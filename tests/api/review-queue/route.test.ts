import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  syllabiGetList: vi.fn(),
  loadMyStandIns: vi.fn(),
  loadQueueExtras: vi.fn(),
  queueFilter: vi.fn(() => "FILTER"),
  queueSort: vi.fn(() => "SORT"),
  queueStages: vi.fn(),
  toQueueItems: vi.fn(),
}));

vi.mock("@/lib/pocketbase", async () => {
  const { NextResponse } = await import("next/server");
  return {
    createAdminPb: vi.fn(async () => ({
      collection: () => ({ getList: mocks.syllabiGetList }),
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

vi.mock("@/lib/review-queue", () => ({
  QUEUE_EXPAND: "EXPAND",
  loadMyStandIns: mocks.loadMyStandIns,
  loadQueueExtras: mocks.loadQueueExtras,
  queueFilter: mocks.queueFilter,
  queueSort: mocks.queueSort,
  queueStages: mocks.queueStages,
  toQueueItems: mocks.toQueueItems,
}));

vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);
vi.mock("@/lib/roles", async () =>
  (await import("@/tests/helpers/mock-auth")).rolesModuleMock(),
);

import { GET } from "@/app/api/review-queue/route";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { mockAuth } from "@/tests/helpers/mock-auth";

const ME = "me1me1me1me1me1";
const COLLEGE = "colAcolAcolAcol";
const STAND_INS = [{ syllabus: "s1", stage: 1, user: ME }];
const COVERS = [{ syllabus: "a", stage: 2, user: "x" }];
const VERSIONS = new Map([["a", 2]]);

const get = (query = "") =>
  GET(new NextRequest(`http://localhost/api/review-queue${query}`));

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ id: ME, roles: { deanOfColleges: [COLLEGE] } });
  mocks.loadMyStandIns.mockResolvedValue(STAND_INS);
  mocks.queueStages.mockReturnValue([1, 2]);
  mocks.syllabiGetList.mockResolvedValue({
    page: 1,
    perPage: 30,
    totalItems: 1,
    totalPages: 1,
    items: [{ id: "a" }],
  });
  mocks.loadQueueExtras.mockResolvedValue({ covers: COVERS, versionNos: VERSIONS });
  mocks.toQueueItems.mockReturnValue([{ mapped: true }]);
});

describe("GET /api/review-queue", () => {
  it("lists the requested stage and status, mapped", async () => {
    const res = await get("?stage=2&status=passed&program=prg&term=trm&search=%20IT%20");

    expect(res.status).toBe(200);
    expect(mocks.queueStages).toHaveBeenCalledWith(
      expect.objectContaining({ deanOfColleges: [COLLEGE] }),
      [1],
    );
    expect(mocks.queueFilter).toHaveBeenCalledWith(expect.anything(), {
      stage: 2,
      status: "passed",
      me: ME,
      roles: expect.objectContaining({ deanOfColleges: [COLLEGE] }),
      standIns: STAND_INS,
      program: "prg",
      term: "trm",
      search: "IT",
    });
    expect(mocks.queueSort).toHaveBeenCalledWith("passed");
    expect(mocks.syllabiGetList).toHaveBeenCalledWith(1, 30, {
      sort: "SORT",
      expand: "EXPAND",
      filter: "FILTER",
    });
    expect(mocks.loadQueueExtras).toHaveBeenCalledWith(expect.anything(), ["a"]);
    expect(mocks.toQueueItems).toHaveBeenCalledWith([{ id: "a" }], {
      stage: 2,
      me: ME,
      roles: expect.objectContaining({ deanOfColleges: [COLLEGE] }),
      covers: COVERS,
      versionNos: VERSIONS,
    });
    expect(await res.json()).toEqual({
      page: 1,
      perPage: 30,
      totalItems: 1,
      totalPages: 1,
      items: [{ mapped: true }],
      stages: [1, 2],
      stage: 2,
    });
  });

  it("defaults to the first stage and the waiting status", async () => {
    const res = await get();
    expect(mocks.queueFilter).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        stage: 1,
        status: "waiting",
        program: undefined,
        term: undefined,
        search: undefined,
      }),
    );
    expect((await res.json()).stage).toBe(1);
  });

  it("clamps paging", async () => {
    await get("?page=0&perPage=500");
    expect(mocks.syllabiGetList).toHaveBeenCalledWith(1, 100, expect.anything());
    await get("?page=3&perPage=0");
    expect(mocks.syllabiGetList).toHaveBeenLastCalledWith(3, 30, expect.anything());
  });

  it("returns an empty queue for a user with no stages", async () => {
    mocks.queueStages.mockReturnValue([]);
    const res = await get();
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ items: [], stages: [], stage: 0 });
    expect(mocks.syllabiGetList).not.toHaveBeenCalled();
  });

  it.each(["?stage=3", "?stage=abc", "?stage=0"])(
    "returns 403 for a stage the caller doesn't review (%s)",
    async (query) => {
      const res = await get(query);
      expect(res.status).toBe(403);
      expect(mocks.syllabiGetList).not.toHaveBeenCalled();
    },
  );

  it("returns 400 for an unknown status before touching PocketBase", async () => {
    const res = await get("?status=everything");
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "Status must be waiting, returned or passed.",
    });
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("returns 401 when signed out", async () => {
    mockAuth({ signedIn: false });
    expect((await get()).status).toBe(401);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("delegates PocketBase errors", async () => {
    mocks.syllabiGetList.mockRejectedValue({ status: 400 });
    expect((await get()).status).toBe(400);
    expect(handlePbError).toHaveBeenCalled();
  });
});
