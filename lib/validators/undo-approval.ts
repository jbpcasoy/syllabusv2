import type { UndoApprovalInput } from "@/types/syllabus-review";

type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

// Same bounds as an admin's lead-transfer override reason.
export const UNDO_REASON_MIN = 10;
export const UNDO_REASON_MAX = 500;

export function parseUndoApprovalInput(
  body: unknown,
): ParseResult<UndoApprovalInput> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, error: "Body must be a JSON object" };
  }

  const { reason } = body as Record<string, unknown>;
  if (typeof reason !== "string" || !reason.trim()) {
    return { ok: false, error: "Give a reason for undoing the approval" };
  }
  const trimmed = reason.trim();
  if (trimmed.length < UNDO_REASON_MIN || trimmed.length > UNDO_REASON_MAX) {
    return {
      ok: false,
      error: `The reason must be ${UNDO_REASON_MIN} to ${UNDO_REASON_MAX} characters`,
    };
  }

  return { ok: true, data: { reason: trimmed } };
}
