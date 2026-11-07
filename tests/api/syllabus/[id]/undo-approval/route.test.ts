import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  syllabiGetOne: vi.fn(),
  reviewsGetList: vi.fn(),
  loadChainHolders: vi.fn(),
  loadStandIns: vi.fn(),
  parseUndoApprovalInput: vi.fn(),
  batchOps: [] as unknown[][],
  batchSend: vi.fn(),
}));

vi.mock("@/lib/pocketbase", async () => {
  const { NextResponse } = await import("next/server");
  const collection = (name: string) =>
    name === "syllabus_reviews"
      ? { getList: mocks.reviewsGetList }
      : { getOne: mocks.syllabiGetOne };
  const batch = {
    collection: (name: string) => ({
      create: (body: unknown) => mocks.batchOps.push(["create", name, body]),
      update: (id: string, body: unknown) =>
        mocks.batchOps.push(["update", name, id, body]),
      delete: (id: string) => mocks.batchOps.push(["delete", name, id]),
    }),
    send: mocks.batchSend,
  };
  return {
    createAdminPb: vi.fn(async () => ({
      collection,
      createBatch: () => batch,
      filter: (expr: string, params: Record<string, unknown>) =>
        `${expr} ${JSON.stringify(params)}`,
    })),
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
vi.mock("@/lib/validators/undo-approval", () => ({
  parseUndoApprovalInput: mocks.parseUndoApprovalInput,
}));
vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);
vi.mock("@/lib/roles", async () =>
  (await import("@/tests/helpers/mock-auth")).rolesModuleMock(),
);

import { POST } from "@/app/api/syllabus/[id]/undo-approval/route";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { mockAuth, requireUserMock } from "@/tests/helpers/mock-auth";

const ID = "sylsylsylsylsyl";
const PROGRAM = "prg123prg123prg";
const ME = "adminadminadmin";
const LEAD = "leadleadleadlea";
const DEAN = "deandeandeandea";
const REVIEW = "rvwrvwrvwrvwrvw";
const VERSION = "ververververver";
const NOW = "2026-11-07T08:00:00.000Z";
const REASON = "Approved by mistake, re-check.";
const ctx = { params: Promise.resolve({ id: ID }) };

const syllabus = (status = "submitted", stage = 3) => ({
  id: ID,
  program: PROGRAM,
  lead: LEAD,
  co_authors: [],
  status,
  stage,
  expand: {
    course: { code: "IT 101", title: "Intro to Computing" },
    program: { code: "BSIT" },
  },
});
const approval = (stage = 2) => ({
  id: REVIEW,
  syllabus: ID,
  version: VERSION,
  stage,
  reviewer: DEAN,
  acting_as: "holder",
  decision: "approve",
  approval_code: `SYL-2627-1-0042-S${stage}`,
  created: "2026-11-01 02:00:00.000Z",
});

const post = () =>
  POST(
    new NextRequest(`http://localhost/api/syllabus/${ID}/undo-approval`, {
      method: "POST",
      body: JSON.stringify({ reason: REASON }),
    }),
    ctx,
  );

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date(NOW));
  mocks.batchOps.length = 0;
  mockAuth({ id: ME, isAdmin: true });
  mocks.parseUndoApprovalInput.mockReturnValue({
    ok: true,
    data: { reason: REASON },
  });
  mocks.syllabiGetOne
    .mockResolvedValueOnce(syllabus())
    .mockResolvedValue({ ...syllabus("submitted", 2), refreshed: true });
  mocks.reviewsGetList.mockResolvedValue({ items: [approval()] });
  mocks.loadChainHolders.mockResolvedValue([
    ["prevprevprevpre"],
    [DEAN],
    ["fdisfdisfdisfdi"],
    ["citlcitlcitlcit"],
    ["vpaavpaavpaavpa"],
  ]);
  mocks.loadStandIns.mockResolvedValue([]);
  mocks.batchSend.mockResolvedValue([]);
});

