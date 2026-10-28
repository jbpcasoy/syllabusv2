import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  syllabiGetOne: vi.fn(),
  resolveSyllabusAccess: vi.fn(),
  loadChainHolders: vi.fn(),
  loadStandIns: vi.fn(),
  ensureRefSeq: vi.fn(),
  loadFormFacts: vi.fn(),
  recordDecision: vi.fn(),
  latestVersion: vi.fn(),
  parseReviewInput: vi.fn(),
}));

vi.mock("@/lib/pocketbase", async () => {
  const { NextResponse } = await import("next/server");
  const collection = () => ({ getOne: mocks.syllabiGetOne });
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
  SYLLABUS_EXPAND: "course,term.school_year,program,lead,co_authors",
  resolveSyllabusAccess: mocks.resolveSyllabusAccess,
  toSyllabusResponse: (record: object, access?: string) => ({
    ...record,
    access,
    mapped: true,
  }),
}));
vi.mock("@/lib/syllabus-chain", () => ({
  loadChainHolders: mocks.loadChainHolders,
  loadStandIns: mocks.loadStandIns,
}));
vi.mock("@/lib/syllabus-decision", () => ({
  ensureRefSeq: mocks.ensureRefSeq,
  loadFormFacts: mocks.loadFormFacts,
  recordDecision: mocks.recordDecision,
}));
vi.mock("@/lib/syllabus-version", () => ({
  latestVersion: mocks.latestVersion,
}));
vi.mock("@/lib/validators/syllabus-review", () => ({
  parseReviewInput: mocks.parseReviewInput,
}));
vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);
vi.mock("@/lib/roles", async () =>
  (await import("@/tests/helpers/mock-auth")).rolesModuleMock(),
);

import { POST } from "@/app/api/syllabus/[id]/review/route";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { mockAuth } from "@/tests/helpers/mock-auth";

const ID = "sylsylsylsylsyl";
const LEAD = "leadleadleadlea";
const CO = "cocococococococ";
const REVIEWER = "revwrevwrevwrev";
const DEAN = "deandeandeandea";
const FDIS = "fdisfdisfdisfdi";
const CITL = "citlcitlcitlcit";
const VPAA = "vpaavpaavpaavpa";
const PROXY = "proxyproxyproxy";
const OTHER = "othrothrothroth";
const BY_STAGE = [REVIEWER, DEAN, FDIS, CITL, VPAA];
const HOLDERS = BY_STAGE.map((id) => [id]);
const VERSION = { id: "ververververver", version_no: 2, created: "x" };
const NOW = "2026-10-27T08:00:00.000Z";
const ctx = { params: Promise.resolve({ id: ID }) };

const syllabus = (stage = 1, status = "submitted", extra: object = {}) => ({
  id: ID,
  program: "prg123prg123prg",
  term: "trm123trm123trm",
  lead: LEAD,
  co_authors: [CO],
  status,
  stage,
  ref_seq: 0,
  expand: {
    term: {
      semester: "First Semester",
      expand: { school_year: { label: "2026-2027" } },
    },
    course: { code: "IT 101", title: "Intro to Computing" },
    program: { code: "BSIT" },
  },
  ...extra,
});

const NO_POINTS = {
  form17Complete: true,
  form17HasNo: false,
  pendingPoints: 0,
  openPoints: 0,
  unjudgedPoints: 0,
  unansweredPoints: 0,
  unresolvedIds: [] as string[],
};

function decide(decision: "approve" | "return") {
  mocks.parseReviewInput.mockReturnValue({ ok: true, data: { decision } });
  return POST(
    new NextRequest(`http://localhost/api/syllabus/${ID}/review`, {
      method: "POST",
      body: JSON.stringify({ decision }),
    }),
    ctx,
  );
}

/** The syllabus as loaded for the decision; reloads return `after`. */
function loads(before: object, after: object = { id: ID, reloaded: true }) {
  mocks.syllabiGetOne.mockImplementation(
    async (_id: string, options: { expand: string }) =>
      options.expand === "term.school_year,course,program" ? before : after,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date(NOW));
  mockAuth({ id: REVIEWER });
  loads(syllabus());
  mocks.resolveSyllabusAccess.mockResolvedValue("reviewer");
  mocks.loadChainHolders.mockResolvedValue(HOLDERS);
  mocks.loadStandIns.mockResolvedValue([]);
  mocks.ensureRefSeq.mockResolvedValue(7);
  mocks.loadFormFacts.mockResolvedValue(NO_POINTS);
  mocks.recordDecision.mockResolvedValue("ok");
  mocks.latestVersion.mockResolvedValue(VERSION);
});

