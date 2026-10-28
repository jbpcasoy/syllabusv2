import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getOne: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  parseSyllabusUpdateInput: vi.fn(),
  activeFacultyAmong: vi.fn(),
  hasLiveReferenceTo: vi.fn(),
  getSyllabusAccess: vi.fn(),
  toSyllabusResponse: vi.fn((record: Record<string, unknown>, access?: string) => ({
    ...record,
    access,
    mapped: true,
  })),
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

vi.mock("@/lib/validators/syllabus", () => ({
  parseSyllabusUpdateInput: mocks.parseSyllabusUpdateInput,
}));

vi.mock("@/lib/syllabus", () => ({
  SYLLABUS_EXPAND: "course,term.school_year,program,lead,co_authors",
  activeFacultyAmong: mocks.activeFacultyAmong,
  getSyllabusAccess: mocks.getSyllabusAccess,
  // Reads also admit referencers; the stub answers with the same value.
  resolveSyllabusAccess: vi.fn(async () => mocks.getSyllabusAccess()),
  toSyllabusResponse: mocks.toSyllabusResponse,
}));

vi.mock("@/lib/syllabus-reference", () => ({
  hasLiveReferenceTo: mocks.hasLiveReferenceTo,
}));

vi.mock("@/lib/syllabus-chain", () => ({
  loadChainHolders: vi.fn(async () => [["revwrevwrevwrev"], ["d"], ["f"], ["c"], ["v"]]),
  loadStandIns: vi.fn(async () => []),
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

import { DELETE, GET, PATCH } from "@/app/api/syllabus/[id]/route";
import { createAdminPb } from "@/lib/pocketbase";
import { mockAuth } from "@/tests/helpers/mock-auth";

const ID = "sylsylsylsylsyl";
const ME = "me1me1me1me1me1";
const CO = "cococococococoo";
const PROGRAM = "prg123prg123prg";
const ctx = { params: Promise.resolve({ id: ID }) };

const draft = {
  id: ID,
  program: PROGRAM,
  lead: ME,
  co_authors: [],
  status: "draft",
  stage: 0,
  submitted_at: "",
};

function req(method: string, body?: unknown) {
  return new NextRequest(`http://localhost/api/syllabus/${ID}`, {
    method,
    ...(body !== undefined && {
      headers: { "Content-Type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ id: ME, roles: { facultyOfPrograms: [PROGRAM] } });
  mocks.getOne.mockResolvedValue(draft);
  mocks.getSyllabusAccess.mockReturnValue("lead");
  mocks.hasLiveReferenceTo.mockResolvedValue(false);
});

describe("GET /api/syllabus/:id", () => {
  it.each(["lead", "coAuthor", "admin", "referencer"])(
    "returns the syllabus with %s access",
    async (access) => {
      mocks.getSyllabusAccess.mockReturnValue(access);

      const res = await GET(req("GET"), ctx);

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        ...draft,
        access,
        mapped: true,
        can_return_signed_copy: false,
        can_transfer_lead: false,
        lead_transfer_is_override: false,
        review: { actorStage: null, actingAs: null, designatableStages: [] },
      });
      expect(mocks.getOne).toHaveBeenCalledWith(ID, {
        expand: "course,term.school_year,program,lead,co_authors",
      });
    },
  );

  it("tells an admin who isn't the chair that a transfer is an override", async () => {
    mockAuth({ id: "adminadminadmin", isAdmin: true });
    mocks.getSyllabusAccess.mockReturnValue("admin");

    const body = await (await GET(req("GET"), ctx)).json();

    expect(body).toMatchObject({
      can_transfer_lead: true,
      lead_transfer_is_override: true,
    });
  });

  it("tells the program reviewer they may decide stage 1", async () => {
    mockAuth({ id: "revwrevwrevwrev" });
    mocks.getSyllabusAccess.mockReturnValue("reviewer");
    mocks.getOne.mockResolvedValue({ ...draft, status: "submitted", stage: 1 });

    const res = await GET(req("GET"), ctx);
    expect((await res.json()).review).toEqual({
      actorStage: 1,
      actingAs: "holder",
      designatableStages: [1],
    });
  });

  it("tells a signedCopy.return holder in scope they may return the scan", async () => {
    mockAuth({
      id: ME,
      roles: { reviewerOfPrograms: [PROGRAM] },
      scope: { programId: PROGRAM },
    });
    mocks.getSyllabusAccess.mockReturnValue("reviewer");

    const res = await GET(req("GET"), ctx);
    expect((await res.json()).can_return_signed_copy).toBe(true);
  });

  it("refuses a program reviewer of another program", async () => {
    mockAuth({ id: ME, roles: { reviewerOfPrograms: ["otherotherother"] } });
    mocks.getSyllabusAccess.mockReturnValue("reviewer");

    const res = await GET(req("GET"), ctx);
    expect((await res.json()).can_return_signed_copy).toBe(false);
  });

  it("lets an admin see which stand-ins they may set", async () => {
    mockAuth({ id: ME, isAdmin: true });
    mocks.getSyllabusAccess.mockReturnValue("admin");
    mocks.getOne.mockResolvedValue({ ...draft, status: "submitted", stage: 2 });

    const res = await GET(req("GET"), ctx);
    expect((await res.json()).review).toEqual({
      actorStage: null,
      actingAs: null,
      designatableStages: [2, 3, 4, 5],
    });
  });

  it("answers 404 when the caller has no access", async () => {
    mocks.getSyllabusAccess.mockReturnValue(null);
    const res = await GET(req("GET"), ctx);
    expect(res.status).toBe(404);
    expect(mocks.toSyllabusResponse).not.toHaveBeenCalled();
  });

  it("returns 401 when signed out", async () => {
    mockAuth({ signedIn: false });
    const res = await GET(req("GET"), ctx);
    expect(res.status).toBe(401);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("propagates 404 from PocketBase", async () => {
    mocks.getOne.mockRejectedValue({ status: 404 });
    const res = await GET(req("GET"), ctx);
    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/syllabus/:id", () => {
  beforeEach(() => {
    mocks.parseSyllabusUpdateInput.mockReturnValue({
      ok: true,
      data: { co_authors: [CO] },
    });
    mocks.activeFacultyAmong.mockResolvedValue(new Set([CO]));
    mocks.update.mockImplementation(async (_id: string, data: object) => ({
      ...draft,
      ...data,
    }));
  });

  it("replaces the co-authors", async () => {
    const res = await PATCH(req("PATCH", { co_authors: [CO] }), ctx);

    expect(res.status).toBe(200);
    expect(mocks.activeFacultyAmong).toHaveBeenCalledWith(
      expect.anything(),
      PROGRAM,
      [CO],
    );
    expect(mocks.update).toHaveBeenCalledWith(
      ID,
      { co_authors: [CO] },
      { expand: "course,term.school_year,program,lead,co_authors" },
    );
    expect(await res.json()).toMatchObject({ co_authors: [CO], access: "lead" });
  });

  it("returns 400 with the validator's error", async () => {
    mocks.parseSyllabusUpdateInput.mockReturnValue({ ok: false, error: "bad" });
    const res = await PATCH(req("PATCH", {}), ctx);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "bad" });
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("passes malformed JSON to the validator as null", async () => {
    mocks.parseSyllabusUpdateInput.mockReturnValue({ ok: false, error: "bad" });
    await PATCH(req("PATCH", "{oops"), ctx);
    expect(mocks.parseSyllabusUpdateInput).toHaveBeenCalledWith(null);
  });

  it("returns 401 when signed out", async () => {
    mockAuth({ signedIn: false });
    const res = await PATCH(req("PATCH", { co_authors: [] }), ctx);
    expect(res.status).toBe(401);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("answers 404 when the caller has no access", async () => {
    mocks.getSyllabusAccess.mockReturnValue(null);
    const res = await PATCH(req("PATCH", { co_authors: [CO] }), ctx);
    expect(res.status).toBe(404);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it.each(["coAuthor", "admin"])(
    "returns 403 for %s access",
    async (access) => {
      mocks.getSyllabusAccess.mockReturnValue(access);
      const res = await PATCH(req("PATCH", { co_authors: [CO] }), ctx);
      expect(res.status).toBe(403);
      expect(mocks.update).not.toHaveBeenCalled();
    },
  );

  it("returns 409 once submitted", async () => {
    mocks.getOne.mockResolvedValue({ ...draft, status: "submitted", stage: 1 });
    const res = await PATCH(req("PATCH", { co_authors: [CO] }), ctx);
    expect(res.status).toBe(409);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("returns 400 when the lead lists themself", async () => {
    mocks.parseSyllabusUpdateInput.mockReturnValue({
      ok: true,
      data: { co_authors: [ME] },
    });
    const res = await PATCH(req("PATCH", { co_authors: [ME] }), ctx);
    expect(res.status).toBe(400);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("returns 409 when a co-author is not active faculty of the program", async () => {
    mocks.activeFacultyAmong.mockResolvedValue(new Set());
    const res = await PATCH(req("PATCH", { co_authors: [CO] }), ctx);
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      error: "Every co-author must be active faculty of this program.",
    });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("propagates 404 from PocketBase", async () => {
    mocks.getOne.mockRejectedValue({ status: 404 });
    const res = await PATCH(req("PATCH", { co_authors: [CO] }), ctx);
    expect(res.status).toBe(404);
  });

  it("delegates update errors", async () => {
    mocks.update.mockRejectedValue({ status: 400 });
    const res = await PATCH(req("PATCH", { co_authors: [CO] }), ctx);
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/syllabus/:id", () => {
  it("deletes a never-submitted draft", async () => {
    const res = await DELETE(req("DELETE"), ctx);
    expect(res.status).toBe(204);
    expect(res.body).toBeNull();
    expect(mocks.delete).toHaveBeenCalledWith(ID);
  });

  it("returns 401 when signed out", async () => {
    mockAuth({ signedIn: false });
    const res = await DELETE(req("DELETE"), ctx);
    expect(res.status).toBe(401);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("answers 404 when the caller has no access", async () => {
    mocks.getSyllabusAccess.mockReturnValue(null);
    const res = await DELETE(req("DELETE"), ctx);
    expect(res.status).toBe(404);
    expect(mocks.delete).not.toHaveBeenCalled();
  });

  it.each(["coAuthor", "admin"])(
    "returns 403 for %s access",
    async (access) => {
      mocks.getSyllabusAccess.mockReturnValue(access);
      const res = await DELETE(req("DELETE"), ctx);
      expect(res.status).toBe(403);
      expect(mocks.delete).not.toHaveBeenCalled();
    },
  );

  it.each([
    ["submitted", { status: "submitted", stage: 1 }],
    ["a draft that was submitted before", { submitted_at: "2026-10-01 00:00:00.000Z" }],
  ])("returns 409 for %s", async (_label, patch) => {
    mocks.getOne.mockResolvedValue({ ...draft, ...patch });
    const res = await DELETE(req("DELETE"), ctx);
    expect(res.status).toBe(409);
    expect(mocks.delete).not.toHaveBeenCalled();
  });

  it("returns 409 while another program's reference is live", async () => {
    mocks.hasLiveReferenceTo.mockResolvedValue(true);
    const res = await DELETE(req("DELETE"), ctx);
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/references this syllabus/);
    expect(mocks.hasLiveReferenceTo).toHaveBeenCalledWith(expect.anything(), ID);
    expect(mocks.delete).not.toHaveBeenCalled();
  });

  it("propagates 404 from PocketBase", async () => {
    mocks.getOne.mockRejectedValue({ status: 404 });
    const res = await DELETE(req("DELETE"), ctx);
    expect(res.status).toBe(404);
  });

  it("delegates delete errors", async () => {
    mocks.delete.mockRejectedValue({ status: 400 });
    const res = await DELETE(req("DELETE"), ctx);
    expect(res.status).toBe(400);
  });
});