describe("POST /api/syllabus/:id/undo-approval", () => {
  it("deletes the approval, moves the syllabus back, logs and notifies in one batch", async () => {
    const res = await post();

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      status: "submitted",
      stage: 2,
      access: "admin",
      mapped: true,
    });
    expect(requireUserMock).toHaveBeenCalledWith("syllabus.undoApproval");
    expect(mocks.reviewsGetList).toHaveBeenCalledWith(1, 1, {
      skipTotal: true,
      sort: "-created",
      filter: `syllabus = {:id} && stage = {:stage} && decision = 'approve' ${JSON.stringify({ id: ID, stage: 2 })}`,
    });
    expect(mocks.batchSend).toHaveBeenCalledTimes(1);
    expect(mocks.batchOps).toEqual([
      ["delete", "syllabus_reviews", REVIEW],
      [
        "update",
        "syllabi",
        ID,
        { status: "submitted", stage: 2, status_changed_at: NOW },
      ],
      [
        "create",
        "syllabus_events",
        {
          syllabus: ID,
          type: "approval_undone",
          actor: ME,
          stage: 2,
          version: VERSION,
          approval_code: "",
          reason: REASON,
        },
      ],
      [
        "create",
        "audit_log",
        {
          actor: ME,
          action: "approval_undone",
          target_collection: "syllabi",
          target_id: ID,
          syllabus: ID,
          override: true,
          reason: REASON,
          data: {
            undone_review: {
              id: REVIEW,
              version: VERSION,
              stage: 2,
              reviewer: DEAN,
              acting_as: "holder",
              approval_code: "SYL-2627-1-0042-S2",
              created: "2026-11-01 02:00:00.000Z",
            },
            from: { status: "submitted", stage: 3 },
            to: { status: "submitted", stage: 2 },
            version: VERSION,
          },
        },
      ],
      [
        "create",
        "notifications",
        expect.objectContaining({
          user: DEAN,
          kind: "approval_undone",
          stage: 2,
          actor: ME,
          link: `/syllabus/${ID}`,
          email_status: "pending",
        }),
      ],
      [
        "create",
        "notifications",
        expect.objectContaining({ user: LEAD, kind: "approval_undone", stage: 2 }),
      ],
    ]);
    const body = (mocks.batchOps[4][2] as { body: string }).body;
    expect(body).toContain('Reason: "Approved by mistake, re-check."');
  });

  it("undoes the final approval of an approved syllabus", async () => {
    mocks.syllabiGetOne.mockReset().mockResolvedValue(syllabus("approved", 5));
    mocks.reviewsGetList.mockResolvedValue({ items: [approval(5)] });

    const res = await post();

    expect(res.status).toBe(200);
    expect(mocks.batchOps[1]).toEqual([
      "update",
      "syllabi",
      ID,
      { status: "submitted", stage: 5, status_changed_at: NOW },
    ]);
  });

  it("returns 400 with the validator's error", async () => {
    mocks.parseUndoApprovalInput.mockReturnValue({
      ok: false,
      error: "Give a reason for undoing the approval",
    });

    const res = await post();

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "Give a reason for undoing the approval",
    });
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("passes malformed JSON to the validator as null", async () => {
    mocks.parseUndoApprovalInput.mockReturnValue({ ok: false, error: "bad" });

    await POST(
      new NextRequest(`http://localhost/api/syllabus/${ID}/undo-approval`, {
        method: "POST",
        body: "{not json",
      }),
      ctx,
    );

    expect(mocks.parseUndoApprovalInput).toHaveBeenCalledWith(null);
  });

  it("returns 401 when signed out", async () => {
    mockAuth({ signedIn: false });

    const res = await post();

    expect(res.status).toBe(401);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it.each([
    ["VPAA", { isVpaa: true }],
    ["dean", { deanOfColleges: ["col123col123col"] }],
    ["program reviewer", { reviewerOfPrograms: [PROGRAM] }],
    ["program chair", { chairOfPrograms: [PROGRAM] }],
  ])("returns 403 for a %s, touching nothing", async (_label, roles) => {
    mockAuth({
      id: ME,
      roles,
      scope: { programId: PROGRAM, collegeId: "col123col123col" },
    });

    const res = await post();

    expect(res.status).toBe(403);
    expect(createAdminPb).not.toHaveBeenCalled();
    expect(mocks.parseUndoApprovalInput).not.toHaveBeenCalled();
  });

  it("propagates a 404 for a missing syllabus", async () => {
    mocks.syllabiGetOne.mockReset().mockRejectedValue({ status: 404 });

    const res = await post();

    expect(res.status).toBe(404);
    expect(handlePbError).toHaveBeenCalled();
    expect(mocks.batchSend).not.toHaveBeenCalled();
  });

  it("delegates a failed batch to handlePbError", async () => {
    const error = { status: 400, response: { data: {} } };
    mocks.batchSend.mockRejectedValue(error);

    const res = await post();

    expect(res.status).toBe(400);
    expect(handlePbError).toHaveBeenCalledWith(error);
  });

  it.each([
    [
      "filed",
      5,
      "Return the signed copy as invalid before undoing the final approval.",
    ],
    [
      "returned",
      2,
      "This syllabus is with its lead for revision. Undo an approval after it is resubmitted.",
    ],
    ["submitted", 1, "There is no approval to undo."],
    ["draft", 0, "There is no approval to undo."],
  ])("returns 409 for a %s syllabus at stage %i", async (status, stage, error) => {
    mocks.syllabiGetOne.mockReset().mockResolvedValue(syllabus(status, stage));

    const res = await post();

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error });
    expect(mocks.reviewsGetList).not.toHaveBeenCalled();
    expect(mocks.batchSend).not.toHaveBeenCalled();
  });

  it("returns 409 when the approval to undo isn't on record", async () => {
    mocks.reviewsGetList.mockResolvedValue({ items: [] });

    const res = await post();

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      error: "No stage 2 approval is on record. Check the syllabus's review records.",
    });
    expect(mocks.batchSend).not.toHaveBeenCalled();
  });
});
