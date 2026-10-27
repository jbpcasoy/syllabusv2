import {
  MAX_SIGNED_COPY_REASON,
  type SignedCopyReturnInput,
} from "@/types/signed-copy";

type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

export function parseSignedCopyReturn(
  body: unknown,
): ParseResult<SignedCopyReturnInput> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, error: "Body must be a JSON object" };
  }

  const { reason } = body as Record<string, unknown>;
  if (typeof reason !== "string" || !reason.trim()) {
    return { ok: false, error: "Give a reason for returning the signed copy" };
  }
  const trimmed = reason.trim();
  if (trimmed.length > MAX_SIGNED_COPY_REASON) {
    return {
      ok: false,
      error: `\`reason\` must be at most ${MAX_SIGNED_COPY_REASON} characters`,
    };
  }

  return { ok: true, data: { reason: trimmed } };
}
