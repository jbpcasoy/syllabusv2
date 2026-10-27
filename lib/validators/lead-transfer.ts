import type { LeadTransferInput } from "@/types/syllabus";

type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

const PB_ID = /^[a-z0-9]{15}$/;

export function parseLeadTransfer(body: unknown): ParseResult<LeadTransferInput> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, error: "Body must be a JSON object" };
  }

  const { lead, keep_previous } = body as Record<string, unknown>;
  if (typeof lead !== "string" || !PB_ID.test(lead)) {
    return { ok: false, error: "`lead` must be a valid user id" };
  }
  if (keep_previous !== undefined && typeof keep_previous !== "boolean") {
    return { ok: false, error: "`keep_previous` must be true or false" };
  }

  return { ok: true, data: { lead, keep_previous: keep_previous ?? true } };
}
