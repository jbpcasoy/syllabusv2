import type { ActingAs } from "@/lib/syllabus-review";
import type { RecordModel } from "pocketbase";
import type { SyllabusResponse } from "./syllabus";

export const REVIEW_DECISIONS = ["approve", "return"] as const;
export type ReviewDecision = (typeof REVIEW_DECISIONS)[number];

/** One decision per version and stage (unique index). */
export interface SyllabusReview extends RecordModel {
  syllabus: string;
  version: string;
  /** 1 to 5. */
  stage: number;
  reviewer: string;
  acting_as: ActingAs;
  decision: ReviewDecision;
  /** SYL-... on approve, "" on return. */
  approval_code: string;
  created: string;
}

/** Body of POST /api/syllabus/:id/review. */
export interface ReviewInput {
  decision: ReviewDecision;
}

/** Returned by POST /api/syllabus/:id/review. */
export interface ReviewResult {
  syllabus: SyllabusResponse;
  review: {
    stage: number;
    decision: ReviewDecision;
    acting_as: ActingAs;
    approval_code: string;
  };
}
