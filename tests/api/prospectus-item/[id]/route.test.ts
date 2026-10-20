import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  getOne: vi.fn(),
  getList: vi.fn(),
  update: vi.fn(),
  del: vi.fn(),
  filter: vi.fn((expr: string) => expr),
  canManage: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/lib/permissions", () => ({
  PERMISSIONS: { prospectusItem: { read: [], write: ["dean"] } },
}));
vi.mock("@/lib/pocketbase", () => ({
  createAdminPb: async () => ({
    filter: mocks.filter,
    collection: () => ({
      getOne: mocks.getOne,
      getList: mocks.getList,
      update: mocks.update,
      delete: mocks.del,
    }),
  }),
  handlePbError: (e: unknown) =>
    new Response(JSON.stringify({ error: String(e) }), { status: 500 }),
}));
vi.mock("@/lib/prospectus-item", () => ({
  PROSPECTUS_ITEM_EXPAND: "prospectus.program",
  canManageProspectusItems: mocks.canManage,
  toProspectusItemResponse: (r: unknown) => r,
}));

import { DELETE, GET, PATCH } from "@/app/api/prospectus-item/[id]/route";

const ctx = { params: Promise.resolve({ id: "item1" }) };
const url = "http://localhost/api/prospectus-item/item1";

function patch(body: unknown) {
  return new NextRequest(url, { method: "PATCH", body: JSON.stringify(body) });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireUser.mockResolvedValue({ ok: true, user: { role: "dean" } });
  mocks.canManage.mockReturnValue(true);
});

describe("GET /api/prospectus-item/:id", () => {
  it("hides items of unpublished prospectuses from non-managers", async () => {
    mocks.canManage.mockReturnValue(false);
    mocks.getOne.mockResolvedValue({
      id: "item1",
      expand: { prospectus: { published: false } },
    });
    const res = await GET(new NextRequest(url), ctx);
    expect(res.status).toBe(404);
  });

  it("returns the item for managers", async () => {
    mocks.getOne.mockResolvedValue({
      id: "item1",
      expand: { prospectus: { published: false } },
    });
    const res = await GET(new NextRequest(url), ctx);
    expect(res.status).toBe(200);
  });
});

describe("PATCH /api/prospectus-item/:id", () => {
  it("returns 400 when no field is provided", async () => {
    const res = await PATCH(patch({}), ctx);
    expect(res.status).toBe(400);
  });

  it("returns 409 when the new key collides with another item", async () => {
    mocks.getOne.mockResolvedValue({
      id: "item1",
      prospectus: "abcde12345fghij",
      subject_code: "CS101",
      year_level: "First Year",
      semester: "First Semester",
    });
    mocks.getList.mockResolvedValue({ items: [{ id: "other" }] });
    const res = await PATCH(patch({ semester: "Summer" }), ctx);
    expect(res.status).toBe(409);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("updates when there is no collision", async () => {
    mocks.getOne.mockResolvedValue({
      id: "item1",
      prospectus: "abcde12345fghij",
      subject_code: "CS101",
      year_level: "First Year",
      semester: "First Semester",
    });
    mocks.getList.mockResolvedValue({ items: [] });
    mocks.update.mockResolvedValue({ id: "item1", title: "New" });
    const res = await PATCH(patch({ title: "New" }), ctx);
    expect(res.status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith(
      "item1",
      { title: "New" },
      { expand: "prospectus.program" },
    );
  });
});

describe("DELETE /api/prospectus-item/:id", () => {
  it("returns 204 on success", async () => {
    mocks.del.mockResolvedValue(true);
    const res = await DELETE(new NextRequest(url, { method: "DELETE" }), ctx);
    expect(res.status).toBe(204);
    expect(mocks.del).toHaveBeenCalledWith("item1");
  });

  it("returns the auth response when forbidden", async () => {
    mocks.requireUser.mockResolvedValue({
      ok: false,
      response: new Response(null, { status: 403 }),
    });
    const res = await DELETE(new NextRequest(url, { method: "DELETE" }), ctx);
    expect(res.status).toBe(403);
    expect(mocks.del).not.toHaveBeenCalled();
  });
});
