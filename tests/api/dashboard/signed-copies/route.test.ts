import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  loadFilteredPrograms: vi.fn(),
  listAwaitingSignedCopy: vi.fn(),
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
// Only the reads are faked; the pure scopePrograms and paging decide.
vi.mock("@/lib/dashboard", async () => {
  const { scopePrograms } = await import("@/lib/dashboard-scope");
  return {
    listAwaitingSignedCopy: mocks.listAwaitingSignedCopy,
    paging: (params: URLSearchParams) => ({
      page: Math.max(1, Number(params.get("page")) || 1),
      perPage: Math.min(100, Math.max(1, Number(params.get("perPage")) || 30)),
    }),
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

import { GET } from "@/app/api/dashboard/signed-copies/route";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import type { ProgramOrg } from "@/types/dashboard";
import { mockAuth } from "@/tests/helpers/mock-auth";

const TERM = "trmtrmtrmtrmtrm";
const program = (id: string, collegeId: string): ProgramOrg => ({
  id,
  code: id.slice(0, 4),
  name: id,
  departmentId: `${id.slice(0, 10)}dept1`,
  departmentName: "Dept",
  collegeId,
  collegeName: "College",
});
const COT = "colcotcolcotcol";
const CON = "colconcolconcol";
const IT = program("prgitprgitprgit", COT);
const N = program("prgnprgnprgnprg", CON);
const LIST = {
  page: 1,
  perPage: 30,
  totalItems: 1,
  totalPages: 1,
  items: [{ id: "sylsylsylsylsyl", course_code: "IT 101", lead_name: "Ana" }],
};

const get = (query = `?term=${TERM}`) =>
  GET(new NextRequest(`http://localhost/api/dashboard/signed-copies${query}`));
const listedPrograms = () =>
  (mocks.listAwaitingSignedCopy.mock.calls[0][2] as { programs: ProgramOrg[] }).programs.map((p) => p.id);

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ isAdmin: true });
  mocks.loadFilteredPrograms.mockResolvedValue([IT, N]);
  mocks.listAwaitingSignedCopy.mockResolvedValue(LIST);
});

describe("GET /api/dashboard/signed-copies", () => {
  it("returns the list for the term", async () => {
    const res = await get();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(LIST);
    expect(mocks.listAwaitingSignedCopy).toHaveBeenCalledWith(
      expect.anything(),
      TERM,
      { ok: true, programs: [IT, N], everything: true },
      1,
      30,
    );
  });

  it.each([
    ["&page=3&perPage=10", 3, 10],
    ["&page=0&perPage=500", 1, 100],
  ])("passes clamped paging (%s)", async (query, page, perPage) => {
    await get(`?term=${TERM}${query}`);
    expect(mocks.listAwaitingSignedCopy.mock.calls[0].slice(3)).toEqual([page, perPage]);
  });

  it("limits a dean to their college", async () => {
    mockAuth({ roles: { deanOfColleges: [COT] } });
    await get();
    expect(listedPrograms()).toEqual([IT.id]);
  });

  it("lets a department head use it (not justifications)", async () => {
    mockAuth({ roles: { headOfDepartments: [IT.departmentId] } });
    const res = await get();
    expect(res.status).toBe(200);
    expect(listedPrograms()).toEqual([IT.id]);
  });

  it("answers 403 to a filter outside the scope, listing nothing", async () => {
    mockAuth({ roles: { deanOfColleges: [COT] } });
    mocks.loadFilteredPrograms.mockResolvedValue([N]);
    const res = await get(`?term=${TERM}&college=${CON}`);
    expect(res.status).toBe(403);
    expect(mocks.listAwaitingSignedCopy).not.toHaveBeenCalled();
  });

  it("lets the VPAA filter anywhere", async () => {
    mockAuth({ roles: { isVpaa: true } });
    mocks.loadFilteredPrograms.mockResolvedValue([N]);
    const res = await get(`?term=${TERM}&college=${CON}`);
    expect(res.status).toBe(200);
    expect(listedPrograms()).toEqual([N.id]);
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

  it.each(["", "?term=nope", `?term=${TERM}&program=nope`])(
    "returns 400 for %o, touching nothing",
    async (query) => {
      expect((await get(query)).status).toBe(400);
      expect(createAdminPb).not.toHaveBeenCalled();
    },
  );

  it("delegates PocketBase errors to handlePbError", async () => {
    const error = { status: 500 };
    mocks.listAwaitingSignedCopy.mockRejectedValue(error);
    expect((await get()).status).toBe(500);
    expect(handlePbError).toHaveBeenCalledWith(error);
  });
});
