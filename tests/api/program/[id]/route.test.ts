import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getOne: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  parseProgramInput: vi.fn(),
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

vi.mock("@/lib/validators/program", () => ({
  parseProgramInput: mocks.parseProgramInput,
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

import { DELETE, GET, PATCH } from "@/app/api/program/[id]/route";
import { createAdminPb } from "@/lib/pocketbase";
import {
  authorizeMock,
  mockAuth,
  requireUserMock,
} from "@/tests/helpers/mock-auth";

const ID = "progAprogAprogA";
const DEPT_A = "deptAdeptAdeptA";
const DEPT_B = "deptBdeptBdeptB";
const COLLEGE_A = "colgAcolgAcolgA";
const COLLEGE_B = "colgBcolgBcolgB";
const ctx = { params: Promise.resolve({ id: ID }) };

function req(method: string, body?: unknown) {
  return new NextRequest(`http://localhost/api/program/${ID}`, {
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

describe("GET /api/program/:id", () => {
  const program = {
    id: ID,
    name: "BS Computer Science",
    code: "BSCS",
    department: DEPT_A,
    expand: { department: { id: DEPT_A, college: COLLEGE_A } },
  };

  it("returns the program with department expanded", async () => {
    mocks.getOne.mockResolvedValue(program);

    const res = await GET(req("GET"), ctx);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(program);
    expect(requireUserMock).toHaveBeenCalledWith();
    expect(mocks.getOne).toHaveBeenCalledWith(ID, { expand: "department" });
  });

  it("lets a dean read a program of their college", async () => {
    mockAuth({ roles: { deanOfColleges: [COLLEGE_A] } });
    mocks.getOne.mockResolvedValue(program);

    expect((await GET(req("GET"), ctx)).status).toBe(200);
  });

  it("lets a department head read a program of their department", async () => {
    mockAuth({ roles: { headOfDepartments: [DEPT_A] } });
    mocks.getOne.mockResolvedValue(program);

    expect((await GET(req("GET"), ctx)).status).toBe(200);
  });

  it("returns 404 for a dean outside their college", async () => {
    mockAuth({ roles: { deanOfColleges: [COLLEGE_B] } });
    mocks.getOne.mockResolvedValue(program);

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

describe("PATCH /api/program/:id", () => {
  it("updates using partial validation", async () => {
    const updated = { id: ID, name: "Renamed", code: "BSCS" };
    mocks.parseProgramInput.mockReturnValue({
      ok: true,
      data: { name: "Renamed" },
    });
    mocks.update.mockResolvedValue(updated);

    const res = await PATCH(req("PATCH", { name: "Renamed" }), ctx);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(updated);
    expect(requireUserMock).toHaveBeenCalledWith("program.update", {
      program: ID,
    });
    expect(mocks.parseProgramInput).toHaveBeenCalledWith(
      { name: "Renamed" },
      { partial: true },
    );
    expect(mocks.getOne).not.toHaveBeenCalled();
    expect(authorizeMock).not.toHaveBeenCalled();
    expect(mocks.update).toHaveBeenCalledWith(
      ID,
      { name: "Renamed" },
      { expand: "department" },
    );
  });

  it("needs no extra check when the department is unchanged", async () => {
    mocks.parseProgramInput.mockReturnValue({
      ok: true,
      data: { name: "X", department: DEPT_A },
    });
    mocks.getOne.mockResolvedValue({ id: ID, department: DEPT_A });
    mocks.update.mockResolvedValue({ id: ID });

    expect((await PATCH(req("PATCH", {}), ctx)).status).toBe(200);
    expect(authorizeMock).not.toHaveBeenCalled();
  });

  it("requires program.create on the new department when moving", async () => {
    mocks.parseProgramInput.mockReturnValue({
      ok: true,
      data: { department: DEPT_B },
    });
    mocks.getOne.mockResolvedValue({ id: ID, department: DEPT_A });
    mocks.update.mockResolvedValue({ id: ID });

    expect((await PATCH(req("PATCH", {}), ctx)).status).toBe(200);
    expect(authorizeMock).toHaveBeenCalledWith(
      expect.anything(),
      "program.create",
      { department: DEPT_B },
    );
  });

  it("returns 403 and updates nothing when the move is not allowed", async () => {
    mocks.parseProgramInput.mockReturnValue({
      ok: true,
      data: { department: DEPT_B },
    });
    mocks.getOne.mockResolvedValue({ id: ID, department: DEPT_A });
    authorizeMock.mockResolvedValueOnce(
      NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    );

    const res = await PATCH(req("PATCH", {}), ctx);

    expect(res.status).toBe(403);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("lets a department head edit but not move a program", async () => {
    mockAuth({
      roles: { headOfDepartments: [DEPT_A] },
      scope: { programId: ID, departmentId: DEPT_A, collegeId: COLLEGE_A },
    });
    mocks.getOne.mockResolvedValue({ id: ID, department: DEPT_A });
    mocks.update.mockResolvedValue({ id: ID });

    mocks.parseProgramInput.mockReturnValue({
      ok: true,
      data: { name: "Renamed", department: DEPT_A },
    });
    expect((await PATCH(req("PATCH", {}), ctx)).status).toBe(200);

    mocks.parseProgramInput.mockReturnValue({
      ok: true,
      data: { department: DEPT_B },
    });
    expect((await PATCH(req("PATCH", {}), ctx)).status).toBe(403);
  });

  it("returns 400 on validation failure without updating", async () => {
    mocks.parseProgramInput.mockReturnValue({ ok: false, error: "bad" });

    const res = await PATCH(req("PATCH", { name: 123 }), ctx);

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "bad" });
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("treats malformed JSON as a null body", async () => {
    mocks.parseProgramInput.mockReturnValue({ ok: false, error: "invalid" });

    const res = await PATCH(req("PATCH", "{oops"), ctx);

    expect(mocks.parseProgramInput).toHaveBeenCalledWith(null, {
      partial: true,
    });
    expect(res.status).toBe(400);
  });

  it("propagates a 404 from PocketBase", async () => {
    mocks.parseProgramInput.mockReturnValue({ ok: true, data: { name: "X" } });
    mocks.update.mockRejectedValue({ status: 404 });

    expect((await PATCH(req("PATCH", { name: "X" }), ctx)).status).toBe(404);
  });

  it("returns 401 when not signed in", async () => {
    mockAuth({ signedIn: false });

    const res = await PATCH(req("PATCH", { name: "X" }), ctx);

    expect(res.status).toBe(401);
    expect(mocks.parseProgramInput).not.toHaveBeenCalled();
  });

  it("returns 403 outside the caller's scope and never touches PocketBase", async () => {
    mockAuth({ roles: { deanOfColleges: [COLLEGE_B] } });

    const res = await PATCH(req("PATCH", { name: "X" }), ctx);

    expect(res.status).toBe(403);
    expect(mocks.parseProgramInput).not.toHaveBeenCalled();
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/program/:id", () => {
  it("deletes and returns 204 with no body", async () => {
    mocks.delete.mockResolvedValue(true);

    const res = await DELETE(req("DELETE"), ctx);

    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
    expect(requireUserMock).toHaveBeenCalledWith("program.delete", {
      program: ID,
    });
    expect(mocks.describeChildren).toHaveBeenCalledWith("program", ID);
    expect(mocks.delete).toHaveBeenCalledWith(ID);
  });

  it("returns 409 with the reason and deletes nothing when children exist", async () => {
    mocks.describeChildren.mockResolvedValue(
      "This program still has 4 prospectuses. Remove or reassign them first.",
    );

    const res = await DELETE(req("DELETE"), ctx);

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      error:
        "This program still has 4 prospectuses. Remove or reassign them first.",
    });
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.delete).not.toHaveBeenCalled();
  });

  it("delegates a failing children check to handlePbError", async () => {
    mocks.describeChildren.mockRejectedValue({ status: 500 });

    expect((await DELETE(req("DELETE"), ctx)).status).toBe(500);
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
      roles: { headOfDepartments: [DEPT_A] },
      scope: { programId: ID, departmentId: DEPT_A, collegeId: COLLEGE_A },
    });

    const res = await DELETE(req("DELETE"), ctx);

    expect(res.status).toBe(403);
    expect(mocks.describeChildren).not.toHaveBeenCalled();
    expect(mocks.delete).not.toHaveBeenCalled();
  });
});
