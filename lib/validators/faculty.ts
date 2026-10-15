import type { FacultyInput } from "@/types/faculty";

type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

const PB_ID = /^[a-z0-9]{15}$/;

export function parseFacultyInput(body: unknown): ParseResult<FacultyInput> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Body must be a JSON object" };
  }

  const { user, department } = body as Record<string, unknown>;

  if (typeof user !== "string" || !PB_ID.test(user)) {
    return { ok: false, error: "`user` must be a valid user id" };
  }
  if (typeof department !== "string" || !PB_ID.test(department)) {
    return { ok: false, error: "`department` must be a valid department id" };
  }

  return { ok: true, data: { user, department } };
}
