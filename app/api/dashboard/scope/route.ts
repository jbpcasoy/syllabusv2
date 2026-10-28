import { requireUser } from "@/lib/auth";
import { resolveScopedPrograms } from "@/lib/dashboard";
import {
  dashboardScope,
  justificationScope,
  scopeIsEmpty,
} from "@/lib/dashboard-scope";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { getUserRoles } from "@/lib/roles";
import type { DashboardScopeResponse } from "@/types/dashboard";
import { NextResponse } from "next/server";

// GET /api/dashboard/scope  (no query)
// dashboard.view. The programs in the caller's scope, with department and
// college, so the dashboard's filters only offer what the caller may pick,
// and whether the justification panel is theirs to see.
export async function GET() {
  const auth = await requireUser("dashboard.view");
  if (!auth.ok) return auth.response;

  try {
    const roles = await getUserRoles(auth.user.id);
    const pb = await createAdminPb();
    const scoped = await resolveScopedPrograms(pb, dashboardScope(roles), {});
    const body: DashboardScopeResponse = {
      // No filter is given, so the scope check always passes.
      programs: scoped.ok ? scoped.programs : [],
      justifications: !scopeIsEmpty(justificationScope(roles)),
    };
    return NextResponse.json(body);
  } catch (error) {
    return handlePbError(error);
  }
}
