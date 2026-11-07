import {
  CHAIN_ROLES,
  FINAL_STAGE,
  INITIAL_STATE,
  SYLLABUS_STATUSES,
  transition,
  undoableStage,
  type ApproveEvent,
  type FileEvent,
  type RejectScanEvent,
  type ResubmitEvent,
  type ReturnEvent,
  type SubmitEvent,
  type UndoApprovalEvent,
  type WorkflowEvent,
  type WorkflowState,
} from "@/lib/syllabus-workflow";
import { describe, expect, it } from "vitest";

const DRAFT: WorkflowState = { status: "draft", stage: 0 };
const READY: SubmitEvent = {
  type: "submit",
  hasVersion: true,
  termOpen: true,
  missingRoles: [],
};

const inReview = (stage: number): WorkflowState => ({ status: "submitted", stage });
const returnedAt = (stage: number): WorkflowState => ({ status: "returned", stage });
const APPROVED: WorkflowState = { status: "approved", stage: 5 };
const FILED: WorkflowState = { status: "filed", stage: 5 };

const approve = (actorStage: number | null): ApproveEvent => ({
  type: "approve",
  actorStage,
  form17Complete: true,
  form17HasNo: false,
  pendingPoints: 0,
});
const giveBack = (actorStage: number | null): ReturnEvent => ({
  type: "return",
  actorStage,
  openPoints: 1,
  unjudgedPoints: 0,
});
const RESUBMIT: ResubmitEvent = {
  type: "resubmit",
  newVersionSinceReturn: true,
  unansweredPoints: 0,
  termOpen: true,
  missingRoles: [],
};
const FILE: FileEvent = { type: "file", hasScan: true };
const REJECT_SCAN: RejectScanEvent = { type: "rejectScan" };
const UNDO: UndoApprovalEvent = { type: "undoApproval", approvalFound: true };

const STAGES = [1, 2, 3, 4, 5];

function expectError(result: ReturnType<typeof transition>, error: string) {
  expect(result).toEqual({ ok: false, error });
}

