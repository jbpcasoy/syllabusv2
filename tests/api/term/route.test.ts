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
  parseTermInput: vi.fn(),
  toTermRecord: vi.fn((data: Record<string, unknown>) => ({
    ...data,
    record: true,
  })),
  toTermResponse: vi.fn((record: Record<string, unknown>) => ({
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

vi.mock("@/lib/validators/term", () => ({
  parseTermInput: mocks.parseTermInput,
  isSemester: (v: unknown) =>
    v === "First Semester" || v === "Second Semester" || v === "Summer",
}));

// Mocked wholesale so the real module (and "server-only") is never loaded.
vi.mock("@/lib/term", () => ({
  toTermRecord: mocks.toTermRecord,
  toTermResponse: mocks.toTermResponse,
}));

vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);

import { GET, POST } from "@/app/api/term/route";
import { createAdminPb } from "@/lib/pocketbase";
import { mockAuth, requireUserMock } from "@/tests/helpers/mock-auth";

const SCHOOL_YEAR_ID = "sy2026sy2026sy2";
const rows = [{ id: "termatermaterma", semester: "First Semester" }];
const listResult = {
  page: 1,
  perPage: 30,
  totalItems: 1,
  totalPages: 1,
  items: rows,
};
const base = { sort: "-school_year.label,semester", expand: "school_year" };

function get(query = "") {
  return new NextRequest(`http://localhost/api/term${query}`);
}

function post(body: unknown, raw = false) {
  return new NextRequest("http://localhost/api/term", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: raw ? (body as string) : JSON.stringify(body),
  });
}

/** Signed in as the CITL director: term writes are admin-only. */
function forbidden() {
  mockAuth({ roles: { isCitlDirector: true } });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ isAdmin: true });
});

describe("GET /api/term", () => {
  beforeEach(() => {
    mocks.getList.mockResolvedValue(listResult);
  });

  it("returns the list mapped through toTermResponse", async () => {
    const res = await GET(get());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ...listResult,
      items: rows.map((r) => ({ ...r, mapped: true })),
    });
    expect(mocks.collectionSpy).toHaveBeenCalledWith("terms");
    expect(mocks.getList).toHaveBeenCalledWith(1, 30, base);
    expect(requireUserMock).toHaveBeenCalledWith();
  });

  it("clamps perPage to 100 and page to at least 1", async () => {
    await GET(get("?page=0&perPage=500"));
    expect(mocks.getList).toHaveBeenCalledWith(1, 100, base);
  });

  it("binds search, school year, semester and open filters", async () => {
    await GET(
      get(
        `?search=2026&school_year=${SCHOOL_YEAR_ID}&semester=Summer&open=true`,
      ),
    );

    expect(mocks.filter).toHaveBeenCalledWith(
      "(school_year.label ~ {:search} || semester ~ {:search})",
      { search: "2026" },
    );
    expect(mocks.filter).toHaveBeenCalledWith("school_year = {:schoolYear}", {
      schoolYear: SCHOOL_YEAR_ID,
    });
    expect(mocks.filter).toHaveBeenCalledWith("semester = {:semester}", {
      semester: "Summer",
    });
    expect(mocks.filter).toHaveBeenCalledWith("open = {:open}", {
      open: true,
    });
    const options = mocks.getList.mock.calls[0][2] as { filter: string };
    expect(options.filter.split(" && ")).toHaveLength(4);
  });

  it("ignores an unknown semester and an invalid open value", async () => {
    await GET(get("?semester=Winter&open=maybe"));
    expect(mocks.filter).not.toHaveBeenCalled();
    expect(mocks.getList).toHaveBeenCalledWith(1, 30, base);
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
  });
});

describe("POST /api/term", () => {
  const data = {
    school_year: SCHOOL_YEAR_ID,
    semester: "First Semester",
    open: false,
    submission_deadline: "2026-12-01",
  };

  beforeEach(() => {
    mocks.parseTermInput.mockReturnValue({ ok: true, data });
    mocks.getList.mockResolvedValue({ items: [] });
  });

  it("creates a term through toTermRecord and returns 201", async () => {
    mocks.create.mockResolvedValue({ id: "new" });

    const res = await POST(post(data));

    expect(res.status).toBe(201);
    expect(requireUserMock).toHaveBeenCalledWith("term.write");
    expect(mocks.toTermRecord).toHaveBeenCalledWith(data);
    expect(mocks.create).toHaveBeenCalledWith(
      { ...data, record: true },
      { expand: "school_year" },
    );
    expect(await res.json()).toEqual({ id: "new", mapped: true });
  });

  it("returns 409 when the school year already has that semester", async () => {
    mocks.getList.mockResolvedValue({ items: [{ id: "old" }] });

    const res = await POST(post(data));

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      error: "That school year already has this semester",
    });
    expect(mocks.filter).toHaveBeenCalledWith(
      "school_year = {:schoolYear} && semester = {:semester}",
      { schoolYear: SCHOOL_YEAR_ID, semester: "First Semester" },
    );
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("returns 400 on validation failure and never touches PocketBase", async () => {
    mocks.parseTermInput.mockReturnValue({ ok: false, error: "bad" });

    const res = await POST(post({}));

    expect(res.status).toBe(400);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("passes null to the validator when the body is not valid JSON", async () => {
    mocks.parseTermInput.mockReturnValue({ ok: false, error: "bad" });

    await POST(post("{not json", true));

    expect(mocks.parseTermInput).toHaveBeenCalledWith(null);
  });

  it("delegates PocketBase errors (e.g. a missing school year) to handlePbError", async () => {
    mocks.create.mockRejectedValue(new Error("pb down"));

    const res = await POST(post(data));

    expect(res.status).toBe(500);
  });

  it("returns 401 when not signed in", async () => {
    mockAuth({ signedIn: false });

    const res = await POST(post(data));

    expect(res.status).toBe(401);
  });

  it("returns 403 for a non-admin and never touches PocketBase", async () => {
    forbidden();

    const res = await POST(post(data));

    expect(res.status).toBe(403);
    expect(mocks.parseTermInput).not.toHaveBeenCalled();
    expect(createAdminPb).not.toHaveBeenCalled();
  });
});
