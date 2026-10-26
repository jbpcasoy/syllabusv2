import { createAdminPb } from "@/lib/pocketbase";
import type { Course, CourseResponse } from "@/types/course";
import "server-only";

/** Expand string used everywhere so the response can show program and prerequisites. */
export const COURSE_EXPAND = "program,prerequisites";

export function toCourseResponse(record: Course): CourseResponse {
  const program = record.expand?.program;
  const prerequisites = record.expand?.prerequisites;
  return {
    id: record.id,
    code: record.code,
    title: record.title,
    program: record.program,
    credit_units: record.credit_units,
    lec_units: record.lec_units,
    lab_units: record.lab_units,
    nominal_duration_hours: record.nominal_duration_hours,
    prerequisites: record.prerequisites ?? [],
    prerequisite_note: record.prerequisite_note,
    created: record.created,
    updated: record.updated,
    expand: {
      ...(program && {
        program: { id: program.id, name: program.name, code: program.code },
      }),
      ...(prerequisites && {
        prerequisites: prerequisites.map((c) => ({
          id: c.id,
          code: c.code,
          title: c.title,
        })),
      }),
    },
  };
}

/** Records that point at a course. Filters are constant, never user input. */
const DEPENDENTS = [
  {
    collection: "prospectus_items",
    filter: "course = {:id}",
    singular: "prospectus item",
    plural: "prospectus items",
  },
  {
    collection: "courses",
    filter: "prerequisites ?= {:id}",
    singular: "course that lists it as a prerequisite",
    plural: "courses that list it as a prerequisite",
  },
];

/**
 * Returns a human-readable reason when prospectus items or other courses
 * still reference the course, or null when it is safe to delete.
 */
export async function describeCourseDependents(
  id: string,
): Promise<string | null> {
  const pb = await createAdminPb();

  const counts = await Promise.all(
    DEPENDENTS.map(async (dep) => {
      const result = await pb.collection(dep.collection).getList(1, 1, {
        filter: pb.filter(dep.filter, { id }),
      });
      return { dep, count: result.totalItems };
    }),
  );

  const parts = counts
    .filter(({ count }) => count > 0)
    .map(({ dep, count }) => `${count} ${count === 1 ? dep.singular : dep.plural}`);

  if (parts.length === 0) return null;
  return `This course is still used by ${parts.join(" and ")}. Remove those references first.`;
}
