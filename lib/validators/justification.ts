import {
  MAX_JUSTIFICATION_REASON,
  MAX_JUSTIFICATION_RETURN_REASON,
  type JustificationEntry,
  type JustificationInput,
  type JustificationReturnInput,
} from "@/types/justification";

type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

const PB_ID = /^[a-z0-9]{15}$/;
const MAX_ENTRIES = 50;

function isObject(body: unknown): body is Record<string, unknown> {
  return typeof body === "object" && body !== null && !Array.isArray(body);
}

/** Shape only; whether each author is a previous author is checked in the route. */
export function parseJustificationInput(
  body: unknown,
): ParseResult<JustificationInput> {
  if (!isObject(body)) return { ok: false, error: "Body must be a JSON object" };

  const { entries } = body;
  if (!Array.isArray(entries) || entries.length > MAX_ENTRIES) {
    return { ok: false, error: "`entries` must be a list of authors and reasons" };
  }

  const parsed: JustificationEntry[] = [];
  for (const entry of entries) {
    if (!isObject(entry)) {
      return { ok: false, error: "Each entry must be an object" };
    }
    const { author, reason } = entry;
    if (typeof author !== "string" || !PB_ID.test(author)) {
      return { ok: false, error: "Each entry needs a valid `author` id" };
    }
    if (parsed.some((e) => e.author === author)) {
      return { ok: false, error: "Each author can be listed once" };
    }
    const trimmed = typeof reason === "string" ? reason.trim() : "";
    if (!trimmed) {
      return { ok: false, error: "Each author needs a reason" };
    }
    if (trimmed.length > MAX_JUSTIFICATION_REASON) {
      return {
        ok: false,
        error: `Reasons must be at most ${MAX_JUSTIFICATION_REASON} characters`,
      };
    }
    parsed.push({ author, reason: trimmed });
  }

  return { ok: true, data: { entries: parsed } };
}

export function parseJustificationReturn(
  body: unknown,
): ParseResult<JustificationReturnInput> {
  if (!isObject(body)) return { ok: false, error: "Body must be a JSON object" };
  if (body.action !== "return") {
    return { ok: false, error: "`action` must be `return`" };
  }
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (!reason) {
    return { ok: false, error: "Give a reason for returning the justification" };
  }
  if (reason.length > MAX_JUSTIFICATION_RETURN_REASON) {
    return {
      ok: false,
      error: `\`reason\` must be at most ${MAX_JUSTIFICATION_RETURN_REASON} characters`,
    };
  }
  return { ok: true, data: { reason } };
}
