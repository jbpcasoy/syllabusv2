import type { RecordModel } from "pocketbase";
import type { Program } from "./program";
import type { AppUser } from "./user";

export interface Faculty extends RecordModel {
  /** ID of the user. */
  user: string;
  /** ID of the program. */
  program: string;
  /** Inactive memberships are kept for history but grant nothing. */
  active: boolean;
  expand?: {
    user?: AppUser;
    program?: Program;
  };
}

export interface FacultyInput {
  user: string;
  program: string;
  /** Defaults to true on create. */
  active?: boolean;
}

export interface FacultyUpdateInput {
  active: boolean;
}

/** Safe shape sent to the browser (no tokens, no hidden user fields). */
export interface FacultyResponse {
  id: string;
  user: string;
  program: string;
  active: boolean;
  created: string;
  updated: string;
  expand?: {
    user?: { id: string; name: string; email: string };
    program?: { id: string; name: string; code: string };
  };
}
