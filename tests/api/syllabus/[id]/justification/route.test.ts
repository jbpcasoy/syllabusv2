import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  syllabiGetOne: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  resolveSyllabusAccess: vi.fn(),
  findJustification: vi.fn(),
  loadJustificationResponse: vi.fn(),
  parseJustificationInput: vi.fn(),
  parseJustificationReturn: vi.fn(),
}));

vi.mock("@/lib/pocketbase", async () => {
  const { NextResponse } = await import("next/server");
  const collection = (name: string) =>
    name === "syllabi"
      ? { getOne: mocks.syllabiGetOne }
      : { create: mocks.create, update: mocks.update, delete: mocks.delete };
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

vi.mock("@/lib/syllabus", () => ({
  resolveSyllabusAccess: mocks.resolveSyllabusAccess,
}));
vi.mock("@/lib/justification", () => ({
  canViewJustification: (access: string | null) =>
    !!access && access !== "referencer",
  findJustification: mocks.findJustification,
  loadJustificationResponse: mocks.loadJustificationResponse,
}));
vi.mock("@/lib/syllabus-decision", () => ({
  hasNotUniqueError: (error: { code?: string }) => error?.code === "validation_not_unique",
}));
vi.mock("@/lib/validators/justification", () => ({
  parseJustificationInput: mocks.parseJustificationInput,
  parseJustificationReturn: mocks.parseJustificationReturn,
}));
vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);
vi.mock("@/lib/roles", async () =>
  (await import("@/tests/helpers/mock-auth")).rolesModuleMock(),
);
vi.mock("@/lib/capabilities", async () =>
  (await import("@/tests/helpers/mock-auth")).capabilitiesModuleMock(),
);

// The justification rules stay real (lib/syllabus-justification.ts).
import { GET, PATCH, PUT } from "@/app/api/syllabus/[id]/justification/route";
import { createAdminPb } from "@/lib/pocketbase";
import { mockAuth } from "@/tests/helpers/mock-auth";

const ID = "sylsylsylsylsyl";
const PROGRAM = "prg123prg123prg";
const ANA = "anaanaanaanaana";
const ctx = { params: Promise.resolve({ id: ID }) };
const RESPONSE = {
  applies: true,
  eligible_authors: [{ id: ANA, name: "Ana" }],
  justification: null,
  can_edit: true,
  can_return: false,
};
const ENTRIES = [{ author: ANA, reason: "On leave." }];

const syllabus = (status = "approved") => ({
  id: ID,
  program: PROGRAM,
  lead: "leadleadleadlea",
  co_authors: [],
  status,
});

const req = (method: string, body: unknown = {}) =>
  new NextRequest(`http://localhost/api/syllabus/${ID}/justification`, {
    method,
    ...(method !== "GET" && { body: JSON.stringify(body) }),
  });

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ id: "leadleadleadlea" });
  mocks.syllabiGetOne.mockResolvedValue(syllabus());
  mocks.create.mockResolvedValue({});
  mocks.update.mockResolvedValue({});
  mocks.delete.mockResolvedValue(undefined);
  mocks.resolveSyllabusAccess.mockResolvedValue("lead");
  mocks.findJustification.mockResolvedValue(null);
  mocks.loadJustificationResponse.mockResolvedValue(RESPONSE);
  mocks.parseJustificationInput.mockReturnValue({ ok: true, data: { entries: ENTRIES } });
  mocks.parseJustificationReturn.mockReturnValue({ ok: true, data: { reason: "Wrong term." } });
});

describe("GET /api/syllabus/:id/justification", () => {
  it.each(["lead", "coAuthor", "reviewer", "admin"])("serves it to %s", async (access) => {
    mocks.resolveSyllabusAccess.mockResolvedValue(access);
    const res = await GET(req("GET"), ctx);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(RESPONSE);
  });

  it.each(["referencer", null])("answers 404 to %s", async (access) => {
    mocks.resolveSyllabusAccess.mockResolvedValue(access);
    expect((await GET(req("GET"), ctx)).status).toBe(404);
    expect(mocks.loadJustificationResponse).not.toHaveBeenCalled();
  });

  it("tells a returner in scope they may return it", async () => {
    mockAuth({ roles: { reviewerOfPrograms: [PROGRAM] }, scope: { programId: PROGRAM } });
    mocks.resolveSyllabusAccess.mockResolvedValue("reviewer");
    await GET(req("GET"), ctx);
    expect(mocks.loadJustificationResponse).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ id: ID }),
      { access: "reviewer", canReturn: true },
    );
  });

  it("returns 401 when signed out", async () => {
    mockAuth({ signedIn: false });
    expect((await GET(req("GET"), ctx)).status).toBe(401);
    expect(createAdminPb).not.toHaveBeenCalled();
  });
});

