import type { RecordModel } from "pocketbase";
import type { Department } from "./department";
import type { AppUser } from "./user";

export interface DepartmentHead extends RecordModel {
  /** ID of the user. */
  user: string;
  /** ID of the department. */
  department: string;
  /** Inactive assignments are kept for history but grant nothing. */
  active: boolean;
  expand?: {
    user?: AppUser;
    department?: Department;
  };
}

export interface DepartmentHeadInput {
  user: string;
  department: string;
  /** Defaults to true on create. */
  active?: boolean;
}

export interface DepartmentHeadUpdateInput {
  active: boolean;
}

/** Safe shape sent to the browser (no tokens, no hidden user fields). */
export interface DepartmentHeadResponse {
  id: string;
  user: string;
  department: string;
  active: boolean;
  created: string;
  updated: string;
  expand?: {
    user?: { id: string; name: string; email: string };
    department?: { id: string; name: string };
  };
}
