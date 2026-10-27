import { FINAL_STAGE } from "@/lib/syllabus-workflow";
import type { StandInInput } from "@/types/syllabus-stand-in";

type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

const PB_ID = /^[a-z0-9]{15}$/;

/** True for an integer stage from 1 to FINAL_STAGE. */
export function isStage(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= FINAL_STAGE
  );
}

export function parseStandInInput(body: unknown): ParseResult<StandInInput> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, error: "Body must be a JSON object" };
  }

  const { stage, user } = body as Record<string, unknown>;

  if (!isStage(stage)) {
    return {
      ok: false,
      error: `\`stage\` must be a whole number from 1 to ${FINAL_STAGE}`,
    };
  }
  if (user !== null && (typeof user !== "string" || !PB_ID.test(user))) {
    return { ok: false, error: "`user` must be a valid user id or null" };
  }

  return { ok: true, data: { stage, user } };
}
