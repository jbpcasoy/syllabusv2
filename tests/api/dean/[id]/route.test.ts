import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getOne: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  parseDeanUpdate: vi.fn(),
  collegeHasActiveDean: vi.fn(),
  toDeanResponse: vi.fn((record: Record<string, unknown>) => ({
    ...record,
    mapped: true,
  })),
}));

vi.mock("@/lib/pocketbase", async () => {
  const { NextResponse } = await import("next/server");
  const collection = () => ({
    getOne: mocks.getOne,
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

vi.mock("@/lib/validators/dean", () => ({
  parseDeanUpdate: mocks.parseDeanUpdate,
}));

vi.mock("@/lib/dean", () => ({
  collegeHasActiveDean: mocks.collegeHasActiveDean,
  toDeanResponse: mocks.toDeanResponse,
}));

vi.mock("@/lib/auth", () => ({
  requireUser: vi.fn(async () => ({
    ok: true,
    user: { id: "u1", role: "admin" },
  })),
}));

import { DELETE, PATCH } from "@/app/api/dean/[id]/route";
import { requireUser } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { createAdminPb } from "@/lib/pocketbase";

const ID = "abc123abc123abc";
const COLLEGE_ID = "colg1colg1colg1";
const ctx = { params: Promise.resolve({ id: ID }) };

function req(method: string, body?: unknown) {
  return new NextRequest(`http://localhost/api/dean/${ID}`, {
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
  mocks.collegeHasActiveDean.mockResolvedValue(false);
});

describe("PATCH /api/dean/:id", () => {
  it("deactivates without checking for another active dean", async () => {
    const updated = { id: ID, active: false };
    mocks.parseDeanUpdate.mockReturnValue({
      ok: true,
      data: { active: false },
    });
    mocks.update.mockResolvedValue(updated);

    const res = await PATCH(req("PATCH", { active: false }), ctx);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ...updated, mapped: true });
    expect(requireUser).toHaveBeenCalledWith(PERMISSIONS.dean.write);
    expect(mocks.getOne).not.toHaveBeenCalled();
    expect(mocks.collegeHasActiveDean).not.toHaveBeenCalled();
    expect(mocks.update).toHaveBeenCalledWith(
      ID,
      { active: false },
      { expand: "user,college" },
    );
    expect(mocks.toDeanResponse).toHaveBeenCalledWith(updated);
  });

  it("activates when the college has no other active dean", async () => {
    const updated = { id: ID, active: true };
    mocks.parseDeanUpdate.mockReturnValue({
      ok: true,
      data: { active: true },
    });
    mocks.getOne.mockResolvedValue({ id: ID, college: COLLEGE_ID });
    mocks.update.mockResolvedValue(updated);

    const res = await PATCH(req("PATCH", { active: true }), ctx);

    expect(res.status).toBe(200);
    expect(mocks.getOne).toHaveBeenCalledWith(ID);
    // The record itself is excluded from the "other active dean" check.
    expect(mocks.collegeHasActiveDean).toHaveBeenCalledWith(COLLEGE_ID, ID);
    expect(mocks.update).toHaveBeenCalledWith(
      ID,
      { active: true },
      { expand: "user,college" },
    );
  });

  it("returns 409 when activating would create a second active dean", async () => {
    mocks.parseDeanUpdate.mockReturnValue({
      ok: true,
      data: { active: true },
    });
    mocks.getOne.mockResolvedValue({ id: ID, college: COLLEGE_ID });
    mocks.collegeHasActiveDean.mockResolvedValue(true);

    const res = await PATCH(req("PATCH", { active: true }), ctx);

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      error: "That college already has an active dean. Deactivate them first.",
    });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("returns 400 on validation failure without touching PocketBase", async () => {
    mocks.parseDeanUpdate.mockReturnValue({
      ok: false,
      error: "`active` must be a boolean",
    });

    const res = await PATCH(req("PATCH", { active: "yes" }), ctx);

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "`active` must be a boolean" });
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("treats malformed JSON as a null body", async () => {
    mocks.parseDeanUpdate.mockReturnValue({ ok: false, error: "invalid" });

    const res = await PATCH(req("PATCH", "{oops"), ctx);

    expect(mocks.parseDeanUpdate).toHaveBeenCalledWith(null);
    expect(res.status).toBe(400);
  });

  it("propagates a 404 when activating a record that does not exist", async () => {
    mocks.parseDeanUpdate.mockReturnValue({
      ok: true,
      data: { active: true },
    });
    mocks.getOne.mockRejectedValue({ status: 404 });

    const res = await PATCH(req("PATCH", { active: true }), ctx);

    expect(res.status).toBe(404);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("propagates a 404 from update", async () => {
    mocks.parseDeanUpdate.mockReturnValue({
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
    expect(mocks.parseDeanUpdate).not.toHaveBeenCalled();
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("returns 403 when the caller lacks permission and never touches PocketBase", async () => {
    forbidden();

    const res = await PATCH(req("PATCH", { active: false }), ctx);

    expect(res.status).toBe(403);
    expect(mocks.parseDeanUpdate).not.toHaveBeenCalled();
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/dean/:id", () => {
  it("deletes and returns 204 with no body", async () => {
    mocks.delete.mockResolvedValue(true);

    const res = await DELETE(req("DELETE"), ctx);

    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
    expect(requireUser).toHaveBeenCalledWith(PERMISSIONS.dean.write);
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
