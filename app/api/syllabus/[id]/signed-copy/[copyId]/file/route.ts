import { requireUser } from "@/lib/auth";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { getUserRoles } from "@/lib/roles";
import { signedCopyFileName } from "@/lib/signed-copy";
import { resolveSyllabusAccess } from "@/lib/syllabus";
import { fetchVersionFile } from "@/lib/syllabus-version";
import type { SignedCopy } from "@/types/signed-copy";
import type { Syllabus } from "@/types/syllabus";
import { NextResponse, type NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string; copyId: string }> };

// Same answer as a missing record, so ids can't be probed.
function notFound() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

// GET /api/syllabus/:id/signed-copy/:copyId/file
// Anyone with access. Streams the scan through the server so the storage
// URL (local or S3) is never exposed. Same pattern as version files.
export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id, copyId } = await params;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const pb = await createAdminPb();
    const [syllabus, roles] = await Promise.all([
      pb.collection("syllabi").getOne<Syllabus>(id, {
        fields:
          "id,lead,co_authors,status,program,expand.course.code,expand.program.code",
        expand: "course,program",
      }),
      getUserRoles(auth.user.id),
    ]);
    if (!(await resolveSyllabusAccess(pb, auth.user.id, roles, syllabus))) {
      return notFound();
    }

    const copy = await pb
      .collection("syllabus_signed_copies")
      .getOne<SignedCopy>(copyId);
    if (copy.syllabus !== id) return notFound();

    const upstream = await fetchVersionFile(pb, copy);
    if (!upstream.ok || !upstream.body) {
      console.error("Signed copy fetch failed", copyId, upstream.status);
      return NextResponse.json(
        { error: "The file could not be loaded" },
        { status: 502 },
      );
    }

    const fileName = signedCopyFileName(
      syllabus.expand?.course?.code ?? "",
      syllabus.expand?.program?.code ?? "",
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
