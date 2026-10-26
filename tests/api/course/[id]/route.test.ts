import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getOne: vi.fn(),
  getList: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  filter: vi.fn(
    (expr: string, params: Record<string, unknown>) =>
      `${expr}|${JSON.stringify(params)}`,
  ),
  parseCourseUpdate: vi.fn(),
  describeCourseDependents: vi.fn(),
  toCourseResponse: vi.fn((record: Record<string, unknown>) => ({
    ...record,
    mapped: true,
  })),
}));

vi.mock("@/lib/pocketbase", async () => {
  const { NextResponse } = await import("next/server");
  const collection = () => ({
    getOne: mocks.getOne,
    getList: mocks.getList,
    update: mocks.update,
    delete: mocks.delete,
  });
  return {
    createAdminPb: vi.fn(async () => ({ collection, filter: mocks.filter })),
    handlePbError: vi.fn((error: unknown) => {
      const status =
        typeof error === "object" && error && "status" in error
          ? Number((error as { status: unknown }).status)
          : 500;
      return NextResponse.json({ error: "pb error" }, { status });
    }),
  };
});

vi.mock("@/lib/validators/course", () => ({
  parseCourseUpdate: mocks.parseCourseUpdate,
}));

vi.mock("@/lib/course", () => ({
  COURSE_EXPAND: "program,prerequisites",
  describeCourseDependents: mocks.describeCourseDependents,
  toCourseResponse: mocks.toCourseResponse,
}));

vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);

import { DELETE, GET, PATCH } from "@/app/api/course/[id]/route";
import { createAdminPb } from "@/lib/pocketbase";
import { mockAuth, requireUserMock } from "@/tests/helpers/mock-auth";

const ID = "coursecoursecou";
const OTHER = "othercourseothe";
const EXPAND = { expand: "program,prerequisites" };
const ctx = { params: Promise.resolve({ id: ID }) };

function req(method: string, body?: unknown) {
  return new NextRequest(`http://localhost/api/course/${ID}`, {
    method,
    ...(body !== undefined && {
      headers: { "Content-Type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  });
}

/** Signed in as the VPAA: course writes are admin-only. */
function forbidden() {
  mockAuth({ roles: { isVpaa: true } });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ isAdmin: true });
});

describe("GET /api/course/:id", () => {
  it("returns the mapped record to any signed-in user", async () => {
    forbidden();
    mocks.getOne.mockResolvedValue({ id: ID });

    const res = await GET(req("GET"), ctx);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: ID, mapped: true });
    expect(mocks.getOne).toHaveBeenCalledWith(ID, EXPAND);
    expect(requireUserMock).toHaveBeenCalledWith();
  });

  it("propagates a 404 from PocketBase", async () => {
    mocks.getOne.mockRejectedValue({ status: 404 });

    const res = await GET(req("GET"), ctx);

    expect(res.status).toBe(404);
  });

  it("returns 401 when not signed in", async () => {
    mockAuth({ signedIn: false });

    const res = await GET(req("GET"), ctx);

    expect(res.status).toBe(401);
  });
});

