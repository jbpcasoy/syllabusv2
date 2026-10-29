import { requireUser } from "@/lib/auth";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { listNeedsProxy } from "@/lib/review-queue";
import { getUserRoles } from "@/lib/roles";
import { NextResponse } from "next/server";

// GET /api/review-queue/needs-proxy
// Any signed-in user. Drafts blocked from submission until a proxy is named,
// among those the caller may name one for. Short by nature, so unpaged.
export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const me = auth.user.id;
    const pb = await createAdminPb();
    const roles = await getUserRoles(me);
    return NextResponse.json({ items: await listNeedsProxy(pb, me, roles) });
  } catch (error) {
    return handlePbError(error);
  }
}
