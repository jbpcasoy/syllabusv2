import type { UserRole } from "@/types/user";

type Rule = { write: readonly UserRole[] };

export const PERMISSIONS = {
  campus: { write: [] },
  college: { write: ["vpaa"] },
  department: { write: ["vpaa", "dean", "departmenthead"] },
} as const satisfies Record<string, Rule>;
