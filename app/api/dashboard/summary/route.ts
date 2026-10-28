import { requireUser } from "@/lib/auth";
import { loadTermSlots, resolveScopedPrograms } from "@/lib/dashboard";
import { aggregate } from "@/lib/dashboard-aggregate";
import { dashboardScope, OUT_OF_SCOPE_ERROR } from "@/lib/dashboard-scope";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { getUserRoles } from "@/lib/roles";
import { parseDashboardQuery } from "@/lib/validators/dashboard";
import type { DashboardSummary } from "@/types/dashboard";
import type { Term } from "@/types/term";
import { NextResponse, type NextRequest } from "next/server";

// GET /api/dashboard/summary?term=<id>&college=<id>&department=<id>&program=<id>
// dashboard.view. Counts by stage and completion rates for one term, within
// the caller's scope, narrowed by the optional filters. A filter outside the
// scope answers 403 before any term data is read.
export async function GET(request: NextRequest) {
  const auth = await requireUser("dashboard.view");
  if (!auth.ok) return auth.response;

  const parsed = parseDashboardQuery(request.nextUrl.searchParams);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { term: termId, filters } = parsed.data;

  try {
    const pb = await createAdminPb();
    const scope = dashboardScope(await getUserRoles(auth.user.id));
    const scoped = await resolveScopedPrograms(pb, scope, filters);
    if (!scoped.ok) {
      return NextResponse.json({ error: OUT_OF_SCOPE_ERROR }, { status: 403 });
    }

    const term = await pb.collection("terms").getOne<Term>(termId, {
      fields: "id,school_year,semester,submission_deadline,review_days",
    });
    const slots = await loadTermSlots(
      pb,
      term,
      scoped.programs,
      scoped.everything,
    );

    const summary: DashboardSummary = aggregate(
      slots,
      {
        submission_deadline: term.submission_deadline ?? "",
        review_days: term.review_days ?? 0,
      },
      new Date(),
    );
    return NextResponse.json(summary);
  } catch (error) {
    return handlePbError(error);
  }
}
