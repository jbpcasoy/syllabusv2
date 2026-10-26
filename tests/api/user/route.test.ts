import { NextRequest } from "next/server";
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
  listActiveAssignments: vi.fn(),
  userKindFilter: vi.fn((kind: string) => `kind:${kind}`),
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

// Keep the real isUserKind; only stub parseUserInput.
vi.mock("@/lib/validators/user", async () => {
  const actual = await vi.importActual<typeof import("@/lib/validators/user")>(
    "@/lib/validators/user",
  );
  return { ...actual, parseUserInput: mocks.parseUserInput };
});

vi.mock("@/lib/users", () => ({
  toUserResponse: mocks.toUserResponse,
  listActiveAssignments: mocks.listActiveAssignments,
  userKindFilter: mocks.userKindFilter,
}));

vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);

import { GET, POST } from "@/app/api/user/route";
import { createAdminPb } from "@/lib/pocketbase";
import { mockAuth, requireUserMock } from "@/tests/helpers/mock-auth";

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

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ isAdmin: true });
});

describe("GET /api/user", () => {
  const aliceAssignments = [{ title: "Program Chair", scope: "BSCS" }];

  beforeEach(() => {
    mocks.getList.mockResolvedValue(listResult);
    mocks.listActiveAssignments.mockResolvedValue(
      new Map([[users[0].id, aliceAssignments]]),
    );
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

  it("attaches each user's active assignments (empty when none)", async () => {
    await GET(get());

    expect(mocks.listActiveAssignments).toHaveBeenCalledWith(
      users.map((u) => u.id),
    );
    expect(mocks.toUserResponse).toHaveBeenCalledWith(
      users[0],
      aliceAssignments,
    );
    expect(mocks.toUserResponse).toHaveBeenCalledWith(users[1], []);
  });

  it("uses the superuser client because listRule only exposes the caller", async () => {
    await GET(get());
    expect(createAdminPb).toHaveBeenCalledOnce();
  });

  it("checks permissions with the user read rule", async () => {
    await GET(get());
    expect(requireUserMock).toHaveBeenCalledWith("user.read");
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

  it.each(["admin", "assigned", "unassigned"])(
    "filters by kind=%s",
    async (kind) => {
      await GET(get(`?kind=${kind}`));

      expect(mocks.userKindFilter).toHaveBeenCalledWith(kind);
      const options = mocks.getList.mock.calls[0][2] as { filter: string };
      expect(options.filter).toBe(`kind:${kind}`);
    },
  );

  it("combines search and kind filters with &&", async () => {
    await GET(get("?search=ali&kind=admin"));

    const options = mocks.getList.mock.calls[0][2] as { filter: string };
    expect(options.filter).toContain(" && ");
  });

  it("does not filter on empty params", async () => {
    await GET(get("?search=%20%20&kind="));

    expect(mocks.filter).not.toHaveBeenCalled();
    expect(mocks.userKindFilter).not.toHaveBeenCalled();
    expect(mocks.getList).toHaveBeenCalledWith(1, 30, base);
  });

  it("returns 400 for an unknown kind without querying PocketBase", async () => {
    const res = await GET(get("?kind=superhero"));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid `kind`" });
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.getList).not.toHaveBeenCalled();
  });

  it("ignores the removed role param", async () => {
    await GET(get("?role=dean"));
    expect(mocks.getList).toHaveBeenCalledWith(1, 30, base);
  });

  it("returns 401 when not signed in", async () => {
    mockAuth({ signedIn: false });

    const res = await GET(get());

    expect(res.status).toBe(401);
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.getList).not.toHaveBeenCalled();
  });

  it("returns 403 for a non-admin, even the VPAA", async () => {
    mockAuth({ roles: { isVpaa: true } });

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
  };

  it("passes the isAdmin flag through to PocketBase", async () => {
    const withAdmin = { ...data, isAdmin: true };
    mocks.parseUserInput.mockReturnValue({ ok: true, data: withAdmin });
    mocks.create.mockResolvedValue({ id: "x" });

    await POST(post(withAdmin));

    expect(mocks.create).toHaveBeenCalledWith({
      ...withAdmin,
      passwordConfirm: withAdmin.password,
    });
  });

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

    expect(requireUserMock).toHaveBeenCalledWith("user.write");
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
    mockAuth({ signedIn: false });

    const res = await POST(post(data));

    expect(res.status).toBe(401);
    expect(mocks.parseUserInput).not.toHaveBeenCalled();
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("returns 403 when the caller lacks permission and never touches PocketBase", async () => {
    mockAuth({ roles: { deanOfColleges: ["colgacolgacolga"] } });

    const res = await POST(post(data));

    expect(res.status).toBe(403);
    expect(mocks.parseUserInput).not.toHaveBeenCalled();
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
