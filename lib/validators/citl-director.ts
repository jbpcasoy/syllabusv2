import type {
  CitlDirectorInput,
  CitlDirectorUpdateInput,
} from "@/types/citl-director";

type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

const PB_ID = /^[a-z0-9]{15}$/;

export function parseCitlDirectorInput(
  body: unknown,
): ParseResult<CitlDirectorInput> {
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

export function parseCitlDirectorUpdate(
  body: unknown,
): ParseResult<CitlDirectorUpdateInput> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Body must be a JSON object" };
  }

  const { active } = body as Record<string, unknown>;
  if (typeof active !== "boolean") {
    return { ok: false, error: "`active` must be a boolean" };
  }

  return { ok: true, data: { active } };
}