describe("PUT /api/syllabus/:id/justification", () => {
  it("creates a draft with the entries", async () => {
    const res = await PUT(req("PUT"), ctx);
    expect(res.status).toBe(200);
    expect(mocks.create).toHaveBeenCalledWith({ syllabus: ID, entries: ENTRIES, status: "draft" });
  });

  it("updates the entries of an existing justification", async () => {
    mocks.findJustification.mockResolvedValue({ id: "jst", status: "returned", entries: [] });
    await PUT(req("PUT"), ctx);
    expect(mocks.update).toHaveBeenCalledWith("jst", { entries: ENTRIES });
  });

  it("deletes it when the entries are emptied", async () => {
    mocks.parseJustificationInput.mockReturnValue({ ok: true, data: { entries: [] } });
    mocks.findJustification.mockResolvedValue({ id: "jst", status: "draft", entries: ENTRIES });
    await PUT(req("PUT"), ctx);
    expect(mocks.delete).toHaveBeenCalledWith("jst");
  });

  it.each([
    ["the syllabus isn't approved", () => mocks.syllabiGetOne.mockResolvedValue(syllabus("submitted"))],
    ["it is submitted", () => mocks.findJustification.mockResolvedValue({ id: "j", status: "submitted" })],
    ["no previous syllabus applies", () => mocks.loadJustificationResponse.mockResolvedValue({ ...RESPONSE, applies: false })],
    ["an author isn't eligible", () => mocks.loadJustificationResponse.mockResolvedValue({ ...RESPONSE, eligible_authors: [] })],
    ["a concurrent save won", () => mocks.create.mockRejectedValue({ code: "validation_not_unique" })],
  ])("returns 409 when %s", async (_label, arrange) => {
    arrange();
    expect((await PUT(req("PUT"), ctx)).status).toBe(409);
  });

  it("works once filed too", async () => {
    mocks.syllabiGetOne.mockResolvedValue(syllabus("filed"));
    expect((await PUT(req("PUT"), ctx)).status).toBe(200);
  });

  it.each(["coAuthor", "reviewer", "admin"])("returns 403 to %s", async (access) => {
    mocks.resolveSyllabusAccess.mockResolvedValue(access);
    expect((await PUT(req("PUT"), ctx)).status).toBe(403);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("answers 404 to a referencer", async () => {
    mocks.resolveSyllabusAccess.mockResolvedValue("referencer");
    expect((await PUT(req("PUT"), ctx)).status).toBe(404);
  });

  it("returns 400 before touching PocketBase", async () => {
    mocks.parseJustificationInput.mockReturnValue({ ok: false, error: "bad" });
    const res = await PUT(
      new NextRequest(`http://localhost/api/syllabus/${ID}/justification`, { method: "PUT", body: "{nope" }),
      ctx,
    );
    expect(res.status).toBe(400);
    expect(mocks.parseJustificationInput).toHaveBeenCalledWith(null);
    expect(createAdminPb).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/syllabus/:id/justification", () => {
  beforeEach(() => {
    mockAuth({ id: "revwrevwrevwrev", roles: { reviewerOfPrograms: [PROGRAM] }, scope: { programId: PROGRAM } });
    mocks.resolveSyllabusAccess.mockResolvedValue("reviewer");
    mocks.findJustification.mockResolvedValue({ id: "jst", status: "submitted" });
  });

  it("returns a submitted justification for revision", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-28T08:00:00.000Z"));
    const res = await PATCH(req("PATCH"), ctx);
    vi.useRealTimers();

    expect(res.status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith("jst", {
      status: "returned",
      return_reason: "Wrong term.",
      returned_by: "revwrevwrevwrev",
      returned_at: "2026-10-28T08:00:00.000Z",
    });
  });

  it.each([
    ["the dean", { deanOfColleges: ["col"] }, { programId: PROGRAM, collegeId: "col" }],
    ["the VPAA", { isVpaa: true }, undefined],
  ])("lets %s return it", async (_label, roles, scope) => {
    mockAuth({ roles, scope });
    expect((await PATCH(req("PATCH"), ctx)).status).toBe(200);
  });

  it.each([
    ["the department head", { headOfDepartments: ["dep"] }, { programId: PROGRAM, departmentId: "dep" }],
    ["the program chair", { chairOfPrograms: [PROGRAM] }, { programId: PROGRAM }],
  ])("returns 403 to %s with nothing written", async (_label, roles, scope) => {
    mockAuth({ roles, scope });
    expect((await PATCH(req("PATCH"), ctx)).status).toBe(403);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it.each([null, { id: "jst", status: "draft" }, { id: "jst", status: "returned" }])(
    "returns 409 for %o",
    async (record) => {
      mocks.findJustification.mockResolvedValue(record);
      expect((await PATCH(req("PATCH"), ctx)).status).toBe(409);
      expect(mocks.update).not.toHaveBeenCalled();
    },
  );

  it("answers 404 to a referencer", async () => {
    mocks.resolveSyllabusAccess.mockResolvedValue("referencer");
    expect((await PATCH(req("PATCH"), ctx)).status).toBe(404);
  });

  it("returns 400 for a bad body", async () => {
    mocks.parseJustificationReturn.mockReturnValue({ ok: false, error: "bad" });
    expect((await PATCH(req("PATCH"), ctx)).status).toBe(400);
  });
});
