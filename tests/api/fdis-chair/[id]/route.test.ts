import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  update: vi.fn(),
  delete: vi.fn(),
  parseFdisChairUpdate: vi.fn(),
  hasActiveFdisChair: vi.fn(),
  toFdisChairResponse: vi.fn((record: Record<string, unknown>) => ({
    ...record,
    mapped: true,
  })),
}));

vi.mock("@/lib/pocketbase", async () => {
  const { NextResponse } = await import("next/server");
  const collection = () => ({
    update: mocks.update,
    delete: mocks.delete,
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

vi.mock("@/lib/validators/fdis-chair", () => ({
  parseFdisChairUpdate: mocks.parseFdisChairUpdate,
}));

vi.mock("@/lib/fdis-chair", () => ({
  hasActiveFdisChair: mocks.hasActiveFdisChair,
  toFdisChairResponse: mocks.toFdisChairResponse,
}));

vi.mock("@/lib/auth", () => ({
  requireUser: vi.fn(async () => ({
    ok: true,
    user: { id: "u1", role: "admin" },
  })),
}));

import { DELETE, PATCH } from "@/app/api/fdis-chair/[id]/route";
import { requireUser } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { createAdminPb } from "@/lib/pocketbase";

const ID = "abc123abc123abc";
const ctx = { params: Promise.resolve({ id: ID }) };

function req(method: string, body?: unknown) {
  return new NextRequest(`http://localhost/api/fdis-chair/${ID}`, {
    method,
    ...(body !== undefined && {
      headers: { "Content-Type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  });
}

function unauthorized() {
  vi.mocked(requireUser).mockResolvedValueOnce({
    ok: false,
    response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
  });
}

function forbidden() {
  vi.mocked(requireUser).mockResolvedValueOnce({
    ok: false,
    response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.hasActiveFdisChair.mockResolvedValue(false);
});

describe("PATCH /api/fdis-chair/:id", () => {
  it("deactivates without checking for another active chair", async () => {
    const updated = { id: ID, active: false };
    mocks.parseFdisChairUpdate.mockReturnValue({
      ok: true,
      data: { active: false },
    });
    mocks.update.mockResolvedValue(updated);

    const res = await PATCH(req("PATCH", { active: false }), ctx);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ...updated, mapped: true });
    expect(requireUser).toHaveBeenCalledWith(PERMISSIONS.fdisChair.write);
    expect(mocks.hasActiveFdisChair).not.toHaveBeenCalled();
    expect(mocks.update).toHaveBeenCalledWith(
      ID,
      { active: false },
      { expand: "user" },
    );
    expect(mocks.toFdisChairResponse).toHaveBeenCalledWith(updated);
  });

  it("activates when there is no other active chair", async () => {
    const updated = { id: ID, active: true };
    mocks.parseFdisChairUpdate.mockReturnValue({
      ok: true,
      data: { active: true },
    });
    mocks.update.mockResolvedValue(updated);

    const res = await PATCH(req("PATCH", { active: true }), ctx);

    expect(res.status).toBe(200);
    // The record itself is excluded from the "other active chair" check.
    expect(mocks.hasActiveFdisChair).toHaveBeenCalledWith(ID);
    expect(mocks.update).toHaveBeenCalledWith(
      ID,
      { active: true },
      { expand: "user" },
    );
  });

  it("returns 409 when activating would create a second active chair", async () => {
    mocks.parseFdisChairUpdate.mockReturnValue({
      ok: true,
      data: { active: true },
    });
    mocks.hasActiveFdisChair.mockResolvedValue(true);

    const res = await PATCH(req("PATCH", { active: true }), ctx);

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      error: "There is already an active FDIS chair. Deactivate them first.",
    });
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("returns 400 on validation failure without touching PocketBase", async () => {
    mocks.parseFdisChairUpdate.mockReturnValue({
      ok: false,
      error: "`active` must be a boolean",
    });

    const res = await PATCH(req("PATCH", { active: "yes" }), ctx);

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "`active` must be a boolean" });
    expect(mocks.hasActiveFdisChair).not.toHaveBeenCalled();
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("treats malformed JSON as a null body", async () => {
    mocks.parseFdisChairUpdate.mockReturnValue({
      ok: false,
      error: "invalid",
    });

    const res = await PATCH(req("PATCH", "{oops"), ctx);

    expect(mocks.parseFdisChairUpdate).toHaveBeenCalledWith(null);
    expect(res.status).toBe(400);
  });

  it("propagates a 404 from update", async () => {
    mocks.parseFdisChairUpdate.mockReturnValue({
      ok: true,
      data: { active: false },
    });
    mocks.update.mockRejectedValue({ status: 404 });

    const res = await PATCH(req("PATCH", { active: false }), ctx);

    expect(res.status).toBe(404);
  });

  it("returns 401 when not signed in", async () => {
    unauthorized();

    const res = await PATCH(req("PATCH", { active: false }), ctx);

    expect(res.status).toBe(401);
    expect(mocks.parseFdisChairUpdate).not.toHaveBeenCalled();
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("returns 403 when the caller lacks permission and never touches PocketBase", async () => {
    forbidden();

    const res = await PATCH(req("PATCH", { active: false }), ctx);

    expect(res.status).toBe(403);
    expect(mocks.parseFdisChairUpdate).not.toHaveBeenCalled();
    expect(mocks.hasActiveFdisChair).not.toHaveBeenCalled();
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/fdis-chair/:id", () => {
  it("deletes and returns 204 with no body", async () => {
    mocks.delete.mockResolvedValue(true);

    const res = await DELETE(req("DELETE"), ctx);

    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
    expect(requireUser).toHaveBeenCalledWith(PERMISSIONS.fdisChair.write);
    expect(createAdminPb).toHaveBeenCalledOnce();
    expect(mocks.delete).toHaveBeenCalledWith(ID);
  });

  it("propagates a 404 from PocketBase", async () => {
    mocks.delete.mockRejectedValue({ status: 404 });

    const res = await DELETE(req("DELETE"), ctx);

    expect(res.status).toBe(404);
  });

  it("returns 401 when not signed in", async () => {
    unauthorized();

    const res = await DELETE(req("DELETE"), ctx);

    expect(res.status).toBe(401);
    expect(mocks.delete).not.toHaveBeenCalled();
  });

  it("returns 403 when the caller lacks permission and never touches PocketBase", async () => {
    forbidden();

    const res = await DELETE(req("DELETE"), ctx);

    expect(res.status).toBe(403);
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.delete).not.toHaveBeenCalled();
  });
});
