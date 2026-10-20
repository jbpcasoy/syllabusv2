import type {
  ProspectusInput,
  ProspectusUpdateInput,
} from "@/types/prospectus";

type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

const PB_ID = /^[a-z0-9]{15}$/;
const SCHOOL_YEAR = /^\d{4}-\d{4}$/;

export const SCHOOL_YEAR_ERROR =
  "`school_year` must be two consecutive years, like 2026-2027";

/** "2026-2027" passes; "2026-2028" and "26-27" don't. */
export function isValidSchoolYear(value: string): boolean {
  if (!SCHOOL_YEAR.test(value)) return false;
  const [start, end] = value.split("-").map(Number);
  return end === start + 1;
}

export function parseProspectusInput(
  body: unknown,
): ParseResult<ProspectusInput> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Body must be a JSON object" };
  }

  const { program, school_year, published } = body as Record<string, unknown>;

  if (typeof program !== "string" || !PB_ID.test(program)) {
    return { ok: false, error: "`program` must be a valid program id" };
  }
  if (
    typeof school_year !== "string" ||
    !isValidSchoolYear(school_year.trim())
  ) {
    return { ok: false, error: SCHOOL_YEAR_ERROR };
  }
  if (published !== undefined && typeof published !== "boolean") {
    return { ok: false, error: "`published` must be a boolean" };
  }

  return {
    ok: true,
    data: {
      program,
      school_year: school_year.trim(),
      published: published ?? false,
    },
  };
}

/** The program can't be changed after creation; only the year and status can. */
export function parseProspectusUpdate(
  body: unknown,
): ParseResult<ProspectusUpdateInput> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Body must be a JSON object" };
  }

  const { school_year, published } = body as Record<string, unknown>;
  const data: ProspectusUpdateInput = {};

  if (school_year !== undefined) {
    if (
      typeof school_year !== "string" ||
      !isValidSchoolYear(school_year.trim())
    ) {
      return { ok: false, error: SCHOOL_YEAR_ERROR };
    }
    data.school_year = school_year.trim();
  }
  if (published !== undefined) {
    if (typeof published !== "boolean") {
      return { ok: false, error: "`published` must be a boolean" };
    }
    data.published = published;
  }

  if (Object.keys(data).length === 0) {
    return {
      ok: false,
      error: "Provide `school_year` and/or `published`",
    };
  }

  return { ok: true, data };
}
