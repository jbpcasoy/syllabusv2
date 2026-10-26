import { requireUser } from "@/lib/auth";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { getUserRoles } from "@/lib/roles";
import { resolveSyllabusAccess } from "@/lib/syllabus";
import { fetchVersionFile, versionFileName } from "@/lib/syllabus-version";
import type { Syllabus } from "@/types/syllabus";
import type { SyllabusVersion } from "@/types/syllabus-version";
import { NextResponse, type NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string; versionId: string }> };

// Same answer as a missing record, so ids can't be probed.
function notFound() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

// GET /api/syllabus/:id/version/:versionId/file
// Lead, co-authors, admin and referencing faculty. Streams the PDF through
// the server so the storage URL (local or S3) is never exposed.
export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id, versionId } = await params;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const pb = await createAdminPb();
    const [syllabus, roles] = await Promise.all([
      pb.collection("syllabi").getOne<Syllabus>(id, {
        fields: "id,lead,co_authors,expand.course.code,expand.program.code",
        expand: "course,program",
      }),
      getUserRoles(auth.user.id),
    ]);
    if (!(await resolveSyllabusAccess(pb, auth.user.id, roles, syllabus))) {
      return notFound();
    }

    const version = await pb
      .collection("syllabus_versions")
      .getOne<SyllabusVersion>(versionId);
    if (version.syllabus !== id) return notFound();

    const upstream = await fetchVersionFile(pb, version);
    if (!upstream.ok || !upstream.body) {
      console.error("PDF fetch failed", versionId, upstream.status);
      return NextResponse.json(
        { error: "The file could not be loaded" },
        { status: 502 },
      );
    }

    const fileName = versionFileName(
      syllabus.expand?.course?.code ?? "",
      syllabus.expand?.program?.code ?? "",
      version.version_no,
    );
    const headers = new Headers({
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${fileName}"`,
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
