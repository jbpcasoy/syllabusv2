import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  addUploadAudit,
  checkUploadRate,
  tooManyUploads,
  UPLOAD_LIMIT,
  UPLOAD_WINDOW_MS,
} from "@/lib/upload-limit";
import type PocketBase from "pocketbase";

const ME = "useruseruseruse";
const NOW = new Date("2026-10-28T08:00:00.000Z");

const getList = vi.fn();
const pb = {
  collection: vi.fn(() => ({ getList })),
  filter: vi.fn((expr: string, params: object) => ({ expr, params })),
} as unknown as PocketBase;

/** `count` uploads, newest first, `minutesApart` apart starting `newest` minutes ago. */
function uploads(count: number, newest = 1, minutesApart = 1) {
  return Array.from({ length: Math.min(count, UPLOAD_LIMIT) }, (_, i) => ({
    created: new Date(
      NOW.getTime() - (newest + i * minutesApart) * 60_000,
    ).toISOString(),
  }));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("checkUploadRate", () => {
  it("lets the upload through under the limit", async () => {
    getList.mockResolvedValue({ totalItems: UPLOAD_LIMIT - 1, items: uploads(19) });
    expect(await checkUploadRate(pb, ME, NOW)).toEqual({ ok: true });
  });

  it("asks only for the caller's uploads inside the window, with params", async () => {
    getList.mockResolvedValue({ totalItems: 0, items: [] });
    await checkUploadRate(pb, ME, NOW);

    expect(pb.collection).toHaveBeenCalledWith("audit_log");
    expect(pb.filter).toHaveBeenCalledWith(
      "actor = {:userId} && action = 'file.uploaded' && created > {:since}",
      { userId: ME, since: new Date(NOW.getTime() - UPLOAD_WINDOW_MS) },
    );
    expect(getList).toHaveBeenCalledWith(1, UPLOAD_LIMIT, {
      sort: "-created",
      fields: "created",
      filter: expect.anything(),
    });
  });

  it("refuses at the limit until the oldest counted upload ages out", async () => {
    // 20 uploads, 1 to 39 minutes ago (2 apart): the oldest frees in 21 min.
    getList.mockResolvedValue({
      totalItems: UPLOAD_LIMIT,
      items: uploads(UPLOAD_LIMIT, 1, 2),
    });
    expect(await checkUploadRate(pb, ME, NOW)).toEqual({
      ok: false,
      retryAfter: 21 * 60,
    });
  });

  it("counts from the LIMIT-th newest when a race went over", async () => {
    getList.mockResolvedValue({
      totalItems: UPLOAD_LIMIT + 2,
      items: uploads(UPLOAD_LIMIT, 1, 1),
    });
    expect(await checkUploadRate(pb, ME, NOW)).toEqual({
      ok: false,
      retryAfter: 40 * 60,
    });
  });

  it("never asks to wait less than a second", async () => {
    getList.mockResolvedValue({
      totalItems: UPLOAD_LIMIT,
      items: Array.from({ length: UPLOAD_LIMIT }, () => ({
        created: new Date(NOW.getTime() - UPLOAD_WINDOW_MS).toISOString(),
      })),
    });
    expect(await checkUploadRate(pb, ME, NOW)).toEqual({
      ok: false,
      retryAfter: 1,
    });
  });
});

describe("tooManyUploads", () => {
  it("answers 429 with Retry-After and the wait in minutes", async () => {
    const res = tooManyUploads(21 * 60);
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("1260");
    expect(await res.json()).toEqual({
      error: "Too many uploads. Try again in 21 minutes.",
    });
  });

  it("rounds up to one minute", async () => {
    const res = tooManyUploads(5);
    expect(await res.json()).toEqual({
      error: "Too many uploads. Try again in 1 minute.",
    });
  });
});

describe("addUploadAudit", () => {
  it("queues a file.uploaded row for the uploaded record", () => {
    const create = vi.fn();
    const batch = { collection: vi.fn(() => ({ create })) } as unknown as ReturnType<
      PocketBase["createBatch"]
    >;
    addUploadAudit(batch, ME, "sylsylsylsylsyl", "signed_copy", "cpycpycpycpycpy");
    expect(create).toHaveBeenCalledWith({
      actor: ME,
      action: "file.uploaded",
      target_collection: "syllabus_signed_copies",
      target_id: "cpycpycpycpycpy",
      syllabus: "sylsylsylsylsyl",
      override: false,
      reason: "",
      data: { kind: "signed_copy" },
    });
  });
});
