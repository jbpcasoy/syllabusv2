import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getList: vi.fn(),
  create: vi.fn(),
  filter: vi.fn(
    (expr: string, params: Record<string, unknown>) =>
      `${expr}|${JSON.stringify(params)}`,
  ),
  parseCampusInput: vi.fn(),
}));

vi.mock("@/lib/pocketbase", async () => {
  const { NextResponse } = await import("next/server");
  const collection = () => ({
    getList: mocks.getList,
    create: mocks.create,
  });
  return {
    createPb: vi.fn(() => ({ collection, filter: mocks.filter })),
    createAdminPb: vi.fn(async () => ({ collection })),
    handlePbError: vi.fn((error: unknown) =>
      NextResponse.json(
        { error: error instanceof Error ? error.message : "unknown" },
        { status: 500 },
      ),
    ),
  };
});

vi.mock("@/lib/validators/campus", () => ({
  parseCampusInput: mocks.parseCampusInput,
}));

vi.mock("@/lib/auth", () => ({
  requireUser: vi.fn(async () => ({
    ok: true,
    user: { id: "u1", role: "admin" },
  })),
}));

import { GET, POST } from "@/app/api/campus/route";
import { requireUser } from "@/lib/auth";
import { createAdminPb, createPb } from "@/lib/pocketbase";

const listResult = {
  page: 1,
  perPage: 30,
  totalItems: 1,
  totalPages: 1,
  items: [{ id: "abc123abc123abc", name: "Main Campus" }],
};

function get(query = "") {
  return new NextRequest(`http://localhost/api/campus${query}`);
}

function post(body: unknown, raw = false) {
  return new NextRequest("http://localhost/api/campus", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: raw ? (body as string) : JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/campus", () => {
  beforeEach(() => {
    mocks.getList.mockResolvedValue(listResult);
  });

  it("returns the list with default pagination and sorting", async () => {
    const res = await GET(get());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(listResult);
    expect(createPb).toHaveBeenCalledOnce();
    expect(mocks.getList).toHaveBeenCalledWith(1, 30, { sort: "name" });
  });

  it("respects page and perPage", async () => {
    await GET(get("?page=3&perPage=10"));
    expect(mocks.getList).toHaveBeenCalledWith(3, 10, { sort: "name" });
  });

  it("clamps perPage to 100 and page to at least 1", async () => {
    await GET(get("?page=-5&perPage=9999"));
    expect(mocks.getList).toHaveBeenCalledWith(1, 100, { sort: "name" });
  });

  it("falls back to defaults for non-numeric values", async () => {
    await GET(get("?page=abc&perPage=xyz"));
    expect(mocks.getList).toHaveBeenCalledWith(1, 30, { sort: "name" });
  });

  it("adds a bound filter when search is provided", async () => {
    await GET(get("?search=%20main%20"));

    expect(mocks.filter).toHaveBeenCalledWith("name ~ {:search}", {
      search: "main", // trimmed
    });
    expect(mocks.getList).toHaveBeenCalledWith(
      1,
      30,
      expect.objectContaining({ sort: "name", filter: expect.any(String) }),
    );
  });

  it("does not filter on an empty/whitespace search", async () => {
    await GET(get("?search=%20%20"));
    expect(mocks.filter).not.toHaveBeenCalled();
    expect(mocks.getList).toHaveBeenCalledWith(1, 30, { sort: "name" });
  });

  it("delegates errors to handlePbError", async () => {
    mocks.getList.mockRejectedValue(new Error("boom"));

    const res = await GET(get());

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "boom" });
  });
});

describe("POST /api/campus", () => {
  it("creates a campus and returns 201", async () => {
    const created = { id: "abc123abc123abc", name: "Main Campus" };
    mocks.parseCampusInput.mockReturnValue({
      ok: true,
      data: { name: "Main Campus" },
    });
    mocks.create.mockResolvedValue(created);

    const res = await POST(post({ name: "Main Campus" }));

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual(created);
    expect(createAdminPb).toHaveBeenCalledOnce(); // writes need admin
    expect(mocks.create).toHaveBeenCalledWith({ name: "Main Campus" });
  });

  it("returns 400 when validation fails and never touches PocketBase", async () => {
    mocks.parseCampusInput.mockReturnValue({
      ok: false,
      error: "name required",
    });

    const res = await POST(post({}));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "name required" });
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("passes null to the validator when the body is not valid JSON", async () => {
    mocks.parseCampusInput.mockReturnValue({
      ok: false,
      error: "invalid body",
    });

    const res = await POST(post("{not json", true));

    expect(mocks.parseCampusInput).toHaveBeenCalledWith(null);
    expect(res.status).toBe(400);
  });

  it("delegates PocketBase errors to handlePbError", async () => {
    mocks.parseCampusInput.mockReturnValue({ ok: true, data: { name: "X" } });
    mocks.create.mockRejectedValue(new Error("pb down"));

    const res = await POST(post({ name: "X" }));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "pb down" });
  });

  it("returns 403 when the caller lacks permission and never touches PocketBase", async () => {
    vi.mocked(requireUser).mockResolvedValueOnce({
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    });

    const res = await POST(post({ name: "X" }));

    expect(res.status).toBe(403);
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
