import type { RecordModel } from "pocketbase";

export interface AppUser extends RecordModel {
  email: string;
  name: string;
  avatar: string;
  /** `can()` reads it through getUserRoles, not from here. */
  isAdmin?: boolean;
}

/** The shape sent to the browser. Never includes tokens or hidden fields. */
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  isAdmin: boolean;
  /** Derived from active assignments. Empty means "unassigned". */
  roleLabels: string[];
}

/** One active assignment, shown read-only in the users admin UI. */
export interface UserAssignment {
  /** For example "Program Chair". */
  title: string;
  /** What it is for, for example "BSCS". Absent for university-wide roles. */
  scope?: string;
}

/** Body accepted by POST /api/user and PATCH /api/user/:id. */
export interface UserInput {
  email: string;
  password: string;
  name?: string;
  /** Administrator flag. */
  isAdmin?: boolean;
}

/** The shape returned by the admin user endpoints. */
export interface UserResponse {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  isAdmin: boolean;
  verified: boolean;
  /** Present on list responses. */
  assignments?: UserAssignment[];
  created: string;
  updated: string;
}

/** Filter accepted by GET /api/user?kind=... */
export const USER_KINDS = ["admin", "assigned", "unassigned"] as const;
export type UserKind = (typeof USER_KINDS)[number];

/** Body accepted by POST /api/auth/register. */
export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
}
