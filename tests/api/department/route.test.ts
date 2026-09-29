import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getList: vi.fn(),
  create: vi.fn(),
  filter: vi.fn(
    (expr: string, params: Record<string, unknown>) =>
      `${expr}|${JSON.stringify(params)}`,
  ),
  parseDepartmentInput: vi.fn(),
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

vi.mock("@/lib/validators/department", () => ({
  parseDepartmentInput: mocks.parseDepartmentInput,
}));

vi.mock("@/lib/auth", () => ({
  requireUser: vi.fn(async () => ({
    ok: true,
    user: { id: "u1", role: "admin" },
  })),
}));

import { GET, POST } from "@/app/api/department/route";
import { requireUser } from "@/lib/auth";
import { createAdminPb, createPb } from "@/lib/pocketbase";

const listResult = {
  page: 1,
  perPage: 30,
  totalItems: 1,
  totalPages: 1,
  items: [{ id: "abc123abc123abc", name: "Computer Science" }],
};

const base = { sort: "name", expand: "college" };

function get(query = "") {
  return new NextRequest(`http://localhost/api/department${query}`);
}

function post(body: unknown, raw = false) {
  return new NextRequest("http://localhost/api/department", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: raw ? (body as string) : JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/department", () => {
  beforeEach(() => {
    mocks.getList.mockResolvedValue(listResult);
  });

  it("returns the list with default pagination, sorting and expand", async () => {
    const res = await GET(get());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(listResult);
    expect(createPb).toHaveBeenCalledOnce();
    expect(mocks.getList).toHaveBeenCalledWith(1, 30, base);
  });

  it("respects page and perPage", async () => {
    await GET(get("?page=3&perPage=10"));
    expect(mocks.getList).toHaveBeenCalledWith(3, 10, base);
  });

  it("clamps perPage to 100 and page to at least 1", async () => {
    await GET(get("?page=-5&perPage=9999"));
    expect(mocks.getList).toHaveBeenCalledWith(1, 100, base);
  });

  it("falls back to defaults for non-numeric values", async () => {
    await GET(get("?page=abc&perPage=xyz"));
    expect(mocks.getList).toHaveBeenCalledWith(1, 30, base);
  });

  it("binds a search filter on name", async () => {
    await GET(get("?search=%20comp%20"));

    expect(mocks.filter).toHaveBeenCalledWith("name ~ {:search}", {
      search: "comp", // trimmed
    });
    expect(mocks.getList).toHaveBeenCalledWith(
      1,
      30,
      expect.objectContaining({ filter: expect.any(String) }),
    );
  });

  it("filters by college", async () => {
    await GET(get("?college=abc123abc123abc"));

    expect(mocks.filter).toHaveBeenCalledWith("college = {:college}", {
      college: "abc123abc123abc",
    });
  });

  it("combines search and college filters with &&", async () => {
    await GET(get("?search=comp&college=abc123abc123abc"));

    const options = mocks.getList.mock.calls[0][2] as { filter: string };
    expect(options.filter).toContain(" && ");
  });

  it("does not filter on empty params", async () => {
    await GET(get("?search=%20%20&college="));
    expect(mocks.filter).not.toHaveBeenCalled();
    expect(mocks.getList).toHaveBeenCalledWith(1, 30, base);
  });

  it("delegates errors to handlePbError", async () => {
    mocks.getList.mockRejectedValue(new Error("boom"));

    const res = await GET(get());

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "boom" });
  });
});

describe("POST /api/department", () => {
  const data = { name: "Computer Science" };

  it("creates a department and returns 201", async () => {
    const created = { id: "abc123abc123abc", ...data };
    mocks.parseDepartmentInput.mockReturnValue({ ok: true, data });
    mocks.create.mockResolvedValue(created);

    const res = await POST(post(data));

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual(created);
    expect(createAdminPb).toHaveBeenCalledOnce();
    expect(mocks.create).toHaveBeenCalledWith(data, { expand: "college" });
  });

  it("returns 400 on validation failure and never touches PocketBase", async () => {
    mocks.parseDepartmentInput.mockReturnValue({
      ok: false,
      error: "`name` is required",
    });

    const res = await POST(post({}));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "`name` is required" });
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("passes null to the validator when the body is not valid JSON", async () => {
    mocks.parseDepartmentInput.mockReturnValue({ ok: false, error: "invalid" });

    const res = await POST(post("{not json", true));

    expect(mocks.parseDepartmentInput).toHaveBeenCalledWith(null);
    expect(res.status).toBe(400);
  });

  it("delegates PocketBase errors to handlePbError", async () => {
    mocks.parseDepartmentInput.mockReturnValue({ ok: true, data });
    mocks.create.mockRejectedValue(new Error("pb down"));

    const res = await POST(post(data));

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
