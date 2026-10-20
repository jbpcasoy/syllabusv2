import type { DeanInput, DeanUpdateInput } from "@/types/dean";

type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

const PB_ID = /^[a-z0-9]{15}$/;

export function parseDeanInput(body: unknown): ParseResult<DeanInput> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Body must be a JSON object" };
  }

  const { user, college, active } = body as Record<string, unknown>;

  if (typeof user !== "string" || !PB_ID.test(user)) {
    return { ok: false, error: "`user` must be a valid user id" };
  }
  if (typeof college !== "string" || !PB_ID.test(college)) {
    return { ok: false, error: "`college` must be a valid college id" };
  }
  if (active !== undefined && typeof active !== "boolean") {
    return { ok: false, error: "`active` must be a boolean" };
  }

  return { ok: true, data: { user, college, active: active ?? true } };
}

export function parseDeanUpdate(body: unknown): ParseResult<DeanUpdateInput> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Body must be a JSON object" };
  }

  const { active } = body as Record<string, unknown>;
  if (typeof active !== "boolean") {
    return { ok: false, error: "`active` must be a boolean" };
  }

  return { ok: true, data: { active } };
}
