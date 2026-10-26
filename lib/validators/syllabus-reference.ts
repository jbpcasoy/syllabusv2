import {
  MAX_REFERENCE_TEXT,
  REFERENCE_STATUSES,
  type ReferenceActionInput,
  type ReferenceStatus,
  type SyllabusReferenceInput,
} from "@/types/syllabus-reference";

type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

const PB_ID = /^[a-z0-9]{15}$/;

function isObject(body: unknown): body is Record<string, unknown> {
  return typeof body === "object" && body !== null && !Array.isArray(body);
}

export function isReferenceStatus(value: unknown): value is ReferenceStatus {
  return (
    typeof value === "string" &&
    (REFERENCE_STATUSES as readonly string[]).includes(value)
  );
}

export function parseSyllabusReferenceInput(
  body: unknown,
): ParseResult<SyllabusReferenceInput> {
  if (!isObject(body)) {
    return { ok: false, error: "Body must be a JSON object" };
  }

  const { syllabus, program, note } = body;

  if (typeof syllabus !== "string" || !PB_ID.test(syllabus)) {
    return { ok: false, error: "`syllabus` must be a valid syllabus id" };
  }
  if (typeof program !== "string" || !PB_ID.test(program)) {
    return { ok: false, error: "`program` must be a valid program id" };
  }
  if (note !== undefined && typeof note !== "string") {
    return { ok: false, error: "`note` must be a string" };
  }
  const trimmed = (note ?? "").trim();
  if (trimmed.length > MAX_REFERENCE_TEXT) {
    return {
      ok: false,
      error: `\`note\` must be at most ${MAX_REFERENCE_TEXT} characters`,
    };
  }

  return { ok: true, data: { syllabus, program, note: trimmed } };
}

export function parseReferenceActionInput(
  body: unknown,
): ParseResult<ReferenceActionInput> {
  if (!isObject(body)) {
    return { ok: false, error: "Body must be a JSON object" };
  }

  const { action, reason } = body;

  if (action === "approve" || action === "withdraw") {
    return { ok: true, data: { action } };
  }
  if (action !== "reject" && action !== "revoke") {
    return {
      ok: false,
      error: '`action` must be "approve", "reject", "withdraw" or "revoke"',
    };
  }
  const trimmed = typeof reason === "string" ? reason.trim() : "";
  if (trimmed === "" || trimmed.length > MAX_REFERENCE_TEXT) {
    return {
      ok: false,
      error: `This action needs a \`reason\` of 1 to ${MAX_REFERENCE_TEXT} characters`,
    };
  }

  return { ok: true, data: { action, reason: trimmed } };
}
