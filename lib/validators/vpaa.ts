import type { VpaaInput, VpaaUpdateInput } from "@/types/vpaa";

type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

const PB_ID = /^[a-z0-9]{15}$/;

export function parseVpaaInput(body: unknown): ParseResult<VpaaInput> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Body must be a JSON object" };
  }

  const { user, active } = body as Record<string, unknown>;

  if (typeof user !== "string" || !PB_ID.test(user)) {
    return { ok: false, error: "`user` must be a valid user id" };
  }
  if (active !== undefined && typeof active !== "boolean") {
    return { ok: false, error: "`active` must be a boolean" };
  }

  return { ok: true, data: { user, active: active ?? true } };
}

export function parseVpaaUpdate(body: unknown): ParseResult<VpaaUpdateInput> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Body must be a JSON object" };
  }

  const { active } = body as Record<string, unknown>;
  if (typeof active !== "boolean") {
    return { ok: false, error: "`active` must be a boolean" };
  }

  return { ok: true, data: { active } };
}
