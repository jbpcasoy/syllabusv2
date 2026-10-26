import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { findMissingChainRoles } from "@/lib/syllabus-chain";
import type PocketBase from "pocketbase";

const PROGRAM = "prg123prg123prg";

const filter = (expr: string, params: Record<string, unknown> = {}) =>
  expr.replace(/\{:(\w+)\}/g, (_, key) => JSON.stringify(params[key]));

/** `active` lists the collections that have an active holder. */
function fakePb(
  active: string[],
  program = { department: "dep123dep123dep" },
  department = { college: "col123col123col" },
) {
  const getList = vi.fn();
  const pb = {
    filter,
    collection: vi.fn((name: string) => ({
      getOne: vi.fn(async () => (name === "programs" ? program : department)),
      getList: vi.fn(async (...args: unknown[]) => {
        getList(name, ...args);
        return { items: active.includes(name) ? [{ id: "x" }] : [] };
      }),
    })),
  };
  return { pb: pb as unknown as PocketBase, getList };
}

const ALL = [
  "program_chairs",
  "department_heads",
  "deans",
  "fdis_chairs",
  "citl_directors",
  "vpaas",
];

describe("findMissingChainRoles", () => {
  it("returns nothing when every role is held", async () => {
    const { pb, getList } = fakePb(ALL);

    expect(await findMissingChainRoles(pb, PROGRAM)).toEqual([]);
    expect(getList).toHaveBeenCalledWith("program_chairs", 1, 1, {
      skipTotal: true,
      fields: "id",
      filter: `active = true && program = "${PROGRAM}"`,
    });
    expect(getList).toHaveBeenCalledWith("department_heads", 1, 1, {
      skipTotal: true,
      fields: "id",
      filter: 'active = true && department = "dep123dep123dep"',
    });
    expect(getList).toHaveBeenCalledWith("deans", 1, 1, {
      skipTotal: true,
      fields: "id",
      filter: 'active = true && college = "col123col123col"',
    });
    expect(getList).toHaveBeenCalledWith("vpaas", 1, 1, {
      skipTotal: true,
      fields: "id",
      filter: "active = true",
    });
  });

  it("lists missing roles in chain order", async () => {
    const { pb } = fakePb(["department_heads", "fdis_chairs", "citl_directors"]);

    expect(await findMissingChainRoles(pb, PROGRAM)).toEqual([
      "programChair",
      "dean",
      "vpaa",
    ]);
  });

  it("treats a program without a department as missing head and dean", async () => {
    const { pb, getList } = fakePb(ALL, { department: "" });

    expect(await findMissingChainRoles(pb, PROGRAM)).toEqual([
      "departmentHead",
      "dean",
    ]);
    expect(getList).not.toHaveBeenCalledWith(
      "department_heads",
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
  });
});
