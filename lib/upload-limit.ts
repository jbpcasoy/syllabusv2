import { addAudit } from "@/lib/audit";
import type { AuditEntry } from "@/types/audit";
import { NextResponse } from "next/server";
import type PocketBase from "pocketbase";
import "server-only";

/** Uploads per user in any rolling window (Phase 6, P4). */
export const UPLOAD_LIMIT = 20;
export const UPLOAD_WINDOW_MS = 60 * 60 * 1000;

export type UploadRate = { ok: true } | { ok: false; retryAfter: number };

/**
 * Counts the caller's `file.uploaded` audit rows in the window. At the
 * limit, `retryAfter` is the seconds until the oldest counted upload ages
 * out. Soft: two simultaneous uploads at LIMIT - 1 can both pass.
 */
export async function checkUploadRate(
  pb: PocketBase,
  userId: string,
  now: Date = new Date(),
): Promise<UploadRate> {
  const since = new Date(now.getTime() - UPLOAD_WINDOW_MS);
  const recent = await pb
    .collection("audit_log")
    .getList<Pick<AuditEntry, "created">>(1, UPLOAD_LIMIT, {
      sort: "-created",
      fields: "created",
      filter: pb.filter(
        "actor = {:userId} && action = 'file.uploaded' && created > {:since}",
        { userId, since },
      ),
    });
  if (recent.totalItems < UPLOAD_LIMIT) return { ok: true };

  // Below the limit again once the LIMIT-th newest upload leaves the window.
  const freesAt =
    new Date(recent.items[UPLOAD_LIMIT - 1].created).getTime() +
    UPLOAD_WINDOW_MS;
  return {
    ok: false,
    retryAfter: Math.max(1, Math.ceil((freesAt - now.getTime()) / 1000)),
  };
}

/** 429 with Retry-After in seconds and a message in minutes. */
export function tooManyUploads(retryAfter: number): NextResponse {
  const minutes = Math.ceil(retryAfter / 60);
  return NextResponse.json(
    {
      error: `Too many uploads. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    },
    { status: 429, headers: { "Retry-After": String(retryAfter) } },
  );
}

export type UploadKind = "version" | "signed_copy" | "justification_scan";

const TARGET: Record<UploadKind, string> = {
  version: "syllabus_versions",
  signed_copy: "syllabus_signed_copies",
  justification_scan: "syllabus_justifications",
};

/** Queues the `file.uploaded` row that the limit counts. */
export function addUploadAudit(
  batch: ReturnType<PocketBase["createBatch"]>,
  actor: string,
  syllabusId: string,
  kind: UploadKind,
  targetId: string,
): void {
  addAudit(batch, {
    actor,
    action: "file.uploaded",
    target_collection: TARGET[kind],
    target_id: targetId,
    syllabus: syllabusId,
    data: { kind },
  });
}
