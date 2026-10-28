import { requireUser } from "@/lib/auth";
import { markAllRead } from "@/lib/notification";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { NextResponse } from "next/server";

// POST /api/notification/read-all  (no body)
// Marks every unread notification of the signed-in user as read.
export async function POST() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const pb = await createAdminPb();
    await markAllRead(pb, auth.user.id, new Date().toISOString());
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handlePbError(error);
  }
}
