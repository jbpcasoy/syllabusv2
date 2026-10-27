/**
 * The only place syllabus status and stage change. Pure: callers gather the
 * facts (versions, term, review chain, reviewer, forms) and persist the
 * result.
 *
 *   draft --submit--> submitted@1 --approve--> submitted@2 ... @5 --approve--> approved
 *   submitted@N --return--> returned@N --resubmit--> submitted@N
 *   approved --file--> filed --rejectScan--> approved
 */

export const SYLLABUS_STATUSES = [
  "draft",
  "submitted",
  "returned",
  "approved",
  "filed",
] as const;
export type SyllabusStatus = (typeof SYLLABUS_STATUSES)[number];

/** Review chain in order. A syllabus at stage N waits on CHAIN_ROLES[N - 1]. */
export const CHAIN_ROLES = [
  { key: "programReviewer", label: "Program Reviewer", stage: 1 },
  { key: "dean", label: "Dean", stage: 2 },
  { key: "fdisChair", label: "FDIS Chair", stage: 3 },
  { key: "citlDirector", label: "CITL Director", stage: 4 },
  { key: "vpaa", label: "VPAA", stage: 5 },
] as const;
export type ChainRole = (typeof CHAIN_ROLES)[number]["key"];

export const FINAL_STAGE = CHAIN_ROLES.length;

export interface WorkflowState {
  status: SyllabusStatus;
  /**
   * 0 while a draft. In review or returned: the stage waiting or returning
   * (1 to 5). Approved and filed: 5.
   */
  stage: number;
}

/** Every syllabus starts here. */
export const INITIAL_STATE: WorkflowState = { status: "draft", stage: 0 };

/** Facts shared by submit and resubmit. */
interface RoutingFacts {
  termOpen: boolean;
  /** Chain roles with no active holder for the syllabus's program. */
  missingRoles: ChainRole[];
  /** The program reviewer leads or co-authors and no proxy is set. */
  proxyNeeded: boolean;
}

export interface SubmitEvent extends RoutingFacts {
  type: "submit";
  hasVersion: boolean;
}

export interface ApproveEvent {
  type: "approve";
  /** The stage the caller may act at now (lib/syllabus-review.ts), or null. */
  actorStage: number | null;
  form17Complete: boolean;
  form17HasNo: boolean;
  /** Points at this stage that are open, responded or unresolved. */
  pendingPoints: number;
}

export interface ReturnEvent {
  type: "return";
  actorStage: number | null;
  /** Form 18-1 points at this stage the return sends back: open or unresolved. */
  openPoints: number;
  /** Points the lead answered that the reviewer hasn't judged yet. */
  unjudgedPoints: number;
}

export interface ResubmitEvent extends RoutingFacts {
  type: "resubmit";
  newVersionSinceReturn: boolean;
  /** Open points still without a response from the lead. */
  unansweredPoints: number;
}

export interface FileEvent {
  type: "file";
  hasScan: boolean;
}

export interface RejectScanEvent {
  type: "rejectScan";
}

export type WorkflowEvent =
  | SubmitEvent
  | ApproveEvent
  | ReturnEvent
  | ResubmitEvent
  | FileEvent
  | RejectScanEvent;

export type TransitionResult =
  | { ok: true; next: WorkflowState }
  | { ok: false; error: string };

export function transition(
  state: WorkflowState,
  event: WorkflowEvent,
): TransitionResult {
  switch (event.type) {
    case "submit":
      return submit(state, event);
    case "approve":
      return approve(state, event);
    case "return":
      return giveBack(state, event);
    case "resubmit":
      return resubmit(state, event);
    case "file":
      return file(state, event);
    case "rejectScan":
      return rejectScan(state);
  }
}

const fail = (error: string): TransitionResult => ({ ok: false, error });

const NOT_REVIEWER = "You are not the reviewer at this stage.";

/** The routing checks submit and resubmit share, in reporting order. */
function routingError(event: RoutingFacts): string | null {
  if (event.missingRoles.length > 0) {
    const missing = CHAIN_ROLES.filter((r) => event.missingRoles.includes(r.key))
      .map((r) => r.label)
      .join(", ");
    return `The review chain is incomplete. No active ${missing}.`;
  }
  if (event.proxyNeeded) {
    return "The program reviewer is an author of this syllabus. A proxy must be designated first.";
  }
  return null;
}

function submit(state: WorkflowState, event: SubmitEvent): TransitionResult {
  if (state.status !== "draft") {
    return fail("Only a draft syllabus can be submitted.");
  }
  if (!event.termOpen) return fail("This term is closed for submissions.");
  if (!event.hasVersion) return fail("Upload a PDF version before submitting.");
  const routing = routingError(event);
  if (routing) return fail(routing);
  return { ok: true, next: { status: "submitted", stage: 1 } };
}

function approve(state: WorkflowState, event: ApproveEvent): TransitionResult {
  if (state.status !== "submitted") {
    return fail("Only a syllabus in review can be approved.");
  }
  if (event.actorStage !== state.stage) return fail(NOT_REVIEWER);
  if (!event.form17Complete) {
    return fail("Answer every Form 17 criterion before approving.");
  }
  if (event.form17HasNo) {
    return fail('Form 17 has a "No". Return the syllabus for revision instead.');
  }
  if (event.pendingPoints > 0) {
    return fail("Settle every review point at this stage before approving.");
  }
  return {
    ok: true,
    next:
      state.stage >= FINAL_STAGE
        ? { status: "approved", stage: FINAL_STAGE }
        : { status: "submitted", stage: state.stage + 1 },
  };
}

function giveBack(state: WorkflowState, event: ReturnEvent): TransitionResult {
  if (state.status !== "submitted") {
    return fail("Only a syllabus in review can be returned.");
  }
  if (event.actorStage !== state.stage) return fail(NOT_REVIEWER);
  if (event.unjudgedPoints > 0) {
    return fail(
      "Mark every answered review point resolved or unresolved before returning.",
    );
  }
  if (event.openPoints < 1) {
    return fail("Add at least one Form 18-1 review point before returning.");
  }
  return { ok: true, next: { status: "returned", stage: state.stage } };
}

function resubmit(state: WorkflowState, event: ResubmitEvent): TransitionResult {
  if (state.status !== "returned") {
    return fail("Only a returned syllabus can be resubmitted.");
  }
  if (!event.termOpen) return fail("This term is closed for submissions.");
  if (!event.newVersionSinceReturn) {
    return fail("Upload a new version before resubmitting.");
  }
  if (event.unansweredPoints > 0) {
    return fail("Respond to every open review point before resubmitting.");
  }
  const routing = routingError(event);
  if (routing) return fail(routing);
  return { ok: true, next: { status: "submitted", stage: state.stage } };
}

function file(state: WorkflowState, event: FileEvent): TransitionResult {
  if (state.status !== "approved") {
    return fail("Only an approved syllabus can be filed.");
  }
  if (!event.hasScan) return fail("Upload the signed copy before filing.");
  return { ok: true, next: { status: "filed", stage: FINAL_STAGE } };
}

function rejectScan(state: WorkflowState): TransitionResult {
  if (state.status !== "filed") {
    return fail("Only a filed syllabus can have its signed copy returned.");
  }
  return { ok: true, next: { status: "approved", stage: FINAL_STAGE } };
}
