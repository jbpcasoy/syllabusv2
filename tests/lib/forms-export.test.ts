import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { listApprovals, loadExportSyllabus } from "@/lib/forms-export";
import type PocketBase from "pocketbase";

const ID = "sylsylsylsylsyl";

const filter = (expr: string, params: Record<string, unknown> = {}) =>
  expr.replace(/\{:(\w+)\}/g, (_, key) => JSON.stringify(params[key]));

describe("loadExportSyllabus", () => {
  it("flattens the expanded syllabus to printable fields", async () => {
    const getOne = vi.fn(async () => ({
      expand: {
        course: { code: "IT 101", title: "Intro" },
        program: { code: "BSIT", name: "BS IT" },
        term: { semester: "First Semester", expand: { school_year: { label: "2026-2027" } } },
        lead: { name: "Lea", email: "l@x" },
        co_authors: [{ name: "Cole" }, { name: "Dee" }],
      },
    }));
    const pb = { collection: () => ({ getOne }) } as unknown as PocketBase;

    expect(await loadExportSyllabus(pb, ID)).toEqual({
      courseCode: "IT 101",
      courseTitle: "Intro",
      programCode: "BSIT",
      programName: "BS IT",
      schoolYearLabel: "2026-2027",
      semester: "First Semester",
      leadName: "Lea",
      coAuthorNames: ["Cole", "Dee"],
    });
    expect(getOne).toHaveBeenCalledWith(ID, {
      expand: "course,program,term.school_year,lead,co_authors",
    });
  });

  it("tolerates missing relations", async () => {
    const pb = {
      collection: () => ({ getOne: vi.fn(async () => ({})) }),
    } as unknown as PocketBase;
    expect(await loadExportSyllabus(pb, ID)).toMatchObject({
      courseCode: "",
      coAuthorNames: [],
    });
  });
});

describe("listApprovals", () => {
  it("keeps the newest approval per stage, in stage order", async () => {
    const row = (stage: number, code: string, created: string, name = "R") => ({
      stage,
      acting_as: "holder",
      approval_code: code,
      created,
      expand: { reviewer: { name } },
    });
    // Newest first, as sorted by the query.
    const getFullList = vi.fn(async () => [
      row(2, "S2-new", "2026-10-27", "Dean"),
      row(1, "S1-new", "2026-10-26", "Rev"),
      row(2, "S2-old", "2026-10-20", "Dean"),
      row(1, "S1-old", "2026-10-19", "Rev"),
    ]);
    const pb = { filter, collection: () => ({ getFullList }) } as unknown as PocketBase;

    expect(await listApprovals(pb, ID)).toEqual([
      {
        stage: 1,
        reviewerName: "Rev",
        actingAs: "holder",
        approvalCode: "S1-new",
        approvedAt: "2026-10-26",
      },
      {
        stage: 2,
        reviewerName: "Dean",
        actingAs: "holder",
        approvalCode: "S2-new",
        approvedAt: "2026-10-27",
      },
    ]);
    expect(getFullList).toHaveBeenCalledWith({
      expand: "reviewer",
      sort: "-created",
      filter: `syllabus = "${ID}" && decision = 'approve'`,
    });
  });
});
