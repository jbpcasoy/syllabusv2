import type { AuditInput } from "@/types/audit";
import type PocketBase from "pocketbase";

type Batch = ReturnType<PocketBase["createBatch"]>;

/**
 * Queues one audit row on the batch that makes the change, so the two land
 * together or not at all. Pure: no reads, nothing sent.
 */
export function addAudit(batch: Batch, input: AuditInput): void {
  batch.collection("audit_log").create({
    actor: input.actor,
    action: input.action,
    target_collection: input.target_collection,
    target_id: input.target_id,
    syllabus: input.syllabus ?? "",
    override: input.override ?? false,
    reason: input.reason ?? "",
    data: input.data ?? null,
  });
}
