import { NextResponse } from "next/server";
import type PocketBase from "pocketbase";
import { vi } from "vitest";

type Batch = ReturnType<PocketBase["createBatch"]>;

/** Under the limit unless a test says otherwise (use ...Once). */
export const checkUploadRateMock = vi.fn(
  async (): Promise<{ ok: true } | { ok: false; retryAfter: number }> => ({
    ok: true,
  }),
);

/**
 * Factory for vi.mock("@/lib/upload-limit"), so "server-only" never loads.
 * addUploadAudit writes a slim row to the given batch, so route tests can
 * see which batch carries it; tests/lib/upload-limit.test.ts covers the
 * real row.
 */
export function uploadLimitModuleMock() {
  return {
    checkUploadRate: checkUploadRateMock,
    tooManyUploads: (retryAfter: number) =>
      NextResponse.json(
        { error: "Too many uploads." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } },
      ),
    addUploadAudit: (
      batch: Batch,
      actor: string,
      syllabus: string,
      kind: string,
      targetId: string,
    ) =>
      batch.collection("audit_log").create({
        actor,
        action: "file.uploaded",
        syllabus,
        target_id: targetId,
        data: { kind },
      }),
  };
}
