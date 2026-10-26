import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  termsGetOne: vi.fn(),
  listReferenceSources: vi.fn(),
}));

vi.mock("@/lib/pocketbase", async () => {
  const { NextResponse } = await import("next/server");
  return {
    createAdminPb: vi.fn(async () => ({
      collection: () => ({ getOne: mocks.termsGetOne }),
    })),
    handlePbError: vi.fn((error: unknown) => {
      const status =
        typeof error === "object" && error && "status" in error
          ? Number((error as { status: unknown }).status)
          : 500;
      return NextResponse.json({ error: "pb error" }, { status });
    }),
  };
});

vi.mock("@/lib/syllabus-reference", () => ({
  listReferenceSources: mocks.listReferenceSources,
}));

vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);

import { GET } from "@/app/api/syllabus-reference/sources/route";
import { createAdminPb } from "@/lib/pocketbase";
import { authorizeMock, mockAuth } from "@/tests/helpers/mock-auth";

// Real PocketBase ids are lowercase; the route validates them.
const PROGRAM = "prgbprgbprgbprg";
const TERM = "trmtrmtrmtrmtrm";
const SCOPE = { programId: PROGRAM };
const term = { id: TERM, school_year: "sy0sy0sy0sy0sy0", semester: "Summer" };

function get(query = `?program=${PROGRAM}&term=${TERM}`) {
  return new NextRequest(`http://localhost/api/syllabus-reference/sources${query}`);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ roles: { chairOfPrograms: [PROGRAM] }, scope: SCOPE });
  mocks.termsGetOne.mockResolvedValue(term);
  mocks.listReferenceSources.mockResolvedValue({
    page: 1,
    perPage: 30,
    totalItems: 0,
    totalPages: 0,
    items: [],
  });
});

describe("GET /api/syllabus-reference/sources", () => {
  it("lists sources for the chair's program and term", async () => {
    const res = await GET(get(`?program=${PROGRAM}&term=${TERM}&search=%20GE%20&perPage=500`));

    expect(res.status).toBe(200);
    expect(authorizeMock).toHaveBeenCalledWith(
      expect.anything(),
      "syllabusReference.request",
      { program: PROGRAM },
    );
    expect(mocks.listReferenceSources).toHaveBeenCalledWith(expect.anything(), {
      program: PROGRAM,
      term,
      search: "GE",
      page: 1,
      perPage: 100,
    });
  });

  it.each([
    ["missing program", `?term=${TERM}`],
    ["bad term", `?program=${PROGRAM}&term=nope`],
  ])("returns 400 for %s", async (_label, query) => {
    const res = await GET(get(query));
    expect(res.status).toBe(400);
    expect(authorizeMock).not.toHaveBeenCalled();
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("returns 401 when signed out", async () => {
    mockAuth({ signedIn: false });
    const res = await GET(get());
    expect(res.status).toBe(401);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("returns 403 for a chair of another program, touching nothing", async () => {
    mockAuth({ roles: { chairOfPrograms: ["otherotherother"] }, scope: SCOPE });
    const res = await GET(get());
    expect(res.status).toBe(403);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("returns 403 for plain faculty", async () => {
    mockAuth({ roles: { facultyOfPrograms: [PROGRAM] }, scope: SCOPE });
    const res = await GET(get());
    expect(res.status).toBe(403);
  });

  it("lets an admin through", async () => {
    mockAuth({ isAdmin: true, scope: SCOPE });
    const res = await GET(get());
    expect(res.status).toBe(200);
  });

  it("propagates 404 for a missing term", async () => {
    mocks.termsGetOne.mockRejectedValue({ status: 404 });
    const res = await GET(get());
    expect(res.status).toBe(404);
    expect(mocks.listReferenceSources).not.toHaveBeenCalled();
  });
});
