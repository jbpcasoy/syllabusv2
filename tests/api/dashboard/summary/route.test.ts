import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  termsGetOne: vi.fn(),
  loadFilteredPrograms: vi.fn(),
  loadTermSlots: vi.fn(),
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
// Only the program read is faked; the pure scopePrograms decides.
vi.mock("@/lib/dashboard", async () => {
  const { scopePrograms } = await import("@/lib/dashboard-scope");
  return {
    loadTermSlots: mocks.loadTermSlots,
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

import { GET } from "@/app/api/dashboard/summary/route";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import type { ProgramOrg } from "@/types/dashboard";
import { mockAuth } from "@/tests/helpers/mock-auth";

const TERM = "trmtrmtrmtrmtrm";
const COT = "colcotcolcotcol";
const CON = "colconcolconcol";
const IT: ProgramOrg = {
  id: "prgitprgitprgit",
  code: "BSIT",
  name: "IT",
  departmentId: "depitdepitdepit",
  departmentName: "IT Dept",
  collegeId: COT,
  collegeName: "COT",
};
const N: ProgramOrg = {
  id: "prgnprgnprgnprg",
  code: "BSN",
  name: "Nursing",
  departmentId: "depndepndepndep",
  departmentName: "Nursing Dept",
  collegeId: CON,
  collegeName: "CON",
};
const TERM_RECORD = {
  id: TERM,
  school_year: "syrsyrsyrsyrsyr",
  semester: "First Semester",
  submission_deadline: "",
  review_days: 0,
};

const get = (query = `?term=${TERM}`) =>
  GET(new NextRequest(`http://localhost/api/dashboard/summary${query}`));

/** The programs loadTermSlots was asked for. */
const loadedPrograms = () =>
  (mocks.loadTermSlots.mock.calls[0]?.[2] as ProgramOrg[]).map((p) => p.id);

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ isAdmin: true });
  mocks.loadFilteredPrograms.mockResolvedValue([IT, N]);
  mocks.termsGetOne.mockResolvedValue(TERM_RECORD);
  mocks.loadTermSlots.mockImplementation(async (_pb, _term, programs) => ({
    programs,
    expected: programs.map((p: ProgramOrg) => ({ program: p.id, course: "c1" })),
    syllabi: [{ program: IT.id, course: "c1", status: "filed", stage: 5, status_changed_at: "" }],
    references: [],
  }));
});

describe("GET /api/dashboard/summary", () => {
  it("returns counts and completion for the term", async () => {
    const res = await get();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.counts).toMatchObject({ filed: 1, notStarted: 1 });
    expect(body.completion.find((r: { id: string }) => r.id === IT.id)).toMatchObject({
      expected: 1,
      filed: 1,
      rate: 1,
    });
    expect(mocks.termsGetOne).toHaveBeenCalledWith(TERM, {
      fields: "id,school_year,semester,submission_deadline,review_days",
    });
  });

  it("lets admin see every program, unrestricted", async () => {
    await get();
    expect(loadedPrograms()).toEqual([IT.id, N.id]);
    expect(mocks.loadTermSlots.mock.calls[0][3]).toBe(true);
  });

  it("restricts the queries once a global viewer filters", async () => {
    mocks.loadFilteredPrograms.mockResolvedValue([IT]);
    await get(`?term=${TERM}&college=${COT}`);
    expect(mocks.loadFilteredPrograms).toHaveBeenCalledWith(expect.anything(), {
      college: COT,
    });
    expect(loadedPrograms()).toEqual([IT.id]);
    expect(mocks.loadTermSlots.mock.calls[0][3]).toBe(false);
  });

  describe("scope", () => {
    beforeEach(() => mockAuth({ roles: { deanOfColleges: [COT] } }));

    it("limits a dean to their college", async () => {
      const res = await get();
      expect(res.status).toBe(200);
      expect(loadedPrograms()).toEqual([IT.id]);
      expect(mocks.loadTermSlots.mock.calls[0][3]).toBe(false);
    });

    it("lets a dean filter inside their college", async () => {
      mocks.loadFilteredPrograms.mockResolvedValue([IT]);
      const res = await get(`?term=${TERM}&program=${IT.id}`);
      expect(res.status).toBe(200);
      expect(loadedPrograms()).toEqual([IT.id]);
    });

    it("answers 403 to a filter outside the scope, reading no term data", async () => {
      mocks.loadFilteredPrograms.mockResolvedValue([N]);
      const res = await get(`?term=${TERM}&college=${CON}`);
      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({
        error: "That college, department or program is outside your scope.",
      });
      expect(mocks.termsGetOne).not.toHaveBeenCalled();
      expect(mocks.loadTermSlots).not.toHaveBeenCalled();
    });

    it("limits a program chair to their program", async () => {
      mockAuth({ roles: { chairOfPrograms: [N.id] } });
      await get();
      expect(loadedPrograms()).toEqual([N.id]);
    });

    it.each([
      ["the VPAA", { isVpaa: true }],
      ["the FDIS chair", { isFdisChair: true }],
      ["the CITL director", { isCitlDirector: true }],
    ])("lets %s see every program", async (_label, roles) => {
      mockAuth({ roles });
      await get(`?term=${TERM}&college=${CON}`);
      expect(mocks.loadTermSlots).toHaveBeenCalled();
    });
  });

  it("returns 401 when signed out, touching nothing", async () => {
    mockAuth({ signedIn: false });
    const res = await get();
    expect(res.status).toBe(401);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("returns 403 to faculty without a dashboard, touching nothing", async () => {
    mockAuth({ roles: { facultyOfPrograms: [IT.id] } });
    const res = await get();
    expect(res.status).toBe(403);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it.each([
    ["no term", ""],
    ["a malformed term", "?term=nope"],
    ["a malformed filter", `?term=${TERM}&college=nope`],
  ])("returns 400 for %s, touching nothing", async (_label, query) => {
    const res = await get(query);
    expect(res.status).toBe(400);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("propagates a missing term as 404", async () => {
    mocks.termsGetOne.mockRejectedValue({ status: 404 });
    const res = await get();
    expect(res.status).toBe(404);
  });

  it("delegates PocketBase errors to handlePbError", async () => {
    const error = { status: 500 };
    mocks.loadTermSlots.mockRejectedValue(error);
    const res = await get();
    expect(res.status).toBe(500);
    expect(handlePbError).toHaveBeenCalledWith(error);
  });
});
