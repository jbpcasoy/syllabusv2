import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/syllabus", () => ({
  anyOf: (_pb: unknown, field: string, values: string[]) =>
    values.length === 0
      ? "id = ''"
      : `(${values.map((v) => `${field} = "${v}"`).join(" || ")})`,
}));

import {
  allAwaitingSignedCopy,
  listAwaitingSignedCopy,
  listJustifications,
  loadFilteredPrograms,
  loadTermSlots,
  paging,
  resolveScopedPrograms,
  termSyllabusRows,
} from "@/lib/dashboard";
import type { ProgramOrg } from "@/types/dashboard";
import type PocketBase from "pocketbase";

const filter = (expr: string, params: Record<string, unknown> = {}) =>
  expr.replace(/\{:(\w+)\}/g, (_, key) => JSON.stringify(params[key]));

type Options = { filter?: string; fields?: string; expand?: string; sort?: string };

function fakePb(rows: Record<string, unknown[]>) {
  const calls: Record<string, Options> = {};
  const pages: Record<string, [number, number]> = {};
  const pb = {
    filter,
    collection: (name: string) => ({
      getFullList: vi.fn(async (options: Options) => {
        calls[name] = options;
        return rows[name] ?? [];
      }),
      getList: vi.fn(async (page: number, perPage: number, options: Options) => {
        calls[name] = options;
        pages[name] = [page, perPage];
        const items = rows[name] ?? [];
        return { page, perPage, totalItems: items.length, totalPages: 1, items };
      }),
    }),
  } as unknown as PocketBase;
  return { pb, calls, pages };
}

const IT: ProgramOrg = {
  id: "prgITprgITprgIT",
  code: "BSIT",
  name: "IT",
  departmentId: "depITdepITdepIT",
  departmentName: "IT Dept",
  collegeId: "colCOTcolCOTcol",
  collegeName: "COT",
};
const N: ProgramOrg = {
  ...IT,
  id: "prgNprgNprgNprg",
  code: "BSN",
  departmentId: "depNdepNdepNdep",
  collegeId: "colCONcolCONcol",
};

describe("loadFilteredPrograms", () => {
  it("maps each program with its department and college", async () => {
    const { pb, calls } = fakePb({
      programs: [
        {
          id: IT.id,
          code: "BSIT",
          name: "IT",
          department: IT.departmentId,
          expand: {
            department: {
              id: IT.departmentId,
              name: "IT Dept",
              college: IT.collegeId,
              expand: { college: { id: IT.collegeId, name: "COT" } },
            },
          },
        },
      ],
    });

    expect(await loadFilteredPrograms(pb, {})).toEqual([IT]);
    expect(calls.programs.filter).toBeUndefined();
    expect(calls.programs.expand).toBe("department.college");
  });

  it("filters by the given college, department and program, bound", async () => {
    const { pb, calls } = fakePb({});
    await loadFilteredPrograms(pb, { college: IT.collegeId, program: IT.id });
    expect(calls.programs.filter).toBe(
      `department.college = "${IT.collegeId}" && id = "${IT.id}"`,
    );
  });
});

describe("resolveScopedPrograms", () => {
  const programRecord = (p: ProgramOrg) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    department: p.departmentId,
    expand: {
      department: {
        id: p.departmentId,
        name: p.departmentName,
        college: p.collegeId,
        expand: { college: { id: p.collegeId, name: p.collegeName } },
      },
    },
  });

  it("keeps the programs inside the scope from one read", async () => {
    const { pb } = fakePb({ programs: [programRecord(IT), programRecord(N)] });
    const dean = { all: false as const, collegeIds: [IT.collegeId], departmentIds: [], programIds: [] };
    expect(await resolveScopedPrograms(pb, dean, {})).toEqual({
      ok: true,
      programs: [IT],
      everything: false,
    });
  });

  it("refuses a filter outside the scope", async () => {
    const { pb } = fakePb({ programs: [programRecord(N)] });
    const dean = { all: false as const, collegeIds: [IT.collegeId], departmentIds: [], programIds: [] };
    expect(await resolveScopedPrograms(pb, dean, { college: N.collegeId })).toEqual({
      ok: false,
    });
  });
});

