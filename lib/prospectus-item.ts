import type {
  ProspectusItem,
  ProspectusItemResponse,
} from "@/types/prospectus-item";
import "server-only";

/** Expand string used everywhere so the response can show course, program and school year. */
export const PROSPECTUS_ITEM_EXPAND =
  "course,prospectus.program,prospectus.school_year";

export function toProspectusItemResponse(
  record: ProspectusItem,
): ProspectusItemResponse {
  const course = record.expand?.course;
  const prospectus = record.expand?.prospectus;
  const program = prospectus?.expand?.program;
  const schoolYear = prospectus?.expand?.school_year;
  return {
    id: record.id,
    prospectus: record.prospectus,
    course: record.course,
    semester: record.semester,
    year_level: record.year_level,
    created: record.created,
    updated: record.updated,
    expand: {
      ...(course && {
        course: { id: course.id, code: course.code, title: course.title },
      }),
      ...(prospectus && {
        prospectus: {
          id: prospectus.id,
          published: prospectus.published,
          ...(program && {
            program: { id: program.id, name: program.name, code: program.code },
          }),
          ...(schoolYear && {
            school_year: { id: schoolYear.id, label: schoolYear.label },
          }),
        },
      }),
    },
  };
}
