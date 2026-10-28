import { requireUser } from "@/lib/auth";
import {
  listAwaitingSignedCopy,
  paging,
  resolveScopedPrograms,
} from "@/lib/dashboard";
import { dashboardScope, OUT_OF_SCOPE_ERROR } from "@/lib/dashboard-scope";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { getUserRoles } from "@/lib/roles";
import { parseDashboardQuery } from "@/lib/validators/dashboard";
import { NextResponse, type NextRequest } from "next/server";

// GET /api/dashboard/signed-copies?term=<id>&college=&department=&program=&page=1&perPage=30
// dashboard.view. The term's approved syllabi in the caller's scope that
// await a signed copy, oldest approval first. Names only, never emails.
export async function GET(request: NextRequest) {
  const auth = await requireUser("dashboard.view");
  if (!auth.ok) return auth.response;

  const { searchParams } = request.nextUrl;
  const parsed = parseDashboardQuery(searchParams);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { term, filters } = parsed.data;
  const { page, perPage } = paging(searchParams);

  try {
    const pb = await createAdminPb();
    const scope = dashboardScope(await getUserRoles(auth.user.id));
    const scoped = await resolveScopedPrograms(pb, scope, filters);
    if (!scoped.ok) {
      return NextResponse.json({ error: OUT_OF_SCOPE_ERROR }, { status: 403 });
    }

    return NextResponse.json(
      await listAwaitingSignedCopy(pb, term, scoped, page, perPage),
    );
  } catch (error) {
    return handlePbError(error);
  }
}
