import { isSemester, SEMESTER_ERROR } from "@/lib/validators/term";
import {
  YEAR_LEVELS,
  type ProspectusItemInput,
  type ProspectusItemUpdateInput,
  type YearLevel,
} from "@/types/prospectus-item";

export { isSemester };

type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

const PB_ID = /^[a-z0-9]{15}$/;

export function isYearLevel(value: unknown): value is YearLevel {
  return (
    typeof value === "string" &&
    (YEAR_LEVELS as readonly string[]).includes(value)
  );
}

const YEAR_LEVEL_ERROR = `\`year_level\` must be one of: ${YEAR_LEVELS.join(", ")}`;
const COURSE_ERROR = "`course` must be a valid course id";

export function parseProspectusItemInput(
  body: unknown,
): ParseResult<ProspectusItemInput> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Body must be a JSON object" };
  }

  const { prospectus, course, semester, year_level } = body as Record<
    string,
    unknown
  >;

  if (typeof prospectus !== "string" || !PB_ID.test(prospectus)) {
    return { ok: false, error: "`prospectus` must be a valid prospectus id" };
  }
  if (typeof course !== "string" || !PB_ID.test(course)) {
    return { ok: false, error: COURSE_ERROR };
  }
  if (!isSemester(semester)) return { ok: false, error: SEMESTER_ERROR };
  if (!isYearLevel(year_level)) {
    return { ok: false, error: YEAR_LEVEL_ERROR };
  }

  return { ok: true, data: { prospectus, course, semester, year_level } };
}

/** The prospectus can't be changed after creation; everything else can. */
export function parseProspectusItemUpdate(
  body: unknown,
): ParseResult<ProspectusItemUpdateInput> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Body must be a JSON object" };
  }

  const { course, semester, year_level } = body as Record<string, unknown>;
  const data: ProspectusItemUpdateInput = {};

  if (course !== undefined) {
    if (typeof course !== "string" || !PB_ID.test(course)) {
      return { ok: false, error: COURSE_ERROR };
    }
    data.course = course;
  }
  if (semester !== undefined) {
    if (!isSemester(semester)) return { ok: false, error: SEMESTER_ERROR };
    data.semester = semester;
  }
  if (year_level !== undefined) {
    if (!isYearLevel(year_level)) {
      return { ok: false, error: YEAR_LEVEL_ERROR };
    }
    data.year_level = year_level;
  }

  if (Object.keys(data).length === 0) {
    return {
      ok: false,
      error: "Provide at least one of `course`, `semester`, `year_level`",
    };
  }

  return { ok: true, data };
}
