import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getOne: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  parseDepartmentHeadUpdate: vi.fn(),
  departmentHasActiveHead: vi.fn(),
  toDepartmentHeadResponse: vi.fn((record: Record<string, unknown>) => ({
    ...record,
    mapped: true,
  })),
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

vi.mock("@/lib/validators/department-head", () => ({
  parseDepartmentHeadUpdate: mocks.parseDepartmentHeadUpdate,
}));

vi.mock("@/lib/department-head", () => ({
  departmentHasActiveHead: mocks.departmentHasActiveHead,
  toDepartmentHeadResponse: mocks.toDepartmentHeadResponse,
}));

vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);

import { DELETE, PATCH } from "@/app/api/department-head/[id]/route";
import { createAdminPb } from "@/lib/pocketbase";
import { mockAuth, requireUserMock } from "@/tests/helpers/mock-auth";

const ID = "abc123abc123abc";
const DEPARTMENT_ID = "dept1dept1dept1";
const ctx = { params: Promise.resolve({ id: ID }) };

function req(method: string, body?: unknown) {
  return new NextRequest(`http://localhost/api/department-head/${ID}`, {
    method,
    ...(body !== undefined && {
      headers: { "Content-Type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  });
}

function unauthorized() {
  mockAuth({ signedIn: false });
}

/** Signed in, but with no roles. */
function forbidden() {
  mockAuth();
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ isAdmin: true });
  mocks.departmentHasActiveHead.mockResolvedValue(false);
});

describe("PATCH /api/department-head/:id", () => {
  it("deactivates without checking for another active head", async () => {
    const updated = { id: ID, active: false };
    mocks.parseDepartmentHeadUpdate.mockReturnValue({
      ok: true,
      data: { active: false },
    });
    mocks.update.mockResolvedValue(updated);

    const res = await PATCH(req("PATCH", { active: false }), ctx);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ...updated, mapped: true });
    expect(requireUserMock).toHaveBeenCalledWith("departmentHead.write", { departmentHead: ID });
    expect(mocks.getOne).not.toHaveBeenCalled();
    expect(mocks.departmentHasActiveHead).not.toHaveBeenCalled();
    expect(mocks.update).toHaveBeenCalledWith(
      ID,
      { active: false },
      { expand: "user,department" },
    );
  });

  it("activates when the department has no other active head", async () => {
    const updated = { id: ID, active: true };
    mocks.parseDepartmentHeadUpdate.mockReturnValue({
      ok: true,
      data: { active: true },
    });
    mocks.getOne.mockResolvedValue({ id: ID, department: DEPARTMENT_ID });
    mocks.update.mockResolvedValue(updated);

    const res = await PATCH(req("PATCH", { active: true }), ctx);

    expect(res.status).toBe(200);
    expect(mocks.getOne).toHaveBeenCalledWith(ID);
    // The record itself is excluded from the "other active head" check.
    expect(mocks.departmentHasActiveHead).toHaveBeenCalledWith(
      DEPARTMENT_ID,
      ID,
    );
    expect(mocks.update).toHaveBeenCalledWith(
      ID,
      { active: true },
      { expand: "user,department" },
    );
  });

  it("returns 409 when activating would create a second active head", async () => {
    mocks.parseDepartmentHeadUpdate.mockReturnValue({
      ok: true,
      data: { active: true },
    });
    mocks.getOne.mockResolvedValue({ id: ID, department: DEPARTMENT_ID });
    mocks.departmentHasActiveHead.mockResolvedValue(true);

    const res = await PATCH(req("PATCH", { active: true }), ctx);

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      error:
        "That department already has an active head. Deactivate them first.",
    });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("returns 400 on validation failure without touching PocketBase", async () => {
    mocks.parseDepartmentHeadUpdate.mockReturnValue({
      ok: false,
      error: "`active` must be a boolean",
    });

    const res = await PATCH(req("PATCH", { active: "yes" }), ctx);

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "`active` must be a boolean" });
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("treats malformed JSON as a null body", async () => {
    mocks.parseDepartmentHeadUpdate.mockReturnValue({
      ok: false,
      error: "invalid",
    });

    const res = await PATCH(req("PATCH", "{oops"), ctx);

    expect(mocks.parseDepartmentHeadUpdate).toHaveBeenCalledWith(null);
    expect(res.status).toBe(400);
  });

  it("propagates a 404 when activating a record that does not exist", async () => {
    mocks.parseDepartmentHeadUpdate.mockReturnValue({
      ok: true,
      data: { active: true },
    });
    mocks.getOne.mockRejectedValue({ status: 404 });

    const res = await PATCH(req("PATCH", { active: true }), ctx);

    expect(res.status).toBe(404);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("propagates a 404 from update", async () => {
    mocks.parseDepartmentHeadUpdate.mockReturnValue({
      ok: true,
      data: { active: false },
    });
    mocks.update.mockRejectedValue({ status: 404 });

    const res = await PATCH(req("PATCH", { active: false }), ctx);

    expect(res.status).toBe(404);
  });

  it("returns 401 when not signed in", async () => {
    unauthorized();

    const res = await PATCH(req("PATCH", { active: false }), ctx);

    expect(res.status).toBe(401);
    expect(mocks.parseDepartmentHeadUpdate).not.toHaveBeenCalled();
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("returns 403 when the caller lacks permission and never touches PocketBase", async () => {
    forbidden();

    const res = await PATCH(req("PATCH", { active: false }), ctx);

    expect(res.status).toBe(403);
    expect(mocks.parseDepartmentHeadUpdate).not.toHaveBeenCalled();
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/department-head/:id", () => {
  it("deletes and returns 204 with no body", async () => {
    mocks.delete.mockResolvedValue(true);

    const res = await DELETE(req("DELETE"), ctx);

    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
    expect(requireUserMock).toHaveBeenCalledWith("departmentHead.write", { departmentHead: ID });
    expect(createAdminPb).toHaveBeenCalledOnce();
    expect(mocks.delete).toHaveBeenCalledWith(ID);
  });

  it("propagates a 404 from PocketBase", async () => {
    mocks.delete.mockRejectedValue({ status: 404 });

    const res = await DELETE(req("DELETE"), ctx);

    expect(res.status).toBe(404);
  });

  it("returns 401 when not signed in", async () => {
    unauthorized();

    const res = await DELETE(req("DELETE"), ctx);

    expect(res.status).toBe(401);
    expect(mocks.delete).not.toHaveBeenCalled();
  });

  it("returns 403 when the caller lacks permission and never touches PocketBase", async () => {
    forbidden();

    const res = await DELETE(req("DELETE"), ctx);

    expect(res.status).toBe(403);
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.delete).not.toHaveBeenCalled();
  });
});

describe("scope (departmentHead.write on the record's department)", () => {
  const chain = { departmentId: DEPARTMENT_ID, collegeId: "colgacolgacolga" };

  beforeEach(() => {
    mocks.parseDepartmentHeadUpdate.mockReturnValue({
      ok: true,
      data: { active: false },
    });
    mocks.update.mockResolvedValue({ id: ID });
    mocks.delete.mockResolvedValue(true);
  });

  it("passes the record id as the scope target", async () => {
    await DELETE(req("DELETE"), ctx);
    expect(requireUserMock).toHaveBeenCalledWith("departmentHead.write", {
      departmentHead: ID,
    });
  });

  it("lets the dean of the department's college update and delete", async () => {
    mockAuth({ roles: { deanOfColleges: [chain.collegeId] }, scope: chain });

    expect((await PATCH(req("PATCH", { active: false }), ctx)).status).toBe(
      200,
    );
    expect((await DELETE(req("DELETE"), ctx)).status).toBe(204);
  });

  it("returns 403 for a dean of another college and changes nothing", async () => {
    mockAuth({ roles: { deanOfColleges: ["othercollegeoth"] }, scope: chain });

    expect((await DELETE(req("DELETE"), ctx)).status).toBe(403);
    expect(mocks.delete).not.toHaveBeenCalled();
  });

  it("returns 403 for the department's own head", async () => {
    mockAuth({ roles: { headOfDepartments: [DEPARTMENT_ID] }, scope: chain });

    expect((await PATCH(req("PATCH", { active: false }), ctx)).status).toBe(
      403,
    );
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
