import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUserRoles: vi.fn(),
  resolveScope: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/roles", () => ({ getUserRoles: mocks.getUserRoles }));
vi.mock("@/lib/scope", () => ({ resolveScope: mocks.resolveScope }));

import { can } from "@/lib/capabilities";
import { NO_ROLES } from "@/types/roles";

const USER = { id: "user1user1user1" };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUserRoles.mockResolvedValue(NO_ROLES);
  mocks.resolveScope.mockResolvedValue({});
});

describe("can", () => {
  it("looks up the roles of the given user", async () => {
    await can(USER, "campus.write");
    expect(mocks.getUserRoles).toHaveBeenCalledWith(USER.id);
  });

  it("lets an admin through without resolving scope", async () => {
    mocks.getUserRoles.mockResolvedValue({ ...NO_ROLES, isAdmin: true });

    expect(await can(USER, "faculty.write", { program: "p" })).toBe(true);
    expect(mocks.resolveScope).not.toHaveBeenCalled();
  });

  it("does not resolve scope when no target is given", async () => {
    mocks.getUserRoles.mockResolvedValue({ ...NO_ROLES, isVpaa: true });

    expect(await can(USER, "college.write")).toBe(true);
    expect(mocks.resolveScope).not.toHaveBeenCalled();
  });

  it("resolves the target and applies the scoped rule", async () => {
    mocks.getUserRoles.mockResolvedValue({
      ...NO_ROLES,
      deanOfColleges: ["colgAcolgAcolgA"],
    });
    mocks.resolveScope.mockResolvedValue({ collegeId: "colgAcolgAcolgA" });

    expect(await can(USER, "department.create", { college: "x" })).toBe(true);
    expect(mocks.resolveScope).toHaveBeenCalledWith({ college: "x" });

    mocks.resolveScope.mockResolvedValue({ collegeId: "colgBcolgBcolgB" });
    expect(await can(USER, "department.create", { college: "y" })).toBe(false);
  });

  it("denies a user with no roles", async () => {
    expect(await can(USER, "faculty.write", { program: "p" })).toBe(false);
  });

  it("propagates errors from the target lookup", async () => {
    mocks.getUserRoles.mockResolvedValue({
      ...NO_ROLES,
      chairOfPrograms: ["p"],
    });
    mocks.resolveScope.mockRejectedValue({ status: 404 });

    await expect(can(USER, "faculty.write", { program: "p" })).rejects.toEqual({
      status: 404,
    });
  });
});
