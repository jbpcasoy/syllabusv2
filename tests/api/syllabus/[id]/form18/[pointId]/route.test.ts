import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  syllabiGetOne: vi.fn(),
  pointsGetOne: vi.fn(),
  pointsUpdate: vi.fn(),
  pointsDelete: vi.fn(),
  resolveSyllabusAccess: vi.fn(),
  loadChainHolders: vi.fn(),
  loadStandIns: vi.fn(),
  latestVersion: vi.fn(),
  parsePointUpdate: vi.fn(),
}));

vi.mock("@/lib/pocketbase", async () => {
  const { NextResponse } = await import("next/server");
  const collection = (name: string) =>
    name === "syllabi"
      ? { getOne: mocks.syllabiGetOne }
      : {
          getOne: mocks.pointsGetOne,
          update: mocks.pointsUpdate,
          delete: mocks.pointsDelete,
        };
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
vi.mock("@/lib/syllabus-chain", () => ({
  loadChainHolders: mocks.loadChainHolders,
  loadStandIns: mocks.loadStandIns,
}));
vi.mock("@/lib/syllabus-version", () => ({
  latestVersion: mocks.latestVersion,
}));
vi.mock("@/lib/form18", () => ({
  POINT_EXPAND: "raised_by,responded_by,judged_by",
  toPointResponse: (record: object) => ({ ...record, mapped: true }),
}));
vi.mock("@/lib/validators/form18", () => ({
  parsePointUpdate: mocks.parsePointUpdate,
}));
vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);
vi.mock("@/lib/roles", async () =>
  (await import("@/tests/helpers/mock-auth")).rolesModuleMock(),
);

import { DELETE, PATCH } from "@/app/api/syllabus/[id]/form18/[pointId]/route";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { mockAuth } from "@/tests/helpers/mock-auth";

const ID = "sylsylsylsylsyl";
const POINT_ID = "pntpntpntpntpnt";
const LEAD = "leadleadleadlea";
const REVIEWER = "revwrevwrevwrev";
const DEAN = "deandeandeandea";
const FDIS = "fdisfdisfdisfdi";
const OTHER = "othrothrothroth";
const HOLDERS = [[REVIEWER], [DEAN], [FDIS], ["c"], ["v"]];
const LATEST = "v2v2v2v2v2v2v2v";
const OLDER = "v1v1v1v1v1v1v1v";
const ctx = { params: Promise.resolve({ id: ID, pointId: POINT_ID }) };

const syllabus = (stage: number, status: string) => ({
  id: ID,
  program: "prg123prg123prg",
  lead: LEAD,
  co_authors: [],
  status,
  stage,
});

const point = (extra: object = {}) => ({
  id: POINT_ID,
  syllabus: ID,
  version: LATEST,
  part: "A",
  stage: 2,
  code: "",
  status: "open",
  form_revision: "01",
  ...extra,
});

function given(sylStage: number, sylStatus: string, pointExtra: object = {}) {
  mocks.syllabiGetOne.mockResolvedValue(syllabus(sylStage, sylStatus));
  mocks.pointsGetOne.mockResolvedValue(point(pointExtra));
}

function patch(data: object) {
  mocks.parsePointUpdate.mockReturnValue({ ok: true, data });
  return PATCH(
    new NextRequest(`http://localhost/api/syllabus/${ID}/form18/${POINT_ID}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
    ctx,
  );
}

const remove = () =>
  DELETE(
    new NextRequest(`http://localhost/api/syllabus/${ID}/form18/${POINT_ID}`, {
      method: "DELETE",
    }),
    ctx,
  );

const EDIT = { action: "edit", review_point: "Sharper.", code: "", remarks: "" };
const RESPOND = { action: "respond", action_taken: "Rewrote CO 2.", page_number: "4" };
const RESOLVE = { action: "judge", status: "resolved" };

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ id: DEAN });
  given(2, "submitted");
  mocks.resolveSyllabusAccess.mockResolvedValue("reviewer");
  mocks.loadChainHolders.mockResolvedValue(HOLDERS);
  mocks.loadStandIns.mockResolvedValue([]);
  mocks.latestVersion.mockResolvedValue({ id: LATEST, version_no: 2, created: "x" });
  mocks.pointsUpdate.mockImplementation(async (_id: string, data: object) => ({
    ...point(),
    ...data,
  }));
  mocks.pointsDelete.mockResolvedValue(undefined);
});