describe("loadTermSlots", () => {
  const term = { id: "trmtrmtrmtrmtrm", school_year: "syrsyrsyrsyrsyr", semester: "First Semester" as const };

  it("reads nothing for no programs", async () => {
    const { pb, calls } = fakePb({});
    expect(await loadTermSlots(pb, term, [], false)).toEqual({
      programs: [],
      expected: [],
      syllabi: [],
      references: [],
    });
    expect(calls).toEqual({});
  });

  it("loads the term's slots for the programs and maps them", async () => {
    const { pb, calls } = fakePb({
      prospectus_items: [
        { course: "c1", expand: { prospectus: { program: IT.id } } },
        { course: "orphan" },
      ],
      syllabi: [{ program: IT.id, course: "c1", status: "submitted", stage: 2 }],
      syllabus_references: [
        { program: IT.id, course: "c2", expand: { syllabus: { status: "filed" } } },
        { program: IT.id, course: "c3" },
      ],
    });

    expect(await loadTermSlots(pb, term, [IT], false)).toEqual({
      programs: [IT],
      expected: [{ program: IT.id, course: "c1" }],
      syllabi: [
        { program: IT.id, course: "c1", status: "submitted", stage: 2, status_changed_at: "" },
      ],
      references: [
        { program: IT.id, course: "c2", sourceStatus: "filed" },
        { program: IT.id, course: "c3", sourceStatus: "" },
      ],
    });

    expect(calls.prospectus_items.filter).toBe(
      `prospectus.published = true && prospectus.school_year = "${term.school_year}" && semester = "First Semester" && (prospectus.program = "${IT.id}")`,
    );
    expect(calls.syllabi.filter).toBe(`term = "${term.id}" && (program = "${IT.id}")`);
    expect(calls.syllabus_references.filter).toBe(
      `term = "${term.id}" && (status = 'pending' || status = 'approved') && (program = "${IT.id}")`,
    );
  });

  it("drops the program clause when the viewer sees everything, unfiltered", async () => {
    const { pb, calls } = fakePb({});
    await loadTermSlots(pb, term, [IT, N], true);
    expect(calls.syllabi.filter).toBe(`term = "${term.id}"`);
    expect(calls.prospectus_items.filter).not.toContain("prospectus.program");
    expect(calls.syllabus_references.filter).not.toContain("program =");
  });
});

describe("paging", () => {
  it.each([
    ["", 1, 30],
    ["page=3&perPage=10", 3, 10],
    ["page=0&perPage=0", 1, 30],
    ["page=-2&perPage=500", 1, 100],
    ["page=abc&perPage=xyz", 1, 30],
  ])("clamps %o", (query, page, perPage) => {
    expect(paging(new URLSearchParams(query))).toEqual({ page, perPage });
  });
});

const TERM = "trmtrmtrmtrmtrm";
const row = (id: string, status: string, extra: object = {}) => ({
  id,
  status,
  status_changed_at: "2026-10-20 08:00:00.000Z",
  expand: {
    course: { code: `IT ${id}`, title: `Course ${id}` },
    program: { code: "BSIT" },
    lead: { name: "Ana", email: "ana@buksu.edu.ph" },
  },
  ...extra,
});

describe("listAwaitingSignedCopy", () => {
  it("lists the term's approved syllabi in the programs, oldest first", async () => {
    const { pb, calls, pages } = fakePb({ syllabi: [row("1", "approved")] });
    const result = await listAwaitingSignedCopy(pb, TERM, { programs: [IT], everything: false }, 2, 10);

    expect(result.items).toEqual([
      {
        id: "1",
        course_code: "IT 1",
        course_title: "Course 1",
        program_code: "BSIT",
        lead_name: "Ana",
        approved_at: "2026-10-20 08:00:00.000Z",
      },
    ]);
    expect(JSON.stringify(result)).not.toContain("@");
    expect(pages.syllabi).toEqual([2, 10]);
    expect(calls.syllabi.sort).toBe("status_changed_at,id");
    expect(calls.syllabi.filter).toBe(
      `term = "${TERM}" && status = 'approved' && (program = "${IT.id}")`,
    );
  });

  it("drops the program clause for everything", async () => {
    const { pb, calls } = fakePb({});
    await listAwaitingSignedCopy(pb, TERM, { programs: [IT, N], everything: true }, 1, 30);
    expect(calls.syllabi.filter).toBe(`term = "${TERM}" && status = 'approved'`);
  });

  it("reads nothing for no programs", async () => {
    const { pb, calls } = fakePb({});
    expect(
      await listAwaitingSignedCopy(pb, TERM, { programs: [], everything: false }, 1, 30),
    ).toEqual({ page: 1, perPage: 30, totalItems: 0, totalPages: 0, items: [] });
    expect(calls).toEqual({});
  });
});

