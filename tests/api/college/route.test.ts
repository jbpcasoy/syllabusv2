import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getList: vi.fn(),
  create: vi.fn(),
  filter: vi.fn(
    (expr: string, params: Record<string, unknown>) =>
      `${expr}|${JSON.stringify(params)}`,
  ),
  parseCollegeInput: vi.fn(),
}));

vi.mock("@/lib/pocketbase", async () => {
  const { NextResponse } = await import("next/server");
  const collection = () => ({
    getList: mocks.getList,
    create: mocks.create,
  });
  return {
    createAdminPb: vi.fn(async () => ({ collection, filter: mocks.filter })),
    handlePbError: vi.fn((error: unknown) =>
      NextResponse.json(
        { error: error instanceof Error ? error.message : "unknown" },
        { status: 500 },
      ),
    ),
  };
});

vi.mock("@/lib/validators/college", () => ({
  parseCollegeInput: mocks.parseCollegeInput,
}));

vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);

import { GET, POST } from "@/app/api/college/route";
import { createAdminPb } from "@/lib/pocketbase";
import { mockAuth, requireUserMock } from "@/tests/helpers/mock-auth";

const listResult = {
  page: 1,
  perPage: 30,
  totalItems: 1,
  totalPages: 1,
  items: [{ id: "abc123abc123abc", name: "Science", code: "COS" }],
};

const base = { sort: "name", expand: "campus" };

function get(query = "") {
  return new NextRequest(`http://localhost/api/college${query}`);
}

function post(body: unknown, raw = false) {
  return new NextRequest("http://localhost/api/college", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: raw ? (body as string) : JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ isAdmin: true });
});

describe("GET /api/college", () => {
  beforeEach(() => {
    mocks.getList.mockResolvedValue(listResult);
  });

  it("returns the list with default pagination, sorting and expand", async () => {
    const res = await GET(get());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(listResult);
    expect(createAdminPb).toHaveBeenCalledOnce();
    expect(mocks.getList).toHaveBeenCalledWith(1, 30, base);
  });

  it("clamps perPage to 100 and page to at least 1", async () => {
    await GET(get("?page=-5&perPage=9999"));
    expect(mocks.getList).toHaveBeenCalledWith(1, 100, base);
  });

  it("binds a search filter over name and code", async () => {
    await GET(get("?search=%20sci%20"));

    expect(mocks.filter).toHaveBeenCalledWith(
      "(name ~ {:search} || code ~ {:search})",
      { search: "sci" },
    );
    expect(mocks.getList).toHaveBeenCalledWith(
      1,
      30,
      expect.objectContaining({ filter: expect.any(String) }),
    );
  });

  it("filters by campus", async () => {
    await GET(get("?campus=abc123abc123abc"));

    expect(mocks.filter).toHaveBeenCalledWith("campus = {:campus}", {
      campus: "abc123abc123abc",
    });
  });

  it("combines search and campus filters with &&", async () => {
    await GET(get("?search=sci&campus=abc123abc123abc"));

    const options = mocks.getList.mock.calls[0][2] as { filter: string };
    expect(options.filter).toContain(" && ");
  });

  it("does not filter on empty params", async () => {
    await GET(get("?search=%20%20&campus="));
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

describe("POST /api/college", () => {
  const data = { name: "Science", code: "COS" };

  it("creates a college and returns 201", async () => {
    const created = { id: "abc123abc123abc", ...data };
    mocks.parseCollegeInput.mockReturnValue({ ok: true, data });
    mocks.create.mockResolvedValue(created);

    const res = await POST(post(data));

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual(created);
    expect(createAdminPb).toHaveBeenCalledOnce();
    expect(mocks.create).toHaveBeenCalledWith(data, { expand: "campus" });
  });

  it("returns 400 on validation failure and never touches PocketBase", async () => {
    mocks.parseCollegeInput.mockReturnValue({
      ok: false,
      error: "`code` is required",
    });

    const res = await POST(post({ name: "Science" }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "`code` is required" });
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("passes null to the validator when the body is not valid JSON", async () => {
    mocks.parseCollegeInput.mockReturnValue({ ok: false, error: "invalid" });

    const res = await POST(post("{not json", true));

    expect(mocks.parseCollegeInput).toHaveBeenCalledWith(null);
    expect(res.status).toBe(400);
  });

  it("delegates PocketBase errors to handlePbError", async () => {
    mocks.parseCollegeInput.mockReturnValue({ ok: true, data });
    mocks.create.mockRejectedValue(new Error("pb down"));

    const res = await POST(post(data));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "pb down" });
  });

  it("returns 403 when the caller lacks permission and never touches PocketBase", async () => {
    mockAuth(); // signed in, no roles

    const res = await POST(post({ name: "X" }));

    expect(res.status).toBe(403);
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });
});

describe("POST /api/college capability", () => {
  const data = { name: "Science", code: "COS", campus: "campacampacampa" };

  beforeEach(() => {
    mocks.parseCollegeInput.mockReturnValue({ ok: true, data });
    mocks.create.mockResolvedValue({ id: "abc123abc123abc", ...data });
  });

  it("requires college.write", async () => {
    await POST(post(data));
    expect(requireUserMock).toHaveBeenCalledWith("college.write");
  });

  it("lets the VPAA create a college", async () => {
    mockAuth({ roles: { isVpaa: true } });
    expect((await POST(post(data))).status).toBe(201);
  });

  it("returns 403 for a dean and creates nothing", async () => {
    mockAuth({ roles: { deanOfColleges: ["colgacolgacolga"] } });
    expect((await POST(post(data))).status).toBe(403);
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
