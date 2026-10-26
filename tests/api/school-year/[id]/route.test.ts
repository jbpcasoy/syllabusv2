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
  parseSchoolYearInput: vi.fn(),
  describeSchoolYearDependents: vi.fn(),
  toSchoolYearResponse: vi.fn((record: Record<string, unknown>) => ({
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

vi.mock("@/lib/validators/school-year", () => ({
  parseSchoolYearInput: mocks.parseSchoolYearInput,
}));

vi.mock("@/lib/school-year", () => ({
  describeSchoolYearDependents: mocks.describeSchoolYearDependents,
  toSchoolYearResponse: mocks.toSchoolYearResponse,
}));

vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);

import { DELETE, GET, PATCH } from "@/app/api/school-year/[id]/route";
import { createAdminPb } from "@/lib/pocketbase";
import { mockAuth, requireUserMock } from "@/tests/helpers/mock-auth";

const ID = "sy2026sy2026sy2";
const ctx = { params: Promise.resolve({ id: ID }) };

function req(method: string, body?: unknown) {
  return new NextRequest(`http://localhost/api/school-year/${ID}`, {
    method,
    ...(body !== undefined && {
      headers: { "Content-Type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
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

describe("GET /api/school-year/:id", () => {
  it("returns the mapped record to any signed-in user", async () => {
    forbidden();
    mocks.getOne.mockResolvedValue({ id: ID, label: "2026-2027" });

    const res = await GET(req("GET"), ctx);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      id: ID,
      label: "2026-2027",
      mapped: true,
    });
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
    expect(createAdminPb).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/school-year/:id", () => {
  const data = { label: "2027-2028" };

  beforeEach(() => {
    mocks.parseSchoolYearInput.mockReturnValue({ ok: true, data });
    mocks.getList.mockResolvedValue({ items: [] });
  });

  it("updates the label after checking for another record with it", async () => {
    mocks.update.mockResolvedValue({ id: ID, ...data });

    const res = await PATCH(req("PATCH", data), ctx);

    expect(res.status).toBe(200);
    expect(requireUserMock).toHaveBeenCalledWith("schoolYear.write");
    expect(mocks.filter).toHaveBeenCalledWith(
      "label = {:label} && id != {:id}",
      { label: "2027-2028", id: ID },
    );
    expect(mocks.update).toHaveBeenCalledWith(ID, data);
  });

  it("returns 409 when another school year has the label", async () => {
    mocks.getList.mockResolvedValue({ items: [{ id: "other" }] });

    const res = await PATCH(req("PATCH", data), ctx);

    expect(res.status).toBe(409);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("returns 400 on validation failure", async () => {
    mocks.parseSchoolYearInput.mockReturnValue({ ok: false, error: "bad" });

    const res = await PATCH(req("PATCH", {}), ctx);

    expect(res.status).toBe(400);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("passes null to the validator when the body is not valid JSON", async () => {
    mocks.parseSchoolYearInput.mockReturnValue({ ok: false, error: "bad" });

    await PATCH(req("PATCH", "{not json"), ctx);

    expect(mocks.parseSchoolYearInput).toHaveBeenCalledWith(null);
  });

  it("propagates a 404 from update", async () => {
    mocks.update.mockRejectedValue({ status: 404 });

    const res = await PATCH(req("PATCH", data), ctx);

    expect(res.status).toBe(404);
  });

  it("returns 401 when not signed in", async () => {
    mockAuth({ signedIn: false });

    const res = await PATCH(req("PATCH", data), ctx);

    expect(res.status).toBe(401);
  });

  it("returns 403 for a non-admin and changes nothing", async () => {
    forbidden();

    const res = await PATCH(req("PATCH", data), ctx);

    expect(res.status).toBe(403);
    expect(mocks.parseSchoolYearInput).not.toHaveBeenCalled();
    expect(createAdminPb).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/school-year/:id", () => {
  beforeEach(() => {
    mocks.describeSchoolYearDependents.mockResolvedValue(null);
  });

  it("returns 204 with no body", async () => {
    mocks.delete.mockResolvedValue(true);

    const res = await DELETE(req("DELETE"), ctx);

    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
    expect(mocks.describeSchoolYearDependents).toHaveBeenCalledWith(ID);
    expect(mocks.delete).toHaveBeenCalledWith(ID);
  });

  it("returns 409 while terms or prospectuses use it", async () => {
    mocks.describeSchoolYearDependents.mockResolvedValue(
      "This school year still has 2 terms. Delete them first.",
    );

    const res = await DELETE(req("DELETE"), ctx);

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      error: "This school year still has 2 terms. Delete them first.",
    });
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
    expect(mocks.describeSchoolYearDependents).not.toHaveBeenCalled();
    expect(createAdminPb).not.toHaveBeenCalled();
  });
});
