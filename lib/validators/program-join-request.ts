import {
  JOIN_REQUEST_STATUSES,
  MAX_JOIN_REQUEST_TEXT,
  type JoinRequestStatus,
  type ProgramJoinRequestDecision,
  type ProgramJoinRequestInput,
} from "@/types/program-join-request";

type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

const PB_ID = /^[a-z0-9]{15}$/;

export function isJoinRequestStatus(value: unknown): value is JoinRequestStatus {
  return (
    typeof value === "string" &&
    (JOIN_REQUEST_STATUSES as readonly string[]).includes(value)
  );
}

export function parseProgramJoinRequestInput(
  body: unknown,
): ParseResult<ProgramJoinRequestInput> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Body must be a JSON object" };
  }

  const { program, note } = body as Record<string, unknown>;

  if (typeof program !== "string" || !PB_ID.test(program)) {
    return { ok: false, error: "`program` must be a valid program id" };
  }
  if (note !== undefined && typeof note !== "string") {
    return { ok: false, error: "`note` must be a string" };
  }
  const trimmed = (note ?? "").trim();
  if (trimmed.length > MAX_JOIN_REQUEST_TEXT) {
    return {
      ok: false,
      error: `\`note\` must be at most ${MAX_JOIN_REQUEST_TEXT} characters`,
    };
  }

  return { ok: true, data: { program, note: trimmed } };
}

export function parseProgramJoinRequestDecision(
  body: unknown,
): ParseResult<ProgramJoinRequestDecision> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Body must be a JSON object" };
  }

  const { decision, reason } = body as Record<string, unknown>;

  if (decision === "approve") return { ok: true, data: { decision } };

  if (decision !== "reject") {
    return { ok: false, error: '`decision` must be "approve" or "reject"' };
  }
  const trimmed = typeof reason === "string" ? reason.trim() : "";
  if (trimmed === "" || trimmed.length > MAX_JOIN_REQUEST_TEXT) {
    return {
      ok: false,
      error: `A rejection needs a \`reason\` of 1 to ${MAX_JOIN_REQUEST_TEXT} characters`,
    };
  }

  return { ok: true, data: { decision, reason: trimmed } };
}
