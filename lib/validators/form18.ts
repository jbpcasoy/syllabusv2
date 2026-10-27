import {
  MAX_PAGE_NUMBER,
  MAX_POINT_TEXT,
  type PointInput,
  type PointUpdateInput,
} from "@/types/form18";

type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

function isObject(body: unknown): body is Record<string, unknown> {
  return typeof body === "object" && body !== null && !Array.isArray(body);
}

/** Trimmed text, "" for null or undefined, or an error message. */
function text(
  value: unknown,
  field: string,
  max: number,
  required = false,
): { ok: true; value: string } | { ok: false; error: string } {
  if (value !== undefined && value !== null && typeof value !== "string") {
    return { ok: false, error: `\`${field}\` must be text` };
  }
  const trimmed = (value ?? "").trim();
  if (required && !trimmed) {
    return { ok: false, error: `\`${field}\` is required` };
  }
  if (trimmed.length > max) {
    return { ok: false, error: `\`${field}\` must be at most ${max} characters` };
  }
  return { ok: true, value: trimmed };
}

/** Shape only; whether `code` fits the stage's part is checked in lib/form18-rules.ts. */
export function parsePointInput(body: unknown): ParseResult<PointInput> {
  if (!isObject(body)) return { ok: false, error: "Body must be a JSON object" };

  const point = text(body.review_point, "review_point", MAX_POINT_TEXT, true);
  if (!point.ok) return point;
  const code = text(body.code, "code", 10);
  if (!code.ok) return code;
  const remarks = text(body.remarks, "remarks", MAX_POINT_TEXT);
  if (!remarks.ok) return remarks;

  return {
    ok: true,
    data: { review_point: point.value, code: code.value, remarks: remarks.value },
  };
}

export function parsePointUpdate(body: unknown): ParseResult<PointUpdateInput> {
  if (!isObject(body)) return { ok: false, error: "Body must be a JSON object" };

  switch (body.action) {
    case "edit": {
      const parsed = parsePointInput(body);
      return parsed.ok
        ? { ok: true, data: { action: "edit", ...parsed.data } }
        : parsed;
    }
    case "respond": {
      const action = text(body.action_taken, "action_taken", MAX_POINT_TEXT, true);
      if (!action.ok) return action;
      const page = text(body.page_number, "page_number", MAX_PAGE_NUMBER);
      if (!page.ok) return page;
      return {
        ok: true,
        data: {
          action: "respond",
          action_taken: action.value,
          page_number: page.value,
        },
      };
    }
    case "judge": {
      if (body.status !== "resolved" && body.status !== "unresolved") {
        return {
          ok: false,
          error: "`status` must be `resolved` or `unresolved`",
        };
      }
      if (body.remarks === undefined) {
        return { ok: true, data: { action: "judge", status: body.status } };
      }
      const remarks = text(body.remarks, "remarks", MAX_POINT_TEXT);
      if (!remarks.ok) return remarks;
      return {
        ok: true,
        data: { action: "judge", status: body.status, remarks: remarks.value },
      };
    }
    default:
      return {
        ok: false,
        error: "`action` must be `edit`, `respond` or `judge`",
      };
  }
}
