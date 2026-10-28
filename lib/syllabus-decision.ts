import { form17Facts } from "@/lib/form17";
import { pointFacts, type PointFacts } from "@/lib/form18-rules";
import {
  addNotifications,
  type NotificationFacts,
} from "@/lib/notifications";
import { addSyllabusEvent } from "@/lib/syllabus-events";
import type { NotificationTarget } from "@/types/notification";
import type { Form18Point } from "@/types/form18";
import type { ActingAs } from "@/lib/syllabus-review";
import type { WorkflowState } from "@/lib/syllabus-workflow";
import type { Syllabus } from "@/types/syllabus";
import type { ReviewDecision } from "@/types/syllabus-review";
import type PocketBase from "pocketbase";
import "server-only";

/**
 * True when PocketBase rejected a write on a unique index, wherever the
 * code sits: a plain create puts it under response.data, a failed batch
 * nests it under the failing request.
 */
export function hasNotUniqueError(error: unknown, depth = 0): boolean {
  if (typeof error !== "object" || error === null || depth > 8) return false;
  if ((error as { code?: unknown }).code === "validation_not_unique") {
    return true;
  }
  return Object.values(error).some((value) =>
    hasNotUniqueError(value, depth + 1),
  );
}

/** Form 17 and Form 18-1 facts the workflow needs at a stage. */
export interface FormFacts extends PointFacts {
  form17Complete: boolean;
  form17HasNo: boolean;
}

/**
 * Form 17 of the version under review, and the Form 18-1 points of the
 * stage being decided (or resumed).
 */
export async function loadFormFacts(
  pb: PocketBase,
  scope: { syllabusId: string; versionId: string | null; stage: number },
): Promise<FormFacts> {
  const [form17, points] = await Promise.all([
    scope.versionId
      ? form17Facts(pb, scope.versionId)
      : { complete: false, hasNo: false },
    pb.collection("form18_points").getFullList<Form18Point>({
      fields: "id,stage,status,version",
      filter: pb.filter("syllabus = {:syllabusId} && stage = {:stage}", {
        syllabusId: scope.syllabusId,
        stage: scope.stage,
      }),
    }),
  ]);
  return {
    form17Complete: form17.complete,
    form17HasNo: form17.hasNo,
    ...pointFacts(points, scope.stage),
  };
}

/** The version the latest return was decided on, or null if never returned. */
export async function lastReturnedVersionId(
  pb: PocketBase,
  syllabusId: string,
): Promise<string | null> {
  const result = await pb
    .collection("syllabus_reviews")
    .getList<{ version: string }>(1, 1, {
      skipTotal: true,
      fields: "version",
      sort: "-created",
      filter: pb.filter("syllabus = {:syllabusId} && decision = 'return'", {
        syllabusId,
      }),
    });
  return result.items[0]?.version ?? null;
}

/** The term's next unused ref_seq. Callers write it and retry on a clash. */
export async function nextRefSeq(pb: PocketBase, term: string): Promise<number> {
  const top = await pb
    .collection("syllabi")
    .getList<Pick<Syllabus, "ref_seq">>(1, 1, {
      skipTotal: true,
      fields: "ref_seq",
      sort: "-ref_seq",
      filter: pb.filter("term = {:term}", { term }),
    });
  return (top.items[0]?.ref_seq ?? 0) + 1;
}

/**
 * The syllabus's ref_seq, assigning the term's next number on first use.
 * Each attempt re-reads the syllabus first, so a number another request
 * has just assigned is kept rather than overwritten. The partial unique
 * index (term, ref_seq) rejects a concurrent duplicate, so a lost race
 * reads the new maximum and tries again.
 */
export async function ensureRefSeq(
  pb: PocketBase,
  syllabus: Pick<Syllabus, "id" | "term" | "ref_seq">,
): Promise<number> {
  if (syllabus.ref_seq > 0) return syllabus.ref_seq;

  for (let attempt = 0; attempt < 3; attempt++) {
    const current = await pb
      .collection("syllabi")
      .getOne<Pick<Syllabus, "ref_seq">>(syllabus.id, { fields: "ref_seq" });
    if (current.ref_seq > 0) return current.ref_seq;

    const next = await nextRefSeq(pb, syllabus.term);
    try {
      await pb.collection("syllabi").update(syllabus.id, { ref_seq: next });
      return next;
    } catch (error) {
      if (!hasNotUniqueError(error)) throw error;
    }
  }
  throw new Error("Could not assign a reference number. Please try again.");
}

