import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const form17 = vi.hoisted(() => ({ form17Facts: vi.fn() }));
vi.mock("@/lib/form17", () => form17);

import {
  ensureRefSeq,
  hasNotUniqueError,
  lastReturnedVersionId,
  loadFormFacts,
  recordDecision,
  type DecisionInput,
} from "@/lib/syllabus-decision";
import type PocketBase from "pocketbase";

const ID = "sylsylsylsylsyl";
const TERM = "trm123trm123trm";

const filter = (expr: string, params: Record<string, unknown> = {}) =>
  expr.replace(/\{:(\w+)\}/g, (_, key) => JSON.stringify(params[key]));

const NOT_UNIQUE = {
  status: 400,
  response: { data: { ref_seq: { code: "validation_not_unique" } } },
};
// Shape of a failed batch: the failing request's error sits under data.requests.
const BATCH_NOT_UNIQUE = {
  status: 400,
  response: {
    data: {
      requests: {
        "0": {
          code: "batch_request_failed",
          response: { data: { version: { code: "validation_not_unique" } } },
        },
      },
    },
  },
};

describe("hasNotUniqueError", () => {
  it.each([
    ["a plain unique rejection", NOT_UNIQUE, true],
    ["a unique rejection inside a batch", BATCH_NOT_UNIQUE, true],
    ["another validation error", { response: { data: { x: { code: "validation_required" } } } }, false],
    ["a 404", { status: 404 }, false],
    ["null", null, false],
    ["a string", "validation_not_unique", false],
  ])("%s → %s", (_label, error, expected) => {
    expect(hasNotUniqueError(error)).toBe(expected);
  });

  it("stops at cyclic or very deep objects", () => {
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(hasNotUniqueError(cyclic)).toBe(false);
  });
});

describe("loadFormFacts", () => {
  const points = [
    { id: "p1", stage: 2, status: "open", version: "v" },
    { id: "p2", stage: 2, status: "responded", version: "v" },
    { id: "p3", stage: 2, status: "unresolved", version: "v" },
    { id: "p4", stage: 2, status: "resolved", version: "v" },
  ];
  const getFullList = vi.fn(async () => points);
  const pb = { filter, collection: () => ({ getFullList }) } as unknown as PocketBase;

  it("reads Form 17 for the version and the points of the stage", async () => {
    form17.form17Facts.mockResolvedValue({ complete: true, hasNo: true });

    expect(
      await loadFormFacts(pb, { syllabusId: ID, versionId: "ververververver", stage: 2 }),
    ).toEqual({
      form17Complete: true,
      form17HasNo: true,
      openPoints: 2,
      unjudgedPoints: 1,
      pendingPoints: 3,
      unansweredPoints: 1,
      unresolvedIds: ["p3"],
    });
    expect(form17.form17Facts).toHaveBeenCalledWith(pb, "ververververver");
    expect(getFullList).toHaveBeenCalledWith({
      fields: "id,stage,status,version",
      filter: `syllabus = "${ID}" && stage = 2`,
    });
  });

  it("treats a missing version as an incomplete checklist", async () => {
    form17.form17Facts.mockClear();
    expect(
      await loadFormFacts(pb, { syllabusId: ID, versionId: null, stage: 2 }),
    ).toMatchObject({ form17Complete: false, form17HasNo: false });
    expect(form17.form17Facts).not.toHaveBeenCalled();
  });
});

describe("lastReturnedVersionId", () => {
  it("reads the version of the latest return", async () => {
    const getList = vi.fn(async () => ({ items: [{ version: "v2v2v2v2v2v2v2v" }] }));
    const pb = { filter, collection: () => ({ getList }) } as unknown as PocketBase;

    expect(await lastReturnedVersionId(pb, ID)).toBe("v2v2v2v2v2v2v2v");
    expect(getList).toHaveBeenCalledWith(1, 1, {
      skipTotal: true,
      fields: "version",
      sort: "-created",
      filter: `syllabus = "${ID}" && decision = 'return'`,
    });
  });

  it("is null for a syllabus never returned", async () => {
    const getList = vi.fn(async () => ({ items: [] }));
    const pb = { filter, collection: () => ({ getList }) } as unknown as PocketBase;
    expect(await lastReturnedVersionId(pb, ID)).toBeNull();
  });
});

