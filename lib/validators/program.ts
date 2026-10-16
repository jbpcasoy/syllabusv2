import type { ProgramInput } from "@/types/program";

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

export function parseProgramInput(
  body: unknown,
  { partial = false }: { partial?: boolean } = {},
): ParseResult<Partial<ProgramInput>> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Body must be a JSON object" };
  }

  const { name, code, department } = body as Record<string, unknown>;
  const data: Partial<ProgramInput> = {};

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

  if (department !== undefined) {
    // "" or null clears the relation; otherwise it must look like a PB id.
    if (department === null || department === "") {
      data.department = "";
    } else if (typeof department === "string" && PB_ID.test(department)) {
      data.department = department;
    } else {
      return { ok: false, error: "`department` must be a valid department id" };
    }
  }

  return { ok: true, data };
}
