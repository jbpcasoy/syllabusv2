import type { RecordModel } from "pocketbase";
import type { AppUser } from "./user";

export const POINT_STATUSES = [
  "open",
  "responded",
  "resolved",
  "unresolved",
] as const;
export type PointStatus = (typeof POINT_STATUSES)[number];

/** Matches the text field limits in form18_points. */
export const MAX_POINT_TEXT = 2000;
export const MAX_PAGE_NUMBER = 50;

/** One Form 18-1 review point. */
export interface Form18Point extends RecordModel {
  syllabus: string;
  /** The version it was raised on. */
  version: string;
  part: "A" | "B";
  /** 1 to 5: the stage that raised it. */
  stage: number;
  /** Part B legend code, e.g. "B.3"; "" in Part A. */
  code: string;
  review_point: string;
  action_taken: string;
  page_number: string;
  remarks: string;
  status: PointStatus;
  form_revision: string;
  raised_by: string;
  responded_by: string;
  judged_by: string;
  created: string;
  updated: string;
  expand?: {
    raised_by?: AppUser;
    responded_by?: AppUser;
    judged_by?: AppUser;
    version?: { version_no: number };
  };
}

/** Body of POST /api/syllabus/:id/form18, and of an "edit". */
export interface PointInput {
  review_point: string;
  /** Required in Part B, empty in Part A. */
  code: string;
  remarks: string;
}

/** Body of PATCH /api/syllabus/:id/form18/:pointId. */
export type PointUpdateInput =
  | ({ action: "edit" } & PointInput)
  | { action: "respond"; action_taken: string; page_number: string }
  | { action: "judge"; status: "resolved" | "unresolved"; remarks?: string };

/** Safe shape sent to the browser. */
export interface Form18PointResponse {
  id: string;
  version: string;
  /** Number of the version it was raised on; 0 if that didn't load. */
  version_no: number;
  part: "A" | "B";
  stage: number;
  code: string;
  review_point: string;
  action_taken: string;
  page_number: string;
  remarks: string;
  status: PointStatus;
  raised_by: { id: string; name: string };
  responded_by: { id: string; name: string } | null;
  judged_by: { id: string; name: string } | null;
  created: string;
  updated: string;
}

export interface Form18Response {
  /** The revision the points use; the current one when there are none. */
  form_revision: string;
  points: Form18PointResponse[];
}
