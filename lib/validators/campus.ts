import { CampusInput } from "@/types/campus";

type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

export function parseCampusInput(
  body: unknown,
  { partial = false }: { partial?: boolean } = {},
): ParseResult<Partial<CampusInput>> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Body must be a JSON object" };
  }

  const { name } = body as Record<string, unknown>;
  const data: Partial<CampusInput> = {};

  if (name !== undefined) {
    if (typeof name !== "string" || name.trim() === "") {
      return { ok: false, error: "`name` must be a non-empty string" };
    }
    data.name = name.trim();
  } else if (!partial) {
    return { ok: false, error: "`name` is required" };
  }

  return { ok: true, data };
}