export interface DecisionInput {
  syllabusId: string;
  versionId: string;
  stage: number;
  reviewer: string;
  actingAs: ActingAs;
  decision: ReviewDecision;
  /** "" on return. */
  approvalCode: string;
  /**
   * Only for a syllabus without a ref_seq yet (submitted before submit
   * assigned one). Written in the decision's batch, so it lands only with
   * the decision that used it.
   */
  refSeq?: number;
  /** From lib/syllabus-workflow.ts. */
  next: WorkflowState;
  /** ISO time stamped as status_changed_at, and returned_at on a return. */
  now: string;
  /** Unresolved points a return re-opens. */
  reopenPointIds?: string[];
  /** From notificationRecipients() and notificationFacts(). */
  notify?: { targets: NotificationTarget[]; facts: NotificationFacts };
}

/**
 * Writes the review row, the syllabus's next state, its timeline event,
 * its notifications and any re-opened points in one batch. The
 * unique index (version, stage) makes a second decision on the same stage
 * fail as a whole: "conflict".
 */
export async function recordDecision(
  pb: PocketBase,
  input: DecisionInput,
): Promise<"ok" | "conflict"> {
  const batch = pb.createBatch();
  batch.collection("syllabus_reviews").create({
    syllabus: input.syllabusId,
    version: input.versionId,
    stage: input.stage,
    reviewer: input.reviewer,
    acting_as: input.actingAs,
    decision: input.decision,
    approval_code: input.approvalCode,
  });
  batch.collection("syllabi").update(input.syllabusId, {
    status: input.next.status,
    stage: input.next.stage,
    status_changed_at: input.now,
    ...(input.decision === "return" && { returned_at: input.now }),
    ...(input.refSeq && { ref_seq: input.refSeq }),
  });
  addSyllabusEvent(
    batch,
    input.syllabusId,
    {
      type: input.decision === "approve" ? "approved" : "returned",
      actor: input.reviewer,
      stage: input.stage,
      version: input.versionId,
      approval_code: input.approvalCode,
    },
    // Only a syllabus in review at the decided stage can be decided.
    { from: { status: "submitted", stage: input.stage }, to: input.next },
  );
  if (input.notify) {
    addNotifications(
      batch,
      input.syllabusId,
      input.reviewer,
      input.notify.targets,
      input.notify.facts,
    );
  }
  for (const pointId of input.reopenPointIds ?? []) {
    batch.collection("form18_points").update(pointId, { status: "open" });
  }
  try {
    await batch.send();
    return "ok";
  } catch (error) {
    if (hasNotUniqueError(error)) return "conflict";
    throw error;
  }
}

/**
 * Why recordDecision answered "conflict", read back from the data:
 * - "decided": the stage's decision on this version exists and the
 *   syllabus has moved on. Another request won the race.
 * - "duplicateReview": that decision exists, yet the syllabus still waits
 *   at the stage. The records disagree; the workflow never does this.
 * - "duplicateCode": another review already holds the approval code.
 * - "unexplained": neither. A ref_seq written with the decision clashed
 *   with another syllabus's, or the clashing row is gone.
 */
export type DecisionConflict =
  | "decided"
  | "duplicateReview"
  | "duplicateCode"
  | "unexplained";

export async function explainConflict(
  pb: PocketBase,
  input: Pick<
    DecisionInput,
    "syllabusId" | "versionId" | "stage" | "approvalCode"
  >,
): Promise<DecisionConflict> {
  const reviews = pb.collection("syllabus_reviews");
  const [syllabus, sameStage, sameCode] = await Promise.all([
    pb
      .collection("syllabi")
      .getOne<Pick<Syllabus, "status" | "stage">>(input.syllabusId, {
        fields: "status,stage",
      }),
    reviews.getList(1, 1, {
      skipTotal: true,
      fields: "id",
      filter: pb.filter("version = {:version} && stage = {:stage}", {
        version: input.versionId,
        stage: input.stage,
      }),
    }),
    input.approvalCode
      ? reviews.getList(1, 1, {
          skipTotal: true,
          fields: "id",
          filter: pb.filter("approval_code = {:code}", {
            code: input.approvalCode,
          }),
        })
      : null,
  ]);
  if (sameStage.items.length > 0) {
    const stillWaiting =
      syllabus.status === "submitted" && syllabus.stage === input.stage;
    return stillWaiting ? "duplicateReview" : "decided";
  }
  if (sameCode && sameCode.items.length > 0) return "duplicateCode";
  return "unexplained";
}
