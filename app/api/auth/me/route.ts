import { getCurrentUser, toSessionUser } from "@/lib/auth";
import { getUserRoles } from "@/lib/roles";
import { NextResponse } from "next/server";

// GET /api/auth/me
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(toSessionUser(user, await getUserRoles(user.id)));
}
