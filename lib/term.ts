import type {
  Term,
  TermInput,
  TermResponse,
  TermUpdateInput,
} from "@/types/term";
import "server-only";

export function toTermResponse(record: Term): TermResponse {
  const schoolYear = record.expand?.school_year;
  return {
    id: record.id,
    school_year: record.school_year,
    semester: record.semester,
    open: record.open,
    // PocketBase stores "2026-12-01 00:00:00.000Z"; the UI only needs the day.
    submission_deadline: record.submission_deadline
      ? record.submission_deadline.slice(0, 10)
      : "",
    review_days: record.review_days ?? 0,
    created: record.created,
    updated: record.updated,
    expand: {
      ...(schoolYear && {
        school_year: { id: schoolYear.id, label: schoolYear.label },
      }),
    },
  };
}

/** Maps the validated input to PocketBase fields ("" clears a date). */
export function toTermRecord<T extends TermInput | TermUpdateInput>(
  data: T,
): Omit<T, "submission_deadline"> & { submission_deadline?: string } {
  const { submission_deadline, ...rest } = data;
  if (submission_deadline === undefined) return rest;
  return {
    ...rest,
    submission_deadline: submission_deadline
      ? `${submission_deadline} 00:00:00.000Z`
      : "",
  };
}
