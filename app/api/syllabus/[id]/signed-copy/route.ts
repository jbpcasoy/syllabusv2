import { requireUser } from "@/lib/auth";
import { checkPdfUpload } from "@/lib/pdf";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { getUserRoles } from "@/lib/roles";
import {
  listSignedCopies,
  SIGNED_COPY_EXPAND,
  toSignedCopyResponse,
} from "@/lib/signed-copy";
import { getSyllabusAccess, resolveSyllabusAccess } from "@/lib/syllabus";
import { hasNotUniqueError } from "@/lib/syllabus-decision";
import { addSyllabusEvent } from "@/lib/syllabus-events";
import { transition } from "@/lib/syllabus-workflow";
import {
  addUploadAudit,
  checkUploadRate,
  tooManyUploads,
} from "@/lib/upload-limit";
import type { SignedCopy } from "@/types/signed-copy";
import type { Syllabus } from "@/types/syllabus";
import { NextResponse, type NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

const notFound = () => NextResponse.json({ error: "Not found" }, { status: 404 });

// GET /api/syllabus/:id/signed-copy
// Anyone with access. Every signed copy, newest first. No file URLs.
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
    if (!(await resolveSyllabusAccess(pb, auth.user.id, roles, syllabus))) {
      return notFound();
    }

    return NextResponse.json({ items: await listSignedCopies(pb, id) });
  } catch (error) {
    return handlePbError(error);
  }
}

// POST /api/syllabus/:id/signed-copy  multipart: file=<PDF, max 20 MB>
// Lead only, once approved. Stores the scan of the wet-signed syllabus and
// files it (approved -> filed). One valid copy at a time. Rate-limited (429)
// and audited as file.uploaded in the filing batch.
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
    const access = getSyllabusAccess(me, roles, syllabus);
    if (!access) return notFound();
    if (access !== "lead") {
      return NextResponse.json(
        { error: "Only the lead can upload the signed copy." },
        { status: 403 },
      );
    }

    const result = transition(syllabus, { type: "file", hasScan: true });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    let created: SignedCopy;
    try {
      created = await pb
        .collection("syllabus_signed_copies")
        .create<SignedCopy>(
          { syllabus: id, file: pdf.file, uploaded_by: me, status: "valid" },
          { expand: SIGNED_COPY_EXPAND },
        );
    } catch (error) {
      // The partial unique index allows one valid copy per syllabus.
      if (hasNotUniqueError(error)) {
        return NextResponse.json(
          { error: "A valid signed copy is already on file." },
          { status: 409 },
        );
      }
      throw error;
    }

    // Two writes (the file upload can't join a batch): undo the copy if
    // filing fails, so a copy never sits valid on an unfiled syllabus.
    try {
      const batch = pb.createBatch();
      batch.collection("syllabi").update(id, {
        ...result.next,
        status_changed_at: new Date().toISOString(),
      });
      addSyllabusEvent(
        batch,
        id,
        { type: "filed", actor: me },
        { from: syllabus, to: result.next },
      );
      addUploadAudit(batch, me, id, "signed_copy", created.id);
      await batch.send();
    } catch (error) {
      await pb.collection("syllabus_signed_copies").delete(created.id);
      throw error;
    }

    return NextResponse.json(toSignedCopyResponse(created), { status: 201 });
  } catch (error) {
    return handlePbError(error);
  }
}
