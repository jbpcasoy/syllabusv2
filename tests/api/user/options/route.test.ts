import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getList: vi.fn(),
  filter: vi.fn(
    (expr: string, params: Record<string, unknown>) =>
      `${expr}|${JSON.stringify(params)}`,
  ),
  toUserOption: vi.fn((user: Record<string, unknown>) => ({
    ...user,
    mapped: true,
  })),
}));

vi.mock("@/lib/pocketbase", async () => {
  const { NextResponse } = await import("next/server");
  const collection = () => ({ getList: mocks.getList });
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

vi.mock("@/lib/users", () => ({ toUserOption: mocks.toUserOption }));

vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);

import { GET } from "@/app/api/user/options/route";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { mockAuth, requireUserMock } from "@/tests/helpers/mock-auth";

const users = [
  { id: "abc123abc123abc", email: "a@example.com", name: "Alice" },
  { id: "def456def456def", email: "b@example.com", name: "Bob" },
];

const base = { sort: "name", fields: "id,email,name" };

function get(query = "") {
  return new NextRequest(`http://localhost/api/user/options${query}`);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ isAdmin: true });
  mocks.getList.mockResolvedValue({ items: users, totalItems: 42 });
});

describe("GET /api/user/options", () => {
  it("returns the users mapped through toUserOption", async () => {
    const res = await GET(get());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      items: users.map((u) => ({ ...u, mapped: true })),
      totalItems: 42,
    });
    expect(mocks.getList).toHaveBeenCalledWith(1, 30, base);
  });

  it("checks permissions with the user pick rule", async () => {
    await GET(get());
    expect(requireUserMock).toHaveBeenCalledWith("user.pick");
  });

  it("clamps perPage to 1..100", async () => {
    await GET(get("?perPage=500"));
    expect(mocks.getList).toHaveBeenLastCalledWith(1, 100, base);

    await GET(get("?perPage=-3"));
    expect(mocks.getList).toHaveBeenLastCalledWith(1, 1, base);
  });

  it("binds search through pb.filter", async () => {
    await GET(get("?search=%20al%20"));

    expect(mocks.filter).toHaveBeenCalledWith(
      "(name ~ {:search} || email ~ {:search})",
      { search: "al" },
    );
    expect(mocks.getList).toHaveBeenCalledWith(1, 30, {
      ...base,
      filter: '(name ~ {:search} || email ~ {:search})|{"search":"al"}',
    });
  });

  it.each([
    ["the VPAA", { isVpaa: true }],
    ["a dean", { deanOfColleges: ["colgAcolgAcolgA"] }],
    ["a department head", { headOfDepartments: ["deptAdeptAdeptA"] }],
    ["a program chair", { chairOfPrograms: ["progAprogAprogA"] }],
  ])("allows %s", async (_label, roles) => {
    mockAuth({ roles });
    const res = await GET(get());
    expect(res.status).toBe(200);
  });

  it.each([
    ["faculty", { facultyOfPrograms: ["progAprogAprogA"] }],
    ["the FDIS chair", { isFdisChair: true }],
    ["an unassigned user", {}],
  ])("returns 403 for %s without touching PocketBase", async (_label, roles) => {
    mockAuth({ roles });
    const res = await GET(get());

    expect(res.status).toBe(403);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("returns 401 when signed out", async () => {
    mockAuth({ signedIn: false });
    const res = await GET(get());

    expect(res.status).toBe(401);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("delegates PocketBase errors to handlePbError", async () => {
    const error = new Error("boom");
    mocks.getList.mockRejectedValue(error);

    const res = await GET(get());

    expect(res.status).toBe(500);
    expect(handlePbError).toHaveBeenCalledWith(error);
  });
});
