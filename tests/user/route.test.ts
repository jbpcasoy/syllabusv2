import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getList: vi.fn(),
  create: vi.fn(),
  filter: vi.fn(
    (expr: string, params: Record<string, unknown>) =>
      `${expr}|${JSON.stringify(params)}`,
  ),
  parseUserInput: vi.fn(),
  toUserResponse: vi.fn((user: Record<string, unknown>) => ({
    ...user,
    mapped: true,
  })),
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

// Keep the real isUserRole; only stub parseUserInput.
vi.mock("@/lib/validators/user", async () => {
  const actual = await vi.importActual<typeof import("@/lib/validators/user")>(
    "@/lib/validators/user",
  );
  return { ...actual, parseUserInput: mocks.parseUserInput };
});

vi.mock("@/lib/users", () => ({
  toUserResponse: mocks.toUserResponse,
}));

vi.mock("@/lib/auth", () => ({
  requireUser: vi.fn(async () => ({
    ok: true,
    user: { id: "u1", role: "admin" },
  })),
}));

import { GET, POST } from "@/app/api/user/route";
import { requireUser } from "@/lib/auth";
import { createAdminPb } from "@/lib/pocketbase";

const users = [
  { id: "abc123abc123abc", email: "a@example.com", name: "Alice" },
  { id: "def456def456def", email: "b@example.com", name: "Bob" },
];

const listResult = {
  page: 1,
  perPage: 30,
  totalItems: 2,
  totalPages: 1,
  items: users,
};

const base = { sort: "name" };

function get(query = "") {
  return new NextRequest(`http://localhost/api/user${query}`);
}

function post(body: unknown, raw = false) {
  return new NextRequest("http://localhost/api/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: raw ? (body as string) : JSON.stringify(body),
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

describe("GET /api/user", () => {
  beforeEach(() => {
    mocks.getList.mockResolvedValue(listResult);
  });

  it("returns the list mapped through toUserResponse", async () => {
    const res = await GET(get());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ...listResult,
      items: users.map((u) => ({ ...u, mapped: true })),
    });
    expect(mocks.toUserResponse).toHaveBeenCalledTimes(users.length);
    expect(mocks.getList).toHaveBeenCalledWith(1, 30, base);
  });

  it("uses the superuser client because listRule only exposes the caller", async () => {
    await GET(get());
    expect(createAdminPb).toHaveBeenCalledOnce();
  });

  it("checks permissions with the user read rule", async () => {
    await GET(get());
    expect(requireUser).toHaveBeenCalledWith([]);
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

  it("binds a search filter over name and email", async () => {
    await GET(get("?search=%20ali%20"));

    expect(mocks.filter).toHaveBeenCalledWith(
      "(name ~ {:search} || email ~ {:search})",
      { search: "ali" }, // trimmed
    );
    expect(mocks.getList).toHaveBeenCalledWith(
      1,
      30,
      expect.objectContaining({ filter: expect.any(String) }),
    );
  });

  it("filters by a valid role", async () => {
    await GET(get("?role=dean"));

    expect(mocks.filter).toHaveBeenCalledWith("role = {:role}", {
      role: "dean",
    });
  });

  it("combines search and role filters with &&", async () => {
    await GET(get("?search=ali&role=vpaa"));

    const options = mocks.getList.mock.calls[0][2] as { filter: string };
    expect(options.filter).toContain(" && ");
  });

  it("does not filter on empty params", async () => {
    await GET(get("?search=%20%20&role="));

    expect(mocks.filter).not.toHaveBeenCalled();
    expect(mocks.getList).toHaveBeenCalledWith(1, 30, base);
  });

  it("returns 400 for an unknown role without querying PocketBase", async () => {
    const res = await GET(get("?role=superhero"));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid `role`" });
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.getList).not.toHaveBeenCalled();
  });

  it("returns 401 when not signed in", async () => {
    vi.mocked(requireUser).mockResolvedValueOnce({
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const res = await GET(get());

    expect(res.status).toBe(401);
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.getList).not.toHaveBeenCalled();
  });

  it("returns 403 when the caller lacks permission", async () => {
    forbidden();

    const res = await GET(get());

    expect(res.status).toBe(403);
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.getList).not.toHaveBeenCalled();
  });

  it("delegates errors to handlePbError", async () => {
    mocks.getList.mockRejectedValue(new Error("boom"));

    const res = await GET(get());

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "boom" });
  });
});

describe("POST /api/user", () => {
  const data = {
    email: "new@example.com",
    password: "supersecret",
    name: "New User",
    role: "dean" as const,
  };

  it("creates a user with passwordConfirm and returns 201", async () => {
    const created = { id: "abc123abc123abc", email: data.email };
    mocks.parseUserInput.mockReturnValue({ ok: true, data });
    mocks.create.mockResolvedValue(created);

    const res = await POST(post(data));

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ...created, mapped: true });
    expect(mocks.parseUserInput).toHaveBeenCalledWith(data);
    expect(createAdminPb).toHaveBeenCalledOnce();
    expect(mocks.create).toHaveBeenCalledWith({
      ...data,
      passwordConfirm: data.password,
    });
    expect(mocks.toUserResponse).toHaveBeenCalledWith(created);
  });

  it("checks permissions with the user write rule", async () => {
    mocks.parseUserInput.mockReturnValue({ ok: true, data });
    mocks.create.mockResolvedValue({ id: "x" });

    await POST(post(data));

    expect(requireUser).toHaveBeenCalledWith([]);
  });

  it("returns 400 on validation failure and never touches PocketBase", async () => {
    mocks.parseUserInput.mockReturnValue({
      ok: false,
      error: "`email` is required",
    });

    const res = await POST(post({ password: "supersecret" }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "`email` is required" });
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("passes null to the validator when the body is not valid JSON", async () => {
    mocks.parseUserInput.mockReturnValue({ ok: false, error: "invalid" });

    const res = await POST(post("{not json", true));

    expect(mocks.parseUserInput).toHaveBeenCalledWith(null);
    expect(res.status).toBe(400);
  });

  it("delegates PocketBase errors to handlePbError", async () => {
    mocks.parseUserInput.mockReturnValue({ ok: true, data });
    mocks.create.mockRejectedValue(new Error("pb down"));

    const res = await POST(post(data));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "pb down" });
  });

  it("returns 401 when not signed in", async () => {
    vi.mocked(requireUser).mockResolvedValueOnce({
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    });

    const res = await POST(post(data));

    expect(res.status).toBe(401);
    expect(mocks.parseUserInput).not.toHaveBeenCalled();
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("returns 403 when the caller lacks permission and never touches PocketBase", async () => {
    forbidden();

    const res = await POST(post(data));

    expect(res.status).toBe(403);
    expect(mocks.parseUserInput).not.toHaveBeenCalled();
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
