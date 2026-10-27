import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  syllabiGetOne: vi.fn(),
  standInsGetList: vi.fn(),
  standInsCreate: vi.fn(),
  standInsUpdate: vi.fn(),
  standInsDelete: vi.fn(),
  resolveSyllabusAccess: vi.fn(),
  activeFacultyAmong: vi.fn(),
  loadChainHolders: vi.fn(),
  listStandIns: vi.fn(),
  parseStandInInput: vi.fn(),
}));

/** Substitutes params like the real SDK so assertions read naturally. */
const filter = (expr: string, params: Record<string, unknown> = {}) =>
  expr.replace(/\{:(\w+)\}/g, (_, key) => JSON.stringify(params[key]));

vi.mock("@/lib/pocketbase", async () => {
  const { NextResponse } = await import("next/server");
  const collection = (name: string) =>
    name === "syllabi"
      ? { getOne: mocks.syllabiGetOne }
      : {
          getList: mocks.standInsGetList,
          create: mocks.standInsCreate,
          update: mocks.standInsUpdate,
          delete: mocks.standInsDelete,
        };
  return {
    createAdminPb: vi.fn(async () => ({ collection, filter })),
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
  activeFacultyAmong: mocks.activeFacultyAmong,
  isNotUniqueError: (error: unknown, field: string) =>
    (error as { response?: { data?: Record<string, { code?: string }> } })
      ?.response?.data?.[field]?.code === "validation_not_unique",
}));
vi.mock("@/lib/syllabus-chain", () => ({
  loadChainHolders: mocks.loadChainHolders,
}));
vi.mock("@/lib/syllabus-stand-in", () => ({
  listStandIns: mocks.listStandIns,
}));
vi.mock("@/lib/validators/syllabus-stand-in", () => ({
  parseStandInInput: mocks.parseStandInInput,
}));
vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);
vi.mock("@/lib/roles", async () =>
  (await import("@/tests/helpers/mock-auth")).rolesModuleMock(),
);

import { GET, PUT } from "@/app/api/syllabus/[id]/stand-in/route";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { mockAuth } from "@/tests/helpers/mock-auth";

const ID = "sylsylsylsylsyl";
const PROGRAM = "prg123prg123prg";
const LEAD = "leadleadleadlea";
const CO = "cocococococococ";
const REVIEWER = "revwrevwrevwrev";
const DEAN = "deandeandeandea";
const FDIS = "fdisfdisfdisfdi";
const CITL = "citlcitlcitlcit";
const VPAA = "vpaavpaavpaavpa";
const TARGET = "trgttrgttrgttrg";
const OTHER = "othrothrothroth";
const HOLDERS = [[REVIEWER], [DEAN], [FDIS], [CITL], [VPAA]];
const ctx = { params: Promise.resolve({ id: ID }) };
const ITEMS = [{ id: "s1", stage: 1, kind: "proxy" }];

const syllabus = (status = "submitted", stage = 1) => ({
  id: ID,
  program: PROGRAM,
  lead: LEAD,
  co_authors: [CO],
  status,
  stage,
});

function put(body: unknown) {
  return new NextRequest(`http://localhost/api/syllabus/${ID}/stand-in`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

function setInput(stage: number, user: string | null = TARGET) {
  mocks.parseStandInInput.mockReturnValue({ ok: true, data: { stage, user } });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ id: DEAN });
  mocks.syllabiGetOne.mockResolvedValue(syllabus());
  mocks.loadChainHolders.mockResolvedValue(HOLDERS);
  mocks.resolveSyllabusAccess.mockResolvedValue("reviewer");
  mocks.activeFacultyAmong.mockResolvedValue(new Set([TARGET]));
  mocks.standInsGetList.mockResolvedValue({ items: [] });
  mocks.standInsCreate.mockResolvedValue({});
  mocks.standInsUpdate.mockResolvedValue({});
  mocks.listStandIns.mockResolvedValue(ITEMS);
  setInput(1);
});

