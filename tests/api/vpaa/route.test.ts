import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getList: vi.fn(),
  create: vi.fn(),
  collectionSpy: vi.fn(),
  filter: vi.fn(
    (expr: string, params: Record<string, unknown>) =>
      `${expr}|${JSON.stringify(params)}`,
  ),
  parseVpaaInput: vi.fn(),
  hasActiveVpaa: vi.fn(),
  toVpaaResponse: vi.fn((record: Record<string, unknown>) => ({
    ...record,
    mapped: true,
  })),
}));

vi.mock("@/lib/pocketbase", async () => {
  const { NextResponse } = await import("next/server");
  const collection = (name: string) => {
    mocks.collectionSpy(name);
    return { getList: mocks.getList, create: mocks.create };
  };
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

vi.mock("@/lib/validators/vpaa", () => ({
  parseVpaaInput: mocks.parseVpaaInput,
}));

// Mocked wholesale so the real module (and "server-only") is never loaded.
vi.mock("@/lib/vpaa", () => ({
  hasActiveVpaa: mocks.hasActiveVpaa,
  toVpaaResponse: mocks.toVpaaResponse,
}));

vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);
vi.mock("@/lib/roles", async () =>
  (await import("@/tests/helpers/mock-auth")).rolesModuleMock(),
);

import { GET, POST } from "@/app/api/vpaa/route";
import { createAdminPb } from "@/lib/pocketbase";
import {
  mockAuth,
  requireUserMock,
} from "@/tests/helpers/mock-auth";

const ADMIN_ID = "adminadminadmin";
const USER_ID = "user1user1user1";

const rows = [
  { id: "abc123abc123abc", user: USER_ID, active: true },
  { id: "def456def456def", user: "user2user2user2", active: false },
];

const listResult = {
  page: 1,
  perPage: 30,
  totalItems: 2,
  totalPages: 1,
  items: rows,
};

const base = { sort: "-created", expand: "user" };

function get(query = "") {
  return new NextRequest(`http://localhost/api/vpaa${query}`);
}

function post(body: unknown, raw = false) {
  return new NextRequest("http://localhost/api/vpaa", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: raw ? (body as string) : JSON.stringify(body),
  });
}

function unauthorized() {
  mockAuth({ signedIn: false });
}

/** Signed in, but with no roles. */
function forbidden() {
  mockAuth({ id: USER_ID });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ id: ADMIN_ID, isAdmin: true });
  mocks.hasActiveVpaa.mockResolvedValue(false);
});

