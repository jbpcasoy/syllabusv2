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
  parseProspectusItemInput: vi.fn(),
  toProspectusItemResponse: vi.fn((record: Record<string, unknown>) => ({
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

vi.mock("@/lib/validators/prospectus-item", () => ({
  parseProspectusItemInput: mocks.parseProspectusItemInput,
  isSemester: (v: unknown) =>
    v === "First Semester" || v === "Second Semester" || v === "Summer",
  isYearLevel: (v: unknown) => v === "First Year" || v === "Second Year",
}));

// Mocked wholesale so the real module (and "server-only") is never loaded.
vi.mock("@/lib/prospectus-item", () => ({
  PROSPECTUS_ITEM_EXPAND: "course,prospectus.program,prospectus.school_year",
  toProspectusItemResponse: mocks.toProspectusItemResponse,
}));

vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);
vi.mock("@/lib/capabilities", async () =>
  (await import("@/tests/helpers/mock-auth")).capabilitiesModuleMock(),
);

import { GET, POST } from "@/app/api/prospectus-item/route";
import { createAdminPb } from "@/lib/pocketbase";
import { mockAuth, requireUserMock } from "@/tests/helpers/mock-auth";

const PROSPECTUS_ID = "prosaprosaprosa";
const COURSE_ID = "coursecoursecou";
const EXPAND = "course,prospectus.program,prospectus.school_year";

const rows = [{ id: "item1item1item1", course: COURSE_ID }];
const listResult = {
  page: 1,
  perPage: 30,
  totalItems: 1,
  totalPages: 1,
  items: rows,
};
const base = { sort: "course.code", expand: EXPAND };

function get(query = "") {
  return new NextRequest(`http://localhost/api/prospectus-item${query}`);
}

function post(body: unknown, raw = false) {
  return new NextRequest("http://localhost/api/prospectus-item", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: raw ? (body as string) : JSON.stringify(body),
  });
}

/** Signed in as a program chair: prospectus item writes are admin-only. */
function forbidden() {
  mockAuth({ roles: { chairOfPrograms: ["progaprogaproga"] } });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ isAdmin: true });
});

describe("GET /api/prospectus-item", () => {
  beforeEach(() => {
    mocks.getList.mockResolvedValue(listResult);
  });

  it("returns the list mapped through toProspectusItemResponse", async () => {
    const res = await GET(get());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ...listResult,
      items: rows.map((r) => ({ ...r, mapped: true })),
    });
    expect(mocks.collectionSpy).toHaveBeenCalledWith("prospectus_items");
    expect(mocks.getList).toHaveBeenCalledWith(1, 30, base);
    expect(requireUserMock).toHaveBeenCalledWith();
  });

  it("clamps perPage to 100 and page to at least 1", async () => {
    await GET(get("?page=-5&perPage=9999"));
    expect(mocks.getList).toHaveBeenCalledWith(1, 100, base);
  });

  it("binds a search over the course code and title", async () => {
    await GET(get("?search=%20cs%20"));
    expect(mocks.filter).toHaveBeenCalledWith(
      "(course.code ~ {:search} || course.title ~ {:search})",
      { search: "cs" },
    );
  });

  it("filters by prospectus, semester and a valid year level only", async () => {
    await GET(
      get(`?prospectus=${PROSPECTUS_ID}&semester=Summer&year_level=Bogus`),
    );

    expect(mocks.filter).toHaveBeenCalledWith("prospectus = {:prospectus}", {
      prospectus: PROSPECTUS_ID,
    });
    expect(mocks.filter).toHaveBeenCalledWith("semester = {:semester}", {
      semester: "Summer",
    });
    expect(mocks.filter).toHaveBeenCalledTimes(2);
  });

  it("restricts non-admins (even deans) to published prospectuses", async () => {
    mockAuth({ roles: { deanOfColleges: ["colgacolgacolga"] } });

    await GET(get());

    expect(mocks.getList).toHaveBeenCalledWith(
      1,
      30,
      expect.objectContaining({ filter: "prospectus.published = true" }),
    );
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

describe("POST /api/prospectus-item", () => {
  const data = {
    prospectus: PROSPECTUS_ID,
    course: COURSE_ID,
    semester: "First Semester",
    year_level: "First Year",
  };

  beforeEach(() => {
    mocks.parseProspectusItemInput.mockReturnValue({ ok: true, data });
    mocks.getList.mockResolvedValue({ items: [] });
  });

  it("creates the item and returns 201", async () => {
    const created = { id: "newnewnewnewnew", ...data };
    mocks.create.mockResolvedValue(created);

    const res = await POST(post(data));

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ...created, mapped: true });
    expect(requireUserMock).toHaveBeenCalledWith("prospectusItem.write");
    expect(mocks.create).toHaveBeenCalledWith(data, { expand: EXPAND });
  });

  it("looks for the same course in the same prospectus", async () => {
    mocks.create.mockResolvedValue({ id: "x" });

    await POST(post(data));

    expect(mocks.filter).toHaveBeenCalledWith(
      "prospectus = {:prospectus} && course = {:course}",
      { prospectus: PROSPECTUS_ID, course: COURSE_ID },
    );
  });

  it("returns 409 when the course is already listed", async () => {
    mocks.getList.mockResolvedValue({ items: [{ id: "old" }] });

    const res = await POST(post(data));

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      error: "That course is already listed in this prospectus",
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("returns 400 on validation failure and never touches PocketBase", async () => {
    mocks.parseProspectusItemInput.mockReturnValue({
      ok: false,
      error: "`course` must be a valid course id",
    });

    const res = await POST(post({}));

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "`course` must be a valid course id",
    });
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("passes null to the validator when the body is not valid JSON", async () => {
    mocks.parseProspectusItemInput.mockReturnValue({
      ok: false,
      error: "invalid",
    });

    const res = await POST(post("{not json", true));

    expect(mocks.parseProspectusItemInput).toHaveBeenCalledWith(null);
    expect(res.status).toBe(400);
  });

  it("delegates PocketBase errors (e.g. a missing course) to handlePbError", async () => {
    mocks.create.mockRejectedValue(new Error("pb down"));

    const res = await POST(post(data));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "pb down" });
  });

  it("returns 401 when not signed in", async () => {
    mockAuth({ signedIn: false });

    const res = await POST(post(data));

    expect(res.status).toBe(401);
    expect(mocks.parseProspectusItemInput).not.toHaveBeenCalled();
  });

  it("returns 403 for a non-admin and never touches PocketBase", async () => {
    forbidden();

    const res = await POST(post(data));

    expect(res.status).toBe(403);
    expect(mocks.parseProspectusItemInput).not.toHaveBeenCalled();
    expect(createAdminPb).not.toHaveBeenCalled();
  });
});
