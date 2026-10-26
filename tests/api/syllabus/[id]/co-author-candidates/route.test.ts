import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getOne: vi.fn(),
  getSyllabusAccess: vi.fn(),
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
  getSyllabusAccess: mocks.getSyllabusAccess,
  listCoAuthorCandidates: mocks.listCoAuthorCandidates,
}));

vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);
vi.mock("@/lib/roles", async () =>
  (await import("@/tests/helpers/mock-auth")).rolesModuleMock(),
);

import { GET } from "@/app/api/syllabus/[id]/co-author-candidates/route";
import { createAdminPb } from "@/lib/pocketbase";
import { mockAuth } from "@/tests/helpers/mock-auth";

const ID = "sylsylsylsylsyl";
const ME = "me1me1me1me1me1";
const ctx = { params: Promise.resolve({ id: ID }) };
const syllabus = { id: ID, program: "prg123prg123prg", lead: ME, co_authors: [] };
const candidates = [{ id: "cococococococoo", name: "Ben", email: "b@x" }];

function get(query = "") {
  return new NextRequest(
    `http://localhost/api/syllabus/${ID}/co-author-candidates${query}`,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ id: ME });
  mocks.getOne.mockResolvedValue(syllabus);
  mocks.getSyllabusAccess.mockReturnValue("lead");
  mocks.listCoAuthorCandidates.mockResolvedValue(candidates);
});

describe("GET /api/syllabus/:id/co-author-candidates", () => {
  it("searches candidates for the lead", async () => {
    const res = await GET(get("?search=%20be%20"), ctx);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ items: candidates });
    expect(mocks.getOne).toHaveBeenCalledWith(ID, {
      fields: "id,program,lead,co_authors",
    });
    expect(mocks.listCoAuthorCandidates).toHaveBeenCalledWith(
      expect.anything(),
      syllabus,
      "be",
    );
  });

  it("defaults the search to empty", async () => {
    await GET(get(), ctx);
    expect(mocks.listCoAuthorCandidates).toHaveBeenCalledWith(
      expect.anything(),
      syllabus,
      "",
    );
  });

  it("returns 401 when signed out", async () => {
    mockAuth({ signedIn: false });
    const res = await GET(get(), ctx);
    expect(res.status).toBe(401);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("answers 404 when the caller has no access", async () => {
    mocks.getSyllabusAccess.mockReturnValue(null);
    const res = await GET(get(), ctx);
    expect(res.status).toBe(404);
    expect(mocks.listCoAuthorCandidates).not.toHaveBeenCalled();
  });

  it.each(["coAuthor", "admin"])("returns 403 for %s access", async (access) => {
    mocks.getSyllabusAccess.mockReturnValue(access);
    const res = await GET(get(), ctx);
    expect(res.status).toBe(403);
    expect(mocks.listCoAuthorCandidates).not.toHaveBeenCalled();
  });

  it("propagates 404 from PocketBase", async () => {
    mocks.getOne.mockRejectedValue({ status: 404 });
    const res = await GET(get(), ctx);
    expect(res.status).toBe(404);
  });
});
