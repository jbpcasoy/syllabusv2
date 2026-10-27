import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getFullList: vi.fn(),
  getOne: vi.fn(),
  collectionSpy: vi.fn(),
  filter: vi.fn(
    (expr: string, params: Record<string, unknown>) =>
      `${expr}|${JSON.stringify(params)}`,
  ),
}));

vi.mock("server-only", () => ({}));

// cache() is request-scoped in React; make it a passthrough for unit tests.
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, cache: <T>(fn: T) => fn };
});

vi.mock("@/lib/pocketbase", () => ({
  createAdminPb: vi.fn(async () => ({
    filter: mocks.filter,
    collection: (name: string) => {
      mocks.collectionSpy(name);
      return {
        getOne: mocks.getOne,
        getFullList: (options: unknown) => mocks.getFullList(name, options),
      };
    },
  })),
}));

import { getUserRoles } from "@/lib/roles";
import { hasAnyRole, NO_ROLES, roleLabels } from "@/types/roles";

const USER_ID = "user1user1user1";

/** Make each assignment collection return the given rows (empty by default). */
function seed(rows: Partial<Record<string, unknown[]>> = {}) {
  mocks.getFullList.mockImplementation(
    async (name: string) => rows[name] ?? [],
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getOne.mockResolvedValue({ isAdmin: false });
  seed();
});

describe("getUserRoles", () => {
  it("returns no roles for a user with no assignments", async () => {
    const roles = await getUserRoles(USER_ID);

    expect(roles).toEqual(NO_ROLES);
    expect(hasAnyRole(roles)).toBe(false);
  });

  it("queries every assignment collection plus the user", async () => {
    await getUserRoles(USER_ID);

    const names = mocks.collectionSpy.mock.calls.map((c) => c[0]).sort();
    expect(names).toEqual(
      [
        "citl_directors",
        "deans",
        "department_heads",
        "faculties",
        "fdis_chairs",
        "program_chairs",
        "program_reviewers",
        "users",
        "vpaas",
      ].sort(),
    );
    expect(mocks.getOne).toHaveBeenCalledWith(USER_ID, { fields: "isAdmin" });
  });

  it("only looks at active assignments of that user, with a bound filter", async () => {
    await getUserRoles(USER_ID);

    expect(mocks.filter).toHaveBeenCalledWith(
      "user = {:userId} && active = true",
      { userId: USER_ID },
    );
    // 8 assignment collections, each with a filter
    expect(mocks.filter).toHaveBeenCalledTimes(8);
    for (const call of mocks.getFullList.mock.calls) {
      expect((call[1] as { filter: string }).filter).toContain("active = true");
    }
  });

  it("maps scoped assignments to their target ids", async () => {
    seed({
      program_chairs: [{ program: "prog1prog1prog1" }],
      program_reviewers: [{ program: "prog2prog2prog2" }],
      department_heads: [{ department: "dept1dept1dept1" }],
      deans: [{ college: "colg1colg1colg1" }],
      faculties: [
        { program: "prog1prog1prog1" },
        { program: "prog2prog2prog2" },
      ],
    });

    const roles = await getUserRoles(USER_ID);

    expect(roles.chairOfPrograms).toEqual(["prog1prog1prog1"]);
    expect(roles.reviewerOfPrograms).toEqual(["prog2prog2prog2"]);
    expect(roles.headOfDepartments).toEqual(["dept1dept1dept1"]);
    expect(roles.deanOfColleges).toEqual(["colg1colg1colg1"]);
    expect(roles.facultyOfPrograms).toEqual([
      "prog1prog1prog1",
      "prog2prog2prog2",
    ]);
    expect(hasAnyRole(roles)).toBe(true);
  });

  it("sets the global flags for single-active roles", async () => {
    seed({
      fdis_chairs: [{ id: "a" }],
      citl_directors: [{ id: "b" }],
      vpaas: [{ id: "c" }],
    });

    const roles = await getUserRoles(USER_ID);

    expect(roles.isFdisChair).toBe(true);
    expect(roles.isCitlDirector).toBe(true);
    expect(roles.isVpaa).toBe(true);
    expect(roles.isAdmin).toBe(false);
  });

  it("supports several roles at once", async () => {
    seed({
      program_chairs: [{ program: "prog1prog1prog1" }],
      deans: [{ college: "colg1colg1colg1" }],
      faculties: [{ program: "prog1prog1prog1" }],
      fdis_chairs: [{ id: "a" }],
    });

    const roles = await getUserRoles(USER_ID);

    expect(roles.chairOfPrograms).toHaveLength(1);
    expect(roles.deanOfColleges).toHaveLength(1);
    expect(roles.facultyOfPrograms).toHaveLength(1);
    expect(roles.isFdisChair).toBe(true);
    expect(roles.isCitlDirector).toBe(false);
  });

  it("removes duplicate and empty ids", async () => {
    seed({
      program_chairs: [
        { program: "prog1prog1prog1" },
        { program: "prog1prog1prog1" },
        { program: "" },
      ],
    });

    const roles = await getUserRoles(USER_ID);

    expect(roles.chairOfPrograms).toEqual(["prog1prog1prog1"]);
  });

  it("reads isAdmin from the user record", async () => {
    mocks.getOne.mockResolvedValue({ isAdmin: true });

    const roles = await getUserRoles(USER_ID);

    expect(roles.isAdmin).toBe(true);
    expect(hasAnyRole(roles)).toBe(true);
  });

  it("treats a missing isAdmin field as false (schema not migrated yet)", async () => {
    mocks.getOne.mockResolvedValue({});

    const roles = await getUserRoles(USER_ID);

    expect(roles.isAdmin).toBe(false);
  });

  it("does not treat a truthy non-boolean isAdmin as admin", async () => {
    mocks.getOne.mockResolvedValue({ isAdmin: "true" });

    const roles = await getUserRoles(USER_ID);

    expect(roles.isAdmin).toBe(false);
  });

  it("does not read or depend on users.role", async () => {
    mocks.getOne.mockResolvedValue({ isAdmin: false, role: "admin" });

    const roles = await getUserRoles(USER_ID);

    expect(roles.isAdmin).toBe(false);
  });

  it("propagates PocketBase errors to the caller", async () => {
    mocks.getFullList.mockRejectedValue(new Error("pb down"));

    await expect(getUserRoles(USER_ID)).rejects.toThrow("pb down");
  });
});

describe("roleLabels", () => {
  it("is empty for an unassigned user", () => {
    expect(roleLabels(NO_ROLES)).toEqual([]);
  });

  it("lists every role a user holds, broadest first", () => {
    expect(
      roleLabels({
        ...NO_ROLES,
        isAdmin: true,
        isVpaa: true,
        deanOfColleges: ["c"],
        chairOfPrograms: ["p"],
        facultyOfPrograms: ["p"],
      }),
    ).toEqual(["Administrator", "VPAA", "Dean", "Program Chair", "Faculty"]);
  });
});
