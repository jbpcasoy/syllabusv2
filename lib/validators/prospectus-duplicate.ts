import type { ProspectusDuplicateInput } from "@/types/prospectus-duplicate";

type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

const PB_ID = /^[a-z0-9]{15}$/;

/** Used for the POST body and for the preview's query string. */
export function parseProspectusDuplicateInput(
  body: unknown,
): ParseResult<ProspectusDuplicateInput> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Body must be a JSON object" };
  }

  const { program, source_school_year, target_school_year } = body as Record<
    string,
    unknown
  >;

  if (typeof program !== "string" || !PB_ID.test(program)) {
    return { ok: false, error: "`program` must be a valid program id" };
  }
  if (typeof source_school_year !== "string" || !PB_ID.test(source_school_year)) {
    return {
      ok: false,
      error: "`source_school_year` must be a valid school year id",
    };
  }
  if (typeof target_school_year !== "string" || !PB_ID.test(target_school_year)) {
    return {
      ok: false,
      error: "`target_school_year` must be a valid school year id",
    };
  }
  if (source_school_year === target_school_year) {
    return {
      ok: false,
      error: "Choose a target school year different from the source",
    };
  }

  return { ok: true, data: { program, source_school_year, target_school_year } };
}
