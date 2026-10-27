import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { findApproval } from "@/lib/approval-verify";
import type PocketBase from "pocketbase";

const filter = (expr: string, params: Record<string, unknown> = {}) =>
  expr.replace(/\{:(\w+)\}/g, (_, key) => JSON.stringify(params[key]));

function fakePb(items: unknown[]) {
  const getList = vi.fn(async () => ({ items }));
  const pb = { filter, collection: vi.fn(() => ({ getList })) };
  return { pb: pb as unknown as PocketBase, getList };
}

const review = {
  id: "rvwrvwrvwrvwrvw",
  syllabus: "sylsylsylsylsyl",
  stage: 2,
  acting_as: "holder",
  decision: "approve",
  approval_code: "SYL-2627-1-0042-S2",
  created: "2026-10-27 08:00:00.000Z",
  expand: {
    reviewer: { name: "Dean D", email: "d@x", tokenKey: "secret" },
    syllabus: {
      expand: {
        course: { code: "IT 101", title: "Intro" },
        program: { code: "BSIT", name: "BS Information Technology" },
        term: {
          semester: "First Semester",
          expand: { school_year: { label: "2026-2027" } },
        },
      },
    },
  },
};

describe("findApproval", () => {
  it("describes the approval behind a code", async () => {
    const { pb, getList } = fakePb([review]);

    const found = await findApproval(pb, "  syl-2627-1-0042-s2 ");
    expect(found).toEqual({
      code: "SYL-2627-1-0042-S2",
      stage: 2,
      stageLabel: "Dean",
      actingAs: "holder",
      reviewerName: "Dean D",
      approvedAt: "2026-10-27 08:00:00.000Z",
      syllabusId: "sylsylsylsylsyl",
      course: { code: "IT 101", title: "Intro" },
      program: { code: "BSIT", name: "BS Information Technology" },
      term: { semester: "First Semester", schoolYearLabel: "2026-2027" },
    });
    expect(JSON.stringify(found)).not.toContain("secret");
    expect(getList).toHaveBeenCalledWith(1, 1, {
      skipTotal: true,
      expand: "reviewer,syllabus.course,syllabus.program,syllabus.term.school_year",
      filter: `approval_code = "SYL-2627-1-0042-S2" && decision = 'approve'`,
    });
  });

  it("returns null for an unknown code", async () => {
    const { pb } = fakePb([]);
    expect(await findApproval(pb, "SYL-2627-1-0042-S2")).toBeNull();
  });

  it("never queries for a malformed code", async () => {
    const { pb, getList } = fakePb([review]);
    expect(await findApproval(pb, "SYL-2627-1-0042-S9")).toBeNull();
    expect(await findApproval(pb, '" || id != "')).toBeNull();
    expect(getList).not.toHaveBeenCalled();
  });
});
