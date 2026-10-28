import type { SyllabusEventType } from "./syllabus-event";

/** A timeline row: the draft's creation, a PDF upload, or a workflow event. */
export type TimelineKind = "created" | "uploaded" | SyllabusEventType;

/** One row of GET /api/syllabus/:id/timeline. Names only, never emails. */
export interface TimelineEntry {
  kind: TimelineKind;
  /** PocketBase datetime. */
  at: string;
  /** 1 to 5, or 0 when it doesn't apply. */
  stage: number;
  /** The version uploaded or acted on, or null. */
  version_no: number | null;
  /** "" when unknown (e.g. who created the draft after a lead transfer). */
  actor_name: string;
  /** SYL-... on approved, otherwise "". */
  approval_code: string;
  /** On scan_returned, otherwise "". */
  reason: string;
}

/** Body of GET /api/syllabus/:id/timeline. Oldest first. */
export interface TimelineResponse {
  items: TimelineEntry[];
}
