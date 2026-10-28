import {
  completionCsv,
  filterOverdue,
  justificationsCsv,
  phtDateTime,
  signedCopiesCsv,
  syllabiCsv,
  syllabusOverdue,
} from "@/lib/dashboard-export";
import type { CompletionRow, SyllabusExportRow } from "@/types/dashboard";
import { describe, expect, it } from "vitest";

const lines = (csv: string) => csv.replace(/^﻿/, "").trimEnd().split("\r\n");
const NOW = new Date("2026-12-10T00:00:00.000Z");
const TERM = { submission_deadline: "2026-12-01", review_days: 3 };

const names = {
  course_code: "IT 101",
  course_title: "Intro to Computing",
  program_code: "BSIT",
  lead_name: "Ana Cruz",
};
const syllabus = (
  id: string,
  status: SyllabusExportRow["status"],
  stage: number,
  status_changed_at: string,
): SyllabusExportRow => ({ id, ...names, status, stage, status_changed_at });

describe("phtDateTime", () => {
  it.each([
    ["2026-10-20 08:00:00.000Z", "2026-10-20 16:00"],
    ["2026-10-20 20:30:00.000Z", "2026-10-21 04:30"],
    ["", ""],
    ["not a date", ""],
  ])("formats %o as %o", (value, expected) => {
    expect(phtDateTime(value)).toBe(expected);
  });
});

describe("completionCsv", () => {
  const row = (partial: Partial<CompletionRow>): CompletionRow => ({
    level: "program",
    id: "p",
    name: "BSIT · Information Technology",
    parentId: "d",
    expected: 3,
    filed: 1,
    rate: 1 / 3,
    overdueSubmission: 1,
    overdueReview: 0,
    ...partial,
  });

  it("writes a header, a percentage to one decimal, and blank for no rate", () => {
    expect(
      lines(
        completionCsv([
          row({ level: "college", name: "College of Technologies", rate: 0.5 }),
          row({}),
          row({ expected: 0, filed: 0, rate: null }),
        ]),
      ),
    ).toEqual([
      "Level,Name,Expected,Filed,Completion %,Overdue submission,Overdue review",
      "College,College of Technologies,3,1,50,1,0",
      "Program,BSIT · Information Technology,3,1,33.3,1,0",
      "Program,BSIT · Information Technology,0,0,,1,0",
    ]);
  });

  it("starts with a byte-order mark", () => {
    expect(completionCsv([]).startsWith("﻿")).toBe(true);
  });
});

describe("syllabusOverdue and filterOverdue", () => {
  const late = syllabus("late", "submitted", 2, "2026-12-01 00:00:00.000Z");
  const fresh = syllabus("fresh", "submitted", 2, "2026-12-09 00:00:00.000Z");
  const draft = syllabus("draft", "draft", 0, "");
  const filed = syllabus("filed", "filed", 5, "2026-11-01 00:00:00.000Z");

  it("counts review days for submitted and submission days for drafts", () => {
    expect(syllabusOverdue(late, TERM, NOW)).toEqual({ review: 6, submission: 0 });
    expect(syllabusOverdue(fresh, TERM, NOW)).toEqual({ review: 0, submission: 0 });
    // 8 days and 8 hours past the end of the deadline day: 8 whole days.
    expect(syllabusOverdue(draft, TERM, NOW)).toEqual({ review: 0, submission: 8 });
    expect(syllabusOverdue(filed, TERM, NOW)).toEqual({ review: 0, submission: 0 });
  });

  it.each([
    [undefined, ["late", "fresh", "draft", "filed"]],
    ["review", ["late"]],
    ["submission", ["draft"]],
  ] as const)("filters overdue=%s", (overdue, expected) => {
    expect(
      filterOverdue([late, fresh, draft, filed], overdue, TERM, NOW).map((r) => r.id),
    ).toEqual(expected);
  });
});

describe("syllabiCsv", () => {
  it("labels status and stage and shows overdue days", () => {
    expect(
      lines(
        syllabiCsv(
          [
            syllabus("a", "submitted", 2, "2026-12-01 00:00:00.000Z"),
            syllabus("b", "draft", 0, ""),
            syllabus("c", "approved", 5, "2026-12-05 00:00:00.000Z"),
          ],
          TERM,
          NOW,
        ),
      ),
    ).toEqual([
      "Program,Course code,Course title,Lead,Status,Stage,Last change (PHT),Review overdue (days),Past submission deadline (days)",
      "BSIT,IT 101,Intro to Computing,Ana Cruz,In review,Dean,2026-12-01 08:00,6,",
      "BSIT,IT 101,Intro to Computing,Ana Cruz,Draft,,,,8",
      "BSIT,IT 101,Intro to Computing,Ana Cruz,Approved,,2026-12-05 08:00,,",
    ]);
  });

  it("neutralizes a formula in a course title", () => {
    const row = { ...syllabus("a", "filed", 5, ""), course_title: '=HYPERLINK("http://evil","x")' };
    expect(lines(syllabiCsv([row], TERM, NOW))[1]).toContain(`"'=HYPERLINK(""http://evil"",""x"")"`);
  });
});

describe("signedCopiesCsv", () => {
  it("shows the approval time and whole days waiting", () => {
    expect(
      lines(
        signedCopiesCsv(
          [{ id: "a", ...names, approved_at: "2026-12-07 12:00:00.000Z" }, { id: "b", ...names, approved_at: "" }],
          NOW,
        ),
      ),
    ).toEqual([
      "Program,Course code,Course title,Lead,Approved (PHT),Days waiting",
      "BSIT,IT 101,Intro to Computing,Ana Cruz,2026-12-07 20:00,2",
      "BSIT,IT 101,Intro to Computing,Ana Cruz,,",
    ]);
  });
});

describe("justificationsCsv", () => {
  it("labels the syllabus status and each justification state", () => {
    const row = (justification: "none" | "draft" | "submitted" | "returned") => ({
      id: justification,
      ...names,
      syllabus_status: "filed" as const,
      justification,
      justification_updated: justification === "none" ? "" : "2026-12-01 00:00:00.000Z",
    });
    expect(lines(justificationsCsv(["none", "draft", "submitted", "returned"].map((s) => row(s as never))))).toEqual([
      "Program,Course code,Course title,Lead,Syllabus status,Justification,Justification updated (PHT)",
      "BSIT,IT 101,Intro to Computing,Ana Cruz,Filed,Not started,",
      "BSIT,IT 101,Intro to Computing,Ana Cruz,Filed,Draft,2026-12-01 08:00",
      "BSIT,IT 101,Intro to Computing,Ana Cruz,Filed,Submitted,2026-12-01 08:00",
      "BSIT,IT 101,Intro to Computing,Ana Cruz,Filed,Returned,2026-12-01 08:00",
    ]);
  });
});
