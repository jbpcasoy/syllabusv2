import type { Prospectus, ProspectusResponse } from "@/types/prospectus";
import "server-only";

/** Expand string used everywhere so the response can show program and school year. */
export const PROSPECTUS_EXPAND = "program,school_year";

export function toProspectusResponse(record: Prospectus): ProspectusResponse {
  const program = record.expand?.program;
  const schoolYear = record.expand?.school_year;
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
      ...(schoolYear && {
        school_year: { id: schoolYear.id, label: schoolYear.label },
      }),
    },
  };
}