describe("PATCH /api/course/:id", () => {
  it("updates without a duplicate check when the code is unchanged", async () => {
    mocks.parseCourseUpdate.mockReturnValue({
      ok: true,
      data: { title: "New" },
    });
    mocks.update.mockResolvedValue({ id: ID, title: "New" });

    const res = await PATCH(req("PATCH", { title: "New" }), ctx);

    expect(res.status).toBe(200);
    expect(requireUserMock).toHaveBeenCalledWith("course.write");
    expect(mocks.getList).not.toHaveBeenCalled();
    expect(mocks.update).toHaveBeenCalledWith(ID, { title: "New" }, EXPAND);
  });

  it("checks for another course with a new code", async () => {
    mocks.parseCourseUpdate.mockReturnValue({
      ok: true,
      data: { code: "CS 102" },
    });
    mocks.getList.mockResolvedValue({ items: [] });
    mocks.update.mockResolvedValue({ id: ID });

    await PATCH(req("PATCH", { code: "CS 102" }), ctx);

    expect(mocks.filter).toHaveBeenCalledWith("code = {:code} && id != {:id}", {
      code: "CS 102",
      id: ID,
    });
  });

  it("returns 409 when the new code is taken", async () => {
    mocks.parseCourseUpdate.mockReturnValue({
      ok: true,
      data: { code: "CS 102" },
    });
    mocks.getList.mockResolvedValue({ items: [{ id: OTHER }] });

    const res = await PATCH(req("PATCH", { code: "CS 102" }), ctx);

    expect(res.status).toBe(409);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("returns 400 when the course lists itself as a prerequisite", async () => {
    mocks.parseCourseUpdate.mockReturnValue({
      ok: true,
      data: { prerequisites: [OTHER, ID] },
    });

    const res = await PATCH(req("PATCH", { prerequisites: [OTHER, ID] }), ctx);

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "A course can't be its own prerequisite",
    });
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("returns 400 on validation failure", async () => {
    mocks.parseCourseUpdate.mockReturnValue({ ok: false, error: "bad" });

    const res = await PATCH(req("PATCH", {}), ctx);

    expect(res.status).toBe(400);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("passes null to the validator when the body is not valid JSON", async () => {
    mocks.parseCourseUpdate.mockReturnValue({ ok: false, error: "bad" });

    await PATCH(req("PATCH", "{not json"), ctx);

    expect(mocks.parseCourseUpdate).toHaveBeenCalledWith(null);
  });

  it("propagates a 404 from update", async () => {
    mocks.parseCourseUpdate.mockReturnValue({
      ok: true,
      data: { title: "New" },
    });
    mocks.update.mockRejectedValue({ status: 404 });

    const res = await PATCH(req("PATCH", { title: "New" }), ctx);

    expect(res.status).toBe(404);
  });

  it("returns 401 when not signed in", async () => {
    mockAuth({ signedIn: false });

    const res = await PATCH(req("PATCH", { title: "New" }), ctx);

    expect(res.status).toBe(401);
  });

  it("returns 403 for a non-admin and changes nothing", async () => {
    forbidden();

    const res = await PATCH(req("PATCH", { title: "New" }), ctx);

    expect(res.status).toBe(403);
    expect(mocks.parseCourseUpdate).not.toHaveBeenCalled();
    expect(createAdminPb).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/course/:id", () => {
  beforeEach(() => {
    mocks.describeCourseDependents.mockResolvedValue(null);
  });

  it("returns 204 with no body", async () => {
    mocks.delete.mockResolvedValue(true);

    const res = await DELETE(req("DELETE"), ctx);

    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
    expect(mocks.describeCourseDependents).toHaveBeenCalledWith(ID);
    expect(mocks.delete).toHaveBeenCalledWith(ID);
  });

  it("returns 409 while prospectus items or other courses reference it", async () => {
    const reason =
      "This course is still used by 3 prospectus items. Remove those references first.";
    mocks.describeCourseDependents.mockResolvedValue(reason);

    const res = await DELETE(req("DELETE"), ctx);

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: reason });
    expect(mocks.delete).not.toHaveBeenCalled();
  });

  it("propagates a 404 from PocketBase", async () => {
    mocks.delete.mockRejectedValue({ status: 404 });

    const res = await DELETE(req("DELETE"), ctx);

    expect(res.status).toBe(404);
  });

  it("returns 401 when not signed in", async () => {
    mockAuth({ signedIn: false });

    const res = await DELETE(req("DELETE"), ctx);

    expect(res.status).toBe(401);
  });

  it("returns 403 for a non-admin and deletes nothing", async () => {
    forbidden();

    const res = await DELETE(req("DELETE"), ctx);

    expect(res.status).toBe(403);
    expect(mocks.describeCourseDependents).not.toHaveBeenCalled();
    expect(createAdminPb).not.toHaveBeenCalled();
  });
});
