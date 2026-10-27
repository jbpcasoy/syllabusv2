import type { Syllabus } from "@/types/syllabus";
import type PocketBase from "pocketbase";
import "server-only";

/** "2026-2027" → "2025-2026"; null for a malformed label. */
export function previousSchoolYearLabel(label: string): string | null {
  const match = /^(\d{4})-(\d{4})$/.exec(label);
  if (!match) return null;
  return `${Number(match[1]) - 1}-${Number(match[2]) - 1}`;
}

/**
 * The previous syllabus: approved or filed, same course and program, same
 * semester of the previous school year. Only that one is acknowledged,
 * never older ones. Null when there is none.
 */
export async function findPreviousSyllabus(
  pb: PocketBase,
  scope: {
    course: string;
    program: string;
    semester: string;
    schoolYearLabel: string;
  },
): Promise<Pick<Syllabus, "id" | "lead" | "co_authors"> | null> {
  const previousYear = previousSchoolYearLabel(scope.schoolYearLabel);
  if (!previousYear) return null;

  const result = await pb
    .collection("syllabi")
    .getList<Pick<Syllabus, "id" | "lead" | "co_authors">>(1, 1, {
      skipTotal: true,
      fields: "id,lead,co_authors",
      filter: pb.filter(
        "course = {:course} && program = {:program} && term.semester = {:semester} && term.school_year.label = {:year} && (status = 'approved' || status = 'filed')",
        {
          course: scope.course,
          program: scope.program,
          semester: scope.semester,
          year: previousYear,
        },
      ),
    });
  return result.items[0] ?? null;
}
