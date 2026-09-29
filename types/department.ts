import type { RecordModel } from "pocketbase";
import type { College } from "./college";

export interface Department extends RecordModel {
  name: string;
  /** ID of the related college ("" when unset). */
  college: string;
  expand?: {
    college?: College;
  };
}

export interface DepartmentInput {
  name: string;
  /** College record ID. Use "" to clear the relation. */
  college?: string;
}
