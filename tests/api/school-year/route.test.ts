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
  parseSchoolYearInput: vi.fn(),
  toSchoolYearResponse: vi.fn((record: Record<string, unknown>) => ({
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

vi.mock("@/lib/validators/school-year", () => ({
  parseSchoolYearInput: mocks.parseSchoolYearInput,
}));

// Mocked wholesale so the real module (and "server-only") is never loaded.
vi.mock("@/lib/school-year", () => ({
  toSchoolYearResponse: mocks.toSchoolYearResponse,
}));

vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);

import { GET, POST } from "@/app/api/school-year/route";
import { createAdminPb } from "@/lib/pocketbase";
import { mockAuth, requireUserMock } from "@/tests/helpers/mock-auth";

const rows = [{ id: "sy2026sy2026sy2", label: "2026-2027" }];
const listResult = {
  page: 1,
  perPage: 30,
  totalItems: 1,
  totalPages: 1,
  items: rows,
};

function get(query = "") {
  return new NextRequest(`http://localhost/api/school-year${query}`);
}

function post(body: unknown, raw = false) {
  return new NextRequest("http://localhost/api/school-year", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: raw ? (body as string) : JSON.stringify(body),
  });
}

/** Signed in as the VPAA: school year writes are admin-only. */
function forbidden() {
  mockAuth({ roles: { isVpaa: true } });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ isAdmin: true });
});

describe("GET /api/school-year", () => {
  beforeEach(() => {
    mocks.getList.mockResolvedValue(listResult);
  });

  it("returns the list mapped through toSchoolYearResponse, newest first", async () => {
    const res = await GET(get());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ...listResult,
      items: rows.map((r) => ({ ...r, mapped: true })),
    });
    expect(mocks.collectionSpy).toHaveBeenCalledWith("school_years");
    expect(mocks.getList).toHaveBeenCalledWith(1, 30, { sort: "-label" });
  });

  it("requires sign-in but no specific capability", async () => {
    forbidden();

    const res = await GET(get());

    expect(res.status).toBe(200);
    expect(requireUserMock).toHaveBeenCalledWith();
  });

  it("clamps perPage to 100 and page to at least 1", async () => {
    await GET(get("?page=-5&perPage=9999"));
    expect(mocks.getList).toHaveBeenCalledWith(1, 100, { sort: "-label" });
  });

  it("binds a trimmed search on the label", async () => {
    await GET(get("?search=%202026%20"));

    expect(mocks.filter).toHaveBeenCalledWith("label ~ {:search}", {
      search: "2026",
    });
  });

  it("returns 401 when not signed in", async () => {
    mockAuth({ signedIn: false });

    const res = await GET(get());

    expect(res.status).toBe(401);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("delegates errors to handlePbError", async () => {
    mocks.getList.mockRejectedValue(new Error("boom"));

    const res = await GET(get());

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "boom" });
  });
});

describe("POST /api/school-year", () => {
  const data = { label: "2026-2027" };

  beforeEach(() => {
    mocks.parseSchoolYearInput.mockReturnValue({ ok: true, data });
    mocks.getList.mockResolvedValue({ items: [] });
  });

  it("creates a school year and returns 201", async () => {
    const created = { id: "sy2026sy2026sy2", ...data };
    mocks.create.mockResolvedValue(created);

    const res = await POST(post(data));

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ...created, mapped: true });
    expect(requireUserMock).toHaveBeenCalledWith("schoolYear.write");
    expect(mocks.create).toHaveBeenCalledWith(data);
  });

  it("returns 409 when the label already exists", async () => {
    mocks.getList.mockResolvedValue({ items: [{ id: "old" }] });

    const res = await POST(post(data));

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      error: "That school year already exists",
    });
    expect(mocks.filter).toHaveBeenCalledWith("label = {:label}", data);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("returns 400 on validation failure and never touches PocketBase", async () => {
    mocks.parseSchoolYearInput.mockReturnValue({ ok: false, error: "bad" });

    const res = await POST(post({ label: "2026-2028" }));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "bad" });
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("passes null to the validator when the body is not valid JSON", async () => {
    mocks.parseSchoolYearInput.mockReturnValue({ ok: false, error: "bad" });

    await POST(post("{not json", true));

    expect(mocks.parseSchoolYearInput).toHaveBeenCalledWith(null);
  });

  it("delegates PocketBase errors (e.g. unique-index race) to handlePbError", async () => {
    mocks.create.mockRejectedValue(new Error("pb down"));

    const res = await POST(post(data));

    expect(res.status).toBe(500);
  });

  it("returns 401 when not signed in", async () => {
    mockAuth({ signedIn: false });

    const res = await POST(post(data));

    expect(res.status).toBe(401);
    expect(mocks.parseSchoolYearInput).not.toHaveBeenCalled();
  });

  it("returns 403 for a non-admin and never touches PocketBase", async () => {
    forbidden();

    const res = await POST(post(data));

    expect(res.status).toBe(403);
    expect(mocks.parseSchoolYearInput).not.toHaveBeenCalled();
    expect(createAdminPb).not.toHaveBeenCalled();
  });
});