describe("listJustifications", () => {
  const syllabi = [
    row("3", "filed"),
    row("1", "approved"),
    row("2", "approved"),
  ];
  const justifications = [
    { syllabus: "1", status: "submitted", updated: "2026-10-21 00:00:00.000Z" },
    { syllabus: "3", status: "returned", updated: "2026-10-22 00:00:00.000Z" },
  ];
  const scoped = { programs: [IT], everything: false };

  it("joins each syllabus with its justification, 'none' when there is none", async () => {
    const { pb, calls } = fakePb({ syllabi, syllabus_justifications: justifications });
    const result = await listJustifications(pb, TERM, scoped, undefined, 1, 30);

    expect(result.items.map((r) => [r.id, r.syllabus_status, r.justification, r.justification_updated])).toEqual([
      ["1", "approved", "submitted", "2026-10-21 00:00:00.000Z"],
      ["2", "approved", "none", ""],
      ["3", "filed", "returned", "2026-10-22 00:00:00.000Z"],
    ]);
    expect(result.totalItems).toBe(3);
    expect(JSON.stringify(result)).not.toContain("@");
    expect(calls.syllabi.filter).toBe(
      `term = "${TERM}" && (status = 'approved' || status = 'filed') && based_on != '' && (program = "${IT.id}")`,
    );
    expect(calls.syllabus_justifications.filter).toBe(`syllabus.term = "${TERM}"`);
  });

  it.each([
    ["none", ["2"]],
    ["submitted", ["1"]],
    ["returned", ["3"]],
    ["draft", []],
  ] as const)("filters to state %s", async (state, expected) => {
    const { pb } = fakePb({ syllabi, syllabus_justifications: justifications });
    const result = await listJustifications(pb, TERM, scoped, state, 1, 30);
    expect(result.items.map((r) => r.id)).toEqual(expected);
    expect(result.totalItems).toBe(expected.length);
  });

  it("pages in memory", async () => {
    const { pb } = fakePb({ syllabi, syllabus_justifications: justifications });
    const result = await listJustifications(pb, TERM, scoped, undefined, 2, 2);
    expect(result).toMatchObject({ page: 2, perPage: 2, totalItems: 3, totalPages: 2 });
    expect(result.items.map((r) => r.id)).toEqual(["3"]);
  });

  it("reads nothing for no programs", async () => {
    const { pb, calls } = fakePb({});
    expect((await listJustifications(pb, TERM, { programs: [], everything: false }, undefined, 1, 30)).items).toEqual([]);
    expect(calls).toEqual({});
  });
});

describe("allAwaitingSignedCopy", () => {
  it("reads every approved row with the same query as the list", async () => {
    const { pb, calls } = fakePb({ syllabi: [row("1", "approved"), row("2", "approved")] });
    const rows = await allAwaitingSignedCopy(pb, TERM, { programs: [IT], everything: false });
    expect(rows.map((r) => r.id)).toEqual(["1", "2"]);
    expect(calls.syllabi).toMatchObject({
      sort: "status_changed_at,id",
      filter: `term = "${TERM}" && status = 'approved' && (program = "${IT.id}")`,
    });
  });

  it("reads nothing for no programs", async () => {
    const { pb, calls } = fakePb({});
    expect(await allAwaitingSignedCopy(pb, TERM, { programs: [], everything: false })).toEqual([]);
    expect(calls).toEqual({});
  });
});

describe("termSyllabusRows", () => {
  it("lists the term's syllabi with status and stage, sorted by program and course", async () => {
    const { pb, calls } = fakePb({ syllabi: [row("1", "submitted", { stage: 2 })] });
    expect(await termSyllabusRows(pb, TERM, { programs: [IT], everything: false }, {})).toEqual([
      {
        id: "1",
        course_code: "IT 1",
        course_title: "Course 1",
        program_code: "BSIT",
        lead_name: "Ana",
        status: "submitted",
        stage: 2,
        status_changed_at: "2026-10-20 08:00:00.000Z",
      },
    ]);
    expect(calls.syllabi.sort).toBe("program.code,course.code");
    expect(calls.syllabi.fields).toContain(",stage");
    expect(calls.syllabi.filter).toBe(`term = "${TERM}" && (program = "${IT.id}")`);
  });

  it("narrows to a status and a stage, bound", async () => {
    const { pb, calls } = fakePb({});
    await termSyllabusRows(pb, TERM, { programs: [IT], everything: true }, { status: "submitted", stage: 3 });
    expect(calls.syllabi.filter).toBe(`term = "${TERM}" && status = "submitted" && stage = 3`);
  });

  it("reads nothing for no programs", async () => {
    const { pb, calls } = fakePb({});
    expect(await termSyllabusRows(pb, TERM, { programs: [], everything: false }, {})).toEqual([]);
    expect(calls).toEqual({});
  });
});
