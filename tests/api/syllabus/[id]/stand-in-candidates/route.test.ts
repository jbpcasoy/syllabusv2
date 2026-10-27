import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getOne: vi.fn(),
  resolveSyllabusAccess: vi.fn(),
  loadChainHolders: vi.fn(),
  listStandInCandidates: vi.fn(),
}));

vi.mock("@/lib/pocketbase", async () => {
  const { NextResponse } = await import("next/server");
  const collection = () => ({ getOne: mocks.getOne });
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

vi.mock("@/lib/syllabus", () => ({
  resolveSyllabusAccess: mocks.resolveSyllabusAccess,
}));
vi.mock("@/lib/syllabus-chain", () => ({
  loadChainHolders: mocks.loadChainHolders,
}));
vi.mock("@/lib/syllabus-stand-in", () => ({
  listStandInCandidates: mocks.listStandInCandidates,
}));
vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);
vi.mock("@/lib/roles", async () =>
  (await import("@/tests/helpers/mock-auth")).rolesModuleMock(),
);

import { GET } from "@/app/api/syllabus/[id]/stand-in-candidates/route";
import { createAdminPb } from "@/lib/pocketbase";
import { mockAuth } from "@/tests/helpers/mock-auth";

const ID = "sylsylsylsylsyl";
const REVIEWER = "revwrevwrevwrev";
const DEAN = "deandeandeandea";
const OTHER = "othrothrothroth";
const HOLDERS = [[REVIEWER], [DEAN], ["f"], ["c"], ["v"]];
const ctx = { params: Promise.resolve({ id: ID }) };
const syllabus = {
  id: ID,
  program: "prg123prg123prg",
  lead: "leadleadleadlea",
  co_authors: [],
  status: "submitted",
  stage: 1,
};
const candidates = [{ id: "u", name: "Ana", email: "a@x" }];

const get = (query: string) =>
  GET(
    new NextRequest(
      `http://localhost/api/syllabus/${ID}/stand-in-candidates${query}`,
    ),
    ctx,
  );

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ id: DEAN });
  mocks.getOne.mockResolvedValue(syllabus);
  mocks.loadChainHolders.mockResolvedValue(HOLDERS);
  mocks.resolveSyllabusAccess.mockResolvedValue("reviewer");
  mocks.listStandInCandidates.mockResolvedValue(candidates);
});

describe("GET /api/syllabus/:id/stand-in-candidates", () => {
  it("lists candidates for a designator", async () => {
    const res = await get("?stage=1&search=%20an%20");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ items: candidates });
    expect(mocks.listStandInCandidates).toHaveBeenCalledWith(
      expect.anything(),
      syllabus,
      1,
      "an",
    );
  });

  it.each(["", "?stage=0", "?stage=6", "?stage=two", "?stage=1.5"])(
    "returns 400 for %j before touching PocketBase",
    async (query) => {
      const res = await get(query);
      expect(res.status).toBe(400);
      expect(createAdminPb).not.toHaveBeenCalled();
    },
  );

  it("returns 403 to a reviewer who may not designate that stage", async () => {
    const res = await get("?stage=2");
    expect(res.status).toBe(403);
    expect(mocks.listStandInCandidates).not.toHaveBeenCalled();
  });

  it("answers 404 to an outsider", async () => {
    mockAuth({ id: OTHER });
    mocks.resolveSyllabusAccess.mockResolvedValue(null);

    const res = await get("?stage=1");
    expect(res.status).toBe(404);
  });

  it("lets an admin search any stage", async () => {
    mockAuth({ id: OTHER, isAdmin: true });
    const res = await get("?stage=5");
    expect(res.status).toBe(200);
    expect(mocks.listStandInCandidates).toHaveBeenCalledWith(
      expect.anything(),
      syllabus,
      5,
      "",
    );
  });

  it("returns 401 when signed out", async () => {
    mockAuth({ signedIn: false });
    const res = await get("?stage=1");
    expect(res.status).toBe(401);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("propagates 404 from PocketBase", async () => {
    mocks.getOne.mockRejectedValue({ status: 404 });
    const res = await get("?stage=1");
    expect(res.status).toBe(404);
  });
});
