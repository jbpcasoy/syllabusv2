import { requireUser } from "@/lib/auth";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { getUserRoles } from "@/lib/roles";
import { resolveSyllabusAccess } from "@/lib/syllabus";
import { loadChainHolders } from "@/lib/syllabus-chain";
import { canDesignate } from "@/lib/syllabus-review";
import { listStandInCandidates } from "@/lib/syllabus-stand-in";
import { isStage } from "@/lib/validators/syllabus-stand-in";
import type { Syllabus } from "@/types/syllabus";
import { NextResponse, type NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/syllabus/:id/stand-in-candidates?stage=1&search=foo
// Whoever may designate for that stage. Stage 1: the program's active
// faculty; later stages: verified users. Never the lead or a co-author.
export async function GET(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = request.nextUrl;
    const stage = Number(searchParams.get("stage"));
    if (!isStage(stage)) {
      return NextResponse.json(
        { error: "`stage` must be a whole number from 1 to 5" },
        { status: 400 },
      );
    }
    const search = searchParams.get("search")?.trim() ?? "";

    const me = auth.user.id;
    const pb = await createAdminPb();
    const [syllabus, roles] = await Promise.all([
      pb.collection("syllabi").getOne<Syllabus>(id),
      getUserRoles(me),
    ]);
    const holders = await loadChainHolders(pb, syllabus.program);
    if (!canDesignate(me, roles.isAdmin, stage, holders)) {
      if (!(await resolveSyllabusAccess(pb, me, roles, syllabus))) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json(
        {
          error:
            "Only an admin or a reviewer of a later stage can designate a stand-in for this stage.",
        },
        { status: 403 },
      );
    }

    const items = await listStandInCandidates(pb, syllabus, stage, search);
    return NextResponse.json({ items });
  } catch (error) {
    return handlePbError(error);
  }
}
