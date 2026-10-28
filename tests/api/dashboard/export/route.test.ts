import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  termsGetOne: vi.fn(),
  loadFilteredPrograms: vi.fn(),
  loadTermSlots: vi.fn(),
  termSyllabusRows: vi.fn(),
  allAwaitingSignedCopy: vi.fn(),
  justificationRows: vi.fn(),
}));

vi.mock("@/lib/pocketbase", async () => {
  const { NextResponse } = await import("next/server");
  const collection = () => ({ getOne: mocks.termsGetOne });
  return {
    createAdminPb: vi.fn(async () => ({ collection })),
    handlePbError: vi.fn((error: unknown) => {
      const status =
        typeof error === "object" && error && "status" in error
          ? Number((error as { status: unknown }).status)
          : 500;
      return NextResponse.json({ error: "pb error" }, { status });
    }),
  };
});

// Mocked wholesale so the real module (and "server-only") is never loaded.
// Only the reads are faked; scope, aggregate and the CSV builders are real.
vi.mock("@/lib/dashboard", async () => {
  const { scopePrograms } = await import("@/lib/dashboard-scope");
  return {
    loadTermSlots: mocks.loadTermSlots,
    termSyllabusRows: mocks.termSyllabusRows,
    allAwaitingSignedCopy: mocks.allAwaitingSignedCopy,
    justificationRows: mocks.justificationRows,
    resolveScopedPrograms: async (pb: unknown, scope: never, filters: never) =>
      scopePrograms(scope, filters, await mocks.loadFilteredPrograms(pb, filters)),
  };
});

vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);
vi.mock("@/lib/roles", async () =>
  (await import("@/tests/helpers/mock-auth")).rolesModuleMock(),
);

import { GET } from "@/app/api/dashboard/export/route";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import type { ProgramOrg } from "@/types/dashboard";
import { mockAuth } from "@/tests/helpers/mock-auth";

const TERM = "trmtrmtrmtrmtrm";
const COT = "colcotcolcotcol";
const CON = "colconcolconcol";
const program = (id: string, departmentId: string, collegeId: string): ProgramOrg => ({
  id,
  code: id.slice(3, 5).toUpperCase(),
  name: id,
  departmentId,
  departmentName: "Dept",
  collegeId,
  collegeName: "College",
});
const IT = program("prgitprgitprgit", "depitdepitdepit", COT);
const N = program("prgnprgnprgnprg", "depndepndepndep", CON);
const names = {
  course_code: "IT 101",
  course_title: "Intro",
  program_code: "BSIT",
  lead_name: "Ana Cruz",
};

const get = (query: string) =>
  GET(new NextRequest(`http://localhost/api/dashboard/export?term=${TERM}&${query}`));
const body = async (res: Response) =>
  (await res.text()).replace(/^﻿/, "").trimEnd().split("\r\n");
const scopedArg = (mock: { mock: { calls: unknown[][] } }) =>
  (mock.mock.calls[0][2] as { programs: ProgramOrg[] }).programs.map((p) => p.id);

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ isAdmin: true });
  mocks.loadFilteredPrograms.mockResolvedValue([IT, N]);
  mocks.termsGetOne.mockResolvedValue({
    id: TERM,
    school_year: "syrsyrsyrsyrsyr",
    semester: "First Semester",
    submission_deadline: "",
    review_days: 0,
    expand: { school_year: { label: "2026-2027" } },
  });
  mocks.loadTermSlots.mockImplementation(async (_pb, _term, programs) => ({
    programs,
    expected: [],
    syllabi: [],
    references: [],
  }));
  mocks.termSyllabusRows.mockResolvedValue([
    { id: "s1", ...names, status: "submitted", stage: 2, status_changed_at: "" },
  ]);
  mocks.allAwaitingSignedCopy.mockResolvedValue([{ id: "s1", ...names, approved_at: "" }]);
  mocks.justificationRows.mockResolvedValue([
    { id: "s1", ...names, syllabus_status: "approved", justification: "none", justification_updated: "" },
  ]);
});