describe("GET /api/syllabus/:id/stand-in", () => {
  const get = () =>
    GET(new NextRequest(`http://localhost/api/syllabus/${ID}/stand-in`), ctx);

  it("lists stand-ins for a caller with access", async () => {
    mockAuth({ id: OTHER });
    const res = await get();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ items: ITEMS });
    expect(mocks.listStandIns).toHaveBeenCalledWith(expect.anything(), ID);
    expect(mocks.loadChainHolders).toHaveBeenCalledWith(expect.anything(), PROGRAM);
  });

  it("lets a designator see a draft they can't otherwise access", async () => {
    mocks.syllabiGetOne.mockResolvedValue(syllabus("draft", 0));
    mocks.resolveSyllabusAccess.mockResolvedValue(null);

    const res = await get();
    expect(res.status).toBe(200);
    expect(mocks.resolveSyllabusAccess).not.toHaveBeenCalled();
  });

  it("answers 404 to a caller with neither", async () => {
    mockAuth({ id: OTHER });
    mocks.resolveSyllabusAccess.mockResolvedValue(null);

    const res = await get();
    expect(res.status).toBe(404);
    expect(mocks.listStandIns).not.toHaveBeenCalled();
  });

  it("returns 401 when signed out", async () => {
    mockAuth({ signedIn: false });
    const res = await get();
    expect(res.status).toBe(401);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("propagates 404 from PocketBase", async () => {
    mocks.syllabiGetOne.mockRejectedValue({ status: 404 });
    const res = await get();
    expect(res.status).toBe(404);
    expect(handlePbError).toHaveBeenCalled();
  });
});

