import { createPb } from "@/lib/pocketbase";
import type { AppUser, SessionUser, UserRole } from "@/types/user";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { cache } from "react";
import "server-only";

export const AUTH_COOKIE = "pb_auth";
const MAX_AGE = 60 * 60 * 24 * 5; // matches authToken.duration (432000s) on your users collection

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(AUTH_COOKIE);
}

/** Maps a PocketBase user record to the safe shape sent to the browser. */
export function toSessionUser(user: AppUser): SessionUser {
  const pb = createPb();
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role || null,
    avatarUrl: user.avatar ? pb.files.getURL(user, user.avatar) : null,
  };
}

/** Validates the cookie's token against PocketBase and returns the user. */
export const getCurrentUser = cache(async (): Promise<AppUser | null> => {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value;
  if (!token) return null;

  try {
    const pb = createPb();
    pb.authStore.save(token, null);
    const { record } = await pb.collection("users").authRefresh();
    return record as AppUser;
  } catch {
    return null; // expired / invalid / user deleted
  }
});

type AuthResult =
  | { ok: true; user: AppUser }
  | { ok: false; response: NextResponse };

/**
 * Use in route handlers.
 * - No argument: any signed-in user passes.
 * - With roles: the user needs one of them. `admin` always passes.
 *   Users with no role assigned are rejected.
 */
export async function requireUser(
  roles?: readonly UserRole[],
): Promise<AuthResult> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (roles && user.role !== "admin") {
    if (!user.role || !roles.includes(user.role)) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      };
    }
  }

  return { ok: true, user };
}
