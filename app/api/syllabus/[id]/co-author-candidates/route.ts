import { requireUser } from "@/lib/auth";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { getUserRoles } from "@/lib/roles";
import { getSyllabusAccess, listCoAuthorCandidates } from "@/lib/syllabus";
import type { Syllabus } from "@/types/syllabus";
import { NextResponse, type NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/syllabus/:id/co-author-candidates?search=foo
// Lead only. Up to 20 active faculty of the target program, by name.
export async function GET(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const search = request.nextUrl.searchParams.get("search")?.trim() ?? "";

    const pb = await createAdminPb();
    const [syllabus, roles] = await Promise.all([
      pb
        .collection("syllabi")
        .getOne<Syllabus>(id, { fields: "id,program,lead,co_authors" }),
      getUserRoles(auth.user.id),
    ]);
    const access = getSyllabusAccess(auth.user.id, roles, syllabus);
    if (!access) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (access !== "lead") {
      return NextResponse.json(
        { error: "Only the lead can change this syllabus." },
        { status: 403 },
      );
    }

    const items = await listCoAuthorCandidates(pb, syllabus, search);
    return NextResponse.json({ items });
  } catch (error) {
    return handlePbError(error);
  }
}
