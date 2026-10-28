import type { CollegeInput } from "@/types/college";

type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

const PB_ID = /^[a-z0-9]{15}$/;

function parseRequiredString(
  value: unknown,
  field: string,
): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof value !== "string" || value.trim() === "") {
    return { ok: false, error: `\`${field}\` must be a non-empty string` };
  }
  return { ok: true, value: value.trim() };
}

export function parseCollegeInput(
  body: unknown,
  { partial = false }: { partial?: boolean } = {},
): ParseResult<Partial<CollegeInput>> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Body must be a JSON object" };
  }

  const { name, code, campus } = body as Record<string, unknown>;
  const data: Partial<CollegeInput> = {};

  for (const [field, value] of [
    ["name", name],
    ["code", code],
  ] as const) {
    if (value !== undefined) {
      const result = parseRequiredString(value, field);
      if (!result.ok) return result;
      data[field] = result.value;
    } else if (!partial) {
      return { ok: false, error: `\`${field}\` is required` };
    }
  }

  if (campus !== undefined) {
    if (typeof campus !== "string" || !PB_ID.test(campus)) {
      return { ok: false, error: "`campus` must be a valid campus id" };
    }
    data.campus = campus;
  } else if (!partial) {
    return { ok: false, error: "`campus` is required" };
  }

  return { ok: true, data };
}
