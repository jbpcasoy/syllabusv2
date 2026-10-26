import type { RecordModel } from "pocketbase";
import type { College } from "./college";

export interface Department extends RecordModel {
  name: string;
  /** ID of the related college. */
  college: string;
  expand?: {
    college?: College;
  };
}

export interface DepartmentInput {
  name: string;
  /** College record ID. Required. */
  college: string;
}
