import type { DepartmentInput } from "@/types/department";

type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

const PB_ID = /^[a-z0-9]{15}$/;

export function parseDepartmentInput(
  body: unknown,
  { partial = false }: { partial?: boolean } = {},
): ParseResult<Partial<DepartmentInput>> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Body must be a JSON object" };
  }

  const { name, college } = body as Record<string, unknown>;
  const data: Partial<DepartmentInput> = {};

  if (name !== undefined) {
    if (typeof name !== "string" || name.trim() === "") {
      return { ok: false, error: "`name` must be a non-empty string" };
    }
    data.name = name.trim();
  } else if (!partial) {
    return { ok: false, error: "`name` is required" };
  }

  if (college !== undefined) {
    // "" or null clears the relation; otherwise it must look like a PB id.
    if (college === null || college === "") {
      data.college = "";
    } else if (typeof college === "string" && PB_ID.test(college)) {
      data.college = college;
    } else {
      return { ok: false, error: "`college` must be a valid college id" };
    }
  }

  return { ok: true, data };
}
