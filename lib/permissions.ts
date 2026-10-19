import type { UserRole } from "@/types/user";

type Rule = { write: readonly UserRole[]; read: readonly UserRole[] };

export const PERMISSIONS = {
  campus: { read: [], write: [] },
  college: { read: [], write: ["vpaa"] },
  department: { read: [], write: ["vpaa", "dean", "departmenthead"] },
  program: { read: [], write: ["vpaa", "dean", "departmenthead"] },
  programChair: { read: [], write: ["vpaa", "dean", "departmenthead"] },
  // Admin only for now. See the note at the end before widening this.
  faculty: { read: [], write: [] },
  // Admin always passes, so an empty list means "admin only".
  user: { read: [], write: [] },
} as const satisfies Record<string, Rule>;
