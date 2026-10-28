import type { LeadTransferInput } from "@/types/syllabus";

type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

const PB_ID = /^[a-z0-9]{15}$/;
export const LEAD_REASON_MIN = 10;
export const LEAD_REASON_MAX = 500;

export function parseLeadTransfer(body: unknown): ParseResult<LeadTransferInput> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, error: "Body must be a JSON object" };
  }

  const { lead, keep_previous, reason } = body as Record<string, unknown>;
  if (typeof lead !== "string" || !PB_ID.test(lead)) {
    return { ok: false, error: "`lead` must be a valid user id" };
  }
  if (keep_previous !== undefined && typeof keep_previous !== "boolean") {
    return { ok: false, error: "`keep_previous` must be true or false" };
  }
  if (reason !== undefined && typeof reason !== "string") {
    return { ok: false, error: "`reason` must be text" };
  }
  const trimmed = reason?.trim() ?? "";
  if (
    trimmed &&
    (trimmed.length < LEAD_REASON_MIN || trimmed.length > LEAD_REASON_MAX)
  ) {
    return {
      ok: false,
      error: `The reason must be ${LEAD_REASON_MIN} to ${LEAD_REASON_MAX} characters`,
    };
  }

  return {
    ok: true,
    data: {
      lead,
      keep_previous: keep_previous ?? true,
      ...(trimmed && { reason: trimmed }),
    },
  };
}
