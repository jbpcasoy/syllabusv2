import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  update: vi.fn(),
  delete: vi.fn(),
  parseFacultyUpdate: vi.fn(),
  toFacultyResponse: vi.fn((record: Record<string, unknown>) => ({
    ...record,
    mapped: true,
  })),
}));

vi.mock("@/lib/pocketbase", async () => {
  const { NextResponse } = await import("next/server");
  const collection = () => ({
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

vi.mock("@/lib/validators/faculty", () => ({
  parseFacultyUpdate: mocks.parseFacultyUpdate,
}));

vi.mock("@/lib/faculty", () => ({
  toFacultyResponse: mocks.toFacultyResponse,
}));

vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);

import { DELETE, PATCH } from "@/app/api/faculty/[id]/route";
import { createAdminPb } from "@/lib/pocketbase";
import { mockAuth, requireUserMock } from "@/tests/helpers/mock-auth";

const ID = "abc123abc123abc";
const ctx = { params: Promise.resolve({ id: ID }) };

function req(method: string, body?: unknown) {
  return new NextRequest(`http://localhost/api/faculty/${ID}`, {
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
});

describe("PATCH /api/faculty/:id", () => {
  it("updates the active flag and returns the mapped record", async () => {
    const updated = { id: ID, active: false };
    mocks.parseFacultyUpdate.mockReturnValue({
      ok: true,
      data: { active: false },
    });
    mocks.update.mockResolvedValue(updated);

    const res = await PATCH(req("PATCH", { active: false }), ctx);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ...updated, mapped: true });
    expect(requireUserMock).toHaveBeenCalledWith("faculty.write", { faculty: ID });
    expect(createAdminPb).toHaveBeenCalledOnce();
    expect(mocks.update).toHaveBeenCalledWith(
      ID,
      { active: false },
      { expand: "user,program" },
    );
    expect(mocks.toFacultyResponse).toHaveBeenCalledWith(updated);
  });

  it("returns 400 on validation failure without updating", async () => {
    mocks.parseFacultyUpdate.mockReturnValue({
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
    mocks.parseFacultyUpdate.mockReturnValue({ ok: false, error: "invalid" });

    const res = await PATCH(req("PATCH", "{oops"), ctx);

    expect(mocks.parseFacultyUpdate).toHaveBeenCalledWith(null);
    expect(res.status).toBe(400);
  });

  it("propagates a 404 from PocketBase", async () => {
    mocks.parseFacultyUpdate.mockReturnValue({
      ok: true,
      data: { active: true },
    });
    mocks.update.mockRejectedValue({ status: 404 });

    const res = await PATCH(req("PATCH", { active: true }), ctx);

    expect(res.status).toBe(404);
  });

  it("returns 401 when not signed in", async () => {
    unauthorized();

    const res = await PATCH(req("PATCH", { active: true }), ctx);

    expect(res.status).toBe(401);
    expect(mocks.parseFacultyUpdate).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("returns 403 when the caller lacks permission and never touches PocketBase", async () => {
    forbidden();

    const res = await PATCH(req("PATCH", { active: true }), ctx);

    expect(res.status).toBe(403);
    expect(mocks.parseFacultyUpdate).not.toHaveBeenCalled();
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/faculty/:id", () => {
  it("deletes and returns 204 with no body", async () => {
    mocks.delete.mockResolvedValue(true);

    const res = await DELETE(req("DELETE"), ctx);

    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
    expect(requireUserMock).toHaveBeenCalledWith("faculty.write", { faculty: ID });
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

describe("scope (faculty.write on the membership's program)", () => {
  const chain = {
    programId: "progaprogaproga",
    departmentId: "deptadeptadepta",
    collegeId: "colgacolgacolga",
  };

  beforeEach(() => {
    mocks.parseFacultyUpdate.mockReturnValue({
      ok: true,
      data: { active: false },
    });
    mocks.update.mockResolvedValue({ id: ID });
    mocks.delete.mockResolvedValue(true);
  });

  it("lets the chair of the program update and delete", async () => {
    mockAuth({ roles: { chairOfPrograms: [chain.programId] }, scope: chain });

    expect((await PATCH(req("PATCH", { active: false }), ctx)).status).toBe(
      200,
    );
    expect((await DELETE(req("DELETE"), ctx)).status).toBe(204);
  });

  it("returns 403 for the chair of another program and changes nothing", async () => {
    mockAuth({ roles: { chairOfPrograms: ["otherprogramoth"] }, scope: chain });

    expect((await PATCH(req("PATCH", { active: false }), ctx)).status).toBe(
      403,
    );
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("returns 403 for the dean and department head above the program", async () => {
    for (const roles of [
      { deanOfColleges: [chain.collegeId] },
      { headOfDepartments: [chain.departmentId] },
    ]) {
      mockAuth({ roles, scope: chain });
      expect((await DELETE(req("DELETE"), ctx)).status).toBe(403);
    }
    expect(mocks.delete).not.toHaveBeenCalled();
  });
});
