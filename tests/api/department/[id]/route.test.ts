import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getOne: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  parseDepartmentInput: vi.fn(),
  describeChildren: vi.fn(),
}));

vi.mock("@/lib/pocketbase", async () => {
  const { NextResponse } = await import("next/server");
  const collection = () => ({
    getOne: mocks.getOne,
    update: mocks.update,
    delete: mocks.delete,
  });
  return {
    createAdminPb: vi.fn(async () => ({ collection })),
    handlePbError: vi.fn((error: unknown) => {
      const status =
        typeof error === "object" && error && "status" in error
          ? Number((error as { status: unknown }).status)
          : 500;
      return NextResponse.json({ error: "pb error" }, { status });
    }),
  };
});

vi.mock("@/lib/validators/department", () => ({
  parseDepartmentInput: mocks.parseDepartmentInput,
}));

vi.mock("@/lib/org-children", () => ({
  describeChildren: mocks.describeChildren,
}));

vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);
vi.mock("@/lib/roles", async () =>
  (await import("@/tests/helpers/mock-auth")).rolesModuleMock(),
);

import { DELETE, GET, PATCH } from "@/app/api/department/[id]/route";
import { createAdminPb } from "@/lib/pocketbase";
import {
  authorizeMock,
  mockAuth,
  requireUserMock,
} from "@/tests/helpers/mock-auth";

const ID = "deptAdeptAdeptA";
const COLLEGE_A = "colgAcolgAcolgA";
const COLLEGE_B = "colgBcolgBcolgB";
const ctx = { params: Promise.resolve({ id: ID }) };

