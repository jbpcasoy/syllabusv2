import { requireUser } from "@/lib/auth";
import {
  canViewJustification,
  findJustification,
  loadJustificationResponse,
} from "@/lib/justification";
import { checkPdfUpload } from "@/lib/pdf";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { getUserRoles } from "@/lib/roles";
import { resolveSyllabusAccess } from "@/lib/syllabus";
import { submitScanError } from "@/lib/syllabus-justification";
import { fetchVersionFile } from "@/lib/syllabus-version";
import {
  addUploadAudit,
  checkUploadRate,
  tooManyUploads,
} from "@/lib/upload-limit";
import type { Syllabus } from "@/types/syllabus";
import { NextResponse, type NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

const notFound = () => NextResponse.json({ error: "Not found" }, { status: 404 });

// POST /api/syllabus/:id/justification/scan  multipart: file=<PDF, max 20 MB>
// Lead only. Uploads the signed letter's scan: draft or returned ->
// submitted, which locks the entries. Rate-limited (429) and audited as
// file.uploaded.
export async function POST(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const me = auth.user.id;
    const pb = await createAdminPb();
    // Before reading the body, so a flood never buffers 20 MB files.
    const rate = await checkUploadRate(pb, me);
    if (!rate.ok) return tooManyUploads(rate.retryAfter);

    const form = await request.formData().catch(() => null);
    if (!form) {
      return NextResponse.json(
        { error: "Expected a multipart form upload" },
        { status: 400 },
      );
    }
    const pdf = await checkPdfUpload(form.get("file"));
    if (!pdf.ok) {
      return NextResponse.json({ error: pdf.error }, { status: 400 });
    }

    const [syllabus, roles] = await Promise.all([
      pb.collection("syllabi").getOne<Syllabus>(id),
      getUserRoles(me),
    ]);
    const access = await resolveSyllabusAccess(pb, me, roles, syllabus);
    if (!canViewJustification(access)) return notFound();
    if (access !== "lead") {
      return NextResponse.json(
        { error: "Only the lead can upload the signed justification." },
        { status: 403 },
      );
    }

    const record = await findJustification(pb, id);
    const ruleError = submitScanError(
      syllabus.status,
      record?.status ?? null,
      record?.entries?.length ?? 0,
    );
    if (ruleError || !record) {
      return NextResponse.json({ error: ruleError }, { status: 409 });
    }

    await pb.collection("syllabus_justifications").update(record.id, {
      scan: pdf.file,
      status: "submitted",
      submitted_at: new Date().toISOString(),
    });
    // The update replaced the previous scan, so there is nothing to undo:
    // a failed audit row is logged and the upload stands.
    try {
      const batch = pb.createBatch();
      addUploadAudit(batch, me, id, "justification_scan", record.id);
      await batch.send();
    } catch (error) {
      console.error("Upload audit failed", record.id, error);
    }
    return NextResponse.json(
      await loadJustificationResponse(pb, syllabus, { access, canReturn: false }),
    );
  } catch (error) {
    return handlePbError(error);
  }
}

// GET /api/syllabus/:id/justification/scan
// Lead, co-authors, reviewers and admin. Streams the signed letter through
// the server, like version files.
export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const pb = await createAdminPb();
    const [syllabus, roles] = await Promise.all([
      pb.collection("syllabi").getOne<Syllabus>(id),
      getUserRoles(auth.user.id),
    ]);
    const access = await resolveSyllabusAccess(pb, auth.user.id, roles, syllabus);
    if (!canViewJustification(access)) return notFound();

    const record = await findJustification(pb, id);
    if (!record?.scan) return notFound();

    const upstream = await fetchVersionFile(pb, { ...record, file: record.scan });
    if (!upstream.ok || !upstream.body) {
      console.error("Justification scan fetch failed", record.id, upstream.status);
      return NextResponse.json(
        { error: "The file could not be loaded" },
        { status: 502 },
      );
    }

    const headers = new Headers({
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="justification.pdf"',
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    });
    const length = upstream.headers.get("Content-Length");
    if (length) headers.set("Content-Length", length);
    return new NextResponse(upstream.body, { status: 200, headers });
  } catch (error) {
    return handlePbError(error);
  }
}
