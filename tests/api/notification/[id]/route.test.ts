import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getFirstListItem: vi.fn(),
  getOne: vi.fn(),
  update: vi.fn(),
  filter: vi.fn(
    (expr: string, params: Record<string, unknown>) =>
      `${expr}|${JSON.stringify(params)}`,
  ),
  parseNotificationUpdateInput: vi.fn(),
  toNotificationResponse: vi.fn((record: Record<string, unknown>) => ({
    ...record,
    mapped: true,
  })),
}));

vi.mock("@/lib/pocketbase", async () => {
  const { NextResponse } = await import("next/server");
  const collection = () => ({
    getFirstListItem: mocks.getFirstListItem,
    getOne: mocks.getOne,
    update: mocks.update,
  });
  return {
    createAdminPb: vi.fn(async () => ({ collection, filter: mocks.filter })),
    handlePbError: vi.fn((error: unknown) => {
      const status =
        typeof error === "object" && error && "status" in error
          ? Number((error as { status: unknown }).status)
          : 500;
      return NextResponse.json({ error: "pb error" }, { status });
    }),
  };
});

vi.mock("@/lib/validators/notification", () => ({
  parseNotificationUpdateInput: mocks.parseNotificationUpdateInput,
}));

// Mocked wholesale so the real module (and "server-only") is never loaded.
vi.mock("@/lib/notification", () => ({
  NOTIFICATION_EXPAND: "actor",
  ownFilter: (_pb: unknown, userId: string) => `own:${userId}`,
  toNotificationResponse: mocks.toNotificationResponse,
}));

vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);

import { PATCH } from "@/app/api/notification/[id]/route";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { mockAuth } from "@/tests/helpers/mock-auth";

const ME = "me1me1me1me1me1";
const ID = "ntfntfntfntfntf";
const NOW = "2026-10-28T08:00:00.000Z";
const ctx = { params: Promise.resolve({ id: ID }) };

function patch(body: unknown, raw = false) {
  return PATCH(
    new NextRequest(`http://localhost/api/notification/${ID}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: raw ? (body as string) : JSON.stringify(body),
    }),
    ctx,
  );
}

function parses(read: boolean) {
  mocks.parseNotificationUpdateInput.mockReturnValue({
    ok: true,
    data: { read },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date(NOW));
  mockAuth({ id: ME });
  parses(true);
  mocks.getFirstListItem.mockResolvedValue({ id: ID, read_at: "" });
  mocks.getOne.mockResolvedValue({ id: ID, read_at: NOW });
});

describe("PATCH /api/notification/:id", () => {
  it("marks an unread row read and returns it mapped", async () => {
    const res = await patch({ read: true });

    expect(res.status).toBe(200);
    expect(mocks.getFirstListItem).toHaveBeenCalledWith(
      `id = {:id}|${JSON.stringify({ id: ID })} && own:${ME}`,
      { fields: "id,read_at" },
    );
    expect(mocks.update).toHaveBeenCalledWith(ID, { read_at: NOW });
    expect(mocks.getOne).toHaveBeenCalledWith(ID, { expand: "actor" });
    expect(await res.json()).toEqual({ id: ID, read_at: NOW, mapped: true });
  });

  it("marks a read row unread", async () => {
    parses(false);
    mocks.getFirstListItem.mockResolvedValue({ id: ID, read_at: NOW });

    await patch({ read: false });
    expect(mocks.update).toHaveBeenCalledWith(ID, { read_at: "" });
  });

  it("keeps the first read time when marking a read row read again", async () => {
    mocks.getFirstListItem.mockResolvedValue({
      id: ID,
      read_at: "2026-10-27 08:00:00.000Z",
    });

    const res = await patch({ read: true });
    expect(res.status).toBe(200);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("writes nothing when an unread row is marked unread", async () => {
    parses(false);
    await patch({ read: false });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("returns 400 with the validator's error", async () => {
    mocks.parseNotificationUpdateInput.mockReturnValue({
      ok: false,
      error: "`read` must be true or false",
    });

    const res = await patch({ read: "yes" });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "`read` must be true or false" });
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("passes malformed JSON to the validator as null", async () => {
    mocks.parseNotificationUpdateInput.mockReturnValue({
      ok: false,
      error: "Body must be a JSON object",
    });

    const res = await patch("{not json", true);
    expect(res.status).toBe(400);
    expect(mocks.parseNotificationUpdateInput).toHaveBeenCalledWith(null);
  });

  it("answers 404 for another user's row, the same as a missing one", async () => {
    mocks.getFirstListItem.mockRejectedValue({ status: 404 });

    const res = await patch({ read: true });
    expect(res.status).toBe(404);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("returns 401 when signed out, touching nothing", async () => {
    mockAuth({ signedIn: false });
    const res = await patch({ read: true });
    expect(res.status).toBe(401);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("delegates write errors to handlePbError", async () => {
    const error = { status: 500 };
    mocks.update.mockRejectedValue(error);

    const res = await patch({ read: true });
    expect(res.status).toBe(500);
    expect(handlePbError).toHaveBeenCalledWith(error);
  });
});