describe("GET /api/vpaa", () => {
  beforeEach(() => {
    mocks.getList.mockResolvedValue(listResult);
  });

  it("returns the list mapped through toVpaaResponse", async () => {
    const res = await GET(get());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ...listResult,
      items: rows.map((r) => ({ ...r, mapped: true })),
    });
    expect(mocks.toVpaaResponse).toHaveBeenCalledTimes(rows.length);
    expect(mocks.collectionSpy).toHaveBeenCalledWith("vpaas");
    expect(mocks.getList).toHaveBeenCalledWith(1, 30, base);
  });

  it("requires sign-in but no specific capability", async () => {
    await GET(get());
    expect(requireUserMock).toHaveBeenCalledWith();
  });

  it("uses the superuser client so expand can see other users", async () => {
    await GET(get());
    expect(createAdminPb).toHaveBeenCalledOnce();
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

  it("binds a search filter over user name and email", async () => {
    await GET(get("?search=%20ali%20"));

    expect(mocks.filter).toHaveBeenCalledWith(
      "(user.name ~ {:search} || user.email ~ {:search})",
      { search: "ali" }, // trimmed
    );
    expect(mocks.getList).toHaveBeenCalledWith(
      1,
      30,
      expect.objectContaining({ filter: expect.any(String) }),
    );
  });

  it("filters by active=true and active=false as booleans", async () => {
    await GET(get("?active=true"));
    expect(mocks.filter).toHaveBeenLastCalledWith("active = {:active}", {
      active: true,
    });

    await GET(get("?active=false"));
    expect(mocks.filter).toHaveBeenLastCalledWith("active = {:active}", {
      active: false,
    });
  });

  it("ignores an invalid active value", async () => {
    await GET(get("?active=maybe"));
    expect(mocks.filter).not.toHaveBeenCalled();
    expect(mocks.getList).toHaveBeenCalledWith(1, 30, base);
  });

  it("combines multiple filters with &&", async () => {
    await GET(get(`?search=ali&user=${USER_ID}&active=true`));

    const options = mocks.getList.mock.calls[0][2] as { filter: string };
    expect(options.filter.split(" && ")).toHaveLength(3);
  });

  it("does not filter on empty params", async () => {
    await GET(get("?search=%20%20&user=&active="));
    expect(mocks.filter).not.toHaveBeenCalled();
    expect(mocks.getList).toHaveBeenCalledWith(1, 30, base);
  });

  describe("scope", () => {

    it("adds no scope filter for university-wide roles", async () => {
      for (const options of [
        { isAdmin: true },
        { roles: { isVpaa: true } },
        { roles: { isFdisChair: true } },
        { roles: { isCitlDirector: true } },
      ]) {
        mockAuth(options);
        await GET(get());
      }
      expect(mocks.filter).not.toHaveBeenCalled();
    });

    it("lets the caller filter by an explicit user id", async () => {
      await GET(get(`?user=${USER_ID}`));

      expect(mocks.filter).toHaveBeenCalledWith("user = {:userId}", {
        userId: USER_ID,
      });
    });

    it("resolves user=me to the caller's own id", async () => {
      await GET(get("?user=me"));

      expect(mocks.filter).toHaveBeenCalledWith("user = {:userId}", {
        userId: ADMIN_ID,
      });
    });

    it("limits a user with no scope to their own records", async () => {
      mockAuth({ id: USER_ID });

      await GET(get());

      expect(mocks.filter).toHaveBeenCalledOnce();
      expect(mocks.filter).toHaveBeenCalledWith("user = {:self}", {
        self: USER_ID,
      });
    });

    it("keeps that limit when another user is requested", async () => {
      mockAuth({ id: USER_ID });

      await GET(get("?user=other1other1oth"));

      const options = mocks.getList.mock.calls[0][2] as { filter: string };
      expect(options.filter.split(" && ")).toHaveLength(2);
      expect(options.filter).toContain("user = {:self}");
    });
  });

  it("returns 401 when not signed in", async () => {
    unauthorized();

    const res = await GET(get());

    expect(res.status).toBe(401);
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

describe("POST /api/vpaa", () => {
  const data = { user: USER_ID, active: true };

  beforeEach(() => {
    mocks.parseVpaaInput.mockReturnValue({ ok: true, data });
    mocks.getList.mockResolvedValue({ items: [] });
  });

  it("creates a VPAA record and returns 201", async () => {
    const created = { id: "abc123abc123abc", ...data };
    mocks.create.mockResolvedValue(created);

    const res = await POST(post(data));

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ...created, mapped: true });
    expect(createAdminPb).toHaveBeenCalledOnce();
    expect(mocks.collectionSpy).toHaveBeenCalledWith("vpaas");
    expect(mocks.create).toHaveBeenCalledWith(data, { expand: "user" });
    expect(mocks.toVpaaResponse).toHaveBeenCalledWith(created);
  });

  it("checks permissions with the vpaa write rule", async () => {
    mocks.create.mockResolvedValue({ id: "x" });

    await POST(post(data));

    expect(requireUserMock).toHaveBeenCalledWith("vpaa.write");
  });

  it("looks for an existing record for the same user", async () => {
    mocks.create.mockResolvedValue({ id: "x" });

    await POST(post(data));

    expect(mocks.filter).toHaveBeenCalledWith("user = {:user}", {
      user: USER_ID,
    });
    expect(mocks.getList).toHaveBeenCalledWith(
      1,
      1,
      expect.objectContaining({ skipTotal: true }),
    );
  });

  it("returns 400 on validation failure and never touches PocketBase", async () => {
    mocks.parseVpaaInput.mockReturnValue({
      ok: false,
      error: "`user` must be a valid user id",
    });

    const res = await POST(post({}));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "`user` must be a valid user id",
    });
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("passes null to the validator when the body is not valid JSON", async () => {
    mocks.parseVpaaInput.mockReturnValue({ ok: false, error: "invalid" });

    const res = await POST(post("{not json", true));

    expect(mocks.parseVpaaInput).toHaveBeenCalledWith(null);
    expect(res.status).toBe(400);
  });

  it("returns 409 when the user is already the active VPAA", async () => {
    mocks.getList.mockResolvedValue({ items: [{ id: "old", active: true }] });

    const res = await POST(post(data));

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      error: "This user is already the VPAA",
    });
    expect(mocks.hasActiveVpaa).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("returns 409 and suggests reactivating when an inactive record exists", async () => {
    mocks.getList.mockResolvedValue({ items: [{ id: "old", active: false }] });

    const res = await POST(post(data));

    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("inactive VPAA record");
    expect(body.error).toContain("Reactivate");
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("returns 409 when there is already an active VPAA", async () => {
    mocks.hasActiveVpaa.mockResolvedValue(true);

    const res = await POST(post(data));

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      error: "There is already an active VPAA. Deactivate them first.",
    });
    expect(mocks.hasActiveVpaa).toHaveBeenCalledWith();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("checks for an active VPAA when active is omitted (treated as active)", async () => {
    mocks.parseVpaaInput.mockReturnValue({
      ok: true,
      data: { user: USER_ID },
    });
    mocks.hasActiveVpaa.mockResolvedValue(true);

    const res = await POST(post({ user: USER_ID }));

    expect(res.status).toBe(409);
    expect(mocks.hasActiveVpaa).toHaveBeenCalledOnce();
  });

  it("skips the active-VPAA check when creating an inactive record", async () => {
    const inactive = { user: USER_ID, active: false };
    mocks.parseVpaaInput.mockReturnValue({ ok: true, data: inactive });
    mocks.hasActiveVpaa.mockResolvedValue(true); // would block if checked
    mocks.create.mockResolvedValue({ id: "x", ...inactive });

    const res = await POST(post(inactive));

    expect(res.status).toBe(201);
    expect(mocks.hasActiveVpaa).not.toHaveBeenCalled();
    expect(mocks.create).toHaveBeenCalledWith(inactive, { expand: "user" });
  });

  it("delegates a create failure (e.g. unique-index race) to handlePbError", async () => {
    mocks.create.mockRejectedValue(new Error("pb down"));

    const res = await POST(post(data));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "pb down" });
  });

  it("returns 401 when not signed in", async () => {
    unauthorized();

    const res = await POST(post(data));

    expect(res.status).toBe(401);
    expect(mocks.parseVpaaInput).not.toHaveBeenCalled();
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("returns 403 when the caller lacks permission and never touches PocketBase", async () => {
    forbidden();

    const res = await POST(post(data));

    expect(res.status).toBe(403);
    expect(mocks.parseVpaaInput).not.toHaveBeenCalled();
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
