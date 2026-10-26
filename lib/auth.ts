import { can, type Capability, type ScopeTarget } from "@/lib/capabilities";
import { createPb, handlePbError } from "@/lib/pocketbase";
import { roleLabels, type UserRoles } from "@/types/roles";
import type { AppUser, SessionUser } from "@/types/user";
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

/** Absolute URL of the user's avatar, or null. */
export function avatarUrl(user: AppUser): string | null {
  return user.avatar ? createPb().files.getURL(user, user.avatar) : null;
}

/** Maps a PocketBase user record and its derived roles to the safe browser shape. */
export function toSessionUser(user: AppUser, roles: UserRoles): SessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: avatarUrl(user),
    isAdmin: roles.isAdmin,
    roleLabels: roleLabels(roles),
  };
}

/**
 * Asks PocketBase to email a verification link. Returns false instead of
 * throwing when sending fails (for example SMTP is not configured), so the
 * caller can still answer and the user can retry by signing in.
 */
export async function requestEmailVerification(email: string): Promise<boolean> {
  try {
    await createPb().collection("users").requestVerification(email);
    return true;
  } catch (error) {
    console.error("Failed to send verification email", error);
    return false;
  }
}

/**
 * Validates the cookie's token against PocketBase and returns the user.
 * Unverified accounts count as signed out, even with a valid token.
 */
export const getCurrentUser = cache(async (): Promise<AppUser | null> => {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value;
  if (!token) return null;

  try {
    const pb = createPb();
    pb.authStore.save(token, null);
    const { record } = await pb.collection("users").authRefresh();
    return record.verified ? (record as AppUser) : null;
  } catch {
    return null; // expired / invalid / user deleted
  }
});

type AuthResult =
  | { ok: true; user: AppUser }
  | { ok: false; response: NextResponse };

/**
 * Checks a capability for a user. Returns null when allowed, otherwise the
 * response to return (403, or the PocketBase error if the target lookup fails).
 * Use it in create routes, where the target comes from the parsed body:
 *
 *   const denied = await authorize(auth.user, "department.create", {
 *     college: parsed.data.college,
 *   });
 *   if (denied) return denied;
 */
export async function authorize(
  user: Pick<AppUser, "id">,
  capability: Capability,
  target?: ScopeTarget,
): Promise<NextResponse | null> {
  try {
    if (await can(user, capability, target)) return null;
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (error) {
    return handlePbError(error);
  }
}

/**
 * Use in route handlers.
 * - No argument: any signed-in user passes.
 * - (capability, target?): the user must hold the capability, optionally
 *   within the scope of `target`. Admin always passes.
 */
export async function requireUser(
  capability?: Capability,
  target?: ScopeTarget,
): Promise<AuthResult> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (capability === undefined) return { ok: true, user };

  const denied = await authorize(user, capability, target);
  return denied ? { ok: false, response: denied } : { ok: true, user };
}