function req(method: string, body?: unknown) {
  return new NextRequest(`http://localhost/api/department/${ID}`, {
    method,
    ...(body !== undefined && {
      headers: { "Content-Type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ isAdmin: true });
  mocks.describeChildren.mockResolvedValue(null);
});

describe("GET /api/department/:id", () => {
  const department = { id: ID, name: "Computer Science", college: COLLEGE_A };

  it("returns the department with college expanded", async () => {
    mocks.getOne.mockResolvedValue(department);

    const res = await GET(req("GET"), ctx);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(department);
    expect(requireUserMock).toHaveBeenCalledWith();
    expect(mocks.getOne).toHaveBeenCalledWith(ID, { expand: "college" });
  });

  it("lets a dean read a department of their college", async () => {
    mockAuth({ roles: { deanOfColleges: [COLLEGE_A] } });
    mocks.getOne.mockResolvedValue(department);

    expect((await GET(req("GET"), ctx)).status).toBe(200);
  });

  it("returns 404 for a dean outside their college", async () => {
    mockAuth({ roles: { deanOfColleges: [COLLEGE_B] } });
    mocks.getOne.mockResolvedValue(department);

    expect((await GET(req("GET"), ctx)).status).toBe(404);
  });

  it("returns 401 when not signed in", async () => {
    mockAuth({ signedIn: false });

    expect((await GET(req("GET"), ctx)).status).toBe(401);
    expect(mocks.getOne).not.toHaveBeenCalled();
  });

  it("propagates a 404 from PocketBase", async () => {
    mocks.getOne.mockRejectedValue({ status: 404 });
    expect((await GET(req("GET"), ctx)).status).toBe(404);
  });
});

describe("PATCH /api/department/:id", () => {
  it("updates using partial validation", async () => {
    const updated = { id: ID, name: "Renamed" };
    mocks.parseDepartmentInput.mockReturnValue({
      ok: true,
      data: { name: "Renamed" },
    });
    mocks.update.mockResolvedValue(updated);

    const res = await PATCH(req("PATCH", { name: "Renamed" }), ctx);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(updated);
    expect(requireUserMock).toHaveBeenCalledWith("department.update", {
      department: ID,
    });
    expect(mocks.parseDepartmentInput).toHaveBeenCalledWith(
      { name: "Renamed" },
      { partial: true },
    );
    expect(mocks.getOne).not.toHaveBeenCalled();
    expect(authorizeMock).not.toHaveBeenCalled();
    expect(mocks.update).toHaveBeenCalledWith(
      ID,
      { name: "Renamed" },
      { expand: "college" },
    );
  });

  it("needs no extra check when the college is unchanged", async () => {
    mocks.parseDepartmentInput.mockReturnValue({
      ok: true,
      data: { name: "X", college: COLLEGE_A },
    });
    mocks.getOne.mockResolvedValue({ id: ID, college: COLLEGE_A });
    mocks.update.mockResolvedValue({ id: ID });

    const res = await PATCH(req("PATCH", {}), ctx);

    expect(res.status).toBe(200);
    expect(authorizeMock).not.toHaveBeenCalled();
  });

  it("requires department.create on the new college when moving", async () => {
    mocks.parseDepartmentInput.mockReturnValue({
      ok: true,
      data: { college: COLLEGE_B },
    });
    mocks.getOne.mockResolvedValue({ id: ID, college: COLLEGE_A });
    mocks.update.mockResolvedValue({ id: ID });

    const res = await PATCH(req("PATCH", {}), ctx);

    expect(res.status).toBe(200);
    expect(authorizeMock).toHaveBeenCalledWith(
      expect.anything(),
      "department.create",
      { college: COLLEGE_B },
    );
  });

  it("returns 403 and updates nothing when the move is not allowed", async () => {
    mocks.parseDepartmentInput.mockReturnValue({
      ok: true,
      data: { college: COLLEGE_B },
    });
    mocks.getOne.mockResolvedValue({ id: ID, college: COLLEGE_A });
    authorizeMock.mockResolvedValueOnce(
      NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    );

    const res = await PATCH(req("PATCH", {}), ctx);

    expect(res.status).toBe(403);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("lets a department head rename but not move their department", async () => {
    mockAuth({
      roles: { headOfDepartments: [ID] },
      scope: { collegeId: COLLEGE_A, departmentId: ID },
    });
    mocks.getOne.mockResolvedValue({ id: ID, college: COLLEGE_A });
    mocks.update.mockResolvedValue({ id: ID });

    mocks.parseDepartmentInput.mockReturnValue({
      ok: true,
      data: { name: "Renamed", college: COLLEGE_A },
    });
    expect((await PATCH(req("PATCH", {}), ctx)).status).toBe(200);

    mocks.parseDepartmentInput.mockReturnValue({
      ok: true,
      data: { college: COLLEGE_B },
    });
    expect((await PATCH(req("PATCH", {}), ctx)).status).toBe(403);
  });

  it("returns 400 on validation failure without updating", async () => {
    mocks.parseDepartmentInput.mockReturnValue({ ok: false, error: "bad" });

    const res = await PATCH(req("PATCH", { name: 123 }), ctx);

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "bad" });
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("treats malformed JSON as a null body", async () => {
    mocks.parseDepartmentInput.mockReturnValue({ ok: false, error: "invalid" });

    const res = await PATCH(req("PATCH", "{oops"), ctx);

    expect(mocks.parseDepartmentInput).toHaveBeenCalledWith(null, {
      partial: true,
    });
    expect(res.status).toBe(400);
  });

  it("propagates a 404 from PocketBase", async () => {
    mocks.parseDepartmentInput.mockReturnValue({
      ok: true,
      data: { name: "X" },
    });
    mocks.update.mockRejectedValue({ status: 404 });

    expect((await PATCH(req("PATCH", { name: "X" }), ctx)).status).toBe(404);
  });

  it("returns 401 when not signed in", async () => {
    mockAuth({ signedIn: false });

    const res = await PATCH(req("PATCH", { name: "X" }), ctx);

    expect(res.status).toBe(401);
    expect(mocks.parseDepartmentInput).not.toHaveBeenCalled();
  });

  it("returns 403 outside the caller's scope and never touches PocketBase", async () => {
    mockAuth({ roles: { deanOfColleges: [COLLEGE_B] } });

    const res = await PATCH(req("PATCH", { name: "X" }), ctx);

    expect(res.status).toBe(403);
    expect(mocks.parseDepartmentInput).not.toHaveBeenCalled();
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/department/:id", () => {
  it("deletes and returns 204 with no body", async () => {
    mocks.delete.mockResolvedValue(true);

    const res = await DELETE(req("DELETE"), ctx);

    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
    expect(requireUserMock).toHaveBeenCalledWith("department.delete", {
      department: ID,
    });
    expect(mocks.describeChildren).toHaveBeenCalledWith("department", ID);
    expect(mocks.delete).toHaveBeenCalledWith(ID);
  });

  it("returns 409 with the reason and deletes nothing when children exist", async () => {
    mocks.describeChildren.mockResolvedValue(
      "This department still has 2 programs. Remove or reassign them first.",
    );

    const res = await DELETE(req("DELETE"), ctx);

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      error:
        "This department still has 2 programs. Remove or reassign them first.",
    });
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.delete).not.toHaveBeenCalled();
  });

  it("delegates a failing children check to handlePbError", async () => {
    mocks.describeChildren.mockRejectedValue({ status: 500 });

    const res = await DELETE(req("DELETE"), ctx);

    expect(res.status).toBe(500);
    expect(mocks.delete).not.toHaveBeenCalled();
  });

  it("propagates a 404 from PocketBase", async () => {
    mocks.delete.mockRejectedValue({ status: 404 });
    expect((await DELETE(req("DELETE"), ctx)).status).toBe(404);
  });

  it("returns 401 when not signed in", async () => {
    mockAuth({ signedIn: false });

    expect((await DELETE(req("DELETE"), ctx)).status).toBe(401);
    expect(mocks.delete).not.toHaveBeenCalled();
  });

  it("returns 403 for a department head (cannot delete) and touches nothing", async () => {
    mockAuth({
      roles: { headOfDepartments: [ID] },
      scope: { collegeId: COLLEGE_A, departmentId: ID },
    });

    const res = await DELETE(req("DELETE"), ctx);

    expect(res.status).toBe(403);
    expect(mocks.describeChildren).not.toHaveBeenCalled();
    expect(mocks.delete).not.toHaveBeenCalled();
  });

  it("lets a dean of that college delete", async () => {
    mockAuth({
      roles: { deanOfColleges: [COLLEGE_A] },
      scope: { collegeId: COLLEGE_A, departmentId: ID },
    });
    mocks.delete.mockResolvedValue(true);

    expect((await DELETE(req("DELETE"), ctx)).status).toBe(204);
  });
});
