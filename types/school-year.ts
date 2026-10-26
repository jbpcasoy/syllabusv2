import type { RecordModel } from "pocketbase";

export interface SchoolYear extends RecordModel {
  /** Format "YYYY-YYYY", e.g. "2026-2027". Unique. */
  label: string;
}

export interface SchoolYearInput {
  label: string;
}

/** Safe shape sent to the browser. */
export interface SchoolYearResponse {
  id: string;
  label: string;
  created: string;
  updated: string;
}
