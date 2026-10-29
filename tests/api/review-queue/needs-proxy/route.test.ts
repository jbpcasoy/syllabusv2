import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listNeedsProxy: vi.fn(),
}));

vi.mock("@/lib/pocketbase", async () => {
  const { NextResponse } = await import("next/server");
  return {
    createAdminPb: vi.fn(async () => ({ collection: vi.fn() })),
    handlePbError: vi.fn((error: unknown) => {
      const status =
        typeof error === "object" && error && "status" in error
          ? Number((error as { status: unknown }).status)
          : 500;
      return NextResponse.json({ error: "pb error" }, { status });
    }),
  };
});

vi.mock("@/lib/review-queue", () => ({
  listNeedsProxy: mocks.listNeedsProxy,
}));

vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);
vi.mock("@/lib/roles", async () =>
  (await import("@/tests/helpers/mock-auth")).rolesModuleMock(),
);

import { GET } from "@/app/api/review-queue/needs-proxy/route";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { mockAuth } from "@/tests/helpers/mock-auth";

const ME = "me1me1me1me1me1";
const COLLEGE = "colAcolAcolAcol";

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ id: ME, roles: { deanOfColleges: [COLLEGE] } });
  mocks.listNeedsProxy.mockResolvedValue([{ id: "a", mapped: true }]);
});

describe("GET /api/review-queue/needs-proxy", () => {
  it("lists the caller's drafts waiting on a proxy", async () => {
    const res = await GET();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ items: [{ id: "a", mapped: true }] });
    expect(mocks.listNeedsProxy).toHaveBeenCalledWith(
      expect.anything(),
      ME,
      expect.objectContaining({ deanOfColleges: [COLLEGE] }),
    );
  });

  it("returns 401 when signed out", async () => {
    mockAuth({ signedIn: false });
    const res = await GET();
    expect(res.status).toBe(401);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("delegates PocketBase errors to handlePbError", async () => {
    mocks.listNeedsProxy.mockRejectedValue({ status: 500 });
    const res = await GET();
    expect(res.status).toBe(500);
    expect(handlePbError).toHaveBeenCalled();
  });
});
