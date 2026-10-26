import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listAvailable: vi.fn(),
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

vi.mock("@/lib/syllabus", () => ({ listAvailable: mocks.listAvailable }));

vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);

import { GET } from "@/app/api/syllabus/available/route";
import { createAdminPb } from "@/lib/pocketbase";
import { mockAuth } from "@/tests/helpers/mock-auth";

const ME = "me1me1me1me1me1";

function get(query = "") {
  return new NextRequest(`http://localhost/api/syllabus/available${query}`);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ id: ME });
  mocks.listAvailable.mockResolvedValue({
    page: 1,
    perPage: 30,
    totalItems: 0,
    totalPages: 0,
    items: [],
  });
});

describe("GET /api/syllabus/available", () => {
  it("lists for the caller with default paging", async () => {
    const res = await GET(get());

    expect(res.status).toBe(200);
    expect(mocks.listAvailable).toHaveBeenCalledWith(expect.anything(), ME, {
      page: 1,
      perPage: 30,
      search: undefined,
      term: undefined,
      program: undefined,
    });
    expect((await res.json()).items).toEqual([]);
  });

  it("passes filters through and clamps paging", async () => {
    await GET(
      get("?page=0&perPage=0&search=%20IT%20&term=trm123trm123trm&program=prg123prg123prg"),
    );

    expect(mocks.listAvailable).toHaveBeenCalledWith(expect.anything(), ME, {
      page: 1,
      perPage: 30,
      search: "IT",
      term: "trm123trm123trm",
      program: "prg123prg123prg",
    });
  });

  it("returns 401 when signed out", async () => {
    mockAuth({ signedIn: false });
    const res = await GET(get());
    expect(res.status).toBe(401);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("delegates PocketBase errors", async () => {
    mocks.listAvailable.mockRejectedValue({ status: 400 });
    const res = await GET(get());
    expect(res.status).toBe(400);
  });
});
