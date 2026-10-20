import {
  SEMESTERS,
  YEAR_LEVELS,
  type ProspectusItemInput,
  type ProspectusItemUpdateInput,
  type Semester,
  type YearLevel,
} from "@/types/prospectus-item";

type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

const PB_ID = /^[a-z0-9]{15}$/;

export const MAX_SUBJECT_CODE = 10; // matches the `max` on prospectus_items.subject_code
export const MAX_TITLE = 255; // matches the `max` on prospectus_items.title

export function isSemester(value: unknown): value is Semester {
  return (
    typeof value === "string" &&
    (SEMESTERS as readonly string[]).includes(value)
  );
}

export function isYearLevel(value: unknown): value is YearLevel {
  return (
    typeof value === "string" &&
    (YEAR_LEVELS as readonly string[]).includes(value)
  );
}

const SEMESTER_ERROR = `\`semester\` must be one of: ${SEMESTERS.join(", ")}`;
const YEAR_LEVEL_ERROR = `\`year_level\` must be one of: ${YEAR_LEVELS.join(", ")}`;

function parseText(
  value: unknown,
  field: string,
  max: number,
): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof value !== "string" || value.trim() === "") {
    return { ok: false, error: `\`${field}\` must be a non-empty string` };
  }
  const trimmed = value.trim();
  if (trimmed.length > max) {
    return {
      ok: false,
      error: `\`${field}\` must be at most ${max} characters`,
    };
  }
  return { ok: true, value: trimmed };
}

export function parseProspectusItemInput(
  body: unknown,
): ParseResult<ProspectusItemInput> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Body must be a JSON object" };
  }

  const { prospectus, semester, year_level, subject_code, title } =
    body as Record<string, unknown>;

  if (typeof prospectus !== "string" || !PB_ID.test(prospectus)) {
    return { ok: false, error: "`prospectus` must be a valid prospectus id" };
  }
  if (!isSemester(semester)) return { ok: false, error: SEMESTER_ERROR };
  if (!isYearLevel(year_level)) {
    return { ok: false, error: YEAR_LEVEL_ERROR };
  }

  const code = parseText(subject_code, "subject_code", MAX_SUBJECT_CODE);
  if (!code.ok) return code;
  const name = parseText(title, "title", MAX_TITLE);
  if (!name.ok) return name;

  return {
    ok: true,
    data: {
      prospectus,
      semester,
      year_level,
      subject_code: code.value,
      title: name.value,
    },
  };
}

/** The prospectus can't be changed after creation; everything else can. */
export function parseProspectusItemUpdate(
  body: unknown,
): ParseResult<ProspectusItemUpdateInput> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Body must be a JSON object" };
  }

  const { semester, year_level, subject_code, title } = body as Record<
    string,
    unknown
  >;
  const data: ProspectusItemUpdateInput = {};

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
  if (subject_code !== undefined) {
    const code = parseText(subject_code, "subject_code", MAX_SUBJECT_CODE);
    if (!code.ok) return code;
    data.subject_code = code.value;
  }
  if (title !== undefined) {
    const name = parseText(title, "title", MAX_TITLE);
    if (!name.ok) return name;
    data.title = name.value;
  }

  if (Object.keys(data).length === 0) {
    return {
      ok: false,
      error:
        "Provide at least one of `semester`, `year_level`, `subject_code`, `title`",
    };
  }

  return { ok: true, data };
}
