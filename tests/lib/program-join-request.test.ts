import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  applyJoinRequestDecision,
  toProgramJoinRequestResponse,
} from "@/lib/program-join-request";
import type { ProgramJoinRequest } from "@/types/program-join-request";
import type PocketBase from "pocketbase";

const REVIEWER = "rev123rev123rev";
const request = {
  id: "req123req123req",
  user: "usr123usr123usr",
  program: "prg123prg123prg",
};

function fakePb(existing: { id: string; active: boolean }[] = []) {
  const ops: unknown[] = [];
  const update = vi.fn();
  const pb = {
    filter: vi.fn((expr: string, params: unknown) => ({ expr, params })),
    collection: vi.fn(() => ({
      getList: vi.fn(async () => ({ items: existing })),
      update,
    })),
    createBatch: vi.fn(() => ({
      collection: (name: string) => ({
        create: (body: unknown) => ops.push(["create", name, body]),
        update: (id: string, body: unknown) =>
          ops.push(["update", name, id, body]),
      }),
      send: vi.fn(async () => []),
    })),
  };
  return { pb: pb as unknown as PocketBase, raw: pb, ops, update };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-26T08:00:00.000Z"));
});

const reviewed = {
  reviewed_by: REVIEWER,
  reviewed_at: "2026-10-26T08:00:00.000Z",
};

describe("applyJoinRequestDecision", () => {
  it("rejects with the reason and touches no membership", async () => {
    const { pb, raw, update } = fakePb();

    await applyJoinRequestDecision(
      pb,
      request,
      { decision: "reject", reason: "Unknown" },
      REVIEWER,
    );

    expect(update).toHaveBeenCalledWith(request.id, {
      status: "rejected",
      reason: "Unknown",
      ...reviewed,
    });
    expect(raw.createBatch).not.toHaveBeenCalled();
  });

  it("creates an active membership and approves in one batch", async () => {
    const { pb, raw, ops } = fakePb([]);

    await applyJoinRequestDecision(pb, request, { decision: "approve" }, REVIEWER);

    expect(raw.filter).toHaveBeenCalledWith(
      "user = {:user} && program = {:program}",
      { user: request.user, program: request.program },
    );
    expect(ops).toEqual([
      [
        "create",
        "faculties",
        { user: request.user, program: request.program, active: true },
      ],
      [
        "update",
        "program_join_requests",
        request.id,
        { status: "approved", ...reviewed },
      ],
    ]);
  });

  it("reactivates an inactive membership instead of creating one", async () => {
    const { pb, ops } = fakePb([{ id: "fac123fac123fac", active: false }]);

    await applyJoinRequestDecision(pb, request, { decision: "approve" }, REVIEWER);

    expect(ops[0]).toEqual([
      "update",
      "faculties",
      "fac123fac123fac",
      { active: true },
    ]);
    expect(ops).toHaveLength(2);
  });

  it("only approves when the membership is already active", async () => {
    const { pb, ops } = fakePb([{ id: "fac123fac123fac", active: true }]);

    await applyJoinRequestDecision(pb, request, { decision: "approve" }, REVIEWER);

    expect(ops).toEqual([
      [
        "update",
        "program_join_requests",
        request.id,
        { status: "approved", ...reviewed },
      ],
    ]);
  });
});

describe("toProgramJoinRequestResponse", () => {
  it("keeps only safe user fields from the expansions", () => {
    const record = {
      id: request.id,
      user: request.user,
      program: request.program,
      note: "hi",
      status: "pending",
      reason: "",
      reviewed_by: "",
      reviewed_at: "",
      created: "c",
      updated: "u",
      collectionId: "x",
      collectionName: "program_join_requests",
      expand: {
        user: {
          id: request.user,
          name: "Ana",
          email: "ana@buksu.edu.ph",
          tokenKey: "secret",
        },
        program: { id: request.program, name: "BSIT", code: "IT", extra: 1 },
      },
    } as unknown as ProgramJoinRequest;

    const res = toProgramJoinRequestResponse(record);

    expect(res.expand).toEqual({
      user: { id: request.user, name: "Ana", email: "ana@buksu.edu.ph" },
      program: { id: request.program, name: "BSIT", code: "IT" },
    });
    expect(res).not.toHaveProperty("collectionId");
  });
});
