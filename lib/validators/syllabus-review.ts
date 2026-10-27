import { REVIEW_DECISIONS, type ReviewInput } from "@/types/syllabus-review";

type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

export function parseReviewInput(body: unknown): ParseResult<ReviewInput> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, error: "Body must be a JSON object" };
  }

  const { decision } = body as Record<string, unknown>;
  if (!(REVIEW_DECISIONS as readonly unknown[]).includes(decision)) {
    return { ok: false, error: "`decision` must be `approve` or `return`" };
  }

  return { ok: true, data: { decision: decision as ReviewInput["decision"] } };
}