describe("POST /api/syllabus/:id/review", () => {
  describe("approve", () => {
    it("moves stage 1 on and issues an approval code", async () => {
      const res = await decide("approve");

      expect(res.status).toBe(200);
      expect(mocks.recordDecision).toHaveBeenCalledWith(expect.anything(), {
        syllabusId: ID,
        versionId: VERSION.id,
        stage: 1,
        reviewer: REVIEWER,
        actingAs: "holder",
        decision: "approve",
        approvalCode: "SYL-2627-1-0007-S1",
        next: { status: "submitted", stage: 2 },
        now: NOW,
        reopenPointIds: [],
        notify: {
          targets: [
            { user: DEAN, kind: "review_requested", stage: 2 },
            { user: LEAD, kind: "approved", stage: 1 },
          ],
          facts: {
            courseCode: "IT 101",
            courseTitle: "Intro to Computing",
            programCode: "BSIT",
            // The mocked session user has no name.
            actorName: "Someone",
          },
        },
      });
      expect(mocks.loadFormFacts).toHaveBeenCalledWith(expect.anything(), {
        syllabusId: ID,
        versionId: VERSION.id,
        stage: 1,
      });
      expect(await res.json()).toEqual({
        syllabus: { id: ID, reloaded: true, access: "reviewer", mapped: true },
        review: {
          stage: 1,
          decision: "approve",
          acting_as: "holder",
          approval_code: "SYL-2627-1-0007-S1",
        },
      });
    });

    it.each([2, 3, 4])("lets the stage %i holder move it on", async (stage) => {
      mockAuth({ id: BY_STAGE[stage - 1] });
      loads(syllabus(stage));

      const res = await decide("approve");
      expect(res.status).toBe(200);
      expect(mocks.recordDecision).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          stage,
          approvalCode: `SYL-2627-1-0007-S${stage}`,
          next: { status: "submitted", stage: stage + 1 },
        }),
      );
    });

    it("approves the syllabus at the VPAA's stage", async () => {
      mockAuth({ id: VPAA });
      loads(syllabus(5));

      await decide("approve");
      expect(mocks.recordDecision).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          approvalCode: "SYL-2627-1-0007-S5",
          next: { status: "approved", stage: 5 },
        }),
      );
      expect(mocks.recordDecision.mock.calls[0][1].notify.targets).toEqual([
        { user: LEAD, kind: "final_approved", stage: 5 },
        { user: CO, kind: "final_approved", stage: 5 },
      ]);
    });

    it.each([
      [{ form17Complete: false }, "Answer every Form 17 criterion before approving."],
      [{ form17HasNo: true }, 'Form 17 has a "No". Return the syllabus for revision instead.'],
      [{ pendingPoints: 1 }, "Settle every review point at this stage before approving."],
    ])("returns 409 when the forms aren't settled (%o)", async (facts, error) => {
      mocks.loadFormFacts.mockResolvedValue({ ...NO_POINTS, ...facts });

      const res = await decide("approve");
      expect(res.status).toBe(409);
      expect(await res.json()).toEqual({ error });
      expect(mocks.ensureRefSeq).not.toHaveBeenCalled();
      expect(mocks.recordDecision).not.toHaveBeenCalled();
    });
  });

  describe("return", () => {
    it("returns the syllabus at its stage without a code", async () => {
      mockAuth({ id: DEAN });
      loads(syllabus(2));
      mocks.loadFormFacts.mockResolvedValue({ ...NO_POINTS, openPoints: 2 });

      const res = await decide("return");
      expect(res.status).toBe(200);
      expect(mocks.recordDecision).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          decision: "return",
          approvalCode: "",
          next: { status: "returned", stage: 2 },
          now: NOW,
        }),
      );
      expect(mocks.recordDecision.mock.calls[0][1].notify.targets).toEqual([
        { user: LEAD, kind: "returned", stage: 2 },
        { user: CO, kind: "returned", stage: 2 },
      ]);
      expect(mocks.ensureRefSeq).not.toHaveBeenCalled();
    });

    it("re-opens unresolved points with the return", async () => {
      mocks.loadFormFacts.mockResolvedValue({
        ...NO_POINTS,
        openPoints: 1,
        unresolvedIds: ["p1p1p1p1p1p1p1p"],
      });

      expect((await decide("return")).status).toBe(200);
      expect(mocks.recordDecision).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ reopenPointIds: ["p1p1p1p1p1p1p1p"] }),
      );
    });

    it("never re-opens points on an approval", async () => {
      await decide("approve");
      expect(mocks.recordDecision).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ reopenPointIds: [] }),
      );
    });

    it("returns 409 while answered points are unjudged", async () => {
      mocks.loadFormFacts.mockResolvedValue({
        ...NO_POINTS,
        openPoints: 1,
        unjudgedPoints: 1,
      });

      const res = await decide("return");
      expect(res.status).toBe(409);
      expect(await res.json()).toEqual({
        error: "Mark every answered review point resolved or unresolved before returning.",
      });
    });

    it("returns 409 without an open review point", async () => {
      const res = await decide("return");
      expect(res.status).toBe(409);
      expect(await res.json()).toEqual({
        error: "Add at least one Form 18-1 review point before returning.",
      });
      expect(mocks.recordDecision).not.toHaveBeenCalled();
    });
  });

  describe("stand-ins", () => {
    it("lets the proxy decide stage 1 and shuts out the program reviewer", async () => {
      mocks.loadStandIns.mockResolvedValue([{ stage: 1, user: PROXY }]);

      mockAuth({ id: PROXY });
      expect((await decide("approve")).status).toBe(200);
      expect(mocks.recordDecision).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ actingAs: "proxy", reviewer: PROXY }),
      );

      vi.clearAllMocks();
      mockAuth({ id: REVIEWER });
      expect((await decide("approve")).status).toBe(403);
      expect(mocks.recordDecision).not.toHaveBeenCalled();
    });

    it("lets a later-stage stand-in decide", async () => {
      loads(syllabus(3));
      mocks.loadStandIns.mockResolvedValue([{ stage: 3, user: OTHER }]);
      mockAuth({ id: OTHER });

      expect((await decide("approve")).status).toBe(200);
      expect(mocks.recordDecision).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ actingAs: "standIn", stage: 3 }),
      );
    });

    it("asks the next stage's stand-in instead of its holder", async () => {
      loads(syllabus(2));
      mocks.loadStandIns.mockResolvedValue([{ stage: 3, user: OTHER }]);
      mockAuth({ id: DEAN });

      await decide("approve");
      expect(mocks.recordDecision.mock.calls[0][1].notify.targets).toEqual([
        { user: OTHER, kind: "review_requested", stage: 3 },
        { user: LEAD, kind: "approved", stage: 2 },
      ]);
    });
  });

  describe("who may decide", () => {
    it("returns 401 when signed out", async () => {
      mockAuth({ signedIn: false });
      const res = await decide("approve");
      expect(res.status).toBe(401);
      expect(createAdminPb).not.toHaveBeenCalled();
    });

    it("answers 404 to a caller without access", async () => {
      mockAuth({ id: OTHER });
      mocks.resolveSyllabusAccess.mockResolvedValue(null);

      const res = await decide("approve");
      expect(res.status).toBe(404);
      expect(mocks.recordDecision).not.toHaveBeenCalled();
    });

    it.each([
      ["leads", { lead: REVIEWER }],
      ["co-authors", { co_authors: [REVIEWER] }],
    ])("blocks a program reviewer who %s it", async (_label, authors) => {
      loads(syllabus(1, "submitted", authors));
      mocks.resolveSyllabusAccess.mockResolvedValue("lead");

      const res = await decide("approve");
      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({
        error:
          "You can't review a syllabus you lead or co-author. A stand-in must be assigned for this stage.",
      });
      expect(mocks.recordDecision).not.toHaveBeenCalled();
    });

    it.each([
      ["a holder of another stage", DEAN, "reviewer"],
      ["an admin without a stand-in", OTHER, "admin"],
      ["a referencer", OTHER, "referencer"],
      ["the lead", LEAD, "lead"],
    ])("returns 403 to %s", async (_label, user, access) => {
      mockAuth({ id: user, isAdmin: access === "admin" });
      mocks.resolveSyllabusAccess.mockResolvedValue(access);

      const res = await decide("approve");
      expect(res.status).toBe(403);
      expect(mocks.latestVersion).not.toHaveBeenCalled();
      expect(mocks.recordDecision).not.toHaveBeenCalled();
    });

    it.each(["draft", "returned", "approved", "filed"])(
      "returns 409 while %s",
      async (status) => {
        loads(syllabus(status === "draft" ? 0 : 2, status));

        const res = await decide("approve");
        expect(res.status).toBe(409);
        expect(await res.json()).toEqual({
          error: "Only a syllabus in review can be approved.",
        });
        expect(mocks.recordDecision).not.toHaveBeenCalled();
      },
    );
  });

  describe("validation", () => {
    it("returns 400 with the validator's error before touching PocketBase", async () => {
      mocks.parseReviewInput.mockReturnValue({ ok: false, error: "bad" });
      const res = await POST(
        new NextRequest(`http://localhost/api/syllabus/${ID}/review`, {
          method: "POST",
          body: JSON.stringify({ decision: "reject" }),
        }),
        ctx,
      );
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: "bad" });
      expect(createAdminPb).not.toHaveBeenCalled();
    });

    it("passes malformed JSON to the validator as null", async () => {
      mocks.parseReviewInput.mockReturnValue({ ok: false, error: "x" });
      await POST(
        new NextRequest(`http://localhost/api/syllabus/${ID}/review`, {
          method: "POST",
          body: "{nope",
        }),
        ctx,
      );
      expect(mocks.parseReviewInput).toHaveBeenCalledWith(null);
    });
  });

  describe("concurrency and errors", () => {
    it("returns 409 when another decision on the stage won", async () => {
      mocks.recordDecision.mockResolvedValue("conflict");

      const res = await decide("approve");
      expect(res.status).toBe(409);
      expect(await res.json()).toEqual({
        error: "Another decision on this stage finished first.",
      });
    });

    it("propagates 404 for an unknown syllabus", async () => {
      mocks.syllabiGetOne.mockRejectedValue({ status: 404 });
      const res = await decide("approve");
      expect(res.status).toBe(404);
    });

    it("delegates write errors to handlePbError", async () => {
      mocks.recordDecision.mockRejectedValue({ status: 400 });
      const res = await decide("approve");
      expect(res.status).toBe(400);
      expect(handlePbError).toHaveBeenCalled();
    });
  });
});
