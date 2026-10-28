import { AUDIT_ACTIONS, type AuditAction, type AuditQuery } from "@/types/audit";

type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

const PB_ID = /^[a-z0-9]{15}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

/** 00:00 Philippine time (UTC+8, no DST) on a YYYY-MM-DD date, or null. */
function phtMidnight(value: string): Date | null {
  if (!DATE.test(value)) return null;
  const date = new Date(`${value}T00:00:00+08:00`);
  if (Number.isNaN(date.getTime())) return null;
  // Rejects dates such as 2026-02-30, which Date would roll over.
  const roundTrip = new Date(date.getTime() + 8 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  return roundTrip === value ? date : null;
}

/**
 * ?action=&actor=<id>&syllabus=<id>&override=true|false&from=YYYY-MM-DD&to=YYYY-MM-DD.
 * Every filter is optional. Dates are whole days in Philippine time, both
 * inclusive.
 */
export function parseAuditQuery(params: URLSearchParams): ParseResult<AuditQuery> {
  const query: AuditQuery = {};

  const action = params.get("action")?.trim();
  if (action) {
    if (!(AUDIT_ACTIONS as readonly string[]).includes(action)) {
      return {
        ok: false,
        error: `\`action\` must be one of: ${AUDIT_ACTIONS.join(", ")}`,
      };
    }
    query.action = action as AuditAction;
  }

  for (const key of ["actor", "syllabus"] as const) {
    const value = params.get(key)?.trim();
    if (!value) continue;
    if (!PB_ID.test(value)) {
      return { ok: false, error: `\`${key}\` must be a valid id` };
    }
    query[key] = value;
  }

  const override = params.get("override")?.trim();
  if (override) {
    if (override !== "true" && override !== "false") {
      return { ok: false, error: "`override` must be true or false" };
    }
    query.override = override === "true";
  }

  const from = params.get("from")?.trim();
  if (from) {
    const start = phtMidnight(from);
    if (!start) return { ok: false, error: "`from` must be a date (YYYY-MM-DD)" };
    query.from = start;
  }
  const to = params.get("to")?.trim();
  if (to) {
    const start = phtMidnight(to);
    if (!start) return { ok: false, error: "`to` must be a date (YYYY-MM-DD)" };
    query.to = new Date(start.getTime() + DAY_MS);
  }
  if (query.from && query.to && query.from >= query.to) {
    return { ok: false, error: "`from` must be on or before `to`" };
  }

  return { ok: true, data: query };
}
