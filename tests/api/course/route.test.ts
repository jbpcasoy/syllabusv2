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
  parseCourseInput: vi.fn(),
  toCourseResponse: vi.fn((record: Record<string, unknown>) => ({
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

vi.mock("@/lib/validators/course", () => ({
  parseCourseInput: mocks.parseCourseInput,
}));

// Mocked wholesale so the real module (and "server-only") is never loaded.
vi.mock("@/lib/course", () => ({
  COURSE_EXPAND: "program,prerequisites",
  toCourseResponse: mocks.toCourseResponse,
}));

vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);

import { GET, POST } from "@/app/api/course/route";
import { createAdminPb } from "@/lib/pocketbase";
import { mockAuth, requireUserMock } from "@/tests/helpers/mock-auth";

const PROGRAM_ID = "prog1prog1prog1";
const rows = [{ id: "coursecoursecou", code: "CS 101" }];
const listResult = {
  page: 1,
  perPage: 30,
  totalItems: 1,
  totalPages: 1,
  items: rows,
};
const base = { sort: "code", expand: "program,prerequisites" };

function get(query = "") {
  return new NextRequest(`http://localhost/api/course${query}`);
}

function post(body: unknown, raw = false) {
  return new NextRequest("http://localhost/api/course", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: raw ? (body as string) : JSON.stringify(body),
  });
}

/** Signed in as the program chair of the owning program: course writes are still admin-only. */
function forbidden() {
  mockAuth({
    roles: { chairOfPrograms: [PROGRAM_ID] },
    scope: { programId: PROGRAM_ID },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ isAdmin: true });
});

describe("GET /api/course", () => {
  beforeEach(() => {
    mocks.getList.mockResolvedValue(listResult);
  });

  it("returns the list mapped through toCourseResponse", async () => {
    const res = await GET(get());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ...listResult,
      items: rows.map((r) => ({ ...r, mapped: true })),
    });
    expect(mocks.collectionSpy).toHaveBeenCalledWith("courses");
    expect(mocks.getList).toHaveBeenCalledWith(1, 30, base);
  });

  it("lets any signed-in user search the catalog", async () => {
    forbidden();

    const res = await GET(get("?search=cs&perPage=20"));

    expect(res.status).toBe(200);
    expect(requireUserMock).toHaveBeenCalledWith();
    expect(mocks.getList).toHaveBeenCalledWith(
      1,
      20,
      expect.objectContaining(base),
    );
  });

  it("clamps perPage to 100 and page to at least 1", async () => {
    await GET(get("?page=-1&perPage=1000"));
    expect(mocks.getList).toHaveBeenCalledWith(1, 100, base);
  });

  it("binds a trimmed search over code and title, and a program filter", async () => {
    await GET(get(`?search=%20intro%20&program=${PROGRAM_ID}`));

    expect(mocks.filter).toHaveBeenCalledWith(
      "(code ~ {:search} || title ~ {:search})",
      { search: "intro" },
    );
    expect(mocks.filter).toHaveBeenCalledWith("program = {:program}", {
      program: PROGRAM_ID,
    });
    const options = mocks.getList.mock.calls[0][2] as { filter: string };
    expect(options.filter.split(" && ")).toHaveLength(2);
  });

  it("does not filter on empty params", async () => {
    await GET(get("?search=%20&program="));
    expect(mocks.filter).not.toHaveBeenCalled();
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

describe("POST /api/course", () => {
  const data = {
    code: "CS 101",
    title: "Intro to Computing",
    program: PROGRAM_ID,
    credit_units: 3,
  };

  beforeEach(() => {
    mocks.parseCourseInput.mockReturnValue({ ok: true, data });
    mocks.getList.mockResolvedValue({ items: [] });
  });

  it("creates a course and returns 201", async () => {
    const created = { id: "coursecoursecou", ...data };
    mocks.create.mockResolvedValue(created);

    const res = await POST(post(data));

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ...created, mapped: true });
    expect(requireUserMock).toHaveBeenCalledWith("course.write");
    expect(mocks.create).toHaveBeenCalledWith(data, {
      expand: "program,prerequisites",
    });
  });

  it("returns 409 when the code is taken", async () => {
    mocks.getList.mockResolvedValue({ items: [{ id: "old" }] });

    const res = await POST(post(data));

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      error: "A course with that code already exists",
    });
    expect(mocks.filter).toHaveBeenCalledWith("code = {:code}", {
      code: "CS 101",
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("returns 400 on validation failure and never touches PocketBase", async () => {
    mocks.parseCourseInput.mockReturnValue({ ok: false, error: "bad" });

    const res = await POST(post({}));

    expect(res.status).toBe(400);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("passes null to the validator when the body is not valid JSON", async () => {
    mocks.parseCourseInput.mockReturnValue({ ok: false, error: "bad" });

    await POST(post("{not json", true));

    expect(mocks.parseCourseInput).toHaveBeenCalledWith(null);
  });

  it("delegates PocketBase errors (e.g. a missing prerequisite) to handlePbError", async () => {
    mocks.create.mockRejectedValue(new Error("pb down"));

    const res = await POST(post(data));

    expect(res.status).toBe(500);
  });

  it("returns 401 when not signed in", async () => {
    mockAuth({ signedIn: false });

    const res = await POST(post(data));

    expect(res.status).toBe(401);
  });

  it("returns 403 for a program chair, even of the owning program", async () => {
    forbidden();

    const res = await POST(post(data));

    expect(res.status).toBe(403);
    expect(mocks.parseCourseInput).not.toHaveBeenCalled();
    expect(createAdminPb).not.toHaveBeenCalled();
  });
});
