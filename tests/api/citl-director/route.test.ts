import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getList: vi.fn(),
  create: vi.fn(),
  collectionSpy: vi.fn(),
  filter: vi.fn(
    (expr: string, params: Record<string, unknown>) =>
      `${expr}|${JSON.stringify(params)}`,
  ),
  parseCitlDirectorInput: vi.fn(),
  canManageCitlDirectors: vi.fn(),
  hasActiveCitlDirector: vi.fn(),
  toCitlDirectorResponse: vi.fn((record: Record<string, unknown>) => ({
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

vi.mock("@/lib/validators/citl-director", () => ({
  parseCitlDirectorInput: mocks.parseCitlDirectorInput,
}));

// Mocked wholesale so the real module (and "server-only") is never loaded.
vi.mock("@/lib/citl-director", () => ({
  canManageCitlDirectors: mocks.canManageCitlDirectors,
  hasActiveCitlDirector: mocks.hasActiveCitlDirector,
  toCitlDirectorResponse: mocks.toCitlDirectorResponse,
}));

vi.mock("@/lib/auth", () => ({
  requireUser: vi.fn(async () => ({
    ok: true,
    user: { id: "adminadminadmin", role: "admin" },
  })),
}));

import { GET, POST } from "@/app/api/citl-director/route";
import { requireUser } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { createAdminPb } from "@/lib/pocketbase";

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
  return new NextRequest(`http://localhost/api/citl-director${query}`);
}

function post(body: unknown, raw = false) {
  return new NextRequest("http://localhost/api/citl-director", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: raw ? (body as string) : JSON.stringify(body),
  });
}

function signedInAs(id: string, role: string) {
  vi.mocked(requireUser).mockResolvedValueOnce({
    ok: true,
    user: { id, role } as never,
  });
}

function unauthorized() {
  vi.mocked(requireUser).mockResolvedValueOnce({
    ok: false,
    response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
  });
}

function forbidden() {
  vi.mocked(requireUser).mockResolvedValueOnce({
    ok: false,
    response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.canManageCitlDirectors.mockReturnValue(true);
  mocks.hasActiveCitlDirector.mockResolvedValue(false);
});

describe("GET /api/citl-director", () => {
  beforeEach(() => {
    mocks.getList.mockResolvedValue(listResult);
  });

  it("returns the list mapped through toCitlDirectorResponse", async () => {
    const res = await GET(get());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ...listResult,
      items: rows.map((r) => ({ ...r, mapped: true })),
    });
    expect(mocks.toCitlDirectorResponse).toHaveBeenCalledTimes(rows.length);
    expect(mocks.collectionSpy).toHaveBeenCalledWith("citl_directors");
    expect(mocks.getList).toHaveBeenCalledWith(1, 30, base);
  });

  it("requires sign-in but no specific role", async () => {
    await GET(get());
    expect(requireUser).toHaveBeenCalledWith();
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

  it("combines filters with &&", async () => {
    await GET(get(`?search=ali&user=${USER_ID}&active=true`));

    const options = mocks.getList.mock.calls[0][2] as { filter: string };
    expect(options.filter.split(" && ")).toHaveLength(3);
  });

  it("does not filter on empty params", async () => {
    await GET(get("?search=%20%20&user=&active="));
    expect(mocks.filter).not.toHaveBeenCalled();
    expect(mocks.getList).toHaveBeenCalledWith(1, 30, base);
  });

  describe("user scoping", () => {
    it("lets a manager list everyone when no user param is given", async () => {
      await GET(get());
      expect(mocks.filter).not.toHaveBeenCalled();
    });

    it("lets a manager filter by an explicit user id", async () => {
      await GET(get(`?user=${USER_ID}`));

      expect(mocks.filter).toHaveBeenCalledWith("user = {:userId}", {
        userId: USER_ID,
      });
    });

    it("resolves user=me to the manager's own id", async () => {
      await GET(get("?user=me"));

      expect(mocks.filter).toHaveBeenCalledWith("user = {:userId}", {
        userId: ADMIN_ID,
      });
    });

    it("scopes a non-manager to their own records", async () => {
      signedInAs(USER_ID, "faculty");
      mocks.canManageCitlDirectors.mockReturnValueOnce(false);

      await GET(get());

      expect(mocks.filter).toHaveBeenCalledWith("user = {:userId}", {
        userId: USER_ID,
      });
    });

    it("ignores a non-manager's attempt to view another user", async () => {
      signedInAs(USER_ID, "faculty");
      mocks.canManageCitlDirectors.mockReturnValueOnce(false);

      await GET(get("?user=other1other1oth"));

      expect(mocks.filter).toHaveBeenCalledOnce();
      expect(mocks.filter).toHaveBeenCalledWith("user = {:userId}", {
        userId: USER_ID,
      });
    });

    it("does not let a non-manager resolve user=me to anyone else", async () => {
      signedInAs(USER_ID, "faculty");
      mocks.canManageCitlDirectors.mockReturnValueOnce(false);

      await GET(get("?user=me"));

      expect(mocks.filter).toHaveBeenCalledWith("user = {:userId}", {
        userId: USER_ID,
      });
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

describe("POST /api/citl-director", () => {
  const data = { user: USER_ID, active: true };

  beforeEach(() => {
    mocks.parseCitlDirectorInput.mockReturnValue({ ok: true, data });
    mocks.getList.mockResolvedValue({ items: [] });
  });

  it("creates a CITL director and returns 201", async () => {
    const created = { id: "abc123abc123abc", ...data };
    mocks.create.mockResolvedValue(created);

    const res = await POST(post(data));

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ...created, mapped: true });
    expect(requireUser).toHaveBeenCalledWith(PERMISSIONS.citlDirector.write);
    expect(createAdminPb).toHaveBeenCalledOnce();
    expect(mocks.collectionSpy).toHaveBeenCalledWith("citl_directors");
    expect(mocks.create).toHaveBeenCalledWith(data, { expand: "user" });
    expect(mocks.toCitlDirectorResponse).toHaveBeenCalledWith(created);
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
    mocks.parseCitlDirectorInput.mockReturnValue({
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
    mocks.parseCitlDirectorInput.mockReturnValue({
      ok: false,
      error: "invalid",
    });

    const res = await POST(post("{not json", true));

    expect(mocks.parseCitlDirectorInput).toHaveBeenCalledWith(null);
    expect(res.status).toBe(400);
  });

  it("returns 409 when the user is already the active CITL director", async () => {
    mocks.getList.mockResolvedValue({ items: [{ id: "old", active: true }] });

    const res = await POST(post(data));

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      error: "This user is already the CITL director",
    });
    expect(mocks.hasActiveCitlDirector).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("returns 409 and suggests reactivating when an inactive record exists", async () => {
    mocks.getList.mockResolvedValue({ items: [{ id: "old", active: false }] });

    const res = await POST(post(data));

    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("inactive CITL director record");
    expect(body.error).toContain("Reactivate");
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("returns 409 when someone else is already the active CITL director", async () => {
    mocks.hasActiveCitlDirector.mockResolvedValue(true);

    const res = await POST(post(data));

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      error: "There is already an active CITL director. Deactivate them first.",
    });
    expect(mocks.hasActiveCitlDirector).toHaveBeenCalledOnce();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("checks for an active director when active is omitted (treated as active)", async () => {
    mocks.parseCitlDirectorInput.mockReturnValue({
      ok: true,
      data: { user: USER_ID },
    });
    mocks.hasActiveCitlDirector.mockResolvedValue(true);

    const res = await POST(post({ user: USER_ID }));

    expect(res.status).toBe(409);
    expect(mocks.hasActiveCitlDirector).toHaveBeenCalledOnce();
  });

  it("skips the active-director check when creating an inactive record", async () => {
    const inactive = { user: USER_ID, active: false };
    mocks.parseCitlDirectorInput.mockReturnValue({ ok: true, data: inactive });
    mocks.hasActiveCitlDirector.mockResolvedValue(true); // would block if checked
    mocks.create.mockResolvedValue({ id: "x", ...inactive });

    const res = await POST(post(inactive));

    expect(res.status).toBe(201);
    expect(mocks.hasActiveCitlDirector).not.toHaveBeenCalled();
    expect(mocks.create).toHaveBeenCalledWith(inactive, { expand: "user" });
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
    expect(mocks.parseCitlDirectorInput).not.toHaveBeenCalled();
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("returns 403 when the caller lacks permission and never touches PocketBase", async () => {
    forbidden();

    const res = await POST(post(data));

    expect(res.status).toBe(403);
    expect(mocks.parseCitlDirectorInput).not.toHaveBeenCalled();
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
