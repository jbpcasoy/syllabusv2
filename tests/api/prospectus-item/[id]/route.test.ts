import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getOne: vi.fn(),
  getList: vi.fn(),
  update: vi.fn(),
  del: vi.fn(),
  filter: vi.fn((expr: string) => expr),
}));

vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);
vi.mock("@/lib/capabilities", async () =>
  (await import("@/tests/helpers/mock-auth")).capabilitiesModuleMock(),
);
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
  toProspectusItemResponse: (r: unknown) => r,
}));

import { DELETE, GET, PATCH } from "@/app/api/prospectus-item/[id]/route";
import { canMock, mockAuth, requireUserMock } from "@/tests/helpers/mock-auth";

const ctx = { params: Promise.resolve({ id: "item1" }) };
const url = "http://localhost/api/prospectus-item/item1";

function patch(body: unknown) {
  return new NextRequest(url, { method: "PATCH", body: JSON.stringify(body) });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ isAdmin: true });
});

describe("GET /api/prospectus-item/:id", () => {
  const unpublished = {
    id: "item1",
    expand: { prospectus: { published: false } },
  };

  it("hides items of unpublished prospectuses from non-admins", async () => {
    mockAuth({ roles: { deanOfColleges: ["colgacolgacolga"] } });
    mocks.getOne.mockResolvedValue(unpublished);
    const res = await GET(new NextRequest(url), ctx);
    expect(res.status).toBe(404);
    expect(canMock).toHaveBeenCalledWith(
      expect.anything(),
      "prospectusItem.write",
    );
  });

  it("returns the item to an admin", async () => {
    mocks.getOne.mockResolvedValue(unpublished);
    const res = await GET(new NextRequest(url), ctx);
    expect(res.status).toBe(200);
  });

  it("returns 401 when not signed in", async () => {
    mockAuth({ signedIn: false });
    const res = await GET(new NextRequest(url), ctx);
    expect(res.status).toBe(401);
    expect(mocks.getOne).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/prospectus-item/:id", () => {
  it("requires prospectusItem.write", async () => {
    await PATCH(patch({}), ctx);
    expect(requireUserMock).toHaveBeenCalledWith("prospectusItem.write");
  });

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

  it("returns 403 for a non-admin and changes nothing", async () => {
    mockAuth({ roles: { chairOfPrograms: ["progaprogaproga"] } });
    const res = await PATCH(patch({ title: "New" }), ctx);
    expect(res.status).toBe(403);
    expect(mocks.getOne).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/prospectus-item/:id", () => {
  it("returns 204 on success", async () => {
    mocks.del.mockResolvedValue(true);
    const res = await DELETE(new NextRequest(url, { method: "DELETE" }), ctx);
    expect(res.status).toBe(204);
    expect(mocks.del).toHaveBeenCalledWith("item1");
  });

  it("returns 403 for a non-admin and deletes nothing", async () => {
    mockAuth({ roles: { isVpaa: true } });
    const res = await DELETE(new NextRequest(url, { method: "DELETE" }), ctx);
    expect(res.status).toBe(403);
    expect(mocks.del).not.toHaveBeenCalled();
  });
});
