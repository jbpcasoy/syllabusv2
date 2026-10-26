import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  token: undefined as string | undefined,
  save: vi.fn(),
  authRefresh: vi.fn(),
  can: vi.fn(),
}));

vi.mock("server-only", () => ({}));

// cache() is request-scoped in React; make it a passthrough for unit tests.
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, cache: <T>(fn: T) => fn };
});

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) =>
      mocks.token ? { name, value: mocks.token } : undefined,
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

vi.mock("@/lib/pocketbase", async () => {
  const { NextResponse } = await import("next/server");
  return {
    createPb: vi.fn(() => ({
      authStore: { save: mocks.save },
      collection: () => ({ authRefresh: mocks.authRefresh }),
      files: { getURL: vi.fn() },
    })),
    handlePbError: vi.fn((error: unknown) => {
      const status =
        typeof error === "object" && error && "status" in error
          ? Number((error as { status: unknown }).status)
          : 500;
      return NextResponse.json({ error: "pb error" }, { status });
    }),
  };
});

vi.mock("@/lib/capabilities", () => ({ can: mocks.can }));

import { authorize, requireUser, toSessionUser } from "@/lib/auth";
import { NO_ROLES } from "@/types/roles";
import type { AppUser } from "@/types/user";

function signIn(record: Record<string, unknown> = {}) {
  mocks.token = "jwt";
  mocks.authRefresh.mockResolvedValue({
    record: { id: "me1me1me1me1me1", isAdmin: false, ...record },
  });
}

async function statusOf(promise: ReturnType<typeof requireUser>) {
  const result = await promise;
  return result.ok ? 200 : result.response.status;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.token = undefined;
  mocks.can.mockResolvedValue(true);
});

describe("requireUser()", () => {
  it("returns 401 without a cookie", async () => {
    expect(await statusOf(requireUser())).toBe(401);
  });

  it("returns 401 when the token no longer validates", async () => {
    mocks.token = "jwt";
    mocks.authRefresh.mockRejectedValue({ status: 401 });

    expect(await statusOf(requireUser())).toBe(401);
  });

  it("lets any signed-in user through when no argument is given", async () => {
    signIn();

    const result = await requireUser();

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.user.id).toBe("me1me1me1me1me1");
  });
});

describe("requireUser(capability, target?)", () => {
  it("returns 401 without checking the capability when signed out", async () => {
    expect(await statusOf(requireUser("campus.write"))).toBe(401);
    expect(mocks.can).not.toHaveBeenCalled();
  });

  it("passes the user, capability and target to can()", async () => {
    signIn();

    const result = await requireUser("faculty.write", { program: "p" });

    expect(result.ok).toBe(true);
    expect(mocks.can).toHaveBeenCalledWith(
      expect.objectContaining({ id: "me1me1me1me1me1" }),
      "faculty.write",
      { program: "p" },
    );
  });

  it("returns 403 when the capability is denied", async () => {
    signIn();
    mocks.can.mockResolvedValue(false);

    expect(await statusOf(requireUser("campus.write"))).toBe(403);
  });

  it("turns a failed target lookup into the PocketBase error response", async () => {
    signIn();
    mocks.can.mockRejectedValue({ status: 404 });

    expect(await statusOf(requireUser("faculty.write", { program: "x" }))).toBe(
      404,
    );
  });
});

describe("toSessionUser", () => {
  const record = {
    id: "me1me1me1me1me1",
    email: "a@example.com",
    name: "A",
    avatar: "",
    tokenKey: "secret",
    password: "hash",
  } as unknown as AppUser;

  it("sends only safe fields plus the derived roles", () => {
    expect(
      toSessionUser(record, {
        ...NO_ROLES,
        chairOfPrograms: ["p"],
        facultyOfPrograms: ["p"],
      }),
    ).toEqual({
      id: "me1me1me1me1me1",
      email: "a@example.com",
      name: "A",
      avatarUrl: null,
      isAdmin: false,
      roleLabels: ["Program Chair", "Faculty"],
    });
  });

  it("reports an unassigned user with no labels", () => {
    expect(toSessionUser(record, NO_ROLES).roleLabels).toEqual([]);
  });

  it("takes isAdmin from the resolved roles", () => {
    const session = toSessionUser(record, { ...NO_ROLES, isAdmin: true });
    expect(session.isAdmin).toBe(true);
    expect(session.roleLabels).toEqual(["Administrator"]);
  });
});

describe("authorize", () => {
  const user = { id: "me1me1me1me1me1" };

  it("returns null when allowed", async () => {
    expect(await authorize(user, "college.write")).toBeNull();
    expect(mocks.can).toHaveBeenCalledWith(user, "college.write", undefined);
  });

  it("returns a 403 response when denied", async () => {
    mocks.can.mockResolvedValue(false);

    const res = await authorize(user, "college.write");

    expect(res?.status).toBe(403);
    expect(await res?.json()).toEqual({ error: "Forbidden" });
  });

  it("returns the PocketBase error response when the lookup fails", async () => {
    mocks.can.mockRejectedValue({ status: 404 });

    const res = await authorize(user, "faculty.write", { program: "x" });

    expect(res?.status).toBe(404);
  });
});
