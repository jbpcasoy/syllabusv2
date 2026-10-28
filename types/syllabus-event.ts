import type { RecordModel } from "pocketbase";

export const SYLLABUS_EVENT_TYPES = [
  "submitted",
  "approved",
  "returned",
  "resubmitted",
  "filed",
  "scan_returned",
] as const;
export type SyllabusEventType = (typeof SYLLABUS_EVENT_TYPES)[number];

/**
 * One workflow transition, written in the transition's batch. Append-only
 * and superuser-only: the browser sees it only through the timeline route.
 */
export interface SyllabusEvent extends RecordModel {
  /** ID of the syllabus. */
  syllabus: string;
  type: SyllabusEventType;
  /** 1 to 5; 0 for filed and scan_returned. */
  stage: number;
  /** ID of the version acted on, or "". */
  version: string;
  /** ID of the user who caused it. */
  actor: string;
  /** SYL-... on approved, otherwise "". */
  approval_code: string;
  /** On scan_returned, otherwise "". */
  reason: string;
  created: string;
}

/** What a route passes to addSyllabusEvent(). */
export type SyllabusEventInput = Pick<SyllabusEvent, "type" | "actor"> &
  Partial<Pick<SyllabusEvent, "stage" | "version" | "approval_code" | "reason">>;
