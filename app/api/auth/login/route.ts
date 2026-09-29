import { setSessionCookie, toSessionUser } from "@/lib/auth";
import { createPb, handlePbError } from "@/lib/pocketbase";
import type { AppUser } from "@/types/user";
import { NextResponse, type NextRequest } from "next/server";
import { ClientResponseError } from "pocketbase";

// POST /api/auth/login  { "email": "...", "password": "..." }
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => null)) as {
      email?: unknown;
      password?: unknown;
    } | null;

    if (
      typeof body?.email !== "string" ||
      typeof body?.password !== "string" ||
      !body.email.trim() ||
      !body.password
    ) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const pb = createPb();
    const { token, record } = await pb
      .collection("users")
      .authWithPassword(body.email.trim(), body.password);

    await setSessionCookie(token);
    return NextResponse.json(toSessionUser(record as AppUser));
  } catch (error) {
    if (error instanceof ClientResponseError && error.status === 400) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }
    return handlePbError(error);
  }
}
