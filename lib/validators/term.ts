import {
  MAX_REVIEW_DAYS,
  SEMESTERS,
  type Semester,
  type TermInput,
  type TermUpdateInput,
} from "@/types/term";

type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

const PB_ID = /^[a-z0-9]{15}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isSemester(value: unknown): value is Semester {
  return (
    typeof value === "string" &&
    (SEMESTERS as readonly string[]).includes(value)
  );
}

export const SEMESTER_ERROR = `\`semester\` must be one of: ${SEMESTERS.join(", ")}`;
const DEADLINE_ERROR =
  "`submission_deadline` must be a date (YYYY-MM-DD) or null";

/** "2026-12-01" passes; "2026-02-30" and "12/01/2026" don't. */
export function isValidDate(value: string): boolean {
  if (!DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

const REVIEW_DAYS_ERROR = `\`review_days\` must be a whole number from 0 to ${MAX_REVIEW_DAYS}`;

function isReviewDays(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= MAX_REVIEW_DAYS
  );
}

function parseDeadline(
  value: unknown,
): { ok: true; value: string | null } | { ok: false; error: string } {
  if (value === null || value === "") return { ok: true, value: null };
  if (typeof value !== "string" || !isValidDate(value.trim())) {
    return { ok: false, error: DEADLINE_ERROR };
  }
  return { ok: true, value: value.trim() };
}

export function parseTermInput(body: unknown): ParseResult<TermInput> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Body must be a JSON object" };
  }

  const { school_year, semester, open, submission_deadline, review_days } =
    body as Record<string, unknown>;

  if (typeof school_year !== "string" || !PB_ID.test(school_year)) {
    return { ok: false, error: "`school_year` must be a valid school year id" };
  }
  if (!isSemester(semester)) return { ok: false, error: SEMESTER_ERROR };
  if (open !== undefined && typeof open !== "boolean") {
    return { ok: false, error: "`open` must be a boolean" };
  }
  const deadline = parseDeadline(submission_deadline ?? null);
  if (!deadline.ok) return deadline;
  if (review_days !== undefined && !isReviewDays(review_days)) {
    return { ok: false, error: REVIEW_DAYS_ERROR };
  }

  return {
    ok: true,
    data: {
      school_year,
      semester,
      open: open ?? false,
      submission_deadline: deadline.value,
      review_days: review_days ?? 0,
    },
  };
}

/** The school year can't be changed after creation; everything else can. */
export function parseTermUpdate(body: unknown): ParseResult<TermUpdateInput> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Body must be a JSON object" };
  }

  const { semester, open, submission_deadline, review_days } = body as Record<
    string,
    unknown
  >;
  const data: TermUpdateInput = {};

  if (semester !== undefined) {
    if (!isSemester(semester)) return { ok: false, error: SEMESTER_ERROR };
    data.semester = semester;
  }
  if (open !== undefined) {
    if (typeof open !== "boolean") {
      return { ok: false, error: "`open` must be a boolean" };
    }
    data.open = open;
  }
  if (submission_deadline !== undefined) {
    const deadline = parseDeadline(submission_deadline);
    if (!deadline.ok) return deadline;
    data.submission_deadline = deadline.value;
  }
  if (review_days !== undefined) {
    if (!isReviewDays(review_days)) {
      return { ok: false, error: REVIEW_DAYS_ERROR };
    }
    data.review_days = review_days;
  }

  if (Object.keys(data).length === 0) {
    return {
      ok: false,
      error:
        "Provide at least one of `semester`, `open`, `submission_deadline`, `review_days`",
    };
  }

  return { ok: true, data };
}
