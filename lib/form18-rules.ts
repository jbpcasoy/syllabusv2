import {
  isLegendCode,
  partForStage,
  type ReviewPointsDefinition,
} from "@/lib/forms";
import type { SyllabusStatus } from "@/lib/syllabus-workflow";
import type { PointStatus } from "@/types/form18";

/**
 * Pure rules for Form 18-1 review points. Who may act (the stage's
 * reviewer, the lead) is checked by the routes; these say when.
 */

type Point = { id: string; stage: number; status: PointStatus; version: string };
type Routed = { status: SyllabusStatus; stage: number };

/** Point counts the workflow needs at `stage`. */
export interface PointFacts {
  /** Open or unresolved: what a return sends back. */
  openPoints: number;
  /** Answered by the lead, not yet judged. */
  unjudgedPoints: number;
  /** Anything but resolved: blocks approval. */
  pendingPoints: number;
  /** Open, with no answer from the lead: blocks resubmission. */
  unansweredPoints: number;
  /** Re-opened by a return. */
  unresolvedIds: string[];
}

export function pointFacts(points: readonly Point[], stage: number): PointFacts {
  const at = points.filter((p) => p.stage === stage);
  const count = (...statuses: PointStatus[]) =>
    at.filter((p) => statuses.includes(p.status)).length;
  return {
    openPoints: count("open", "unresolved"),
    unjudgedPoints: count("responded"),
    pendingPoints: count("open", "responded", "unresolved"),
    unansweredPoints: count("open"),
    unresolvedIds: at.filter((p) => p.status === "unresolved").map((p) => p.id),
  };
}

/** Part A takes no code; Part B needs one from the legend. */
export function pointCodeError(
  form: ReviewPointsDefinition,
  stage: number,
  code: string,
): string | null {
  if (partForStage(stage) === "A") {
    return code ? "Part A review points don't take a code." : null;
  }
  if (!code) return "Part B review points need a code from the legend.";
  return isLegendCode(form, code) ? null : `Unknown legend code: ${code}`;
}

export type PointAction = "edit" | "delete" | "respond" | "judge";

/**
 * Why `action` can't happen to the point now, or null.
 * - edit, delete: the raising stage, before it returns this version.
 * - respond: the lead, while the syllabus is returned at the point's stage.
 * - judge: the raising stage, once the lead has answered.
 */
export function pointActionError(
  action: PointAction,
  point: Point,
  syllabus: Routed,
  latestVersionId: string,
): string | null {
  const atItsStage = syllabus.stage === point.stage;
  switch (action) {
    case "edit":
    case "delete":
      return syllabus.status === "submitted" &&
        atItsStage &&
        point.status === "open" &&
        point.version === latestVersionId
        ? null
        : "A review point can only be changed before you return the syllabus.";
    case "respond":
      return syllabus.status === "returned" &&
        atItsStage &&
        (point.status === "open" || point.status === "responded")
        ? null
        : "Only open points of the stage that returned the syllabus can be answered.";
    case "judge":
      return syllabus.status === "submitted" &&
        atItsStage &&
        point.status !== "open"
        ? null
        : "Only points the lead has answered can be marked resolved or unresolved.";
  }
}
