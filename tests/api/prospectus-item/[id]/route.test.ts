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
  parseProspectusItemUpdate: vi.fn(),
  toProspectusItemResponse: vi.fn((record: Record<string, unknown>) => ({
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

vi.mock("@/lib/validators/prospectus-item", () => ({
  parseProspectusItemUpdate: mocks.parseProspectusItemUpdate,
}));

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

import { DELETE, GET, PATCH } from "@/app/api/prospectus-item/[id]/route";
import { createAdminPb } from "@/lib/pocketbase";
import { canMock, mockAuth, requireUserMock } from "@/tests/helpers/mock-auth";

const ID = "item1item1item1";
const PROSPECTUS_ID = "prosaprosaprosa";
const COURSE_ID = "coursecoursecou";
const EXPAND = "course,prospectus.program,prospectus.school_year";
const ctx = { params: Promise.resolve({ id: ID }) };

function req(method: string, body?: unknown) {
  return new NextRequest(`http://localhost/api/prospectus-item/${ID}`, {
    method,
    ...(body !== undefined && {
      headers: { "Content-Type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  });
}

/** Signed in as a dean: prospectus item writes are admin-only. */
function forbidden() {
  mockAuth({ roles: { deanOfColleges: ["colgacolgacolga"] } });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ isAdmin: true });
});

describe("GET /api/prospectus-item/:id", () => {
  const unpublished = {
    id: ID,
    expand: { prospectus: { published: false } },
  };

  it("returns the mapped item to a manager", async () => {
    mocks.getOne.mockResolvedValue(unpublished);

    const res = await GET(req("GET"), ctx);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ...unpublished, mapped: true });
    expect(mocks.getOne).toHaveBeenCalledWith(ID, { expand: EXPAND });
  });

  it("hides items of unpublished prospectuses from non-admins", async () => {
    forbidden();
    mocks.getOne.mockResolvedValue(unpublished);

    const res = await GET(req("GET"), ctx);

    expect(res.status).toBe(404);
    expect(canMock).toHaveBeenCalledWith(
      expect.anything(),
      "prospectusItem.write",
    );
  });

  it("lets a non-admin read an item of a published prospectus", async () => {
    forbidden();
    mocks.getOne.mockResolvedValue({
      id: ID,
      expand: { prospectus: { published: true } },
    });

    const res = await GET(req("GET"), ctx);

    expect(res.status).toBe(200);
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
    expect(mocks.getOne).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/prospectus-item/:id", () => {
  it("updates the year level without a duplicate check", async () => {
    mocks.parseProspectusItemUpdate.mockReturnValue({
      ok: true,
      data: { year_level: "Second Year" },
    });
    mocks.update.mockResolvedValue({ id: ID, year_level: "Second Year" });

    const res = await PATCH(req("PATCH", { year_level: "Second Year" }), ctx);

    expect(res.status).toBe(200);
    expect(requireUserMock).toHaveBeenCalledWith("prospectusItem.write");
    expect(mocks.getList).not.toHaveBeenCalled();
    expect(mocks.update).toHaveBeenCalledWith(
      ID,
      { year_level: "Second Year" },
      { expand: EXPAND },
    );
  });

  it("checks for the new course elsewhere in the same prospectus", async () => {
    mocks.parseProspectusItemUpdate.mockReturnValue({
      ok: true,
      data: { course: COURSE_ID },
    });
    mocks.getOne.mockResolvedValue({ id: ID, prospectus: PROSPECTUS_ID });
    mocks.getList.mockResolvedValue({ items: [] });
    mocks.update.mockResolvedValue({ id: ID });

    const res = await PATCH(req("PATCH", { course: COURSE_ID }), ctx);

    expect(res.status).toBe(200);
    expect(mocks.filter).toHaveBeenCalledWith(
      "prospectus = {:prospectus} && course = {:course} && id != {:id}",
      { prospectus: PROSPECTUS_ID, course: COURSE_ID, id: ID },
    );
  });

  it("returns 409 when the new course is already listed", async () => {
    mocks.parseProspectusItemUpdate.mockReturnValue({
      ok: true,
      data: { course: COURSE_ID },
    });
    mocks.getOne.mockResolvedValue({ id: ID, prospectus: PROSPECTUS_ID });
    mocks.getList.mockResolvedValue({ items: [{ id: "other" }] });

    const res = await PATCH(req("PATCH", { course: COURSE_ID }), ctx);

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      error: "That course is already listed in this prospectus",
    });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("returns 400 on validation failure", async () => {
    mocks.parseProspectusItemUpdate.mockReturnValue({
      ok: false,
      error: "Provide at least one of `course`, `semester`, `year_level`",
    });

    const res = await PATCH(req("PATCH", {}), ctx);

    expect(res.status).toBe(400);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("passes null to the validator when the body is not valid JSON", async () => {
    mocks.parseProspectusItemUpdate.mockReturnValue({
      ok: false,
      error: "invalid",
    });

    await PATCH(req("PATCH", "{not json"), ctx);

    expect(mocks.parseProspectusItemUpdate).toHaveBeenCalledWith(null);
  });

  it("propagates a 404 from PocketBase", async () => {
    mocks.parseProspectusItemUpdate.mockReturnValue({
      ok: true,
      data: { course: COURSE_ID },
    });
    mocks.getOne.mockRejectedValue({ status: 404 });

    const res = await PATCH(req("PATCH", { course: COURSE_ID }), ctx);

    expect(res.status).toBe(404);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("returns 401 when not signed in", async () => {
    mockAuth({ signedIn: false });

    const res = await PATCH(req("PATCH", {}), ctx);

    expect(res.status).toBe(401);
  });

  it("returns 403 for a non-admin and changes nothing", async () => {
    forbidden();

    const res = await PATCH(req("PATCH", { course: COURSE_ID }), ctx);

    expect(res.status).toBe(403);
    expect(mocks.parseProspectusItemUpdate).not.toHaveBeenCalled();
    expect(createAdminPb).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/prospectus-item/:id", () => {
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
    mockAuth({ roles: { isVpaa: true } });

    const res = await DELETE(req("DELETE"), ctx);

    expect(res.status).toBe(403);
    expect(createAdminPb).not.toHaveBeenCalled();
  });
});