describe("PUT /api/syllabus/:id/stand-in", () => {
  describe("success", () => {
    it("creates a stand-in and returns the list", async () => {
      const res = await PUT(put({}), ctx);

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ items: ITEMS });
      expect(mocks.standInsGetList).toHaveBeenCalledWith(1, 1, {
        skipTotal: true,
        filter: `syllabus = "${ID}" && stage = 1`,
      });
      expect(mocks.standInsCreate).toHaveBeenCalledWith({
        syllabus: ID,
        stage: 1,
        user: TARGET,
        assigned_by: DEAN,
      });
      expect(mocks.standInsUpdate).not.toHaveBeenCalled();
    });

    it("replaces an existing stand-in", async () => {
      mocks.standInsGetList.mockResolvedValue({ items: [{ id: "old" }] });

      const res = await PUT(put({}), ctx);
      expect(res.status).toBe(200);
      expect(mocks.standInsUpdate).toHaveBeenCalledWith("old", {
        user: TARGET,
        assigned_by: DEAN,
      });
      expect(mocks.standInsCreate).not.toHaveBeenCalled();
    });

    it("clears an existing stand-in", async () => {
      setInput(1, null);
      mocks.standInsGetList.mockResolvedValue({ items: [{ id: "old" }] });

      const res = await PUT(put({}), ctx);
      expect(res.status).toBe(200);
      expect(mocks.standInsDelete).toHaveBeenCalledWith("old");
      expect(mocks.activeFacultyAmong).not.toHaveBeenCalled();
    });

    it("clearing an empty stage is a no-op", async () => {
      setInput(1, null);
      const res = await PUT(put({}), ctx);
      expect(res.status).toBe(200);
      expect(mocks.standInsDelete).not.toHaveBeenCalled();
    });

    it("does not require faculty membership after stage 1", async () => {
      mocks.syllabiGetOne.mockResolvedValue(syllabus("submitted", 2));
      mockAuth({ id: VPAA });
      setInput(3);

      const res = await PUT(put({}), ctx);
      expect(res.status).toBe(200);
      expect(mocks.activeFacultyAmong).not.toHaveBeenCalled();
    });
  });

  describe("validation", () => {
    it("returns 400 with the validator's error before touching PocketBase", async () => {
      mocks.parseStandInInput.mockReturnValue({ ok: false, error: "bad stage" });

      const res = await PUT(put({ stage: 9 }), ctx);
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: "bad stage" });
      expect(createAdminPb).not.toHaveBeenCalled();
    });

    it("passes malformed JSON to the validator as null", async () => {
      mocks.parseStandInInput.mockReturnValue({ ok: false, error: "x" });
      const req = new NextRequest(`http://localhost/api/syllabus/${ID}/stand-in`, {
        method: "PUT",
        body: "{not json",
      });

      const res = await PUT(req, ctx);
      expect(res.status).toBe(400);
      expect(mocks.parseStandInInput).toHaveBeenCalledWith(null);
    });
  });

  describe("who may designate", () => {
    it("returns 401 when signed out", async () => {
      mockAuth({ signedIn: false });
      const res = await PUT(put({}), ctx);
      expect(res.status).toBe(401);
      expect(createAdminPb).not.toHaveBeenCalled();
    });

    it("lets an admin designate any stage", async () => {
      mockAuth({ id: OTHER, isAdmin: true });
      mocks.syllabiGetOne.mockResolvedValue(syllabus("submitted", 5));
      setInput(5);

      const res = await PUT(put({}), ctx);
      expect(res.status).toBe(200);
    });

    it("lets the program reviewer name their own proxy", async () => {
      mockAuth({ id: REVIEWER });
      const res = await PUT(put({}), ctx);
      expect(res.status).toBe(200);
    });

    it.each([
      [DEAN, 1],
      [FDIS, 2],
      [CITL, 3],
      [VPAA, 4],
    ])("lets %s designate for earlier stage %i", async (user, stage) => {
      mockAuth({ id: user });
      mocks.syllabiGetOne.mockResolvedValue(syllabus("submitted", stage));
      setInput(stage);

      const res = await PUT(put({}), ctx);
      expect(res.status).toBe(200);
    });

    it.each([
      ["the same stage", DEAN, 2],
      ["an earlier stage's holder", REVIEWER, 3],
      ["the VPAA for itself", VPAA, 5],
    ])("returns 403 for %s", async (_label, user, stage) => {
      mockAuth({ id: user });
      mocks.syllabiGetOne.mockResolvedValue(syllabus("submitted", stage));
      setInput(stage);

      const res = await PUT(put({}), ctx);
      expect(res.status).toBe(403);
      expect(mocks.standInsCreate).not.toHaveBeenCalled();
      expect(mocks.standInsGetList).not.toHaveBeenCalled();
    });

    it("returns 403 to the lead, who can see the syllabus", async () => {
      mockAuth({ id: LEAD });
      mocks.resolveSyllabusAccess.mockResolvedValue("lead");

      const res = await PUT(put({}), ctx);
      expect(res.status).toBe(403);
      expect(mocks.standInsCreate).not.toHaveBeenCalled();
    });

    it("answers 404 to an outsider", async () => {
      mockAuth({ id: OTHER });
      mocks.resolveSyllabusAccess.mockResolvedValue(null);

      const res = await PUT(put({}), ctx);
      expect(res.status).toBe(404);
      expect(mocks.standInsGetList).not.toHaveBeenCalled();
    });
  });

  describe("when", () => {
    it("returns 409 for a later stage while drafting", async () => {
      mocks.syllabiGetOne.mockResolvedValue(syllabus("draft", 0));
      mockAuth({ id: VPAA });
      setInput(2);

      const res = await PUT(put({}), ctx);
      expect(res.status).toBe(409);
      expect(await res.json()).toEqual({
        error: "Stand-ins for later stages can be set once the syllabus is submitted.",
      });
    });

    it("allows the proxy while drafting", async () => {
      mocks.syllabiGetOne.mockResolvedValue(syllabus("draft", 0));
      const res = await PUT(put({}), ctx);
      expect(res.status).toBe(200);
    });

    it("returns 409 for a stage that has passed", async () => {
      mocks.syllabiGetOne.mockResolvedValue(syllabus("returned", 3));
      const res = await PUT(put({}), ctx);
      expect(res.status).toBe(409);
      expect(await res.json()).toEqual({ error: "That stage has already passed." });
    });

    it.each(["approved", "filed"])("returns 409 once %s", async (status) => {
      mocks.syllabiGetOne.mockResolvedValue(syllabus(status, 5));
      mockAuth({ id: OTHER, isAdmin: true });

      const res = await PUT(put({}), ctx);
      expect(res.status).toBe(409);
      expect(mocks.standInsCreate).not.toHaveBeenCalled();
    });
  });

  describe("who may stand in", () => {
    it.each([LEAD, CO])("returns 409 for author %s", async (user) => {
      setInput(1, user);
      const res = await PUT(put({}), ctx);

      expect(res.status).toBe(409);
      expect(await res.json()).toEqual({
        error: "A stand-in can't lead or co-author this syllabus.",
      });
      expect(mocks.standInsCreate).not.toHaveBeenCalled();
    });

    it("returns 409 for a proxy who isn't active faculty of the program", async () => {
      mocks.activeFacultyAmong.mockResolvedValue(new Set());
      const res = await PUT(put({}), ctx);

      expect(res.status).toBe(409);
      expect(await res.json()).toEqual({
        error: "A proxy must be active faculty of the program.",
      });
      expect(mocks.activeFacultyAmong).toHaveBeenCalledWith(
        expect.anything(),
        PROGRAM,
        [TARGET],
      );
    });
  });

  describe("PocketBase errors", () => {
    it("returns 409 when a concurrent create wins the unique index", async () => {
      mocks.standInsCreate.mockRejectedValue({
        status: 400,
        response: { data: { stage: { code: "validation_not_unique" } } },
      });

      const res = await PUT(put({}), ctx);
      expect(res.status).toBe(409);
      expect(await res.json()).toEqual({
        error: "Another change finished first. Please try again.",
      });
    });

    it("delegates other errors to handlePbError", async () => {
      mocks.standInsCreate.mockRejectedValue({ status: 400 });
      const res = await PUT(put({}), ctx);
      expect(res.status).toBe(400);
      expect(handlePbError).toHaveBeenCalled();
    });

    it("propagates 404 for an unknown syllabus", async () => {
      mocks.syllabiGetOne.mockRejectedValue({ status: 404 });
      const res = await PUT(put({}), ctx);
      expect(res.status).toBe(404);
    });
  });
});
