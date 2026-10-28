import { addAudit } from "@/lib/audit";
import type { WorkflowState } from "@/lib/syllabus-workflow";
import type { SyllabusEventInput } from "@/types/syllabus-event";
import type PocketBase from "pocketbase";

type Batch = ReturnType<PocketBase["createBatch"]>;

/** The syllabus's state before and after the transition. */
export interface StatusChange {
  from: WorkflowState;
  to: WorkflowState;
}

/**
 * Queues one timeline event, and its audit row, on the batch that makes the
 * transition, so all three land together or not at all. Pure: no reads,
 * nothing sent. Callers set `status_changed_at` on the syllabus in the same
 * batch.
 */
export function addSyllabusEvent(
  batch: Batch,
  syllabusId: string,
  event: SyllabusEventInput,
  change: StatusChange,
): void {
  batch.collection("syllabus_events").create({
    syllabus: syllabusId,
    type: event.type,
    actor: event.actor,
    stage: event.stage ?? 0,
    version: event.version ?? "",
    approval_code: event.approval_code ?? "",
    reason: event.reason ?? "",
  });
  addAudit(batch, {
    actor: event.actor,
    action: event.type,
    target_collection: "syllabi",
    target_id: syllabusId,
    syllabus: syllabusId,
    reason: event.reason,
    data: {
      from: { status: change.from.status, stage: change.from.stage },
      to: { status: change.to.status, stage: change.to.stage },
      ...(event.version && { version: event.version }),
      ...(event.approval_code && { approval_code: event.approval_code }),
    },
  });
}
