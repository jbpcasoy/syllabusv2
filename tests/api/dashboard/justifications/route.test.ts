import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  loadFilteredPrograms: vi.fn(),
  listJustifications: vi.fn(),
}));

vi.mock("@/lib/pocketbase", async () => {
  const { NextResponse } = await import("next/server");
  return {
    createAdminPb: vi.fn(async () => ({})),
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
// Only the reads are faked; the pure scopePrograms decides.
vi.mock("@/lib/dashboard", async () => {
  const { scopePrograms } = await import("@/lib/dashboard-scope");
  return {
    listJustifications: mocks.listJustifications,
    paging: () => ({ page: 1, perPage: 30 }),
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

import { GET } from "@/app/api/dashboard/justifications/route";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import type { ProgramOrg } from "@/types/dashboard";
import { mockAuth } from "@/tests/helpers/mock-auth";

const TERM = "trmtrmtrmtrmtrm";
const COT = "colcotcolcotcol";
const CON = "colconcolconcol";
const program = (id: string, departmentId: string, collegeId: string): ProgramOrg => ({
  id,
  code: id.slice(0, 4),
  name: id,
  departmentId,
  departmentName: "Dept",
  collegeId,
  collegeName: "College",
});
const IT = program("prgitprgitprgit", "depitdepitdepit", COT);
const EMC = program("prgemcprgemcprg", "depitdepitdepit", COT);
const N = program("prgnprgnprgnprg", "depndepndepndep", CON);
const LIST = { page: 1, perPage: 30, totalItems: 0, totalPages: 0, items: [] };

const get = (query = `?term=${TERM}`) =>
  GET(new NextRequest(`http://localhost/api/dashboard/justifications${query}`));
const listedPrograms = () =>
  (mocks.listJustifications.mock.calls[0][2] as { programs: ProgramOrg[] }).programs.map((p) => p.id);

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ isAdmin: true });
  mocks.loadFilteredPrograms.mockResolvedValue([IT, EMC, N]);
  mocks.listJustifications.mockResolvedValue(LIST);
});

describe("GET /api/dashboard/justifications", () => {
  it("returns the list for the term", async () => {
    const res = await get();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(LIST);
    expect(mocks.listJustifications).toHaveBeenCalledWith(
      expect.anything(),
      TERM,
      { ok: true, programs: [IT, EMC, N], everything: true },
      undefined,
      1,
      30,
    );
  });

  it.each(["none", "draft", "submitted", "returned"])(
    "passes the state filter %s",
    async (state) => {
      await get(`?term=${TERM}&state=${state}`);
      expect(mocks.listJustifications.mock.calls[0][3]).toBe(state);
    },
  );

  it("returns 400 for an unknown state, touching nothing", async () => {
    const res = await get(`?term=${TERM}&state=approved`);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "`state` must be one of: none, draft, submitted, returned",
    });
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  describe("who sees justifications", () => {
    it.each([
      ["the VPAA", { isVpaa: true }],
      ["the FDIS chair", { isFdisChair: true }],
      ["the CITL director", { isCitlDirector: true }],
    ])("lets %s see every program", async (_label, roles) => {
      mockAuth({ roles });
      expect((await get()).status).toBe(200);
      expect(listedPrograms()).toEqual([IT.id, EMC.id, N.id]);
    });

    it("limits a dean to their college", async () => {
      mockAuth({ roles: { deanOfColleges: [COT] } });
      await get();
      expect(listedPrograms()).toEqual([IT.id, EMC.id]);
    });

    it("limits a program reviewer to their program", async () => {
      mockAuth({ roles: { reviewerOfPrograms: [EMC.id] } });
      await get();
      expect(listedPrograms()).toEqual([EMC.id]);
    });

    it("ignores the head and chair parts of a reviewer's roles", async () => {
      mockAuth({
        roles: {
          reviewerOfPrograms: [EMC.id],
          headOfDepartments: [N.departmentId],
          chairOfPrograms: [IT.id],
        },
      });
      await get();
      expect(listedPrograms()).toEqual([EMC.id]);
    });

    it.each([
      ["a department head", { headOfDepartments: [IT.departmentId] }],
      ["a program chair", { chairOfPrograms: [IT.id] }],
    ])("answers 403 to %s, touching nothing", async (_label, roles) => {
      mockAuth({ roles });
      const res = await get();
      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({
        error: "Only reviewers and administrators see justifications.",
      });
      expect(createAdminPb).not.toHaveBeenCalled();
    });

    it("answers 403 to a reviewer filtering another program, listing nothing", async () => {
      mockAuth({ roles: { reviewerOfPrograms: [EMC.id] } });
      mocks.loadFilteredPrograms.mockResolvedValue([IT]);
      const res = await get(`?term=${TERM}&program=${IT.id}`);
      expect(res.status).toBe(403);
      expect(mocks.listJustifications).not.toHaveBeenCalled();
    });
  });

  it("returns 401 when signed out, touching nothing", async () => {
    mockAuth({ signedIn: false });
    expect((await get()).status).toBe(401);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("returns 403 to faculty, touching nothing", async () => {
    mockAuth({ roles: { facultyOfPrograms: [IT.id] } });
    expect((await get()).status).toBe(403);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("returns 400 for a missing term", async () => {
    expect((await get("")).status).toBe(400);
  });

  it("delegates PocketBase errors to handlePbError", async () => {
    const error = { status: 500 };
    mocks.listJustifications.mockRejectedValue(error);
    expect((await get()).status).toBe(500);
    expect(handlePbError).toHaveBeenCalledWith(error);
  });
});
