import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  loadFilteredPrograms: vi.fn(),
}));

vi.mock("@/lib/pocketbase", async () => {
  const { NextResponse } = await import("next/server");
  return {
    createAdminPb: vi.fn(async () => ({})),
    handlePbError: vi.fn((error: unknown) => {
      const status =
        typeof error === "object" && error && "status" in error
          ? Number((error as { status: unknown }).status)
          : 500;
      return NextResponse.json({ error: "pb error" }, { status });
    }),
  };
});

// Mocked wholesale so the real module (and "server-only") is never loaded.
// Only the program read is faked; the pure scopePrograms decides.
vi.mock("@/lib/dashboard", async () => {
  const { scopePrograms } = await import("@/lib/dashboard-scope");
  return {
    resolveScopedPrograms: async (pb: unknown, scope: never, filters: never) =>
      scopePrograms(scope, filters, await mocks.loadFilteredPrograms(pb, filters)),
  };
});

vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);
vi.mock("@/lib/roles", async () =>
  (await import("@/tests/helpers/mock-auth")).rolesModuleMock(),
);

import { GET } from "@/app/api/dashboard/scope/route";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import type { ProgramOrg } from "@/types/dashboard";
import { mockAuth } from "@/tests/helpers/mock-auth";

const program = (id: string, departmentId: string, collegeId: string): ProgramOrg => ({
  id,
  code: id.slice(3, 5),
  name: id,
  departmentId,
  departmentName: "Dept",
  collegeId,
  collegeName: "College",
});
const IT = program("prgitprgitprgit", "depitdepitdepit", "colcotcolcotcol");
const EMC = program("prgemcprgemcprg", "depitdepitdepit", "colcotcolcotcol");
const N = program("prgnprgnprgnprg", "depndepndepndep", "colconcolconcol");

beforeEach(() => {
  vi.clearAllMocks();
  mocks.loadFilteredPrograms.mockResolvedValue([IT, EMC, N]);
});

describe("GET /api/dashboard/scope", () => {
  it("gives admin every program and the justification panel", async () => {
    mockAuth({ isAdmin: true });
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ programs: [IT, EMC, N], justifications: true });
    expect(mocks.loadFilteredPrograms).toHaveBeenCalledWith(expect.anything(), {});
  });

  it.each([
    ["a dean", { deanOfColleges: [IT.collegeId] }, [IT.id, EMC.id], true],
    ["a program reviewer", { reviewerOfPrograms: [EMC.id] }, [EMC.id], true],
    ["a department head", { headOfDepartments: [IT.departmentId] }, [IT.id, EMC.id], false],
    ["a program chair", { chairOfPrograms: [N.id] }, [N.id], false],
    ["the VPAA", { isVpaa: true }, [IT.id, EMC.id, N.id], true],
  ])("scopes %s", async (_label, roles, programs, justifications) => {
    mockAuth({ roles });
    const body = await (await GET()).json();
    expect(body.programs.map((p: ProgramOrg) => p.id)).toEqual(programs);
    expect(body.justifications).toBe(justifications);
  });

  it("returns 401 when signed out, touching nothing", async () => {
    mockAuth({ signedIn: false });
    expect((await GET()).status).toBe(401);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("returns 403 to faculty, touching nothing", async () => {
    mockAuth({ roles: { facultyOfPrograms: [IT.id] } });
    expect((await GET()).status).toBe(403);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("delegates PocketBase errors to handlePbError", async () => {
    mockAuth({ isAdmin: true });
    const error = { status: 500 };
    mocks.loadFilteredPrograms.mockRejectedValue(error);
    expect((await GET()).status).toBe(500);
    expect(handlePbError).toHaveBeenCalledWith(error);
  });
});
