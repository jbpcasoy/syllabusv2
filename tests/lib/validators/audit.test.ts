import { parseAuditQuery } from "@/lib/validators/audit";
import { describe, expect, it } from "vitest";

const ID = "sylsylsylsylsyl";
const parse = (query: string) => parseAuditQuery(new URLSearchParams(query));

describe("parseAuditQuery", () => {
  it("accepts no filters", () => {
    expect(parse("")).toEqual({ ok: true, data: {} });
  });

  it("parses every filter", () => {
    expect(
      parse(
        `action=lead.transferred&actor=${ID}&syllabus=${ID}&override=true&from=2026-10-01&to=2026-10-28`,
      ),
    ).toEqual({
      ok: true,
      data: {
        action: "lead.transferred",
        actor: ID,
        syllabus: ID,
        override: true,
        // 00:00 PHT is 16:00 UTC the day before.
        from: new Date("2026-09-30T16:00:00.000Z"),
        // The whole `to` day counts: up to 00:00 PHT the next day.
        to: new Date("2026-10-28T16:00:00.000Z"),
      },
    });
  });

  it("parses override=false", () => {
    expect(parse("override=false")).toEqual({ ok: true, data: { override: false } });
  });

  it("allows a single day", () => {
    expect(parse("from=2026-10-28&to=2026-10-28").ok).toBe(true);
  });

  it("ignores blank values", () => {
    expect(parse("action=&actor=%20&from=")).toEqual({ ok: true, data: {} });
  });

  it.each([
    ["action=deleted", "`action` must be one of: submitted, approved, returned, resubmitted, filed, scan_returned, lead.transferred, file.uploaded"],
    ["actor=short", "`actor` must be a valid id"],
    ["syllabus=UPPERCASEUPPERCA", "`syllabus` must be a valid id"],
    ["override=yes", "`override` must be true or false"],
    ["from=28/10/2026", "`from` must be a date (YYYY-MM-DD)"],
    ["from=2026-02-30", "`from` must be a date (YYYY-MM-DD)"],
    ["to=2026-13-01", "`to` must be a date (YYYY-MM-DD)"],
    ["from=2026-10-29&to=2026-10-28", "`from` must be on or before `to`"],
  ])("rejects %s", (query, error) => {
    expect(parse(query)).toEqual({ ok: false, error });
  });
});
