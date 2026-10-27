import type {
  ProgramReviewerInput,
  ProgramReviewerUpdateInput,
} from "@/types/program-reviewer";

type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

const PB_ID = /^[a-z0-9]{15}$/;

export function parseProgramReviewerInput(
  body: unknown,
): ParseResult<ProgramReviewerInput> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Body must be a JSON object" };
  }

  const { user, program, active } = body as Record<string, unknown>;

  if (typeof user !== "string" || !PB_ID.test(user)) {
    return { ok: false, error: "`user` must be a valid user id" };
  }
  if (typeof program !== "string" || !PB_ID.test(program)) {
    return { ok: false, error: "`program` must be a valid program id" };
  }
  if (active !== undefined && typeof active !== "boolean") {
    return { ok: false, error: "`active` must be a boolean" };
  }

  return { ok: true, data: { user, program, active: active ?? true } };
}

export function parseProgramReviewerUpdate(
  body: unknown,
): ParseResult<ProgramReviewerUpdateInput> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Body must be a JSON object" };
  }

  const { active } = body as Record<string, unknown>;
  if (typeof active !== "boolean") {
    return { ok: false, error: "`active` must be a boolean" };
  }

  return { ok: true, data: { active } };
}