describe("ensureRefSeq", () => {
  let getList: ReturnType<typeof vi.fn>;
  let update: ReturnType<typeof vi.fn>;
  let pb: PocketBase;

  beforeEach(() => {
    getList = vi.fn(async () => ({ items: [{ ref_seq: 41 }] }));
    update = vi.fn(async () => ({}));
    pb = { filter, collection: () => ({ getList, update }) } as unknown as PocketBase;
  });

  it("keeps an existing sequence without querying", async () => {
    expect(await ensureRefSeq(pb, { id: ID, term: TERM, ref_seq: 9 })).toBe(9);
    expect(getList).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it("assigns the term's next number", async () => {
    expect(await ensureRefSeq(pb, { id: ID, term: TERM, ref_seq: 0 })).toBe(42);
    expect(getList).toHaveBeenCalledWith(1, 1, {
      skipTotal: true,
      fields: "ref_seq",
      sort: "-ref_seq",
      filter: `term = "${TERM}"`,
    });
    expect(update).toHaveBeenCalledWith(ID, { ref_seq: 42 });
  });

  it("starts a term at 1", async () => {
    getList.mockResolvedValue({ items: [] });
    expect(await ensureRefSeq(pb, { id: ID, term: TERM, ref_seq: 0 })).toBe(1);
  });

  it("retries with the new maximum after losing a race", async () => {
    getList
      .mockResolvedValueOnce({ items: [{ ref_seq: 41 }] })
      .mockResolvedValueOnce({ items: [{ ref_seq: 42 }] });
    update.mockRejectedValueOnce(NOT_UNIQUE);

    expect(await ensureRefSeq(pb, { id: ID, term: TERM, ref_seq: 0 })).toBe(43);
    expect(update).toHaveBeenLastCalledWith(ID, { ref_seq: 43 });
  });

  it("gives up after three lost races", async () => {
    update.mockRejectedValue(NOT_UNIQUE);
    await expect(
      ensureRefSeq(pb, { id: ID, term: TERM, ref_seq: 0 }),
    ).rejects.toThrow("Could not assign a reference number");
    expect(update).toHaveBeenCalledTimes(3);
  });

  it("rethrows other errors at once", async () => {
    update.mockRejectedValue({ status: 500 });
    await expect(
      ensureRefSeq(pb, { id: ID, term: TERM, ref_seq: 0 }),
    ).rejects.toEqual({ status: 500 });
    expect(update).toHaveBeenCalledTimes(1);
  });
});

describe("recordDecision", () => {
  const ops: unknown[] = [];
  const send = vi.fn();
  const pb = {
    createBatch: () => ({
      collection: (name: string) => ({
        create: (body: unknown) => ops.push(["create", name, body]),
        update: (id: string, body: unknown) => ops.push(["update", name, id, body]),
      }),
      send,
    }),
  } as unknown as PocketBase;

  const input: DecisionInput = {
    syllabusId: ID,
    versionId: "ververververver",
    stage: 2,
    reviewer: "deandeandeandea",
    actingAs: "holder",
    decision: "approve",
    approvalCode: "SYL-2627-1-0042-S2",
    next: { status: "submitted", stage: 3 },
    now: "2026-10-27T08:00:00.000Z",
  };

  beforeEach(() => {
    ops.length = 0;
    send.mockReset().mockResolvedValue([]);
  });

  it("writes the review and the next state in one batch", async () => {
    expect(await recordDecision(pb, input)).toBe("ok");
    expect(ops).toEqual([
      [
        "create",
        "syllabus_reviews",
        {
          syllabus: ID,
          version: "ververververver",
          stage: 2,
          reviewer: "deandeandeandea",
          acting_as: "holder",
          decision: "approve",
          approval_code: "SYL-2627-1-0042-S2",
        },
      ],
      ["update", "syllabi", ID, { status: "submitted", stage: 3 }],
    ]);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("stamps returned_at on a return", async () => {
    await recordDecision(pb, {
      ...input,
      decision: "return",
      approvalCode: "",
      next: { status: "returned", stage: 2 },
    });
    expect(ops[1]).toEqual([
      "update",
      "syllabi",
      ID,
      { status: "returned", stage: 2, returned_at: "2026-10-27T08:00:00.000Z" },
    ]);
  });

  it("re-opens unresolved points in the same batch as a return", async () => {
    await recordDecision(pb, {
      ...input,
      decision: "return",
      approvalCode: "",
      next: { status: "returned", stage: 2 },
      reopenPointIds: ["p3", "p5"],
    });
    expect(ops.slice(2)).toEqual([
      ["update", "form18_points", "p3", { status: "open" }],
      ["update", "form18_points", "p5", { status: "open" }],
    ]);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("reports a conflict when the unique index rejects the batch", async () => {
    send.mockRejectedValue(BATCH_NOT_UNIQUE);
    expect(await recordDecision(pb, input)).toBe("conflict");
  });

  it("rethrows other errors", async () => {
    send.mockRejectedValue({ status: 500 });
    await expect(recordDecision(pb, input)).rejects.toEqual({ status: 500 });
  });
});
