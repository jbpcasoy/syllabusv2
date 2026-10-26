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

import { describeCourseDependents } from "@/lib/course";
import { describeSchoolYearDependents } from "@/lib/school-year";

const ID = "abc123abc123abc";

/** Counts per collection; the course check hits "courses" for prerequisites. */
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

describe("describeSchoolYearDependents", () => {
  it("returns null when nothing uses the school year", async () => {
    expect(await describeSchoolYearDependents(ID)).toBeNull();
    expect(mocks.filter).toHaveBeenCalledWith("school_year = {:id}", {
      id: ID,
    });
  });

  it("lists terms and prospectuses", async () => {
    seed({ terms: 1, prospectuses: 3 });
    expect(await describeSchoolYearDependents(ID)).toBe(
      "This school year still has 1 term and 3 prospectuses. Delete them first.",
    );
  });
});

describe("describeCourseDependents", () => {
  it("returns null when nothing references the course", async () => {
    expect(await describeCourseDependents(ID)).toBeNull();
    expect(mocks.filter).toHaveBeenCalledWith("course = {:id}", { id: ID });
    expect(mocks.filter).toHaveBeenCalledWith("prerequisites ?= {:id}", {
      id: ID,
    });
  });

  it("lists prospectus items and dependent courses", async () => {
    seed({ prospectus_items: 2, courses: 1 });
    expect(await describeCourseDependents(ID)).toBe(
      "This course is still used by 2 prospectus items and 1 course that lists it as a prerequisite. Remove those references first.",
    );
  });
});
