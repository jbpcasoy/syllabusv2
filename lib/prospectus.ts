import { PERMISSIONS } from "@/lib/permissions";
import type { Prospectus, ProspectusResponse } from "@/types/prospectus";
import type { AppUser, UserRole } from "@/types/user";
import "server-only";

/** Admins, plus any role listed in PERMISSIONS.prospectus.write. */
export function canManageProspectuses(user: AppUser): boolean {
  if (user.role === "admin") return true;
  return (
    !!user.role &&
    (PERMISSIONS.prospectus.write as readonly UserRole[]).includes(user.role)
  );
}

export function toProspectusResponse(record: Prospectus): ProspectusResponse {
  const program = record.expand?.program;
  return {
    id: record.id,
    program: record.program,
    school_year: record.school_year,
    published: record.published,
    created: record.created,
    updated: record.updated,
    expand: {
      ...(program && {
        program: { id: program.id, name: program.name, code: program.code },
      }),
    },
  };
}
