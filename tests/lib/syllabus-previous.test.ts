import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  findPreviousSyllabus,
  previousSchoolYearLabel,
} from "@/lib/syllabus-previous";
import type PocketBase from "pocketbase";

const filter = (expr: string, params: Record<string, unknown> = {}) =>
  expr.replace(/\{:(\w+)\}/g, (_, key) => JSON.stringify(params[key]));

describe("previousSchoolYearLabel", () => {
  it.each([
    ["2026-2027", "2025-2026"],
    ["2000-2001", "1999-2000"],
    ["2026", null],
    ["", null],
    ["2026-27", null],
  ])("%j → %j", (label, expected) => {
    expect(previousSchoolYearLabel(label)).toBe(expected);
  });
});

describe("findPreviousSyllabus", () => {
  const scope = {
    course: "crs123crs123crs",
    program: "prg123prg123prg",
    semester: "First Semester",
    schoolYearLabel: "2026-2027",
  };

  it("finds an approved or filed syllabus of the same semester last year", async () => {
    const previous = { id: "oldoldoldoldold", lead: "l", co_authors: ["c"] };
    const getList = vi.fn(async () => ({ items: [previous] }));
    const pb = { filter, collection: () => ({ getList }) } as unknown as PocketBase;

    expect(await findPreviousSyllabus(pb, scope)).toEqual(previous);
    expect(getList).toHaveBeenCalledWith(1, 1, {
      skipTotal: true,
      fields: "id,lead,co_authors",
      filter:
        'course = "crs123crs123crs" && program = "prg123prg123prg" && term.semester = "First Semester" && term.school_year.label = "2025-2026" && (status = \'approved\' || status = \'filed\')',
    });
  });

  it("is null when there is none", async () => {
    const pb = {
      filter,
      collection: () => ({ getList: vi.fn(async () => ({ items: [] })) }),
    } as unknown as PocketBase;
    expect(await findPreviousSyllabus(pb, scope)).toBeNull();
  });

  it("doesn't query for a malformed school year", async () => {
    const getList = vi.fn();
    const pb = { filter, collection: () => ({ getList }) } as unknown as PocketBase;
    expect(
      await findPreviousSyllabus(pb, { ...scope, schoolYearLabel: "?" }),
    ).toBeNull();
    expect(getList).not.toHaveBeenCalled();
  });
});