describe("GET /api/dashboard/export", () => {
  it.each([
    ["completion", "Level,Name,Expected"],
    ["syllabi", "Program,Course code,Course title,Lead,Status"],
    ["signed-copies", "Program,Course code,Course title,Lead,Approved (PHT)"],
    ["justifications", "Program,Course code,Course title,Lead,Syllabus status,Justification"],
  ])("downloads the %s view as a CSV attachment", async (view, header) => {
    const res = await get(`view=${view}`);

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect(res.headers.get("content-disposition")).toBe(
      `attachment; filename="${view}-2026-2027-first-semester.csv"`,
    );
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(res.headers.get("x-truncated")).toBe("false");
    // text() drops a byte-order mark while decoding, so read the raw bytes.
    const bytes = new Uint8Array(await res.clone().arrayBuffer());
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(await res.clone().text()).not.toContain("@");
    expect((await body(res))[0]).toContain(header);
  });

  it("writes the completion rows of the scoped programs", async () => {
    mocks.loadTermSlots.mockImplementation(async (_pb, _term, programs) => ({
      programs,
      expected: [{ program: IT.id, course: "c1" }],
      syllabi: [{ program: IT.id, course: "c1", status: "filed", stage: 5, status_changed_at: "" }],
      references: [],
    }));
    const lines = await body(await get("view=completion"));
    expect(lines).toContain(`Program,IT · ${IT.id},1,1,100,0,0`);
  });

  it("passes the syllabus filters and applies overdue", async () => {
    mocks.termsGetOne.mockResolvedValueOnce({
      id: TERM,
      semester: "First Semester",
      submission_deadline: "",
      review_days: 3,
      expand: { school_year: { label: "2026-2027" } },
    });
    mocks.termSyllabusRows.mockResolvedValue([
      { id: "late", ...names, status: "submitted", stage: 2, status_changed_at: "2020-01-01 00:00:00.000Z" },
      { id: "fresh", ...names, course_code: "IT 999", status: "submitted", stage: 2, status_changed_at: new Date().toISOString() },
    ]);

    const lines = await body(await get("view=syllabi&status=submitted&stage=2&overdue=review"));
    expect(mocks.termSyllabusRows).toHaveBeenCalledWith(
      expect.anything(),
      TERM,
      expect.anything(),
      { status: "submitted", stage: 2 },
    );
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain("IT 101");
  });

  it("passes the justification state", async () => {
    await get("view=justifications&state=returned");
    expect(mocks.justificationRows.mock.calls[0][3]).toBe("returned");
  });

  it("caps the rows at 5,000 and says so", async () => {
    mocks.allAwaitingSignedCopy.mockResolvedValue(
      Array.from({ length: 5001 }, (_, i) => ({ id: `s${i}`, ...names, approved_at: "" })),
    );
    const res = await get("view=signed-copies");
    expect(res.headers.get("x-truncated")).toBe("true");
    expect(await body(res)).toHaveLength(5001); // header plus 5,000 rows
  });

  describe("scope", () => {
    it("limits a dean's export to their college", async () => {
      mockAuth({ roles: { deanOfColleges: [COT] } });
      await get("view=signed-copies");
      expect(scopedArg(mocks.allAwaitingSignedCopy)).toEqual([IT.id]);
    });

    it("answers 403 to a filter outside the scope, reading no term", async () => {
      mockAuth({ roles: { deanOfColleges: [COT] } });
      mocks.loadFilteredPrograms.mockResolvedValue([N]);
      const res = await get(`view=syllabi&college=${CON}`);
      expect(res.status).toBe(403);
      expect(mocks.termsGetOne).not.toHaveBeenCalled();
      expect(mocks.termSyllabusRows).not.toHaveBeenCalled();
    });

    it("uses the justification scope for justifications", async () => {
      mockAuth({ roles: { reviewerOfPrograms: [N.id], chairOfPrograms: [IT.id] } });
      await get("view=justifications");
      expect(scopedArg(mocks.justificationRows)).toEqual([N.id]);
    });

    it.each([
      ["a department head", { headOfDepartments: [IT.departmentId] }],
      ["a program chair", { chairOfPrograms: [IT.id] }],
    ])("refuses justifications to %s, touching nothing", async (_label, roles) => {
      mockAuth({ roles });
      const res = await get("view=justifications");
      expect(res.status).toBe(403);
      expect(createAdminPb).not.toHaveBeenCalled();
    });

    it("lets a department head export the other views", async () => {
      mockAuth({ roles: { headOfDepartments: [IT.departmentId] } });
      expect((await get("view=signed-copies")).status).toBe(200);
      expect(scopedArg(mocks.allAwaitingSignedCopy)).toEqual([IT.id]);
    });
  });

  it("returns 401 when signed out, touching nothing", async () => {
    mockAuth({ signedIn: false });
    expect((await get("view=completion")).status).toBe(401);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("returns 403 to faculty, touching nothing", async () => {
    mockAuth({ roles: { facultyOfPrograms: [IT.id] } });
    expect((await get("view=completion")).status).toBe(403);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it.each([
    ["no view", ""],
    ["an unknown view", "view=users"],
    ["a bad status", "view=syllabi&status=nope"],
    ["a bad stage", "view=syllabi&stage=9"],
    ["a bad overdue", "view=syllabi&overdue=soon"],
    ["a bad state", "view=justifications&state=nope"],
    ["a bad filter id", "view=completion&program=nope"],
  ])("returns 400 for %s, touching nothing", async (_label, query) => {
    expect((await get(query)).status).toBe(400);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("propagates a missing term as 404", async () => {
    mocks.termsGetOne.mockRejectedValue({ status: 404 });
    expect((await get("view=completion")).status).toBe(404);
  });

  it("delegates PocketBase errors to handlePbError", async () => {
    const error = { status: 500 };
    mocks.allAwaitingSignedCopy.mockRejectedValue(error);
    expect((await get("view=signed-copies")).status).toBe(500);
    expect(handlePbError).toHaveBeenCalledWith(error);
  });
});