describe("transition: submit", () => {
  it("moves a ready draft to stage 1", () => {
    expect(transition(DRAFT, READY)).toEqual({
      ok: true,
      next: { status: "submitted", stage: 1 },
    });
  });

  it("rejects a syllabus that is already submitted", () => {
    expectError(
      transition(inReview(1), READY),
      "Only a draft syllabus can be submitted.",
    );
  });

  it("requires an uploaded version", () => {
    expectError(
      transition(DRAFT, { ...READY, hasVersion: false }),
      "Upload a PDF version before submitting.",
    );
  });

  it("requires an open term", () => {
    expectError(
      transition(DRAFT, { ...READY, termOpen: false }),
      "This term is closed for submissions.",
    );
  });

  it("names every missing reviewer role in chain order", () => {
    expectError(
      transition(DRAFT, {
        ...READY,
        missingRoles: ["vpaa", "programReviewer", "dean"],
      }),
      "The review chain is incomplete. No active Program Reviewer, Dean, VPAA.",
    );
  });

  it("reports the status problem before any other", () => {
    const result = transition(inReview(1), {
      type: "submit",
      hasVersion: false,
      termOpen: false,
      missingRoles: ["vpaa"],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/Only a draft/);
  });

  it("does not mutate its input", () => {
    const state = { ...DRAFT };
    const event = { ...READY, missingRoles: ["dean" as const, "vpaa" as const] };
    transition(state, event);
    expect(state).toEqual(DRAFT);
    expect(event.missingRoles).toEqual(["dean", "vpaa"]);
  });
});

describe("transition: approve", () => {
  it.each([1, 2, 3, 4])("moves stage %i on to the next stage", (stage) => {
    expect(transition(inReview(stage), approve(stage))).toEqual({
      ok: true,
      next: { status: "submitted", stage: stage + 1 },
    });
  });

  it("approves the syllabus at stage 5 and keeps the stage", () => {
    expect(transition(inReview(5), approve(5))).toEqual({
      ok: true,
      next: { status: "approved", stage: 5 },
    });
  });

  it.each([DRAFT, returnedAt(3), APPROVED, FILED])(
    "rejects a syllabus that is not in review (%o)",
    (state) => {
      expectError(
        transition(state, approve(state.stage)),
        "Only a syllabus in review can be approved.",
      );
    },
  );

  it.each([
    [3, null],
    [3, 2],
    [3, 4],
    [1, 5],
  ])("rejects a caller who is not the reviewer at stage %i (actor %o)", (stage, actor) => {
    expectError(
      transition(inReview(stage), approve(actor)),
      "You are not the reviewer at this stage.",
    );
  });

  it("requires every Form 17 criterion answered", () => {
    expectError(
      transition(inReview(1), { ...approve(1), form17Complete: false }),
      "Answer every Form 17 criterion before approving.",
    );
  });

  it.each(STAGES)("blocks approval at stage %i while Form 17 has a No", (stage) => {
    expectError(
      transition(inReview(stage), { ...approve(stage), form17HasNo: true }),
      'Form 17 has a "No". Return the syllabus for revision instead.',
    );
  });

  it("blocks approval while review points at the stage are unsettled", () => {
    expectError(
      transition(inReview(4), { ...approve(4), pendingPoints: 2 }),
      "Settle every review point at this stage before approving.",
    );
  });

  it("checks the reviewer before the forms", () => {
    const result = transition(inReview(2), {
      type: "approve",
      actorStage: 1,
      form17Complete: false,
      form17HasNo: true,
      pendingPoints: 3,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/not the reviewer/);
  });
});

describe("transition: return", () => {
  it.each(STAGES)("returns a syllabus at stage %i and remembers the stage", (stage) => {
    expect(transition(inReview(stage), giveBack(stage))).toEqual({
      ok: true,
      next: { status: "returned", stage },
    });
  });

  it.each([DRAFT, returnedAt(2), APPROVED, FILED])(
    "rejects a syllabus that is not in review (%o)",
    (state) => {
      expectError(
        transition(state, giveBack(state.stage)),
        "Only a syllabus in review can be returned.",
      );
    },
  );

  it("rejects a caller who is not the reviewer at the stage", () => {
    expectError(
      transition(inReview(5), giveBack(4)),
      "You are not the reviewer at this stage.",
    );
    expectError(
      transition(inReview(5), giveBack(null)),
      "You are not the reviewer at this stage.",
    );
  });

  it("requires at least one open Form 18-1 review point", () => {
    expectError(
      transition(inReview(2), { ...giveBack(2), openPoints: 0 }),
      "Add at least one Form 18-1 review point before returning.",
    );
  });

  it("requires every answered point judged first", () => {
    expectError(
      transition(inReview(2), { ...giveBack(2), unjudgedPoints: 1 }),
      "Mark every answered review point resolved or unresolved before returning.",
    );
  });

  it("reports unjudged points before missing ones", () => {
    const result = transition(inReview(2), {
      ...giveBack(2),
      openPoints: 0,
      unjudgedPoints: 2,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/resolved or unresolved/);
  });
});

describe("transition: resubmit", () => {
  it.each(STAGES)("resumes at the returning stage %i", (stage) => {
    expect(transition(returnedAt(stage), RESUBMIT)).toEqual({
      ok: true,
      next: { status: "submitted", stage },
    });
  });

  it.each([DRAFT, inReview(3), APPROVED, FILED])(
    "rejects a syllabus that is not returned (%o)",
    (state) => {
      expectError(
        transition(state, RESUBMIT),
        "Only a returned syllabus can be resubmitted.",
      );
    },
  );

  it("requires an open term", () => {
    expectError(
      transition(returnedAt(2), { ...RESUBMIT, termOpen: false }),
      "This term is closed for submissions.",
    );
  });

  it("requires a version uploaded after the return", () => {
    expectError(
      transition(returnedAt(2), { ...RESUBMIT, newVersionSinceReturn: false }),
      "Upload a new version before resubmitting.",
    );
  });

  it("requires a response to every open review point", () => {
    expectError(
      transition(returnedAt(2), { ...RESUBMIT, unansweredPoints: 1 }),
      "Respond to every open review point before resubmitting.",
    );
  });

  it("requires a complete review chain", () => {
    expectError(
      transition(returnedAt(4), { ...RESUBMIT, missingRoles: ["fdisChair"] }),
      "The review chain is incomplete. No active FDIS Chair.",
    );
  });
});

describe("transition: file", () => {
  it("files an approved syllabus with a signed scan", () => {
    expect(transition(APPROVED, FILE)).toEqual({
      ok: true,
      next: FILED,
    });
  });

  it.each([DRAFT, inReview(5), returnedAt(5), FILED])(
    "rejects a syllabus that is not approved (%o)",
    (state) => {
      expectError(
        transition(state, FILE),
        "Only an approved syllabus can be filed.",
      );
    },
  );

  it("requires the signed scan", () => {
    expectError(
      transition(APPROVED, { type: "file", hasScan: false }),
      "Upload the signed copy before filing.",
    );
  });
});

describe("transition: rejectScan", () => {
  it("moves a filed syllabus back to approved", () => {
    expect(transition(FILED, REJECT_SCAN)).toEqual({
      ok: true,
      next: APPROVED,
    });
  });

  it.each([DRAFT, inReview(5), returnedAt(5), APPROVED])(
    "rejects a syllabus that is not filed (%o)",
    (state) => {
      expectError(
        transition(state, REJECT_SCAN),
        "Only a filed syllabus can have its signed copy returned.",
      );
    },
  );
});

describe("transition: undoApproval", () => {
  it.each([2, 3, 4, 5])("moves a syllabus waiting at stage %i back one stage", (stage) => {
    expect(transition(inReview(stage), UNDO)).toEqual({
      ok: true,
      next: inReview(stage - 1),
    });
  });

  it("moves an approved syllabus back to waiting on the final stage", () => {
    expect(transition(APPROVED, UNDO)).toEqual({ ok: true, next: inReview(5) });
  });

  it("refuses a filed syllabus until its signed copy is returned", () => {
    expectError(
      transition(FILED, UNDO),
      "Return the signed copy as invalid before undoing the final approval.",
    );
  });

  it.each(STAGES)("refuses a syllabus returned at stage %i", (stage) => {
    expectError(
      transition(returnedAt(stage), UNDO),
      "This syllabus is with its lead for revision. Undo an approval after it is resubmitted.",
    );
  });

  it.each([DRAFT, inReview(1)])("refuses %o, which has no approval", (state) => {
    expectError(transition(state, UNDO), "There is no approval to undo.");
  });

  it("refuses when the approval to undo isn't on record", () => {
    expectError(
      transition(inReview(3), { type: "undoApproval", approvalFound: false }),
      "No stage 2 approval is on record. Check the syllabus's review records.",
    );
  });

  it("names the stage each state would undo", () => {
    expect(undoableStage(DRAFT)).toBeNull();
    expect(undoableStage(inReview(1))).toBeNull();
    expect(undoableStage(inReview(2))).toBe(1);
    expect(undoableStage(inReview(5))).toBe(4);
    expect(undoableStage(returnedAt(3))).toBeNull();
    expect(undoableStage(APPROVED)).toBe(5);
    expect(undoableStage(FILED)).toBeNull();
  });

  it("lets the undone stage approve again", () => {
    const undone = transition(inReview(3), UNDO);
    expect(undone.ok && transition(undone.next, approve(2))).toEqual({
      ok: true,
      next: inReview(3),
    });
  });
});

describe("transition: every state and event", () => {
  // Each state with the events it accepts when every fact is favourable.
  const STATES: [WorkflowState, WorkflowEvent["type"][]][] = [
    [DRAFT, ["submit"]],
    ...STAGES.map((s): [WorkflowState, WorkflowEvent["type"][]] => [
      inReview(s),
      s === 1 ? ["approve", "return"] : ["approve", "return", "undoApproval"],
    ]),
    ...STAGES.map(
      (s): [WorkflowState, WorkflowEvent["type"][]] => [returnedAt(s), ["resubmit"]],
    ),
    [APPROVED, ["file", "undoApproval"]],
    [FILED, ["rejectScan"]],
  ];
  const favourable = (state: WorkflowState): WorkflowEvent[] => [
    READY,
    approve(state.stage),
    giveBack(state.stage),
    RESUBMIT,
    FILE,
    REJECT_SCAN,
    UNDO,
  ];

  it.each(STATES)("%o accepts exactly %o", (state, allowed) => {
    const accepted = favourable(state)
      .filter((event) => transition(state, event).ok)
      .map((event) => event.type);
    expect(accepted).toEqual(allowed);
  });

  it("never leaves the stage range", () => {
    for (const [state] of STATES) {
      for (const event of favourable(state)) {
        const result = transition(state, event);
        if (!result.ok) continue;
        expect(result.next.stage).toBeGreaterThanOrEqual(1);
        expect(result.next.stage).toBeLessThanOrEqual(FINAL_STAGE);
      }
    }
  });

  it("walks a syllabus through all six stages with one return", () => {
    let state = transition(DRAFT, READY);
    for (const stage of [1, 2]) {
      if (!state.ok) break;
      state = transition(state.next, approve(stage));
    }
    expect(state).toEqual({ ok: true, next: inReview(3) });
    if (!state.ok) return;
    state = transition(state.next, giveBack(3));
    if (!state.ok) return;
    state = transition(state.next, RESUBMIT);
    expect(state).toEqual({ ok: true, next: inReview(3) });
    for (const stage of [3, 4, 5]) {
      if (!state.ok) break;
      state = transition(state.next, approve(stage));
    }
    expect(state).toEqual({ ok: true, next: APPROVED });
    if (!state.ok) return;
    expect(transition(state.next, FILE)).toEqual({ ok: true, next: FILED });
  });
});

describe("constants", () => {
  it("lists the five chain roles in review order", () => {
    expect(CHAIN_ROLES.map((r) => r.key)).toEqual([
      "programReviewer",
      "dean",
      "fdisChair",
      "citlDirector",
      "vpaa",
    ]);
    expect(CHAIN_ROLES.map((r) => r.stage)).toEqual(STAGES);
    expect(FINAL_STAGE).toBe(5);
  });

  it("starts every syllabus as an unrouted draft", () => {
    expect(INITIAL_STATE).toEqual({ status: "draft", stage: 0 });
  });

  it("has the Phase 3 statuses", () => {
    expect(SYLLABUS_STATUSES).toEqual([
      "draft",
      "submitted",
      "returned",
      "approved",
      "filed",
    ]);
  });
});
