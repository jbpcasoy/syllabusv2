import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getOne: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  parseCampusInput: vi.fn(),
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

vi.mock("@/lib/validators/campus", () => ({
  parseCampusInput: mocks.parseCampusInput,
}));

vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);

import { DELETE, GET, PATCH } from "@/app/api/campus/[id]/route";
import { createAdminPb } from "@/lib/pocketbase";
import { mockAuth, requireUserMock } from "@/tests/helpers/mock-auth";

const ID = "abc123abc123abc";
const ctx = { params: Promise.resolve({ id: ID }) };

function req(method: string, body?: unknown) {
  return new NextRequest(`http://localhost/api/campus/${ID}`, {
    method,
    ...(body !== undefined && {
      headers: { "Content-Type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ isAdmin: true });
});

describe("GET /api/campus/:id", () => {
  it("returns the campus", async () => {
    const campus = { id: ID, name: "Main Campus" };
    mocks.getOne.mockResolvedValue(campus);

    const res = await GET(req("GET"), ctx);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(campus);
    expect(createAdminPb).toHaveBeenCalledOnce();
    expect(mocks.getOne).toHaveBeenCalledWith(ID);
  });

  it("propagates a 404 from PocketBase", async () => {
    mocks.getOne.mockRejectedValue({ status: 404 });

    const res = await GET(req("GET"), ctx);

    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/campus/:id", () => {
  it("updates using partial validation", async () => {
    const updated = { id: ID, name: "Renamed" };
    mocks.parseCampusInput.mockReturnValue({
      ok: true,
      data: { name: "Renamed" },
    });
    mocks.update.mockResolvedValue(updated);

    const res = await PATCH(req("PATCH", { name: "Renamed" }), ctx);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(updated);
    expect(mocks.parseCampusInput).toHaveBeenCalledWith(
      { name: "Renamed" },
      { partial: true },
    );
    expect(createAdminPb).toHaveBeenCalledOnce();
    expect(mocks.update).toHaveBeenCalledWith(ID, { name: "Renamed" });
  });

  it("returns 400 on validation failure without updating", async () => {
    mocks.parseCampusInput.mockReturnValue({ ok: false, error: "bad name" });

    const res = await PATCH(req("PATCH", { name: 123 }), ctx);

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "bad name" });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("treats malformed JSON as a null body", async () => {
    mocks.parseCampusInput.mockReturnValue({
      ok: false,
      error: "invalid body",
    });

    const res = await PATCH(req("PATCH", "{oops"), ctx);

    expect(mocks.parseCampusInput).toHaveBeenCalledWith(null, {
      partial: true,
    });
    expect(res.status).toBe(400);
  });

  it("propagates a 404 from PocketBase", async () => {
    mocks.parseCampusInput.mockReturnValue({ ok: true, data: { name: "X" } });
    mocks.update.mockRejectedValue({ status: 404 });

    const res = await PATCH(req("PATCH", { name: "X" }), ctx);

    expect(res.status).toBe(404);
  });

  it("returns 403 when the caller lacks permission and never touches PocketBase", async () => {
    mockAuth(); // signed in, no roles

    const res = await PATCH(req("PATCH", { name: "X" }), ctx);

    expect(res.status).toBe(403);
    expect(mocks.parseCampusInput).not.toHaveBeenCalled();
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/campus/:id", () => {
  it("deletes and returns 204 with no body", async () => {
    mocks.delete.mockResolvedValue(true);

    const res = await DELETE(req("DELETE"), ctx);

    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
    expect(createAdminPb).toHaveBeenCalledOnce();
    expect(mocks.delete).toHaveBeenCalledWith(ID);
    expect(requireUserMock).toHaveBeenCalledWith("campus.write");
  });

  it("propagates a 404 from PocketBase", async () => {
    mocks.delete.mockRejectedValue({ status: 404 });

    const res = await DELETE(req("DELETE"), ctx);

    expect(res.status).toBe(404);
  });

  it("returns 403 when the caller lacks permission and never touches PocketBase", async () => {
    mockAuth(); // signed in, no roles

    const res = await DELETE(req("DELETE"), ctx);

    expect(res.status).toBe(403);
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.delete).not.toHaveBeenCalled();
  });
});
