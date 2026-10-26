import type { RecordModel } from "pocketbase";
import type { Program } from "./program";
import type { AppUser } from "./user";

export const JOIN_REQUEST_STATUSES = ["pending", "approved", "rejected"] as const;
export type JoinRequestStatus = (typeof JOIN_REQUEST_STATUSES)[number];

/** Matches the `max` on the note and reason fields. */
export const MAX_JOIN_REQUEST_TEXT = 500;

export interface ProgramJoinRequest extends RecordModel {
  /** ID of the user asking to join. */
  user: string;
  /** ID of the program (GE programs included). */
  program: string;
  /** Optional message from the requester ("" when empty). */
  note: string;
  status: JoinRequestStatus;
  /** Why it was rejected ("" otherwise). */
  reason: string;
  /** ID of the user who decided ("" while pending). */
  reviewed_by: string;
  /** ISO date of the decision ("" while pending). */
  reviewed_at: string;
  expand?: {
    user?: AppUser;
    program?: Program;
    reviewed_by?: AppUser;
  };
}

/** Body of POST /api/program-join-request. The requester is always the caller. */
export interface ProgramJoinRequestInput {
  program: string;
  note: string;
}

/** Body of PATCH /api/program-join-request/:id. */
export type ProgramJoinRequestDecision =
  | { decision: "approve" }
  | { decision: "reject"; reason: string };

/** Safe shape sent to the browser (no tokens, no hidden user fields). */
export interface ProgramJoinRequestResponse {
  id: string;
  user: string;
  program: string;
  note: string;
  status: JoinRequestStatus;
  reason: string;
  reviewed_by: string;
  reviewed_at: string;
  created: string;
  updated: string;
  expand?: {
    user?: { id: string; name: string; email: string };
    program?: { id: string; name: string; code: string };
    reviewed_by?: { id: string; name: string };
  };
}
