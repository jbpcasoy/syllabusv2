import type { CourseInput, CourseUpdateInput } from "@/types/course";

type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };
type FieldResult<T> = { ok: true; value: T } | { ok: false; error: string };

const PB_ID = /^[a-z0-9]{15}$/;

export const MAX_CODE = 20; // matches the `max` on courses.code
export const MAX_TITLE = 255; // matches the `max` on courses.title
export const MAX_NOTE = 255; // matches the `max` on courses.prerequisite_note
export const MAX_UNITS = 30; // matches the `max` on the *_units fields
export const MAX_HOURS = 1000; // matches the `max` on courses.nominal_duration_hours
export const MAX_PREREQUISITES = 20; // matches `maxSelect` on courses.prerequisites

const NUMBER_FIELDS = [
  ["credit_units", MAX_UNITS],
  ["lec_units", MAX_UNITS],
  ["lab_units", MAX_UNITS],
  ["nominal_duration_hours", MAX_HOURS],
] as const;

/** Trims and collapses inner whitespace so "CS  101" and "CS 101" match. */
export function normalizeCourseCode(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function parseText(
  value: unknown,
  field: string,
  max: number,
): FieldResult<string> {
  if (typeof value !== "string" || value.trim() === "") {
    return { ok: false, error: `\`${field}\` must be a non-empty string` };
  }
  const trimmed = value.trim();
  if (trimmed.length > max) {
    return { ok: false, error: `\`${field}\` must be at most ${max} characters` };
  }
  return { ok: true, value: trimmed };
}

function parseNumber(
  value: unknown,
  field: string,
  max: number,
): FieldResult<number> {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > max
  ) {
    return { ok: false, error: `\`${field}\` must be a number from 0 to ${max}` };
  }
  return { ok: true, value };
}

function parsePrerequisites(value: unknown): FieldResult<string[]> {
  if (
    !Array.isArray(value) ||
    !value.every((id) => typeof id === "string" && PB_ID.test(id))
  ) {
    return {
      ok: false,
      error: "`prerequisites` must be an array of course ids",
    };
  }
  const unique = [...new Set(value as string[])];
  if (unique.length > MAX_PREREQUISITES) {
    return {
      ok: false,
      error: `\`prerequisites\` can list at most ${MAX_PREREQUISITES} courses`,
    };
  }
  return { ok: true, value: unique };
}

function parseNote(value: unknown): FieldResult<string> {
  if (typeof value !== "string") {
    return { ok: false, error: "`prerequisite_note` must be a string" };
  }
  const trimmed = value.trim();
  if (trimmed.length > MAX_NOTE) {
    return {
      ok: false,
      error: `\`prerequisite_note\` must be at most ${MAX_NOTE} characters`,
    };
  }
  return { ok: true, value: trimmed };
}

/** Shared by create and update; only `partial` differs. */
function parse(
  body: unknown,
  partial: boolean,
): ParseResult<CourseUpdateInput> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Body must be a JSON object" };
  }

  const fields = body as Record<string, unknown>;
  const data: CourseUpdateInput = {};

  if (fields.code !== undefined || !partial) {
    const code = parseText(fields.code, "code", MAX_CODE);
    if (!code.ok) return code;
    data.code = normalizeCourseCode(code.value);
  }
  if (fields.title !== undefined || !partial) {
    const title = parseText(fields.title, "title", MAX_TITLE);
    if (!title.ok) return title;
    data.title = title.value;
  }
  if (fields.program !== undefined || !partial) {
    if (typeof fields.program !== "string" || !PB_ID.test(fields.program)) {
      return { ok: false, error: "`program` must be a valid program id" };
    }
    data.program = fields.program;
  }
  for (const [field, max] of NUMBER_FIELDS) {
    if (fields[field] === undefined) continue;
    const number = parseNumber(fields[field], field, max);
    if (!number.ok) return number;
    data[field] = number.value;
  }
  if (fields.prerequisites !== undefined) {
    const prerequisites = parsePrerequisites(fields.prerequisites);
    if (!prerequisites.ok) return prerequisites;
    data.prerequisites = prerequisites.value;
  }
  if (fields.prerequisite_note !== undefined) {
    const note = parseNote(fields.prerequisite_note);
    if (!note.ok) return note;
    data.prerequisite_note = note.value;
  }

  if (partial && Object.keys(data).length === 0) {
    return { ok: false, error: "Provide at least one field to update" };
  }

  return { ok: true, data };
}

export function parseCourseInput(body: unknown): ParseResult<CourseInput> {
  return parse(body, false) as ParseResult<CourseInput>;
}

export function parseCourseUpdate(
  body: unknown,
): ParseResult<CourseUpdateInput> {
  return parse(body, true);
}
