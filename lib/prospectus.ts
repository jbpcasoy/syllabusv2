import type { Prospectus, ProspectusResponse } from "@/types/prospectus";
import "server-only";

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
