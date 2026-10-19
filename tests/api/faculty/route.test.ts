import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getList: vi.fn(),
  create: vi.fn(),
  filter: vi.fn(
    (expr: string, params: Record<string, unknown>) =>
      `${expr}|${JSON.stringify(params)}`,
  ),
  parseFacultyInput: vi.fn(),
  canManageFaculty: vi.fn((_user: unknown) => true),
  toFacultyResponse: vi.fn((record: Record<string, unknown>) => ({
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

vi.mock("@/lib/validators/faculty", () => ({
  parseFacultyInput: mocks.parseFacultyInput,
}));

// Mocked wholesale so the real module (and "server-only") is never loaded.
vi.mock("@/lib/faculty", () => ({
  canManageFaculty: mocks.canManageFaculty,
  toFacultyResponse: mocks.toFacultyResponse,
}));

vi.mock("@/lib/auth", () => ({
  requireUser: vi.fn(async () => ({
    ok: true,
    user: { id: "me1me1me1me1me1", role: "admin" },
  })),
}));

import { GET, POST } from "@/app/api/faculty/route";
import { requireUser } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { createAdminPb } from "@/lib/pocketbase";

const ME = "me1me1me1me1me1";
const USER_ID = "usr123usr123usr";
const PROGRAM_ID = "prg123prg123prg";

const rows = [
  { id: "abc123abc123abc", user: USER_ID, program: PROGRAM_ID, active: true },
  { id: "def456def456def", user: USER_ID, program: PROGRAM_ID, active: false },
];

const listResult = {
  page: 1,
  perPage: 30,
  totalItems: 2,
  totalPages: 1,
  items: rows,
};

const base = { sort: "-created", expand: "user,program" };

function get(query = "") {
  return new NextRequest(`http://localhost/api/faculty${query}`);
}

function post(body: unknown, raw = false) {
  return new NextRequest("http://localhost/api/faculty", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: raw ? (body as string) : JSON.stringify(body),
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
});

describe("GET /api/faculty", () => {
  beforeEach(() => {
    mocks.getList.mockResolvedValue(listResult);
  });

  it("returns the list mapped through toFacultyResponse", async () => {
    const res = await GET(get());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ...listResult,
      items: rows.map((r) => ({ ...r, mapped: true })),
    });
    expect(mocks.toFacultyResponse).toHaveBeenCalledTimes(rows.length);
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

  it("filters by program", async () => {
    await GET(get(`?program=${PROGRAM_ID}`));

    expect(mocks.filter).toHaveBeenCalledWith("program = {:program}", {
      program: PROGRAM_ID,
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

  it("combines multiple filters with &&", async () => {
    await GET(get(`?search=ali&program=${PROGRAM_ID}&active=true`));

    const options = mocks.getList.mock.calls[0][2] as { filter: string };
    expect(options.filter.split(" && ")).toHaveLength(3);
  });

  it("does not filter on empty params", async () => {
    await GET(get("?search=%20%20&program=&user=&active="));
    expect(mocks.filter).not.toHaveBeenCalled();
    expect(mocks.getList).toHaveBeenCalledWith(1, 30, base);
  });

  describe("user scoping", () => {
    it("lets a manager list everyone when no user is given", async () => {
      await GET(get());
      expect(mocks.filter).not.toHaveBeenCalled();
    });

    it("resolves user=me to the caller for a manager", async () => {
      await GET(get("?user=me"));
      expect(mocks.filter).toHaveBeenCalledWith("user = {:userId}", {
        userId: ME,
      });
    });

    it("lets a manager filter by another user's id", async () => {
      await GET(get(`?user=${USER_ID}`));
      expect(mocks.filter).toHaveBeenCalledWith("user = {:userId}", {
        userId: USER_ID,
      });
    });

    it("forces a non-manager to their own memberships", async () => {
      mocks.canManageFaculty.mockReturnValueOnce(false);

      await GET(get());

      expect(mocks.filter).toHaveBeenCalledWith("user = {:userId}", {
        userId: ME,
      });
    });

    it("ignores the user param for a non-manager", async () => {
      mocks.canManageFaculty.mockReturnValueOnce(false);

      await GET(get(`?user=${USER_ID}`));

      expect(mocks.filter).toHaveBeenCalledTimes(1);
      expect(mocks.filter).toHaveBeenCalledWith("user = {:userId}", {
        userId: ME,
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

describe("POST /api/faculty", () => {
  const data = { user: USER_ID, program: PROGRAM_ID, active: true };

  it("creates a membership and returns 201", async () => {
    const created = { id: "abc123abc123abc", ...data };
    mocks.parseFacultyInput.mockReturnValue({ ok: true, data });
    mocks.getList.mockResolvedValue({ items: [] });
    mocks.create.mockResolvedValue(created);

    const res = await POST(post(data));

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ...created, mapped: true });
    expect(createAdminPb).toHaveBeenCalledOnce();
    expect(mocks.create).toHaveBeenCalledWith(data, {
      expand: "user,program",
    });
    expect(mocks.toFacultyResponse).toHaveBeenCalledWith(created);
  });

  it("checks permissions with the faculty write rule", async () => {
    mocks.parseFacultyInput.mockReturnValue({ ok: true, data });
    mocks.getList.mockResolvedValue({ items: [] });
    mocks.create.mockResolvedValue({ id: "x" });

    await POST(post(data));

    expect(requireUser).toHaveBeenCalledWith(PERMISSIONS.faculty.write);
  });

  it("looks for an existing membership with a bound filter", async () => {
    mocks.parseFacultyInput.mockReturnValue({ ok: true, data });
    mocks.getList.mockResolvedValue({ items: [] });
    mocks.create.mockResolvedValue({ id: "x" });

    await POST(post(data));

    expect(mocks.filter).toHaveBeenCalledWith(
      "user = {:user} && program = {:program}",
      { user: USER_ID, program: PROGRAM_ID },
    );
    expect(mocks.getList).toHaveBeenCalledWith(
      1,
      1,
      expect.objectContaining({ skipTotal: true }),
    );
  });

  it("returns 409 when the user is already active in that program", async () => {
    mocks.parseFacultyInput.mockReturnValue({ ok: true, data });
    mocks.getList.mockResolvedValue({ items: [{ id: "old", active: true }] });

    const res = await POST(post(data));

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      error: "This user is already faculty of that program",
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("returns 409 and suggests reactivating when the membership is inactive", async () => {
    mocks.parseFacultyInput.mockReturnValue({ ok: true, data });
    mocks.getList.mockResolvedValue({ items: [{ id: "old", active: false }] });

    const res = await POST(post(data));

    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("inactive membership");
    expect(body.error).toContain("Reactivate");
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("returns 400 on validation failure and never touches PocketBase", async () => {
    mocks.parseFacultyInput.mockReturnValue({
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
    mocks.parseFacultyInput.mockReturnValue({ ok: false, error: "invalid" });

    const res = await POST(post("{not json", true));

    expect(mocks.parseFacultyInput).toHaveBeenCalledWith(null);
    expect(res.status).toBe(400);
  });

  it("delegates a create failure (e.g. unique-index race) to handlePbError", async () => {
    mocks.parseFacultyInput.mockReturnValue({ ok: true, data });
    mocks.getList.mockResolvedValue({ items: [] });
    mocks.create.mockRejectedValue(new Error("pb down"));

    const res = await POST(post(data));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "pb down" });
  });

  it("returns 401 when not signed in", async () => {
    unauthorized();

    const res = await POST(post(data));

    expect(res.status).toBe(401);
    expect(mocks.parseFacultyInput).not.toHaveBeenCalled();
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("returns 403 when the caller lacks permission and never touches PocketBase", async () => {
    forbidden();

    const res = await POST(post(data));

    expect(res.status).toBe(403);
    expect(mocks.parseFacultyInput).not.toHaveBeenCalled();
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
