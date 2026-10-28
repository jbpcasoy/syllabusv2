import type { RecordModel } from "pocketbase";
import type { Campus } from "./campus";

export interface College extends RecordModel {
  name: string;
  code: string;
  /** ID of the related campus. */
  campus: string;
  expand?: {
    campus?: Campus;
  };
}

export interface CollegeInput {
  name: string;
  code: string;
  /** Campus record ID. */
  campus: string;
}
