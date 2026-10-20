import type { RecordModel } from "pocketbase";
import type { College } from "./college";
import type { AppUser } from "./user";

export interface Dean extends RecordModel {
  /** ID of the user. */
  user: string;
  /** ID of the college. */
  college: string;
  /** Only one active dean per college. Inactive ones are kept for history. */
  active: boolean;
  expand?: {
    user?: AppUser;
    college?: College;
  };
}

export interface DeanInput {
  user: string;
  college: string;
  /** Defaults to true on create. */
  active?: boolean;
}

export interface DeanUpdateInput {
  active: boolean;
}

/** Safe shape sent to the browser (no tokens, no hidden user fields). */
export interface DeanResponse {
  id: string;
  user: string;
  college: string;
  active: boolean;
  created: string;
  updated: string;
  expand?: {
    user?: { id: string; name: string; email: string };
    college?: { id: string; name: string; code: string };
  };
}
