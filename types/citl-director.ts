import type { RecordModel } from "pocketbase";
import type { AppUser } from "./user";

export interface CitlDirector extends RecordModel {
  /** ID of the user. */
  user: string;
  /** Only one record can be active at a time. Inactive ones are kept for history. */
  active: boolean;
  expand?: {
    user?: AppUser;
  };
}

export interface CitlDirectorInput {
  user: string;
  /** Defaults to true on create. */
  active?: boolean;
}

export interface CitlDirectorUpdateInput {
  active: boolean;
}

/** Safe shape sent to the browser (no tokens, no hidden user fields). */
export interface CitlDirectorResponse {
  id: string;
  user: string;
  active: boolean;
  created: string;
  updated: string;
  expand?: {
    user?: { id: string; name: string; email: string };
  };
}