describe("PATCH /api/syllabus/:id/form18/:pointId", () => {
  describe("edit", () => {
    it("lets the raising stage edit an open point of this round", async () => {
      const res = await patch(EDIT);

      expect(res.status).toBe(200);
      expect(mocks.pointsUpdate).toHaveBeenCalledWith(
        POINT_ID,
        { review_point: "Sharper.", code: "", remarks: "" },
        { expand: "raised_by,responded_by,judged_by" },
      );
    });

    it("checks the code against the point's part", async () => {
      const res = await patch({ ...EDIT, code: "B.1" });
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({
        error: "Part A review points don't take a code.",
      });
    });

    it("returns 409 for a point from an earlier round", async () => {
      given(2, "submitted", { version: OLDER });
      expect((await patch(EDIT)).status).toBe(409);
      expect(mocks.pointsUpdate).not.toHaveBeenCalled();
    });

    it("returns 403 to the reviewer of another stage", async () => {
      mockAuth({ id: FDIS });
      expect((await patch(EDIT)).status).toBe(403);
      expect(mocks.pointsUpdate).not.toHaveBeenCalled();
    });

    it("returns 409 once the stage has passed", async () => {
      given(3, "submitted");
      mockAuth({ id: DEAN });
      expect((await patch(EDIT)).status).toBe(409);
    });
  });

  describe("respond", () => {
    it("lets the lead answer an open point while returned", async () => {
      given(2, "returned", { version: OLDER });
      mockAuth({ id: LEAD });
      mocks.resolveSyllabusAccess.mockResolvedValue("lead");

      const res = await patch(RESPOND);
      expect(res.status).toBe(200);
      expect(mocks.pointsUpdate).toHaveBeenCalledWith(
        POINT_ID,
        {
          action_taken: "Rewrote CO 2.",
          page_number: "4",
          status: "responded",
          responded_by: LEAD,
        },
        expect.anything(),
      );
    });

    it.each([
      ["a co-author", "coAuthor"],
      ["the reviewer", "reviewer"],
      ["an admin", "admin"],
    ])("returns 403 to %s", async (_label, access) => {
      given(2, "returned");
      mocks.resolveSyllabusAccess.mockResolvedValue(access);

      const res = await patch(RESPOND);
      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ error: "Only the lead can answer review points." });
    });

    it.each([
      ["still in review", 2, "submitted", {}],
      ["at another stage", 3, "returned", {}],
      ["already resolved", 2, "returned", { status: "resolved" }],
    ])("returns 409 when %s", async (_label, stage, status, extra) => {
      given(stage, status, extra);
      mockAuth({ id: LEAD });
      mocks.resolveSyllabusAccess.mockResolvedValue("lead");

      expect((await patch(RESPOND)).status).toBe(409);
      expect(mocks.pointsUpdate).not.toHaveBeenCalled();
    });
  });

  describe("judge", () => {
    it("lets the reviewer mark an answered point resolved", async () => {
      given(2, "submitted", { status: "responded", version: OLDER });

      expect((await patch(RESOLVE)).status).toBe(200);
      expect(mocks.pointsUpdate).toHaveBeenCalledWith(
        POINT_ID,
        { status: "resolved", judged_by: DEAN },
        expect.anything(),
      );
    });

    it("keeps remarks given with an unresolved judgement", async () => {
      given(2, "submitted", { status: "responded" });

      await patch({ action: "judge", status: "unresolved", remarks: "Still vague." });
      expect(mocks.pointsUpdate).toHaveBeenCalledWith(
        POINT_ID,
        { status: "unresolved", judged_by: DEAN, remarks: "Still vague." },
        expect.anything(),
      );
    });

    it("returns 409 for an unanswered point", async () => {
      expect((await patch(RESOLVE)).status).toBe(409);
      expect(mocks.pointsUpdate).not.toHaveBeenCalled();
    });

    it("lets a stand-in judge in the holder's place", async () => {
      given(2, "submitted", { status: "responded" });
      mocks.loadStandIns.mockResolvedValue([{ stage: 2, user: OTHER }]);

      mockAuth({ id: OTHER });
      expect((await patch(RESOLVE)).status).toBe(200);

      vi.clearAllMocks();
      mockAuth({ id: DEAN });
      expect((await patch(RESOLVE)).status).toBe(403);
    });
  });

  it("answers 404 for a point of another syllabus", async () => {
    mocks.pointsGetOne.mockResolvedValue(point({ syllabus: "otherotherother" }));
    expect((await patch(EDIT)).status).toBe(404);
    expect(mocks.pointsUpdate).not.toHaveBeenCalled();
  });

  it("answers 404 without access", async () => {
    mocks.resolveSyllabusAccess.mockResolvedValue(null);
    expect((await patch(EDIT)).status).toBe(404);
  });

  it("returns 400 before touching PocketBase", async () => {
    mocks.parsePointUpdate.mockReturnValue({ ok: false, error: "bad" });
    const res = await PATCH(
      new NextRequest(`http://localhost/api/syllabus/${ID}/form18/${POINT_ID}`, {
        method: "PATCH",
        body: "{nope",
      }),
      ctx,
    );
    expect(res.status).toBe(400);
    expect(mocks.parsePointUpdate).toHaveBeenCalledWith(null);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("returns 401 when signed out", async () => {
    mockAuth({ signedIn: false });
    expect((await patch(EDIT)).status).toBe(401);
  });

  it("propagates 404 from PocketBase", async () => {
    mocks.pointsGetOne.mockRejectedValue({ status: 404 });
    expect((await patch(EDIT)).status).toBe(404);
    expect(handlePbError).toHaveBeenCalled();
  });
});

describe("DELETE /api/syllabus/:id/form18/:pointId", () => {
  it("lets the raising stage delete an open point of this round", async () => {
    const res = await remove();
    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
    expect(mocks.pointsDelete).toHaveBeenCalledWith(POINT_ID);
  });

  it("returns 409 once the lead has answered it", async () => {
    given(2, "submitted", { status: "responded" });
    expect((await remove()).status).toBe(409);
    expect(mocks.pointsDelete).not.toHaveBeenCalled();
  });

  it("returns 403 to another reviewer", async () => {
    mockAuth({ id: REVIEWER });
    expect((await remove()).status).toBe(403);
    expect(mocks.pointsDelete).not.toHaveBeenCalled();
  });

  it("answers 404 without access", async () => {
    mocks.resolveSyllabusAccess.mockResolvedValue(null);
    expect((await remove()).status).toBe(404);
  });

  it("returns 401 when signed out", async () => {
    mockAuth({ signedIn: false });
    expect((await remove()).status).toBe(401);
  });
});
