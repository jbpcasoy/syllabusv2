import type { RecordModel } from "pocketbase";

export const AUDIT_ACTIONS = [
  "submitted",
  "approved",
  "returned",
  "resubmitted",
  "filed",
  "scan_returned",
  "lead.transferred",
  "file.uploaded",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

/**
 * One audited change, written in the same batch as the change. Append-only
 * and superuser-only: the browser sees it only through GET /api/audit.
 */
export interface AuditEntry extends RecordModel {
  /** ID of the user who caused it, or "" for a system action. */
  actor: string;
  action: AuditAction;
  /** Collection of the changed record, for example "syllabi". */
  target_collection: string;
  target_id: string;
  /** ID of the syllabus involved, or "". A plain id, not a relation. */
  syllabus: string;
  /** An admin acting in place of the usual role. */
  override: boolean;
  reason: string;
  /** Before and after facts, at most 2 KB. */
  data: Record<string, unknown> | null;
  created: string;
  expand?: { actor?: { name: string } };
}

/** Filters for GET /api/audit, parsed by lib/validators/audit.ts. */
export interface AuditQuery {
  action?: AuditAction;
  actor?: string;
  syllabus?: string;
  override?: boolean;
  /** Inclusive, from 00:00 PHT of the `from` date. */
  from?: Date;
  /** Exclusive, 00:00 PHT the day after the `to` date. */
  to?: Date;
}

/** What a route passes to addAudit(). */
export type AuditInput = Pick<
  AuditEntry,
  "actor" | "action" | "target_collection" | "target_id"
> &
  Partial<Pick<AuditEntry, "syllabus" | "override" | "reason" | "data">>;

export interface AuditResponse {
  id: string;
  action: AuditAction;
  actor_name: string;
  syllabus: string;
  /** Program and course code, for example "BSIT · IT 101", or "". */
  syllabus_label: string;
  /** Readable summary of `data`, for example "Draft → In review (Program Reviewer)". */
  detail: string;
  override: boolean;
  reason: string;
  data: Record<string, unknown> | null;
  created: string;
}
