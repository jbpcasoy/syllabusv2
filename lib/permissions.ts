import type { UserRole } from "@/types/user";

type Rule = { write: readonly UserRole[]; read: readonly UserRole[] };

export const PERMISSIONS = {
  campus: { read: [], write: [] },
  college: { read: [], write: ["vpaa"] },
  department: { read: [], write: ["vpaa", "dean", "departmenthead"] },
  // Admin always passes, so an empty list means "admin only".
  user: { read: [], write: [] },
} as const satisfies Record<string, Rule>;
