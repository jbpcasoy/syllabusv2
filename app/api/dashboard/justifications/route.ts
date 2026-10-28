import { requireUser } from "@/lib/auth";
import {
  listJustifications,
  paging,
  resolveScopedPrograms,
} from "@/lib/dashboard";
import {
  justificationScope,
  OUT_OF_SCOPE_ERROR,
  scopeIsEmpty,
} from "@/lib/dashboard-scope";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { getUserRoles } from "@/lib/roles";
import {
  parseDashboardQuery,
  parseJustificationState,
} from "@/lib/validators/dashboard";
import { NextResponse, type NextRequest } from "next/server";

// GET /api/dashboard/justifications?term=<id>&college=&department=&program=&state=none|draft|submitted|returned&page=1&perPage=30
// dashboard.view, and only for the roles that may return a justification
// (justificationScope: program reviewer, dean, FDIS chair, CITL director,
// VPAA, admin). Department heads and program chairs get 403. The term's
// approved or filed syllabi that build on last year's, with each
// justification's state, within that narrower scope.
export async function GET(request: NextRequest) {
  const auth = await requireUser("dashboard.view");
  if (!auth.ok) return auth.response;

  const { searchParams } = request.nextUrl;
  const parsed = parseDashboardQuery(searchParams);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const state = parseJustificationState(searchParams.get("state"));
  if (!state.ok) {
    return NextResponse.json({ error: state.error }, { status: 400 });
  }
  const { term, filters } = parsed.data;
  const { page, perPage } = paging(searchParams);

  try {
    const scope = justificationScope(await getUserRoles(auth.user.id));
    if (scopeIsEmpty(scope)) {
      return NextResponse.json(
        { error: "Only reviewers and administrators see justifications." },
        { status: 403 },
      );
    }

    const pb = await createAdminPb();
    const scoped = await resolveScopedPrograms(pb, scope, filters);
    if (!scoped.ok) {
      return NextResponse.json({ error: OUT_OF_SCOPE_ERROR }, { status: 403 });
    }

    return NextResponse.json(
      await listJustifications(pb, term, scoped, state.data, page, perPage),
    );
  } catch (error) {
    return handlePbError(error);
  }
}
