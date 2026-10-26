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
  parseProspectusUpdate: vi.fn(),
  toProspectusResponse: vi.fn((record: Record<string, unknown>) => ({
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

vi.mock("@/lib/validators/prospectus", () => ({
  parseProspectusUpdate: mocks.parseProspectusUpdate,
}));

vi.mock("@/lib/prospectus", () => ({
  PROSPECTUS_EXPAND: "program,school_year",
  toProspectusResponse: mocks.toProspectusResponse,
}));

vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);
vi.mock("@/lib/capabilities", async () =>
  (await import("@/tests/helpers/mock-auth")).capabilitiesModuleMock(),
);

import { DELETE, GET, PATCH } from "@/app/api/prospectus/[id]/route";
import { createAdminPb } from "@/lib/pocketbase";
import { mockAuth, requireUserMock } from "@/tests/helpers/mock-auth";

const ID = "abc123abc123abc";
const PROGRAM_ID = "prog1prog1prog1";
const ctx = { params: Promise.resolve({ id: ID }) };

function req(method: string, body?: unknown) {
  return new NextRequest(`http://localhost/api/prospectus/${ID}`, {
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

/** Signed in as a dean: prospectus writes are admin-only. */
function forbidden() {
  mockAuth({ roles: { deanOfColleges: ["colgacolgacolga"] } });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ isAdmin: true });
});

describe("GET /api/prospectus/:id", () => {
  it("returns the mapped record with program expanded", async () => {
    const record = { id: ID, published: false };
    mocks.getOne.mockResolvedValue(record);

    const res = await GET(req("GET"), ctx);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ...record, mapped: true });
    expect(requireUserMock).toHaveBeenCalledWith();
    expect(mocks.getOne).toHaveBeenCalledWith(ID, { expand: "program,school_year" });
  });

  it("hides an unpublished record from a non-manager", async () => {
    forbidden(); // not an admin
    mocks.getOne.mockResolvedValue({ id: ID, published: false });

    const res = await GET(req("GET"), ctx);

    expect(res.status).toBe(404);
  });

  it("lets a non-manager read a published record", async () => {
    forbidden(); // not an admin
    mocks.getOne.mockResolvedValue({ id: ID, published: true });

    const res = await GET(req("GET"), ctx);

    expect(res.status).toBe(200);
  });

  it("returns 401 when not signed in", async () => {
    unauthorized();

    const res = await GET(req("GET"), ctx);

    expect(res.status).toBe(401);
    expect(mocks.getOne).not.toHaveBeenCalled();
  });

  it("propagates a 404 from PocketBase", async () => {
    mocks.getOne.mockRejectedValue({ status: 404 });

    const res = await GET(req("GET"), ctx);

    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/prospectus/:id", () => {
  it("updates published without any duplicate check", async () => {
    const updated = { id: ID, published: true };
    mocks.parseProspectusUpdate.mockReturnValue({
      ok: true,
      data: { published: true },
    });
    mocks.update.mockResolvedValue(updated);

    const res = await PATCH(req("PATCH", { published: true }), ctx);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ...updated, mapped: true });
    expect(requireUserMock).toHaveBeenCalledWith("prospectus.write");
    expect(mocks.getOne).not.toHaveBeenCalled();
    expect(mocks.getList).not.toHaveBeenCalled();
    expect(mocks.update).toHaveBeenCalledWith(
      ID,
      { published: true },
      { expand: "program,school_year" },
    );
  });

  it("checks for a duplicate (excluding itself) when the year changes", async () => {
    mocks.parseProspectusUpdate.mockReturnValue({
      ok: true,
      data: { school_year: "sy2027sy2027sy2" },
    });
    mocks.getOne.mockResolvedValue({
      id: ID,
      program: PROGRAM_ID,
      school_year: "sy2026sy2026sy2",
    });
    mocks.getList.mockResolvedValue({ items: [] });
    mocks.update.mockResolvedValue({ id: ID });

    const res = await PATCH(req("PATCH", { school_year: "sy2027sy2027sy2" }), ctx);

    expect(res.status).toBe(200);
    expect(mocks.filter).toHaveBeenCalledWith(
      "program = {:program} && school_year = {:schoolYear} && id != {:id}",
      { program: PROGRAM_ID, schoolYear: "sy2027sy2027sy2", id: ID },
    );
    expect(mocks.update).toHaveBeenCalledWith(
      ID,
      { school_year: "sy2027sy2027sy2" },
      { expand: "program,school_year" },
    );
  });

  it("skips the duplicate check when the year is unchanged", async () => {
    mocks.parseProspectusUpdate.mockReturnValue({
      ok: true,
      data: { school_year: "sy2026sy2026sy2" },
    });
    mocks.getOne.mockResolvedValue({
      id: ID,
      program: PROGRAM_ID,
      school_year: "sy2026sy2026sy2",
    });
    mocks.update.mockResolvedValue({ id: ID });

    const res = await PATCH(req("PATCH", { school_year: "sy2026sy2026sy2" }), ctx);

    expect(res.status).toBe(200);
    expect(mocks.getList).not.toHaveBeenCalled();
  });

  it("returns 409 when the new year collides with another prospectus", async () => {
    mocks.parseProspectusUpdate.mockReturnValue({
      ok: true,
      data: { school_year: "sy2027sy2027sy2" },
    });
    mocks.getOne.mockResolvedValue({
      id: ID,
      program: PROGRAM_ID,
      school_year: "sy2026sy2026sy2",
    });
    mocks.getList.mockResolvedValue({ items: [{ id: "other" }] });

    const res = await PATCH(req("PATCH", { school_year: "sy2027sy2027sy2" }), ctx);

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      error: "That program already has a prospectus for this school year",
    });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("returns 400 on validation failure without touching PocketBase", async () => {
    mocks.parseProspectusUpdate.mockReturnValue({
      ok: false,
      error: "bad",
    });

    const res = await PATCH(req("PATCH", {}), ctx);

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "bad" });
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("treats malformed JSON as a null body", async () => {
    mocks.parseProspectusUpdate.mockReturnValue({
      ok: false,
      error: "invalid",
    });

    const res = await PATCH(req("PATCH", "{oops"), ctx);

    expect(mocks.parseProspectusUpdate).toHaveBeenCalledWith(null);
    expect(res.status).toBe(400);
  });

  it("propagates a 404 from update", async () => {
    mocks.parseProspectusUpdate.mockReturnValue({
      ok: true,
      data: { published: true },
    });
    mocks.update.mockRejectedValue({ status: 404 });

    const res = await PATCH(req("PATCH", { published: true }), ctx);

    expect(res.status).toBe(404);
  });

  it("returns 401 when not signed in", async () => {
    unauthorized();

    const res = await PATCH(req("PATCH", { published: true }), ctx);

    expect(res.status).toBe(401);
    expect(mocks.parseProspectusUpdate).not.toHaveBeenCalled();
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("returns 403 when the caller lacks permission and never touches PocketBase", async () => {
    forbidden();

    const res = await PATCH(req("PATCH", { published: true }), ctx);

    expect(res.status).toBe(403);
    expect(mocks.parseProspectusUpdate).not.toHaveBeenCalled();
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/prospectus/:id", () => {
  it("deletes and returns 204 with no body", async () => {
    mocks.delete.mockResolvedValue(true);

    const res = await DELETE(req("DELETE"), ctx);

    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
    expect(requireUserMock).toHaveBeenCalledWith("prospectus.write");
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
