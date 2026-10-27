import type { RecordModel } from "pocketbase";
import type { AppUser } from "./user";

/**
 * Who acts at one stage of one syllabus in place of its conflicted holder.
 * The stage-1 stand-in is the proxy.
 */
export interface SyllabusStandIn extends RecordModel {
  /** ID of the syllabus. Unique with stage. */
  syllabus: string;
  /** 1 to 5. */
  stage: number;
  /** ID of the stand-in. */
  user: string;
  /** ID of whoever designated them. */
  assigned_by: string;
  created: string;
  updated: string;
  expand?: {
    user?: AppUser;
    assigned_by?: AppUser;
  };
}

/** Body of PUT /api/syllabus/:id/stand-in. `user: null` clears the stage. */
export interface StandInInput {
  stage: number;
  user: string | null;
}

/** Safe shape sent to the browser. */
export interface StandInResponse {
  id: string;
  stage: number;
  /** "proxy" at stage 1, "standIn" after. */
  kind: "proxy" | "standIn";
  user: { id: string; name: string; email: string };
  assigned_by: { id: string; name: string };
  /** When it was last set. */
  updated: string;
}

/** A user who may be designated, from GET /api/syllabus/:id/stand-in-candidates. */
export interface StandInCandidate {
  id: string;
  name: string;
  email: string;
}
