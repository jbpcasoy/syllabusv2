import { requireUser } from "@/lib/auth";
import { can } from "@/lib/capabilities";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { getUserRoles } from "@/lib/roles";
import { listCoAuthorCandidates, resolveSyllabusAccess } from "@/lib/syllabus";
import type { Syllabus } from "@/types/syllabus";
import { NextResponse, type NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/syllabus/:id/lead-candidates?search=foo
// syllabus.transferLead holders. Up to 20 active faculty of the program
// other than the current lead, by name.
export async function GET(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const search = request.nextUrl.searchParams.get("search")?.trim() ?? "";
    const pb = await createAdminPb();
    const [syllabus, roles] = await Promise.all([
      pb.collection("syllabi").getOne<Syllabus>(id),
      getUserRoles(auth.user.id),
    ]);
    if (!(await can(auth.user, "syllabus.transferLead", { program: syllabus.program }))) {
      if (!(await resolveSyllabusAccess(pb, auth.user.id, roles, syllabus))) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json(
        { error: "Only the program chair or an admin can transfer the lead." },
        { status: 403 },
      );
    }

    const items = await listCoAuthorCandidates(pb, syllabus, search);
    return NextResponse.json({ items });
  } catch (error) {
    return handlePbError(error);
  }
}
