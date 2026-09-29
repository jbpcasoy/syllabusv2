import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getOne: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  parseUserInput: vi.fn(),
  toUserResponse: vi.fn((user: Record<string, unknown>) => ({
    ...user,
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

vi.mock("@/lib/validators/user", () => ({
  parseUserInput: mocks.parseUserInput,
}));

vi.mock("@/lib/users", () => ({
  toUserResponse: mocks.toUserResponse,
}));

vi.mock("@/lib/auth", () => ({
  requireUser: vi.fn(async () => ({
    ok: true,
    user: { id: "admin1admin1adm", role: "admin" },
  })),
}));

import { DELETE, GET, PATCH } from "@/app/api/user/[id]/route";
import { requireUser } from "@/lib/auth";
import { createAdminPb } from "@/lib/pocketbase";

const ADMIN_ID = "admin1admin1adm";
const ID = "abc123abc123abc";
const ctx = (id = ID) => ({ params: Promise.resolve({ id }) });

function req(method: string, body?: unknown, id = ID) {
  return new NextRequest(`http://localhost/api/user/${id}`, {
    method,
    ...(body !== undefined && {
      headers: { "Content-Type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  });
}

function signedInAs(id: string, role: string) {
  vi.mocked(requireUser).mockResolvedValueOnce({
    ok: true,
    user: { id, role } as never,
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
});

describe("GET /api/user/:id", () => {
  const user = { id: ID, email: "a@example.com", name: "Alice" };

  it("lets an admin read any user", async () => {
    mocks.getOne.mockResolvedValue(user);

    const res = await GET(req("GET"), ctx());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ...user, mapped: true });
    expect(createAdminPb).toHaveBeenCalledOnce();
    expect(mocks.getOne).toHaveBeenCalledWith(ID);
    expect(mocks.toUserResponse).toHaveBeenCalledWith(user);
  });

  it("requires sign-in but no specific role", async () => {
    mocks.getOne.mockResolvedValue(user);

    await GET(req("GET"), ctx());

    expect(requireUser).toHaveBeenCalledWith();
  });

  it("lets a non-admin read their own record", async () => {
    signedInAs(ID, "dean");
    mocks.getOne.mockResolvedValue(user);

    const res = await GET(req("GET"), ctx());

    expect(res.status).toBe(200);
    expect(mocks.getOne).toHaveBeenCalledWith(ID);
  });

  it("returns 403 when a non-admin reads someone else", async () => {
    signedInAs("other1other1oth", "dean");

    const res = await GET(req("GET"), ctx());

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "Forbidden" });
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.getOne).not.toHaveBeenCalled();
  });

  it("returns 401 when not signed in", async () => {
    unauthorized();

    const res = await GET(req("GET"), ctx());

    expect(res.status).toBe(401);
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.getOne).not.toHaveBeenCalled();
  });

  it("propagates a 404 from PocketBase", async () => {
    mocks.getOne.mockRejectedValue({ status: 404 });

    const res = await GET(req("GET"), ctx());

    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/user/:id", () => {
  it("updates using partial validation", async () => {
    const updated = { id: ID, name: "Renamed" };
    mocks.parseUserInput.mockReturnValue({
      ok: true,
      data: { name: "Renamed" },
    });
    mocks.update.mockResolvedValue(updated);

    const res = await PATCH(req("PATCH", { name: "Renamed" }), ctx());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ...updated, mapped: true });
    expect(requireUser).toHaveBeenCalledWith([]);
    expect(mocks.parseUserInput).toHaveBeenCalledWith(
      { name: "Renamed" },
      { partial: true },
    );
    expect(createAdminPb).toHaveBeenCalledOnce();
    expect(mocks.update).toHaveBeenCalledWith(ID, { name: "Renamed" });
  });

  it("adds passwordConfirm when a password is being changed", async () => {
    mocks.parseUserInput.mockReturnValue({
      ok: true,
      data: { password: "newsecret123" },
    });
    mocks.update.mockResolvedValue({ id: ID });

    await PATCH(req("PATCH", { password: "newsecret123" }), ctx());

    expect(mocks.update).toHaveBeenCalledWith(ID, {
      password: "newsecret123",
      passwordConfirm: "newsecret123",
    });
  });

  it("does not add passwordConfirm when no password is sent", async () => {
    mocks.parseUserInput.mockReturnValue({
      ok: true,
      data: { role: "dean" },
    });
    mocks.update.mockResolvedValue({ id: ID });

    await PATCH(req("PATCH", { role: "dean" }), ctx());

    const payload = mocks.update.mock.calls[0][1] as Record<string, unknown>;
    expect(payload).not.toHaveProperty("passwordConfirm");
  });

  it("allows changing another user's role", async () => {
    mocks.parseUserInput.mockReturnValue({
      ok: true,
      data: { role: "faculty" },
    });
    mocks.update.mockResolvedValue({ id: ID });

    const res = await PATCH(req("PATCH", { role: "faculty" }), ctx());

    expect(res.status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith(ID, { role: "faculty" });
  });

  it("blocks an admin from removing their own admin role", async () => {
    mocks.parseUserInput.mockReturnValue({
      ok: true,
      data: { role: "dean" },
    });

    const res = await PATCH(
      req("PATCH", { role: "dean" }, ADMIN_ID),
      ctx(ADMIN_ID),
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "You can't remove your own admin role",
    });
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("blocks an admin from clearing their own role", async () => {
    mocks.parseUserInput.mockReturnValue({ ok: true, data: { role: "" } });

    const res = await PATCH(
      req("PATCH", { role: "" }, ADMIN_ID),
      ctx(ADMIN_ID),
    );

    expect(res.status).toBe(400);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("lets an admin re-save their own admin role", async () => {
    mocks.parseUserInput.mockReturnValue({
      ok: true,
      data: { role: "admin" },
    });
    mocks.update.mockResolvedValue({ id: ADMIN_ID });

    const res = await PATCH(
      req("PATCH", { role: "admin" }, ADMIN_ID),
      ctx(ADMIN_ID),
    );

    expect(res.status).toBe(200);
    expect(mocks.update).toHaveBeenCalledOnce();
  });

  it("lets an admin edit their own non-role fields", async () => {
    mocks.parseUserInput.mockReturnValue({
      ok: true,
      data: { name: "Me" },
    });
    mocks.update.mockResolvedValue({ id: ADMIN_ID });

    const res = await PATCH(
      req("PATCH", { name: "Me" }, ADMIN_ID),
      ctx(ADMIN_ID),
    );

    expect(res.status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith(ADMIN_ID, { name: "Me" });
  });

  it("returns 400 on validation failure without updating", async () => {
    mocks.parseUserInput.mockReturnValue({ ok: false, error: "bad" });

    const res = await PATCH(req("PATCH", { email: "nope" }), ctx());

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "bad" });
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("treats malformed JSON as a null body", async () => {
    mocks.parseUserInput.mockReturnValue({ ok: false, error: "invalid" });

    const res = await PATCH(req("PATCH", "{oops"), ctx());

    expect(mocks.parseUserInput).toHaveBeenCalledWith(null, {
      partial: true,
    });
    expect(res.status).toBe(400);
  });

  it("propagates a 404 from PocketBase", async () => {
    mocks.parseUserInput.mockReturnValue({ ok: true, data: { name: "X" } });
    mocks.update.mockRejectedValue({ status: 404 });

    const res = await PATCH(req("PATCH", { name: "X" }), ctx());

    expect(res.status).toBe(404);
  });

  it("returns 401 when not signed in", async () => {
    unauthorized();

    const res = await PATCH(req("PATCH", { name: "X" }), ctx());

    expect(res.status).toBe(401);
    expect(mocks.parseUserInput).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("returns 403 when the caller lacks permission and never touches PocketBase", async () => {
    forbidden();

    const res = await PATCH(req("PATCH", { name: "X" }), ctx());

    expect(res.status).toBe(403);
    expect(mocks.parseUserInput).not.toHaveBeenCalled();
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/user/:id", () => {
  it("deletes and returns 204 with no body", async () => {
    mocks.delete.mockResolvedValue(true);

    const res = await DELETE(req("DELETE"), ctx());

    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
    expect(requireUser).toHaveBeenCalledWith([]);
    expect(createAdminPb).toHaveBeenCalledOnce();
    expect(mocks.delete).toHaveBeenCalledWith(ID);
  });

  it("blocks users from deleting their own account", async () => {
    const res = await DELETE(req("DELETE", undefined, ADMIN_ID), ctx(ADMIN_ID));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "You can't delete your own account",
    });
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.delete).not.toHaveBeenCalled();
  });

  it("propagates a 404 from PocketBase", async () => {
    mocks.delete.mockRejectedValue({ status: 404 });

    const res = await DELETE(req("DELETE"), ctx());

    expect(res.status).toBe(404);
  });

  it("returns 401 when not signed in", async () => {
    unauthorized();

    const res = await DELETE(req("DELETE"), ctx());

    expect(res.status).toBe(401);
    expect(mocks.delete).not.toHaveBeenCalled();
  });

  it("returns 403 when the caller lacks permission and never touches PocketBase", async () => {
    forbidden();

    const res = await DELETE(req("DELETE"), ctx());

    expect(res.status).toBe(403);
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.delete).not.toHaveBeenCalled();
  });
});
