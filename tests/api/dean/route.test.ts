import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getList: vi.fn(),
  create: vi.fn(),
  filter: vi.fn(
    (expr: string, params: Record<string, unknown>) =>
      `${expr}|${JSON.stringify(params)}`,
  ),
  parseDeanInput: vi.fn(),
  collegeHasActiveDean: vi.fn(),
  toDeanResponse: vi.fn((record: Record<string, unknown>) => ({
    ...record,
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

vi.mock("@/lib/validators/dean", () => ({
  parseDeanInput: mocks.parseDeanInput,
}));

// Mocked wholesale so the real module (and "server-only") is never loaded.
vi.mock("@/lib/dean", () => ({
  collegeHasActiveDean: mocks.collegeHasActiveDean,
  toDeanResponse: mocks.toDeanResponse,
}));

vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);
vi.mock("@/lib/roles", async () =>
  (await import("@/tests/helpers/mock-auth")).rolesModuleMock(),
);

import { GET, POST } from "@/app/api/dean/route";
import { createAdminPb } from "@/lib/pocketbase";
import {
  mockAuth,
  requireUserMock,
} from "@/tests/helpers/mock-auth";

const ADMIN_ID = "adminadminadmin";
const USER_ID = "user1user1user1";
const COLLEGE_ID = "colg1colg1colg1";

const rows = [
  {
    id: "abc123abc123abc",
    user: USER_ID,
    college: COLLEGE_ID,
    active: true,
  },
];

const listResult = {
  page: 1,
  perPage: 30,
  totalItems: 1,
  totalPages: 1,
  items: rows,
};

const base = { sort: "-created", expand: "user,college" };

function get(query = "") {
  return new NextRequest(`http://localhost/api/dean${query}`);
}

function post(body: unknown, raw = false) {
  return new NextRequest("http://localhost/api/dean", {
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
  mocks.collegeHasActiveDean.mockResolvedValue(false);
});

describe("GET /api/dean", () => {
  beforeEach(() => {
    mocks.getList.mockResolvedValue(listResult);
  });

  it("returns the list mapped through toDeanResponse", async () => {
    const res = await GET(get());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ...listResult,
      items: rows.map((r) => ({ ...r, mapped: true })),
    });
    expect(mocks.toDeanResponse).toHaveBeenCalledTimes(rows.length);
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

  it("filters by college", async () => {
    await GET(get(`?college=${COLLEGE_ID}`));

    expect(mocks.filter).toHaveBeenCalledWith("college = {:college}", {
      college: COLLEGE_ID,
    });
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

  it("combines filters with &&", async () => {
    await GET(get(`?search=ali&college=${COLLEGE_ID}&active=true`));

    const options = mocks.getList.mock.calls[0][2] as { filter: string };
    expect(options.filter.split(" && ")).toHaveLength(3);
  });

  it("does not filter on empty params", async () => {
    await GET(get("?search=%20%20&college=&user=&active="));
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

describe("POST /api/dean", () => {
  const data = { user: USER_ID, college: COLLEGE_ID, active: true };

  beforeEach(() => {
    mocks.parseDeanInput.mockReturnValue({ ok: true, data });
    mocks.getList.mockResolvedValue({ items: [] });
  });

  it("creates a dean and returns 201", async () => {
    const created = { id: "abc123abc123abc", ...data };
    mocks.create.mockResolvedValue(created);

    const res = await POST(post(data));

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ...created, mapped: true });
    expect(requireUserMock).toHaveBeenCalledWith("dean.write");
    expect(createAdminPb).toHaveBeenCalledOnce();
    expect(mocks.create).toHaveBeenCalledWith(data, {
      expand: "user,college",
    });
    expect(mocks.toDeanResponse).toHaveBeenCalledWith(created);
  });

  it("looks for an existing record for the same user and college", async () => {
    mocks.create.mockResolvedValue({ id: "x" });

    await POST(post(data));

    expect(mocks.filter).toHaveBeenCalledWith(
      "user = {:user} && college = {:college}",
      { user: USER_ID, college: COLLEGE_ID },
    );
    expect(mocks.getList).toHaveBeenCalledWith(
      1,
      1,
      expect.objectContaining({ skipTotal: true }),
    );
  });

  it("returns 400 on validation failure and never touches PocketBase", async () => {
    mocks.parseDeanInput.mockReturnValue({
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
    mocks.parseDeanInput.mockReturnValue({ ok: false, error: "invalid" });

    const res = await POST(post("{not json", true));

    expect(mocks.parseDeanInput).toHaveBeenCalledWith(null);
    expect(res.status).toBe(400);
  });

  it("returns 409 when the user is already an active dean of the college", async () => {
    mocks.getList.mockResolvedValue({ items: [{ id: "old", active: true }] });

    const res = await POST(post(data));

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      error: "This user is already dean of that college",
    });
    expect(mocks.collegeHasActiveDean).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("returns 409 and suggests reactivating when an inactive record exists", async () => {
    mocks.getList.mockResolvedValue({ items: [{ id: "old", active: false }] });

    const res = await POST(post(data));

    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("inactive dean record");
    expect(body.error).toContain("Reactivate");
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("returns 409 when the college already has an active dean", async () => {
    mocks.collegeHasActiveDean.mockResolvedValue(true);

    const res = await POST(post(data));

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      error: "That college already has an active dean. Deactivate them first.",
    });
    expect(mocks.collegeHasActiveDean).toHaveBeenCalledWith(COLLEGE_ID);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("checks for an active dean when active is omitted (treated as active)", async () => {
    mocks.parseDeanInput.mockReturnValue({
      ok: true,
      data: { user: USER_ID, college: COLLEGE_ID },
    });
    mocks.collegeHasActiveDean.mockResolvedValue(true);

    const res = await POST(post({ user: USER_ID, college: COLLEGE_ID }));

    expect(res.status).toBe(409);
    expect(mocks.collegeHasActiveDean).toHaveBeenCalledOnce();
  });

  it("skips the active-dean check when creating an inactive record", async () => {
    const inactive = { ...data, active: false };
    mocks.parseDeanInput.mockReturnValue({ ok: true, data: inactive });
    mocks.collegeHasActiveDean.mockResolvedValue(true); // would block if checked
    mocks.create.mockResolvedValue({ id: "x", ...inactive });

    const res = await POST(post(inactive));

    expect(res.status).toBe(201);
    expect(mocks.collegeHasActiveDean).not.toHaveBeenCalled();
    expect(mocks.create).toHaveBeenCalledWith(inactive, {
      expand: "user,college",
    });
  });

  it("delegates PocketBase errors (e.g. unique-index race) to handlePbError", async () => {
    mocks.create.mockRejectedValue(new Error("pb down"));

    const res = await POST(post(data));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "pb down" });
  });

  it("returns 401 when not signed in", async () => {
    unauthorized();

    const res = await POST(post(data));

    expect(res.status).toBe(401);
    expect(mocks.parseDeanInput).not.toHaveBeenCalled();
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("returns 403 when the caller lacks permission and never touches PocketBase", async () => {
    forbidden();

    const res = await POST(post(data));

    expect(res.status).toBe(403);
    expect(mocks.parseDeanInput).not.toHaveBeenCalled();
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
