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
  parseTermUpdate: vi.fn(),
  toTermRecord: vi.fn((data: Record<string, unknown>) => data),
  toTermResponse: vi.fn((record: Record<string, unknown>) => ({
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

vi.mock("@/lib/validators/term", () => ({
  parseTermUpdate: mocks.parseTermUpdate,
}));

vi.mock("@/lib/term", () => ({
  toTermRecord: mocks.toTermRecord,
  toTermResponse: mocks.toTermResponse,
}));

vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);

import { DELETE, GET, PATCH } from "@/app/api/term/[id]/route";
import { createAdminPb } from "@/lib/pocketbase";
import { mockAuth, requireUserMock } from "@/tests/helpers/mock-auth";

const ID = "termatermaterma";
const SCHOOL_YEAR_ID = "sy2026sy2026sy2";
const ctx = { params: Promise.resolve({ id: ID }) };

function req(method: string, body?: unknown) {
  return new NextRequest(`http://localhost/api/term/${ID}`, {
    method,
    ...(body !== undefined && {
      headers: { "Content-Type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  });
}

/** Signed in as a dean: term writes are admin-only. */
function forbidden() {
  mockAuth({ roles: { deanOfColleges: ["colgacolgacolga"] } });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ isAdmin: true });
});

describe("GET /api/term/:id", () => {
  it("returns the mapped record with the school year expanded", async () => {
    forbidden(); // any signed-in user may read
    mocks.getOne.mockResolvedValue({ id: ID });

    const res = await GET(req("GET"), ctx);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: ID, mapped: true });
    expect(mocks.getOne).toHaveBeenCalledWith(ID, { expand: "school_year" });
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

describe("PATCH /api/term/:id", () => {
  it("updates open without a duplicate check", async () => {
    mocks.parseTermUpdate.mockReturnValue({ ok: true, data: { open: true } });
    mocks.update.mockResolvedValue({ id: ID, open: true });

    const res = await PATCH(req("PATCH", { open: true }), ctx);

    expect(res.status).toBe(200);
    expect(requireUserMock).toHaveBeenCalledWith("term.write");
    expect(mocks.getOne).not.toHaveBeenCalled();
    expect(mocks.update).toHaveBeenCalledWith(
      ID,
      { open: true },
      { expand: "school_year" },
    );
  });

  it("checks for a duplicate (excluding itself) when the semester changes", async () => {
    mocks.parseTermUpdate.mockReturnValue({
      ok: true,
      data: { semester: "Summer" },
    });
    mocks.getOne.mockResolvedValue({
      id: ID,
      school_year: SCHOOL_YEAR_ID,
      semester: "First Semester",
    });
    mocks.getList.mockResolvedValue({ items: [] });
    mocks.update.mockResolvedValue({ id: ID });

    const res = await PATCH(req("PATCH", { semester: "Summer" }), ctx);

    expect(res.status).toBe(200);
    expect(mocks.filter).toHaveBeenCalledWith(
      "school_year = {:schoolYear} && semester = {:semester} && id != {:id}",
      { schoolYear: SCHOOL_YEAR_ID, semester: "Summer", id: ID },
    );
  });

  it("skips the duplicate check when the semester is unchanged", async () => {
    mocks.parseTermUpdate.mockReturnValue({
      ok: true,
      data: { semester: "Summer" },
    });
    mocks.getOne.mockResolvedValue({ id: ID, semester: "Summer" });
    mocks.update.mockResolvedValue({ id: ID });

    await PATCH(req("PATCH", { semester: "Summer" }), ctx);

    expect(mocks.getList).not.toHaveBeenCalled();
  });

  it("returns 409 when the school year already has the new semester", async () => {
    mocks.parseTermUpdate.mockReturnValue({
      ok: true,
      data: { semester: "Summer" },
    });
    mocks.getOne.mockResolvedValue({
      id: ID,
      school_year: SCHOOL_YEAR_ID,
      semester: "First Semester",
    });
    mocks.getList.mockResolvedValue({ items: [{ id: "other" }] });

    const res = await PATCH(req("PATCH", { semester: "Summer" }), ctx);

    expect(res.status).toBe(409);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("returns 400 on validation failure", async () => {
    mocks.parseTermUpdate.mockReturnValue({ ok: false, error: "bad" });

    const res = await PATCH(req("PATCH", {}), ctx);

    expect(res.status).toBe(400);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("passes null to the validator when the body is not valid JSON", async () => {
    mocks.parseTermUpdate.mockReturnValue({ ok: false, error: "bad" });

    await PATCH(req("PATCH", "{not json"), ctx);

    expect(mocks.parseTermUpdate).toHaveBeenCalledWith(null);
  });

  it("propagates a 404 from PocketBase", async () => {
    mocks.parseTermUpdate.mockReturnValue({ ok: true, data: { open: true } });
    mocks.update.mockRejectedValue({ status: 404 });

    const res = await PATCH(req("PATCH", { open: true }), ctx);

    expect(res.status).toBe(404);
  });

  it("returns 401 when not signed in", async () => {
    mockAuth({ signedIn: false });

    const res = await PATCH(req("PATCH", { open: true }), ctx);

    expect(res.status).toBe(401);
  });

  it("returns 403 for a non-admin and changes nothing", async () => {
    forbidden();

    const res = await PATCH(req("PATCH", { open: true }), ctx);

    expect(res.status).toBe(403);
    expect(mocks.parseTermUpdate).not.toHaveBeenCalled();
    expect(createAdminPb).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/term/:id", () => {
  it("returns 204 with no body", async () => {
    mocks.delete.mockResolvedValue(true);

    const res = await DELETE(req("DELETE"), ctx);

    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
    expect(mocks.delete).toHaveBeenCalledWith(ID);
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
    expect(createAdminPb).not.toHaveBeenCalled();
  });
});
