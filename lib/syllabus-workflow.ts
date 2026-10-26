/**
 * The only place syllabus status and stage change. Pure: callers gather the
 * facts (versions, term, review chain) and persist the result. Phase 2 has
 * submit only; Phase 3 adds approve and return.
 */

export const SYLLABUS_STATUSES = ["draft", "submitted"] as const;
export type SyllabusStatus = (typeof SYLLABUS_STATUSES)[number];

/** Review chain in order. A syllabus at stage N waits on CHAIN_ROLES[N - 1]. */
export const CHAIN_ROLES = [
  { key: "programChair", label: "Program Chair", stage: 1 },
  { key: "departmentHead", label: "Department Head", stage: 2 },
  { key: "dean", label: "Dean", stage: 3 },
  { key: "fdisChair", label: "FDIS Chair", stage: 4 },
  { key: "citlDirector", label: "CITL Director", stage: 5 },
  { key: "vpaa", label: "VPAA", stage: 6 },
] as const;
export type ChainRole = (typeof CHAIN_ROLES)[number]["key"];

export interface WorkflowState {
  status: SyllabusStatus;
  /** 0 while not routed, otherwise 1 to 6. */
  stage: number;
}

/** Every syllabus starts here. */
export const INITIAL_STATE: WorkflowState = { status: "draft", stage: 0 };

export interface SubmitEvent {
  type: "submit";
  hasVersion: boolean;
  termOpen: boolean;
  /** Chain roles with no active holder for the syllabus's program. */
  missingRoles: ChainRole[];
}

export type WorkflowEvent = SubmitEvent;

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
  }
}

function submit(state: WorkflowState, event: SubmitEvent): TransitionResult {
  if (state.status !== "draft") {
    return { ok: false, error: "Only a draft syllabus can be submitted." };
  }
  if (!event.termOpen) {
    return { ok: false, error: "This term is closed for submissions." };
  }
  if (!event.hasVersion) {
    return { ok: false, error: "Upload a PDF version before submitting." };
  }
  if (event.missingRoles.length > 0) {
    const missing = CHAIN_ROLES.filter((r) => event.missingRoles.includes(r.key))
      .map((r) => r.label)
      .join(", ");
    return {
      ok: false,
      error: `The review chain is incomplete. No active ${missing}.`,
    };
  }
  return { ok: true, next: { status: "submitted", stage: 1 } };
}
