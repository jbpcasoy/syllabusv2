import {
  MAX_CO_AUTHORS,
  SYLLABUS_STATUSES,
  type SyllabusInput,
  type SyllabusStatus,
  type SyllabusUpdateInput,
} from "@/types/syllabus";
import {
  MAX_VERSION_NOTES,
  type SyllabusVersionInput,
} from "@/types/syllabus-version";

type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

const PB_ID = /^[a-z0-9]{15}$/;

function isObject(body: unknown): body is Record<string, unknown> {
  return typeof body === "object" && body !== null && !Array.isArray(body);
}

export function isSyllabusStatus(value: unknown): value is SyllabusStatus {
  return (
    typeof value === "string" &&
    (SYLLABUS_STATUSES as readonly string[]).includes(value)
  );
}

export function parseSyllabusInput(body: unknown): ParseResult<SyllabusInput> {
  if (!isObject(body)) {
    return { ok: false, error: "Body must be a JSON object" };
  }

  const { course, term, program } = body;

  if (typeof course !== "string" || !PB_ID.test(course)) {
    return { ok: false, error: "`course` must be a valid course id" };
  }
  if (typeof term !== "string" || !PB_ID.test(term)) {
    return { ok: false, error: "`term` must be a valid term id" };
  }
  if (typeof program !== "string" || !PB_ID.test(program)) {
    return { ok: false, error: "`program` must be a valid program id" };
  }

  return { ok: true, data: { course, term, program } };
}

export function parseSyllabusUpdateInput(
  body: unknown,
): ParseResult<SyllabusUpdateInput> {
  if (!isObject(body)) {
    return { ok: false, error: "Body must be a JSON object" };
  }

  const { co_authors } = body;

  if (
    !Array.isArray(co_authors) ||
    !co_authors.every((id) => typeof id === "string" && PB_ID.test(id))
  ) {
    return { ok: false, error: "`co_authors` must be a list of user ids" };
  }
  const unique = [...new Set(co_authors as string[])];
  if (unique.length > MAX_CO_AUTHORS) {
    return {
      ok: false,
      error: `A syllabus can have at most ${MAX_CO_AUTHORS} co-authors`,
    };
  }

  return { ok: true, data: { co_authors: unique } };
}

/** Takes the text fields of the multipart upload as a plain object. */
export function parseSyllabusVersionInput(
  body: unknown,
): ParseResult<SyllabusVersionInput> {
  if (!isObject(body)) {
    return { ok: false, error: "Body must be an object" };
  }

  const { notes } = body;

  if (notes !== undefined && notes !== null && typeof notes !== "string") {
    return { ok: false, error: "`notes` must be a string" };
  }
  const trimmed = (notes ?? "").trim();
  if (trimmed.length > MAX_VERSION_NOTES) {
    return {
      ok: false,
      error: `\`notes\` must be at most ${MAX_VERSION_NOTES} characters`,
    };
  }

  return { ok: true, data: { notes: trimmed } };
}
