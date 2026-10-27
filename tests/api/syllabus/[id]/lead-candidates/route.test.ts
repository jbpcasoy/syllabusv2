import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getOne: vi.fn(),
  resolveSyllabusAccess: vi.fn(),
  listCoAuthorCandidates: vi.fn(),
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
  listCoAuthorCandidates: mocks.listCoAuthorCandidates,
}));
vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);
vi.mock("@/lib/roles", async () =>
  (await import("@/tests/helpers/mock-auth")).rolesModuleMock(),
);
vi.mock("@/lib/capabilities", async () =>
  (await import("@/tests/helpers/mock-auth")).capabilitiesModuleMock(),
);

import { GET } from "@/app/api/syllabus/[id]/lead-candidates/route";
import { createAdminPb } from "@/lib/pocketbase";
import { mockAuth } from "@/tests/helpers/mock-auth";

const ID = "sylsylsylsylsyl";
const PROGRAM = "prg123prg123prg";
const ctx = { params: Promise.resolve({ id: ID }) };
const syllabus = { id: ID, program: PROGRAM, lead: "l", co_authors: [] };
const candidates = [{ id: "u", name: "Ana", email: "a@x" }];

const get = (query = "") =>
  GET(new NextRequest(`http://localhost/api/syllabus/${ID}/lead-candidates${query}`), ctx);

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ roles: { chairOfPrograms: [PROGRAM] }, scope: { programId: PROGRAM } });
  mocks.getOne.mockResolvedValue(syllabus);
  mocks.resolveSyllabusAccess.mockResolvedValue(null);
  mocks.listCoAuthorCandidates.mockResolvedValue(candidates);
});

describe("GET /api/syllabus/:id/lead-candidates", () => {
  it("searches the program's faculty for the chair", async () => {
    const res = await get("?search=%20an%20");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ items: candidates });
    expect(mocks.listCoAuthorCandidates).toHaveBeenCalledWith(
      expect.anything(),
      syllabus,
      "an",
    );
  });

  it("lets an admin search", async () => {
    mockAuth({ isAdmin: true });
    expect((await get()).status).toBe(200);
  });

  it("returns 403 to someone who can see it but may not transfer", async () => {
    mockAuth();
    mocks.resolveSyllabusAccess.mockResolvedValue("lead");
    expect((await get()).status).toBe(403);
    expect(mocks.listCoAuthorCandidates).not.toHaveBeenCalled();
  });

  it("answers 404 to an outsider", async () => {
    mockAuth();
    expect((await get()).status).toBe(404);
  });

  it("returns 401 when signed out", async () => {
    mockAuth({ signedIn: false });
    expect((await get()).status).toBe(401);
    expect(createAdminPb).not.toHaveBeenCalled();
  });
});
