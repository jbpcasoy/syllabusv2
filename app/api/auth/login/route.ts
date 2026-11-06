import {
  requestEmailVerification,
  setSessionCookie,
  toSessionUser,
} from "@/lib/auth";
import { createPb, handlePbError } from "@/lib/pocketbase";
import { getUserRoles } from "@/lib/roles";
import type { AppUser } from "@/types/user";
import { NextResponse, type NextRequest } from "next/server";
import { ClientResponseError } from "pocketbase";

// POST /api/auth/login  { "email": "...", "password": "..." }
// Unverified accounts get 403 and a fresh verification email instead of a session.
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

    if (!record.verified) {
      const sent = await requestEmailVerification(record.email);
      return NextResponse.json(
        {
          error: sent
            ? // PocketBase skips a repeat email sent moments after the last one
              // and doesn't say so, so don't claim a new one went out.
              `Verify your email before signing in. Check ${record.email} for the verification link. If it hasn't arrived, try signing in again in a few minutes to get a new one.`
            : "Verify your email before signing in. We couldn't send a new link right now; try again later.",
        },
        { status: 403 },
      );
    }

    await setSessionCookie(token);
    return NextResponse.json(
      toSessionUser(record as AppUser, await getUserRoles(record.id)),
    );
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
