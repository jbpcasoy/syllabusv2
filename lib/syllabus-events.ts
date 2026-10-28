import type { SyllabusEventInput } from "@/types/syllabus-event";
import type PocketBase from "pocketbase";

type Batch = ReturnType<PocketBase["createBatch"]>;

/**
 * Queues one timeline event on the batch that makes the transition, so the
 * two land together or not at all. Pure: no reads, nothing sent. Callers
 * set `status_changed_at` on the syllabus in the same batch.
 */
export function addSyllabusEvent(
  batch: Batch,
  syllabusId: string,
  event: SyllabusEventInput,
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
}
