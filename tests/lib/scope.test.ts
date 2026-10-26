import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getOne: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/pocketbase", () => ({
  createAdminPb: vi.fn(async () => ({
    collection: (name: string) => ({
      getOne: (id: string, options: unknown) => mocks.getOne(name, id, options),
    }),
  })),
}));

import { resolveScope } from "@/lib/scope";

const records: Record<string, Record<string, unknown>> = {
  "programs/progAprogAprogA": { department: "deptAdeptAdeptA" },
  "programs/orphan0orphan0o": { department: "" },
  "departments/deptAdeptAdeptA": { college: "colgAcolgAcolgA" },
  "departments/nocolgnocolgnoc": { college: "" },
  "program_chairs/chairAchairAcha": { program: "progAprogAprogA" },
  "faculties/factyAfactyAfact": { program: "progAprogAprogA" },
  "program_join_requests/jreqAjreqAjreqA": { program: "progAprogAprogA" },
  "syllabus_references/srefAsrefAsrefA": { program: "progAprogAprogA" },
  "department_heads/headAheadAheadA": { department: "deptAdeptAdeptA" },
};

const fullChain = {
  programId: "progAprogAprogA",
  departmentId: "deptAdeptAdeptA",
  collegeId: "colgAcolgAcolgA",
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getOne.mockImplementation(async (name: string, id: string) => {
    const record = records[`${name}/${id}`];
    if (!record) throw { status: 404 };
    return record;
  });
});

describe("resolveScope", () => {
  it("returns a college target as-is without touching PocketBase", async () => {
    expect(await resolveScope({ college: "colgAcolgAcolgA" })).toEqual({
      collegeId: "colgAcolgAcolgA",
    });
    expect(mocks.getOne).not.toHaveBeenCalled();
  });

  it("resolves a department to its college", async () => {
    expect(await resolveScope({ department: "deptAdeptAdeptA" })).toEqual({
      departmentId: "deptAdeptAdeptA",
      collegeId: "colgAcolgAcolgA",
    });
  });

  it("resolves a program through its department to the college", async () => {
    expect(await resolveScope({ program: "progAprogAprogA" })).toEqual({
      programId: "progAprogAprogA",
      departmentId: "deptAdeptAdeptA",
      collegeId: "colgAcolgAcolgA",
    });
  });

  it("leaves out links that are missing (legacy data)", async () => {
    expect(await resolveScope({ program: "orphan0orphan0o" })).toEqual({
      programId: "orphan0orphan0o",
    });
    expect(await resolveScope({ department: "nocolgnocolgnoc" })).toEqual({
      departmentId: "nocolgnocolgnoc",
      collegeId: undefined,
    });
  });

  it("resolves a program chair record through its program", async () => {
    expect(await resolveScope({ programChair: "chairAchairAcha" })).toEqual(
      fullChain,
    );
    expect(mocks.getOne).toHaveBeenCalledWith(
      "program_chairs",
      "chairAchairAcha",
      { fields: "program" },
    );
  });

  it("resolves a faculty membership through its program", async () => {
    expect(await resolveScope({ faculty: "factyAfactyAfact" })).toEqual(
      fullChain,
    );
  });

  it("resolves a program join request through its program", async () => {
    expect(
      await resolveScope({ programJoinRequest: "jreqAjreqAjreqA" }),
    ).toEqual(fullChain);
    expect(mocks.getOne).toHaveBeenCalledWith(
      "program_join_requests",
      "jreqAjreqAjreqA",
      { fields: "program" },
    );
  });

  it("resolves a syllabus reference through the referencing program", async () => {
    expect(
      await resolveScope({ syllabusReference: "srefAsrefAsrefA" }),
    ).toEqual(fullChain);
    expect(mocks.getOne).toHaveBeenCalledWith(
      "syllabus_references",
      "srefAsrefAsrefA",
      { fields: "program" },
    );
  });

  it("resolves a department head record through its department", async () => {
    expect(await resolveScope({ departmentHead: "headAheadAheadA" })).toEqual({
      departmentId: "deptAdeptAdeptA",
      collegeId: "colgAcolgAcolgA",
    });
  });

  it("propagates a 404 for an unknown assignment record", async () => {
    await expect(
      resolveScope({ programChair: "missing0missing0" }),
    ).rejects.toEqual({ status: 404 });
  });

  it("propagates PocketBase's 404 for an unknown record", async () => {
    await expect(resolveScope({ program: "missing0missing0" })).rejects.toEqual(
      {
        status: 404,
      },
    );
  });
});
