import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getList: vi.fn(),
  filter: vi.fn(
    (expr: string, params: Record<string, unknown>) =>
      `${expr}|${JSON.stringify(params)}`,
  ),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/pocketbase", () => ({
  createAdminPb: vi.fn(async () => ({
    filter: mocks.filter,
    collection: (name: string) => ({
      getList: (page: number, perPage: number, options: unknown) =>
        mocks.getList(name, page, perPage, options),
    }),
  })),
}));

import { describeChildren } from "@/lib/org-children";

const ID = "abc123abc123abc";

function seed(counts: Record<string, number>) {
  mocks.getList.mockImplementation(async (name: string) => ({
    totalItems: counts[name] ?? 0,
    items: [],
  }));
}

beforeEach(() => {
  vi.clearAllMocks();
  seed({});
});

describe("describeChildren", () => {
  it("returns null when there are no children", async () => {
    expect(await describeChildren("college", ID)).toBeNull();
  });

  it("names the count and kind of children", async () => {
    seed({ departments: 3 });
    expect(await describeChildren("college", ID)).toBe(
      "This college still has 3 departments. Remove or reassign them first.",
    );
  });

  it("uses the singular for exactly one", async () => {
    seed({ departments: 1 });
    expect(await describeChildren("college", ID)).toContain("1 department.");
  });

  it("combines several kinds of children", async () => {
    seed({ departments: 3, deans: 1 });
    expect(await describeChildren("college", ID)).toBe(
      "This college still has 3 departments and 1 dean record. Remove or reassign them first.",
    );
  });

  it("joins three kinds with commas and 'and'", async () => {
    seed({ faculties: 2, program_chairs: 1, prospectuses: 4 });
    expect(await describeChildren("program", ID)).toBe(
      "This program still has 2 faculty memberships, 1 program chair record and 4 prospectuses. Remove or reassign them first.",
    );
  });

  it("checks programs and department heads for a department", async () => {
    seed({ programs: 2, department_heads: 1 });
    expect(await describeChildren("department", ID)).toContain(
      "2 programs and 1 department head record",
    );
  });

  it("binds the id into each filter", async () => {
    await describeChildren("department", ID);

    expect(mocks.filter).toHaveBeenCalledWith("department = {:id}", { id: ID });
    expect(mocks.filter).toHaveBeenCalledTimes(2);
  });

  it("propagates PocketBase errors", async () => {
    mocks.getList.mockRejectedValue(new Error("pb down"));
    await expect(describeChildren("college", ID)).rejects.toThrow("pb down");
  });
});
