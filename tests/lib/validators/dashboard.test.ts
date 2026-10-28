import {
  parseDashboardQuery,
  parseExportView,
  parseJustificationState,
  parseSyllabusExportFilters,
} from "@/lib/validators/dashboard";
import { describe, expect, it } from "vitest";

const TERM = "trmtrmtrmtrmtrm";
const COLLEGE = "colcolcolcolcol";
const q = (query: string) => parseDashboardQuery(new URLSearchParams(query));

describe("parseDashboardQuery", () => {
  it("requires only the term", () => {
    expect(q(`term=${TERM}`)).toEqual({
      ok: true,
      data: { term: TERM, filters: {} },
    });
  });

  it("reads every filter and treats empty ones as none", () => {
    expect(
      q(`term=${TERM}&college=${COLLEGE}&department=&program=prgprgprgprgprg`),
    ).toEqual({
      ok: true,
      data: {
        term: TERM,
        filters: { college: COLLEGE, program: "prgprgprgprgprg" },
      },
    });
  });

  it.each([
    ["no term", ""],
    ["a malformed term", "term=2026"],
    ["a filter-injection attempt", `term=${TERM}' || id != '`],
  ])("rejects %s", (_label, query) => {
    expect(q(query)).toEqual({
      ok: false,
      error: "`term` must be a valid term id",
    });
  });

  it.each(["college", "department", "program"])(
    "rejects a malformed %s",
    (key) => {
      expect(q(`term=${TERM}&${key}=nope`)).toEqual({
        ok: false,
        error: `\`${key}\` must be a valid ${key} id`,
      });
    },
  );
});

describe("parseJustificationState", () => {
  it.each([null, "", "  "])("reads %o as every state", (value) => {
    expect(parseJustificationState(value)).toEqual({ ok: true, data: undefined });
  });

  it.each(["none", "draft", "submitted", "returned"])("accepts %s", (state) => {
    expect(parseJustificationState(state)).toEqual({ ok: true, data: state });
  });

  it.each(["approved", "NONE", "draft'"])("rejects %s", (state) => {
    expect(parseJustificationState(state).ok).toBe(false);
  });
});

describe("parseExportView", () => {
  it.each(["completion", "syllabi", "signed-copies", "justifications"])("accepts %s", (view) => {
    expect(parseExportView(view)).toEqual({ ok: true, data: view });
  });

  it.each([null, "", "users", "Completion"])("rejects %o", (view) => {
    expect(parseExportView(view)).toEqual({
      ok: false,
      error: "`view` must be one of: completion, syllabi, signed-copies, justifications",
    });
  });
});

describe("parseSyllabusExportFilters", () => {
  const p = (query: string) => parseSyllabusExportFilters(new URLSearchParams(query));

  it("takes each filter as optional", () => {
    expect(p("")).toEqual({ ok: true, data: {} });
    expect(p("status=submitted&stage=2&overdue=review")).toEqual({
      ok: true,
      data: { status: "submitted", stage: 2, overdue: "review" },
    });
  });

  it.each([
    ["status=pending", "`status` must be one of: draft, submitted, returned, approved, filed"],
    ["stage=0", "`stage` must be 1 to 5"],
    ["stage=6", "`stage` must be 1 to 5"],
    ["stage=1.5", "`stage` must be 1 to 5"],
    ["stage=two", "`stage` must be 1 to 5"],
    ["overdue=yes", "`overdue` must be review or submission"],
  ])("rejects %s", (query, error) => {
    expect(p(query)).toEqual({ ok: false, error });
  });
});
