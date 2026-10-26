import type { RecordModel } from "pocketbase";
import type { Department } from "./department";

export interface Program extends RecordModel {
  name: string;
  code: string;
  /** ID of the related department ("" when unset). */
  department: string;
  expand?: {
    department?: Department;
  };
}

export interface ProgramInput {
  name: string;
  code: string;
  /** Department record ID. Required. */
  department: string;
}
