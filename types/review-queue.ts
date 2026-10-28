import type { ListResult } from "pocketbase";
import type { SyllabusResponse } from "./syllabus";

/**
 * Which rows of a stage's queue: waiting on the stage, returned by it (with
 * faculty), or past it (approved at this stage or beyond).
 */
export const QUEUE_STATUSES = ["waiting", "returned", "passed"] as const;
export type QueueStatus = (typeof QUEUE_STATUSES)[number];

export function isQueueStatus(value: unknown): value is QueueStatus {
  return QUEUE_STATUSES.includes(value as QueueStatus);
}

/** One row of GET /api/review-queue. */
export interface ReviewQueueItem {
  syllabus: SyllabusResponse;
  /** Latest version number; 0 if none. */
  version_no: number;
  /** True when the viewer may decide it now (link to the review workspace). */
  actionable: boolean;
  /** Name of the stand-in covering this stage for someone else, or null. */
  covered_by: string | null;
}

/** Body of GET /api/review-queue. */
export interface ReviewQueueResponse extends ListResult<ReviewQueueItem> {
  /** Stages the viewer may open, ascending; the tabs. */
  stages: number[];
  /** The stage these items belong to, or 0 when `stages` is empty. */
  stage: number;
}
