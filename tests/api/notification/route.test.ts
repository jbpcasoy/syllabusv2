import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getList: vi.fn(),
  countUnread: vi.fn(),
  toNotificationResponse: vi.fn((record: Record<string, unknown>) => ({
    ...record,
    mapped: true,
  })),
}));

vi.mock("@/lib/pocketbase", async () => {
  const { NextResponse } = await import("next/server");
  const collection = (name: string) => ({
    getList: (...args: unknown[]) => mocks.getList(name, ...args),
  });
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

// Mocked wholesale so the real module (and "server-only") is never loaded.
vi.mock("@/lib/notification", () => ({
  NOTIFICATION_EXPAND: "actor",
  countUnread: mocks.countUnread,
  ownFilter: (_pb: unknown, userId: string, unreadOnly = false) =>
    `own:${userId}:${unreadOnly}`,
  toNotificationResponse: mocks.toNotificationResponse,
}));

vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);

import { GET } from "@/app/api/notification/route";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { mockAuth } from "@/tests/helpers/mock-auth";

const ME = "me1me1me1me1me1";
const rows = [{ id: "ntfntfntfntfntf", user: ME, title: "Hi" }];
const listResult = {
  page: 1,
  perPage: 30,
  totalItems: 1,
  totalPages: 1,
  items: rows,
};

const get = (query = "") =>
  GET(new NextRequest(`http://localhost/api/notification${query}`));

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ id: ME });
  mocks.getList.mockResolvedValue(listResult);
  mocks.countUnread.mockResolvedValue(3);
});

describe("GET /api/notification", () => {
  it("returns the caller's notifications, newest first, with the unread count", async () => {
    const res = await get();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ...listResult,
      items: rows.map((r) => ({ ...r, mapped: true })),
      unread_count: 3,
    });
    expect(mocks.getList).toHaveBeenCalledWith("notifications", 1, 30, {
      sort: "-created",
      expand: "actor",
      filter: `own:${ME}:false`,
    });
    expect(mocks.countUnread).toHaveBeenCalledWith(expect.anything(), ME);
  });

  it("lists only unread rows with unread=true", async () => {
    await get("?unread=true");
    expect(mocks.getList.mock.calls[0][3]).toMatchObject({
      filter: `own:${ME}:true`,
    });
  });

  it("treats any other unread value as all", async () => {
    await get("?unread=1");
    expect(mocks.getList.mock.calls[0][3]).toMatchObject({
      filter: `own:${ME}:false`,
    });
  });

  it("never lists another user's rows, whatever the query says", async () => {
    await get("?user=othrothrothroth");
    expect(mocks.getList.mock.calls[0][3]).toMatchObject({
      filter: `own:${ME}:false`,
    });
  });

  it.each([
    ["?page=3&perPage=10", 3, 10],
    ["?page=0&perPage=0", 1, 30],
    ["?page=-2&perPage=500", 1, 100],
    ["?page=abc&perPage=xyz", 1, 30],
  ])("clamps paging (%s)", async (query, page, perPage) => {
    await get(query);
    expect(mocks.getList).toHaveBeenCalledWith(
      "notifications",
      page,
      perPage,
      expect.anything(),
    );
  });

  it("returns 401 when signed out, touching nothing", async () => {
    mockAuth({ signedIn: false });
    const res = await get();
    expect(res.status).toBe(401);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("delegates PocketBase errors to handlePbError", async () => {
    const error = { status: 500 };
    mocks.getList.mockRejectedValue(error);
    const res = await get();
    expect(res.status).toBe(500);
    expect(handlePbError).toHaveBeenCalledWith(error);
  });
});
