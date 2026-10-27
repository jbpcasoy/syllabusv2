import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  findMissingChainRoles,
  loadChainHolders,
  loadStandIns,
  missingChainRoles,
} from "@/lib/syllabus-chain";
import type PocketBase from "pocketbase";

const PROGRAM = "prg123prg123prg";
const SYLLABUS = "sylsylsylsylsyl";

const filter = (expr: string, params: Record<string, unknown> = {}) =>
  expr.replace(/\{:(\w+)\}/g, (_, key) => JSON.stringify(params[key]));

/** `active` maps collections to the user ids of their active holders. */
function fakePb(
  active: Record<string, string[]>,
  program = { department: "dep123dep123dep" },
  department = { college: "col123col123col" },
) {
  const getFullList = vi.fn();
  const pb = {
    filter,
    collection: vi.fn((name: string) => ({
      getOne: vi.fn(async () => (name === "programs" ? program : department)),
      getFullList: vi.fn(async (...args: unknown[]) => {
        getFullList(name, ...args);
        return (active[name] ?? []).map((user) => ({ user }));
      }),
    })),
  };
  return { pb: pb as unknown as PocketBase, getFullList };
}

const ALL = {
  program_reviewers: ["reviewer"],
  deans: ["dean"],
  fdis_chairs: ["fdis"],
  citl_directors: ["citl"],
  vpaas: ["vpaa"],
};

describe("loadChainHolders", () => {
  it("returns holders per stage in chain order", async () => {
    const { pb, getFullList } = fakePb({ ...ALL, program_reviewers: ["r1", "r2"] });

    expect(await loadChainHolders(pb, PROGRAM)).toEqual([
      ["r1", "r2"],
      ["dean"],
      ["fdis"],
      ["citl"],
      ["vpaa"],
    ]);
    expect(getFullList).toHaveBeenCalledWith("program_reviewers", {
      fields: "user",
      filter: `active = true && program = "${PROGRAM}"`,
    });
    expect(getFullList).toHaveBeenCalledWith("deans", {
      fields: "user",
      filter: 'active = true && college = "col123col123col"',
    });
    expect(getFullList).toHaveBeenCalledWith("vpaas", {
      fields: "user",
      filter: "active = true",
    });
  });

  it("never consults program chairs or department heads", async () => {
    const { pb, getFullList } = fakePb(ALL);

    await loadChainHolders(pb, PROGRAM);
    const collections = getFullList.mock.calls.map(([name]) => name);
    expect(collections).not.toContain("program_chairs");
    expect(collections).not.toContain("department_heads");
  });

  it("leaves the dean empty for a program without a department", async () => {
    const { pb, getFullList } = fakePb(ALL, { department: "" });

    const holders = await loadChainHolders(pb, PROGRAM);
    expect(holders[0]).toEqual(["reviewer"]);
    expect(holders[1]).toEqual([]);
    expect(getFullList).not.toHaveBeenCalledWith("deans", expect.anything());
  });
});

describe("loadStandIns", () => {
  it("reads the syllabus's stand-ins", async () => {
    const getFullList = vi.fn(async () => [{ stage: 1, user: "u" }]);
    const pb = {
      filter,
      collection: vi.fn(() => ({ getFullList })),
    } as unknown as PocketBase;

    expect(await loadStandIns(pb, SYLLABUS)).toEqual([{ stage: 1, user: "u" }]);
    expect(pb.collection).toHaveBeenCalledWith("syllabus_stand_ins");
    expect(getFullList).toHaveBeenCalledWith({
      fields: "stage,user",
      filter: `syllabus = "${SYLLABUS}"`,
    });
  });
});

describe("missingChainRoles", () => {
  it("lists empty stages in chain order", () => {
    expect(missingChainRoles([[], ["d"], [], ["c"], []])).toEqual([
      "programReviewer",
      "fdisChair",
      "vpaa",
    ]);
  });

  it("returns nothing when every stage is held", () => {
    expect(missingChainRoles([["a"], ["b"], ["c"], ["d"], ["e"]])).toEqual([]);
  });
});

describe("findMissingChainRoles", () => {
  it("returns nothing when every role is held", async () => {
    const { pb } = fakePb(ALL);
    expect(await findMissingChainRoles(pb, PROGRAM)).toEqual([]);
  });

  it("lists missing roles in chain order", async () => {
    const { pb } = fakePb({ fdis_chairs: ["fdis"], citl_directors: ["citl"] });

    expect(await findMissingChainRoles(pb, PROGRAM)).toEqual([
      "programReviewer",
      "dean",
      "vpaa",
    ]);
  });

  it("treats a program without a department as missing a dean", async () => {
    const { pb } = fakePb(ALL, { department: "" });
    expect(await findMissingChainRoles(pb, PROGRAM)).toEqual(["dean"]);
  });
});
