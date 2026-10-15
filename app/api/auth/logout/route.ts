import { clearSessionCookie } from "@/lib/auth";
import { NextResponse } from "next/server";

// POST /api/auth/logout
export async function POST() {
  await clearSessionCookie();
  return new NextResponse(null, { status: 204 });
}
