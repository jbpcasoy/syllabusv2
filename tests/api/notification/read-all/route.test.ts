import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  markAllRead: vi.fn(),
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

// Mocked wholesale so the real module (and "server-only") is never loaded.
vi.mock("@/lib/notification", () => ({ markAllRead: mocks.markAllRead }));

vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);

import { POST } from "@/app/api/notification/read-all/route";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { mockAuth } from "@/tests/helpers/mock-auth";

const ME = "me1me1me1me1me1";
const NOW = "2026-10-28T08:00:00.000Z";

const post = () => POST();

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date(NOW));
  mockAuth({ id: ME });
  mocks.markAllRead.mockResolvedValue(undefined);
});

describe("POST /api/notification/read-all", () => {
  it("marks the caller's notifications read and returns 204 with no body", async () => {
    const res = await post();

    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
    expect(mocks.markAllRead).toHaveBeenCalledWith(expect.anything(), ME, NOW);
  });

  it("returns 401 when signed out, touching nothing", async () => {
    mockAuth({ signedIn: false });
    const res = await post();
    expect(res.status).toBe(401);
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.markAllRead).not.toHaveBeenCalled();
  });

  it("delegates PocketBase errors to handlePbError", async () => {
    const error = { status: 500 };
    mocks.markAllRead.mockRejectedValue(error);

    const res = await post();
    expect(res.status).toBe(500);
    expect(handlePbError).toHaveBeenCalledWith(error);
  });
});
