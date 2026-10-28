import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { toTermRecord, toTermResponse } from "@/lib/term";
import type { Term } from "@/types/term";

const record = {
  id: "trmtrmtrmtrmtrm",
  collectionId: "pbc_1800000002",
  collectionName: "terms",
  school_year: "syrsyrsyrsyrsyr",
  semester: "First Semester",
  open: true,
  submission_deadline: "2026-12-01 00:00:00.000Z",
  review_days: 5,
  created: "2026-10-01 00:00:00.000Z",
  updated: "2026-10-02 00:00:00.000Z",
  expand: { school_year: { id: "syrsyrsyrsyrsyr", label: "2026-2027" } },
} as unknown as Term;

describe("toTermResponse", () => {
  it("maps the day of the deadline and the review limit", () => {
    expect(toTermResponse(record)).toEqual({
      id: "trmtrmtrmtrmtrm",
      school_year: "syrsyrsyrsyrsyr",
      semester: "First Semester",
      open: true,
      submission_deadline: "2026-12-01",
      review_days: 5,
      created: "2026-10-01 00:00:00.000Z",
      updated: "2026-10-02 00:00:00.000Z",
      expand: { school_year: { id: "syrsyrsyrsyrsyr", label: "2026-2027" } },
    });
  });

  it("reads a term from before the review limit as no limit", () => {
    const older: Partial<Term> = { ...record };
    delete older.review_days;
    expect(toTermResponse(older as Term)).toMatchObject({
      review_days: 0,
    });
  });
});

describe("toTermRecord", () => {
  it("passes the review limit through untouched", () => {
    expect(
      toTermRecord({ semester: "Summer", review_days: 7, submission_deadline: null }),
    ).toEqual({ semester: "Summer", review_days: 7, submission_deadline: "" });
  });
});
