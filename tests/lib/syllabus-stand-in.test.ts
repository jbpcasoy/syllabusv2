import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  listStandInCandidates,
  listStandIns,
  toStandInResponse,
} from "@/lib/syllabus-stand-in";
import type { SyllabusStandIn } from "@/types/syllabus-stand-in";
import type PocketBase from "pocketbase";

const SYLLABUS = "sylsylsylsylsyl";
const PROGRAM = "prg123prg123prg";
const LEAD = "leadleadleadlea";
const CO = "cocococococococ";

const filter = (expr: string, params: Record<string, unknown> = {}) =>
  expr.replace(/\{:(\w+)\}/g, (_, key) => JSON.stringify(params[key]));

function fakePb(handlers: Record<string, Record<string, ReturnType<typeof vi.fn>>>) {
  return {
    filter,
    collection: vi.fn((name: string) => handlers[name]),
  } as unknown as PocketBase;
}

const record = {
  id: "standinstandins",
  syllabus: SYLLABUS,
  stage: 1,
  user: "useruseruseruse",
  assigned_by: "assgnassgnassgn",
  created: "2026-10-27 08:00:00.000Z",
  updated: "2026-10-27 09:00:00.000Z",
  expand: {
    user: { id: "useruseruseruse", name: "Ana", email: "ana@x", tokenKey: "secret" },
    assigned_by: { id: "assgnassgnassgn", name: "Dean D", email: "d@x" },
  },
} as unknown as SyllabusStandIn;

describe("toStandInResponse", () => {
  it("maps a proxy to a safe shape", () => {
    const response = toStandInResponse(record);
    expect(response).toEqual({
      id: "standinstandins",
      stage: 1,
      kind: "proxy",
      user: { id: "useruseruseruse", name: "Ana", email: "ana@x" },
      assigned_by: { id: "assgnassgnassgn", name: "Dean D" },
      updated: "2026-10-27 09:00:00.000Z",
    });
    expect(JSON.stringify(response)).not.toContain("secret");
  });

  it("calls later stages stand-ins and tolerates a missing expand", () => {
    const response = toStandInResponse({ ...record, stage: 3, expand: undefined });
    expect(response.kind).toBe("standIn");
    expect(response.user).toEqual({ id: "useruseruseruse", name: "", email: "" });
  });
});

describe("listStandIns", () => {
  it("reads the syllabus's stand-ins in stage order", async () => {
    const getFullList = vi.fn(async () => [record]);
    const pb = fakePb({ syllabus_stand_ins: { getFullList } });

    expect(await listStandIns(pb, SYLLABUS)).toHaveLength(1);
    expect(getFullList).toHaveBeenCalledWith({
      expand: "user,assigned_by",
      sort: "stage",
      filter: `syllabus = "${SYLLABUS}"`,
    });
  });
});

describe("listStandInCandidates", () => {
  const syllabus = { program: PROGRAM, lead: LEAD, co_authors: [CO] };

  it("offers the program's active faculty for the proxy, minus authors", async () => {
    const getList = vi.fn(async () => ({
      items: [{ expand: { user: { id: "u1", name: "Ana", email: "a@x" } } }, {}],
    }));
    const pb = fakePb({ faculties: { getList } });

    expect(await listStandInCandidates(pb, syllabus, 1, "an")).toEqual([
      { id: "u1", name: "Ana", email: "a@x" },
    ]);
    expect(getList).toHaveBeenCalledWith(1, 20, {
      skipTotal: true,
      expand: "user",
      sort: "user.name",
      filter: `program = "${PROGRAM}" && active = true && user != "${LEAD}" && user != "${CO}" && (user.name ~ "an" || user.email ~ "an")`,
    });
  });

  it("offers verified users for later stages, minus authors", async () => {
    const getList = vi.fn(async () => ({
      items: [{ id: "u2", name: "Ben", email: "b@x", tokenKey: "secret" }],
    }));
    const pb = fakePb({ users: { getList } });

    expect(await listStandInCandidates(pb, syllabus, 3, "")).toEqual([
      { id: "u2", name: "Ben", email: "b@x" },
    ]);
    expect(getList).toHaveBeenCalledWith(1, 20, {
      skipTotal: true,
      fields: "id,name,email",
      sort: "name",
      filter: `verified = true && id != "${LEAD}" && id != "${CO}"`,
    });
  });
});
