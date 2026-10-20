import { PERMISSIONS } from "@/lib/permissions";
import type {
  ProspectusItem,
  ProspectusItemResponse,
} from "@/types/prospectus-item";
import type { AppUser, UserRole } from "@/types/user";
import "server-only";

/** Admins, plus any role listed in PERMISSIONS.prospectusItem.write. */
export function canManageProspectusItems(user: AppUser): boolean {
  if (user.role === "admin") return true;
  return (
    !!user.role &&
    (PERMISSIONS.prospectusItem.write as readonly UserRole[]).includes(
      user.role,
    )
  );
}

/** Expand string used everywhere so the response can show program and school year. */
export const PROSPECTUS_ITEM_EXPAND = "prospectus.program";

export function toProspectusItemResponse(
  record: ProspectusItem,
): ProspectusItemResponse {
  const prospectus = record.expand?.prospectus;
  const program = prospectus?.expand?.program;
  return {
    id: record.id,
    prospectus: record.prospectus,
    semester: record.semester,
    year_level: record.year_level,
    subject_code: record.subject_code,
    title: record.title,
    created: record.created,
    updated: record.updated,
    expand: {
      ...(prospectus && {
        prospectus: {
          id: prospectus.id,
          school_year: prospectus.school_year,
          published: prospectus.published,
          ...(program && {
            program: { id: program.id, name: program.name, code: program.code },
          }),
        },
      }),
    },
  };
}
