import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getList: vi.fn(),
  create: vi.fn(),
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
    collection: () => ({ getList: mocks.getList, create: mocks.create }),
  }),
  handlePbError: (e: unknown) =>
    new Response(JSON.stringify({ error: String(e) }), { status: 500 }),
}));
vi.mock("@/lib/prospectus-item", () => ({
  PROSPECTUS_ITEM_EXPAND: "prospectus.program",
  toProspectusItemResponse: (r: unknown) => r,
}));

import { GET, POST } from "@/app/api/prospectus-item/route";
import { mockAuth, requireUserMock } from "@/tests/helpers/mock-auth";

const PID = "abcde12345fghij";
const validBody = {
  prospectus: PID,
  semester: "First Semester",
  year_level: "First Year",
  subject_code: "CS101",
  title: "Intro to Computing",
};

function post(body: unknown) {
  return new NextRequest("http://localhost/api/prospectus-item", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ isAdmin: true });
});

describe("GET /api/prospectus-item", () => {
  it("returns the auth response when unauthenticated", async () => {
    mockAuth({ signedIn: false });
    const res = await GET(
      new NextRequest("http://localhost/api/prospectus-item"),
    );
    expect(res.status).toBe(401);
  });

  it("applies filters and sorts by subject_code", async () => {
    mocks.getList.mockResolvedValue({ items: [], totalPages: 1 });
    const res = await GET(
      new NextRequest(
        "http://localhost/api/prospectus-item?semester=Summer&year_level=Bogus&search=cs",
      ),
    );
    expect(res.status).toBe(200);
    const opts = mocks.getList.mock.calls[0][2];
    expect(opts.sort).toBe("subject_code");
    expect(opts.filter).toContain("semester = {:semester}");
    expect(opts.filter).toContain("subject_code ~ {:search}");
    expect(opts.filter).not.toContain("year_level");
    expect(opts.filter).not.toContain("published");
  });

  it("restricts non-admins (even deans) to published prospectuses", async () => {
    mockAuth({ roles: { deanOfColleges: ["colgacolgacolga"] } });
    mocks.getList.mockResolvedValue({ items: [], totalPages: 1 });
    await GET(new NextRequest("http://localhost/api/prospectus-item"));
    expect(mocks.getList.mock.calls[0][2].filter).toBe(
      "prospectus.published = true",
    );
  });
});

describe("POST /api/prospectus-item", () => {
  it("returns 400 for invalid input", async () => {
    const res = await POST(post({ ...validBody, subject_code: "" }));
    expect(res.status).toBe(400);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("returns 409 when the subject already exists", async () => {
    mocks.getList.mockResolvedValue({ items: [{ id: "x" }] });
    const res = await POST(post(validBody));
    expect(res.status).toBe(409);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("creates the item and returns 201", async () => {
    mocks.getList.mockResolvedValue({ items: [] });
    mocks.create.mockResolvedValue({ id: "new", ...validBody });
    const res = await POST(post(validBody));
    expect(res.status).toBe(201);
    expect(mocks.create).toHaveBeenCalledWith(validBody, {
      expand: "prospectus.program",
    });
    expect(requireUserMock).toHaveBeenCalledWith("prospectusItem.write");
  });

  it("returns 403 for a non-admin and creates nothing", async () => {
    mockAuth({ roles: { chairOfPrograms: ["progaprogaproga"] } });
    const res = await POST(post(validBody));
    expect(res.status).toBe(403);
    expect(mocks.getList).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("returns 401 when not signed in", async () => {
    mockAuth({ signedIn: false });
    const res = await POST(post(validBody));
    expect(res.status).toBe(401);
  });
});
