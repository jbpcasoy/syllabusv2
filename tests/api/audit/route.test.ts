import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listAudit: vi.fn(),
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
vi.mock("@/lib/audit-log", () => ({ listAudit: mocks.listAudit }));
vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);

// The validator stays real: it is pure, and the 400s are its messages.
import { GET } from "@/app/api/audit/route";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { mockAuth, requireUserMock } from "@/tests/helpers/mock-auth";

const ID = "sylsylsylsylsyl";
const page = {
  page: 1,
  perPage: 30,
  totalItems: 1,
  totalPages: 1,
  items: [{ id: "aud", action: "approved", actor_name: "Dean" }],
};

const get = (query = "") =>
  GET(new NextRequest(`http://localhost/api/audit${query}`));

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ id: "adminadminadmin", isAdmin: true });
  mocks.listAudit.mockResolvedValue(page);
});

describe("GET /api/audit", () => {
  it("lists the audit log for an admin", async () => {
    const res = await get();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(page);
    expect(requireUserMock).toHaveBeenCalledWith("audit.view");
    expect(mocks.listAudit).toHaveBeenCalledWith(expect.anything(), {}, 1, 30);
  });

  it("passes the parsed filters and paging", async () => {
    await get(
      `?action=lead.transferred&syllabus=${ID}&override=true&from=2026-10-01&to=2026-10-28&page=2&perPage=10`,
    );
    expect(mocks.listAudit).toHaveBeenCalledWith(
      expect.anything(),
      {
        action: "lead.transferred",
        syllabus: ID,
        override: true,
        from: new Date("2026-09-30T16:00:00.000Z"),
        to: new Date("2026-10-28T16:00:00.000Z"),
      },
      2,
      10,
    );
  });

  it.each([
    ["-5", 1],
    ["500", 100],
    ["abc", 30],
  ])("clamps perPage=%s to %i", async (perPage, expected) => {
    await get(`?perPage=${perPage}`);
    expect(mocks.listAudit).toHaveBeenCalledWith(
      expect.anything(),
      {},
      1,
      expected,
    );
  });

  it.each([
    ["?action=deleted"],
    ["?actor=short"],
    ["?from=2026-02-30"],
    ["?from=2026-10-29&to=2026-10-28"],
  ])("returns 400 for %s before touching PocketBase", async (query) => {
    const res = await get(query);
    expect(res.status).toBe(400);
    expect(await res.json()).toHaveProperty("error");
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("returns 401 when signed out", async () => {
    mockAuth({ signedIn: false });
    expect((await get()).status).toBe(401);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it.each([
    ["the VPAA", { isVpaa: true }],
    ["a dean", { deanOfColleges: ["colcolcolcolcol"] }],
    ["a program chair", { chairOfPrograms: ["prgprgprgprgprg"] }],
  ])("returns 403 to %s with nothing touching PocketBase", async (_label, roles) => {
    mockAuth({ id: "useruseruseruse", roles });
    expect((await get()).status).toBe(403);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("delegates errors to handlePbError", async () => {
    mocks.listAudit.mockRejectedValue({ status: 500 });
    expect((await get()).status).toBe(500);
    expect(handlePbError).toHaveBeenCalledWith({ status: 500 });
  });
});
