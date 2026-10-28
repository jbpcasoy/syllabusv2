import { requireUser } from "@/lib/auth";
import { checkPdfUpload } from "@/lib/pdf";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { getUserRoles } from "@/lib/roles";
import {
  activeFacultyAmong,
  getSyllabusAccess,
  isNotUniqueError,
  resolveSyllabusAccess,
} from "@/lib/syllabus";
import {
  latestVersionNo,
  SYLLABUS_VERSION_EXPAND,
  toSyllabusVersionResponse,
} from "@/lib/syllabus-version";
import {
  addUploadAudit,
  checkUploadRate,
  tooManyUploads,
} from "@/lib/upload-limit";
import { parseSyllabusVersionInput } from "@/lib/validators/syllabus";
import type { Syllabus } from "@/types/syllabus";
import type { SyllabusVersion } from "@/types/syllabus-version";
import type { Term } from "@/types/term";
import { NextResponse, type NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

// Same answer as a missing record, so ids can't be probed.
function notFound() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

// GET /api/syllabus/:id/version?page=1&perPage=30
// Lead, co-authors, admin and referencing faculty. Newest first, without
// file names.
export async function GET(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const perPage = Math.min(
      100,
      Math.max(1, Number(searchParams.get("perPage")) || 30),
    );

    const pb = await createAdminPb();
    const [syllabus, roles] = await Promise.all([
      pb
        .collection("syllabi")
        .getOne<Syllabus>(id, { fields: "id,lead,co_authors,status,program" }),
      getUserRoles(auth.user.id),
    ]);
    if (!(await resolveSyllabusAccess(pb, auth.user.id, roles, syllabus))) {
      return notFound();
    }

    const result = await pb
      .collection("syllabus_versions")
      .getList<SyllabusVersion>(page, perPage, {
        sort: "-version_no",
        expand: SYLLABUS_VERSION_EXPAND,
        filter: pb.filter("syllabus = {:id}", { id }),
      });

    return NextResponse.json({
      ...result,
      items: result.items.map(toSyllabusVersionResponse),
    });
  } catch (error) {
    return handlePbError(error);
  }
}

// POST /api/syllabus/:id/version  multipart: file=<PDF, max 20 MB>, notes?=<text>
// Lead only, while a draft or returned, in an open term, and still active faculty of
// the target program. Numbers the version max + 1. Rate-limited (429) and
// audited as file.uploaded.
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
    const parsed = parseSyllabusVersionInput({ notes: form.get("notes") });
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
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
        { error: "Only the lead can upload versions." },
        { status: 403 },
      );
    }
    // A returned syllabus takes its revision here before resubmitting.
    if (syllabus.status !== "draft" && syllabus.status !== "returned") {
      return NextResponse.json(
        { error: "Versions can only be uploaded while drafting or after a return." },
        { status: 409 },
      );
    }

    const [term, faculty, latest] = await Promise.all([
      pb.collection("terms").getOne<Term>(syllabus.term, { fields: "id,open" }),
      activeFacultyAmong(pb, syllabus.program, [me]),
      latestVersionNo(pb, id),
    ]);
    if (!term.open) {
      return NextResponse.json(
        { error: "This term is closed for submissions." },
        { status: 409 },
      );
    }
    if (!faculty.has(me)) {
      return NextResponse.json(
        { error: "You are no longer active faculty of this program." },
        { status: 403 },
      );
    }

    const versionNo = latest + 1;
    let created: SyllabusVersion;
    try {
      created = await pb
        .collection("syllabus_versions")
        .create<SyllabusVersion>(
          {
            syllabus: id,
            version_no: versionNo,
            file: pdf.file,
            uploaded_by: me,
            notes: parsed.data.notes,
          },
          { expand: SYLLABUS_VERSION_EXPAND },
        );
    } catch (error) {
      // The unique index (syllabus, version_no) rejects a concurrent upload.
      if (isNotUniqueError(error, "version_no")) {
        return NextResponse.json(
          { error: "Another upload finished first. Please try again." },
          { status: 409 },
        );
      }
      throw error;
    }

    // Two writes (the file upload can't join a batch): undo the version if
    // its audit row fails, so every stored upload is counted.
    try {
      const batch = pb.createBatch();
      addUploadAudit(batch, me, id, "version", created.id);
      await batch.send();
    } catch (error) {
      await pb.collection("syllabus_versions").delete(created.id);
      throw error;
    }
    return NextResponse.json(toSyllabusVersionResponse(created), {
      status: 201,
    });
  } catch (error) {
    return handlePbError(error);
  }
}
