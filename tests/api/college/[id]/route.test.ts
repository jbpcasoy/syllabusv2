import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getOne: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  parseCollegeInput: vi.fn(),
  describeChildren: vi.fn(),
}));

vi.mock("@/lib/org-children", () => ({
  describeChildren: mocks.describeChildren,
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

vi.mock("@/lib/validators/college", () => ({
  parseCollegeInput: mocks.parseCollegeInput,
}));

vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);

import { DELETE, GET, PATCH } from "@/app/api/college/[id]/route";
import { createAdminPb } from "@/lib/pocketbase";
import { mockAuth, requireUserMock } from "@/tests/helpers/mock-auth";

const ID = "abc123abc123abc";
const ctx = { params: Promise.resolve({ id: ID }) };

function req(method: string, body?: unknown) {
  return new NextRequest(`http://localhost/api/college/${ID}`, {
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
  mocks.describeChildren.mockResolvedValue(null);
});

describe("GET /api/college/:id", () => {
  it("returns the college with campus expanded", async () => {
    const college = { id: ID, name: "Science", code: "COS" };
    mocks.getOne.mockResolvedValue(college);

    const res = await GET(req("GET"), ctx);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(college);
    expect(createAdminPb).toHaveBeenCalledOnce();
    expect(mocks.getOne).toHaveBeenCalledWith(ID, { expand: "campus" });
  });

  it("propagates a 404 from PocketBase", async () => {
    mocks.getOne.mockRejectedValue({ status: 404 });
    const res = await GET(req("GET"), ctx);
    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/college/:id", () => {
  it("updates using partial validation", async () => {
    const updated = { id: ID, name: "Renamed", code: "COS" };
    mocks.parseCollegeInput.mockReturnValue({
      ok: true,
      data: { name: "Renamed" },
    });
    mocks.update.mockResolvedValue(updated);

    const res = await PATCH(req("PATCH", { name: "Renamed" }), ctx);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(updated);
    expect(mocks.parseCollegeInput).toHaveBeenCalledWith(
      { name: "Renamed" },
      { partial: true },
    );
    expect(createAdminPb).toHaveBeenCalledOnce();
    expect(mocks.update).toHaveBeenCalledWith(
      ID,
      { name: "Renamed" },
      { expand: "campus" },
    );
  });

  it("returns 400 on validation failure without updating", async () => {
    mocks.parseCollegeInput.mockReturnValue({ ok: false, error: "bad" });

    const res = await PATCH(req("PATCH", { name: 123 }), ctx);

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "bad" });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("treats malformed JSON as a null body", async () => {
    mocks.parseCollegeInput.mockReturnValue({ ok: false, error: "invalid" });

    const res = await PATCH(req("PATCH", "{oops"), ctx);

    expect(mocks.parseCollegeInput).toHaveBeenCalledWith(null, {
      partial: true,
    });
    expect(res.status).toBe(400);
  });

  it("propagates a 404 from PocketBase", async () => {
    mocks.parseCollegeInput.mockReturnValue({ ok: true, data: { name: "X" } });
    mocks.update.mockRejectedValue({ status: 404 });

    const res = await PATCH(req("PATCH", { name: "X" }), ctx);

    expect(res.status).toBe(404);
  });

  it("returns 403 when the caller lacks permission and never touches PocketBase", async () => {
    mockAuth(); // signed in, no roles

    const res = await PATCH(req("PATCH", { name: "X" }), ctx);

    expect(res.status).toBe(403);
    expect(mocks.parseCollegeInput).not.toHaveBeenCalled();
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/college/:id", () => {
  it("deletes and returns 204 with no body", async () => {
    mocks.delete.mockResolvedValue(true);

    const res = await DELETE(req("DELETE"), ctx);

    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
    expect(createAdminPb).toHaveBeenCalledOnce();
    expect(mocks.delete).toHaveBeenCalledWith(ID);
    expect(requireUserMock).toHaveBeenCalledWith("college.write");
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

  it("checks for children before deleting", async () => {
    mocks.delete.mockResolvedValue(true);

    await DELETE(req("DELETE"), ctx);

    expect(mocks.describeChildren).toHaveBeenCalledWith("college", ID);
  });

  it("returns 409 with the reason and deletes nothing when children exist", async () => {
    mocks.describeChildren.mockResolvedValue(
      "This college still has 3 departments. Remove or reassign them first.",
    );

    const res = await DELETE(req("DELETE"), ctx);

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      error:
        "This college still has 3 departments. Remove or reassign them first.",
    });
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.delete).not.toHaveBeenCalled();
  });

  it("delegates a failing children check to handlePbError", async () => {
    mocks.describeChildren.mockRejectedValue({ status: 500 });

    const res = await DELETE(req("DELETE"), ctx);

    expect(res.status).toBe(500);
    expect(mocks.delete).not.toHaveBeenCalled();
  });
});
