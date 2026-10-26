import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getFullList: vi.fn(),
  filter: vi.fn(
    (expr: string, params: Record<string, unknown>) =>
      `${expr}|${JSON.stringify(params)}`,
  ),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({ avatarUrl: () => null }));
vi.mock("@/lib/pocketbase", () => ({
  createAdminPb: vi.fn(async () => ({
    filter: mocks.filter,
    collection: (name: string) => ({
      getFullList: (options: unknown) => mocks.getFullList(name, options),
    }),
  })),
}));

import {
  listActiveAssignments,
  toUserResponse,
  userKindFilter,
} from "@/lib/users";
import type { AppUser } from "@/types/user";

const A = "useraaaaaaaaaaa";
const B = "userbbbbbbbbbbb";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getFullList.mockResolvedValue([]);
});

describe("userKindFilter", () => {
  it("filters admins by the flag", () => {
    expect(userKindFilter("admin")).toBe("isAdmin = true");
  });

  it("matches any active record in any assignment collection", () => {
    const filter = userKindFilter("assigned");
    expect(filter).toContain("program_chairs_via_user.active ?= true");
    expect(filter).toContain("vpaas_via_user.active ?= true");
    expect(filter.split(" || ")).toHaveLength(7);
  });

  it("requires no admin flag and no active record anywhere for unassigned", () => {
    const filter = userKindFilter("unassigned");
    expect(filter.startsWith("isAdmin = false && ")).toBe(true);
    // No `?`: the condition must hold for every related record.
    expect(filter).toContain("faculties_via_user.active != true");
    expect(filter.split(" && ")).toHaveLength(8);
  });
});

describe("listActiveAssignments", () => {
  it("does not query PocketBase for an empty page", async () => {
    expect(await listActiveAssignments([])).toEqual(new Map());
    expect(mocks.getFullList).not.toHaveBeenCalled();
  });

  it("binds each user id and only reads active records", async () => {
    await listActiveAssignments([A, B]);

    expect(mocks.filter).toHaveBeenCalledWith("user = {:u0}", { u0: A });
    expect(mocks.filter).toHaveBeenCalledWith("user = {:u1}", { u1: B });
    expect(mocks.getFullList).toHaveBeenCalledTimes(7);
    const [, options] = mocks.getFullList.mock.calls[0] as [
      string,
      { filter: string },
    ];
    expect(options.filter.startsWith("active = true && (")).toBe(true);
  });

  it("labels each assignment with its title and scope", async () => {
    mocks.getFullList.mockImplementation(async (name: string) => {
      if (name === "program_chairs") {
        return [
          { user: A, expand: { program: { name: "BS CS", code: "BSCS" } } },
        ];
      }
      if (name === "deans") {
        return [{ user: A, expand: { college: { name: "Science", code: "" } } }];
      }
      if (name === "vpaas") return [{ user: B }];
      return [];
    });

    const result = await listActiveAssignments([A, B]);

    expect(result.get(A)).toEqual([
      { title: "Dean", scope: "Science" },
      { title: "Program Chair", scope: "BSCS" },
    ]);
    expect(result.get(B)).toEqual([{ title: "VPAA" }]);
  });
});

describe("toUserResponse", () => {
  const record = {
    id: A,
    email: "a@example.com",
    name: "A",
    avatar: "",
    verified: true,
    isAdmin: true,
    tokenKey: "secret",
    created: "c",
    updated: "u",
  } as unknown as AppUser;

  it("maps only safe fields", () => {
    expect(toUserResponse(record)).toEqual({
      id: A,
      email: "a@example.com",
      name: "A",
      avatarUrl: null,
      isAdmin: true,
      verified: true,
      created: "c",
      updated: "u",
    });
  });

  it("includes assignments when given", () => {
    expect(toUserResponse(record, []).assignments).toEqual([]);
  });
});
