import type { RecordModel } from "pocketbase";

export const USER_ROLES = [
  "admin",
  "faculty",
  "programchair",
  "departmenthead",
  "dean",
  "fdischair",
  "vpaa",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  faculty: "Faculty",
  programchair: "Program Chair",
  departmenthead: "Department Head",
  dean: "Dean",
  fdischair: "FDIS Chair",
  vpaa: "VPAA",
};

export interface AppUser extends RecordModel {
  email: string;
  name: string;
  avatar: string;
  /** "" when no role has been assigned in PocketBase. */
  role: UserRole | "";
}

/** The shape sent to the browser. Never includes tokens or hidden fields. */
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole | null;
  avatarUrl: string | null;
}
