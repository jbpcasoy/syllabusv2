import type { SchoolYearInput } from "@/types/school-year";

type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

const SCHOOL_YEAR = /^\d{4}-\d{4}$/;

export const SCHOOL_YEAR_ERROR =
  "`label` must be two consecutive years, like 2026-2027";

/** "2026-2027" passes; "2026-2028" and "26-27" don't. */
export function isValidSchoolYear(value: string): boolean {
  if (!SCHOOL_YEAR.test(value)) return false;
  const [start, end] = value.split("-").map(Number);
  return end === start + 1;
}

/** Create and update take the same body: the label is the only field. */
export function parseSchoolYearInput(
  body: unknown,
): ParseResult<SchoolYearInput> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Body must be a JSON object" };
  }

  const { label } = body as Record<string, unknown>;

  if (typeof label !== "string" || !isValidSchoolYear(label.trim())) {
    return { ok: false, error: SCHOOL_YEAR_ERROR };
  }

  return { ok: true, data: { label: label.trim() } };
}
