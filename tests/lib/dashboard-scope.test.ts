import {
  dashboardScope,
  filterInScope,
  justificationScope,
  programInScope,
  programMatches,
  programScopeFilter,
  scopeIsEmpty,
  scopePrograms,
} from "@/lib/dashboard-scope";
import type { DashboardScope, ProgramOrg } from "@/types/dashboard";
import { NO_ROLES, type UserRoles } from "@/types/roles";
import { describe, expect, it } from "vitest";

const roles = (partial: Partial<UserRoles> = {}): UserRoles => ({
  ...NO_ROLES,
  ...partial,
});
const bind = (expr: string, params: Record<string, unknown>) =>
  expr.replace(/\{:(\w+)\}/g, (_, key) => JSON.stringify(params[key]));

const COLLEGE_A = "colAcolAcolAcol";
const COLLEGE_B = "colBcolBcolBcol";
const DEPT_A1 = "depA1depA1depA1";
const DEPT_A2 = "depA2depA2depA2";
const DEPT_B1 = "depB1depB1depB1";
const PROG_A1 = "prgA1prgA1prgA1";
const PROG_A2 = "prgA2prgA2prgA2";
const PROG_B1 = "prgB1prgB1prgB1";

const org = (id: string, departmentId: string, collegeId: string): ProgramOrg => ({
  id,
  code: id.slice(0, 5),
  name: id,
  departmentId,
  departmentName: departmentId,
  collegeId,
  collegeName: collegeId,
});
const PROGRAMS = [
  org(PROG_A1, DEPT_A1, COLLEGE_A),
  org(PROG_A2, DEPT_A2, COLLEGE_A),
  org(PROG_B1, DEPT_B1, COLLEGE_B),
];
const scoped = (partial: Partial<Omit<Extract<DashboardScope, { all: false }>, "all">>): DashboardScope => ({
  all: false,
  collegeIds: [],
  departmentIds: [],
  programIds: [],
  ...partial,
});

describe("dashboardScope", () => {
  it.each([
    ["admin", roles({ isAdmin: true })],
    ["the VPAA", roles({ isVpaa: true })],
    ["the FDIS chair", roles({ isFdisChair: true })],
    ["the CITL director", roles({ isCitlDirector: true })],
  ])("is global for %s", (_label, who) => {
    expect(dashboardScope(who)).toEqual({ all: true });
  });

  it("is global for a global role who also holds scoped ones", () => {
    expect(
      dashboardScope(roles({ isFdisChair: true, deanOfColleges: [COLLEGE_A] })),
    ).toEqual({ all: true });
  });

  it.each([
    ["a dean", roles({ deanOfColleges: [COLLEGE_A] }), scoped({ collegeIds: [COLLEGE_A] })],
    ["a department head", roles({ headOfDepartments: [DEPT_A1] }), scoped({ departmentIds: [DEPT_A1] })],
    ["a program chair", roles({ chairOfPrograms: [PROG_A1] }), scoped({ programIds: [PROG_A1] })],
    ["a program reviewer", roles({ reviewerOfPrograms: [PROG_B1] }), scoped({ programIds: [PROG_B1] })],
    ["faculty only", roles({ facultyOfPrograms: [PROG_A1] }), scoped({})],
  ])("is scoped for %s", (_label, who, expected) => {
    expect(dashboardScope(who)).toEqual(expected);
  });

  it("combines every scoped role, without duplicates", () => {
    expect(
      dashboardScope(
        roles({
          deanOfColleges: [COLLEGE_B],
          headOfDepartments: [DEPT_A1],
          chairOfPrograms: [PROG_A2],
          reviewerOfPrograms: [PROG_A2, PROG_B1],
        }),
      ),
    ).toEqual(
      scoped({
        collegeIds: [COLLEGE_B],
        departmentIds: [DEPT_A1],
        programIds: [PROG_A2, PROG_B1],
      }),
    );
  });
});

describe("justificationScope", () => {
  it.each([
    ["admin", roles({ isAdmin: true })],
    ["the VPAA", roles({ isVpaa: true })],
    ["the FDIS chair", roles({ isFdisChair: true })],
    ["the CITL director", roles({ isCitlDirector: true })],
  ])("is global for %s", (_label, who) => {
    expect(justificationScope(who)).toEqual({ all: true });
  });

  it("covers a dean's college and a reviewer's programs", () => {
    expect(
      justificationScope(
        roles({ deanOfColleges: [COLLEGE_A], reviewerOfPrograms: [PROG_B1] }),
      ),
    ).toEqual(scoped({ collegeIds: [COLLEGE_A], programIds: [PROG_B1] }));
  });

  it.each([
    ["a department head", roles({ headOfDepartments: [DEPT_A1] })],
    ["a program chair", roles({ chairOfPrograms: [PROG_A1] })],
    ["faculty", roles({ facultyOfPrograms: [PROG_A1] })],
  ])("is empty for %s", (_label, who) => {
    expect(scopeIsEmpty(justificationScope(who))).toBe(true);
  });

  it("drops the head and chair parts of someone who is also a reviewer", () => {
    expect(
      justificationScope(
        roles({
          headOfDepartments: [DEPT_A1],
          chairOfPrograms: [PROG_A1],
          reviewerOfPrograms: [PROG_A2],
        }),
      ),
    ).toEqual(scoped({ programIds: [PROG_A2] }));
  });
});

describe("scopeIsEmpty", () => {
  it("is false for a global scope and for any id", () => {
    expect(scopeIsEmpty({ all: true })).toBe(false);
    expect(scopeIsEmpty(scoped({ programIds: [PROG_A1] }))).toBe(false);
  });

  it("is true with no ids", () => {
    expect(scopeIsEmpty(scoped({}))).toBe(true);
  });
});

describe("programScopeFilter", () => {
  it("has no constraint for a global scope", () => {
    expect(programScopeFilter(bind, { all: true })).toBe("");
  });

  it("ORs every scope id at its level", () => {
    expect(
      programScopeFilter(
        bind,
        scoped({ collegeIds: [COLLEGE_A], departmentIds: [DEPT_B1], programIds: [PROG_B1] }),
      ),
    ).toBe(
      `(department.college = "${COLLEGE_A}" || department = "${DEPT_B1}" || id = "${PROG_B1}")`,
    );
  });

  it("matches nothing for an empty scope", () => {
    expect(programScopeFilter(bind, scoped({}))).toBe("id = ''");
  });

  it("ANDs the filters onto the scope", () => {
    expect(
      programScopeFilter(bind, scoped({ collegeIds: [COLLEGE_A] }), {
        college: COLLEGE_A,
        department: DEPT_A1,
        program: PROG_A1,
      }),
    ).toBe(
      `(department.college = "${COLLEGE_A}") && department.college = "${COLLEGE_A}" && department = "${DEPT_A1}" && id = "${PROG_A1}"`,
    );
  });

  it("binds filter values instead of concatenating them", () => {
    const filter = programScopeFilter(bind, { all: true }, { program: `x" || id != "` });
    expect(filter).toBe(`id = ${JSON.stringify(`x" || id != "`)}`);
  });
});

describe("programInScope and programMatches", () => {
  const a1 = PROGRAMS[0];

  it.each([
    [{ all: true } as DashboardScope, true],
    [scoped({ collegeIds: [COLLEGE_A] }), true],
    [scoped({ departmentIds: [DEPT_A1] }), true],
    [scoped({ programIds: [PROG_A1] }), true],
    [scoped({ collegeIds: [COLLEGE_B], departmentIds: [DEPT_A2], programIds: [PROG_B1] }), false],
  ])("scope %o holds A1: %s", (scope, expected) => {
    expect(programInScope(scope, a1)).toBe(expected);
  });

  it("matches only every filter given", () => {
    expect(programMatches({}, a1)).toBe(true);
    expect(programMatches({ college: COLLEGE_A, department: DEPT_A1 }, a1)).toBe(true);
    expect(programMatches({ college: COLLEGE_A, department: DEPT_A2 }, a1)).toBe(false);
    expect(programMatches({ program: PROG_B1 }, a1)).toBe(false);
  });
});

describe("filterInScope", () => {
  const dean = scoped({ collegeIds: [COLLEGE_A] });
  const head = scoped({ departmentIds: [DEPT_A1] });
  const chair = scoped({ programIds: [PROG_A1] });

  it("allows no filter for anyone", () => {
    expect(filterInScope(scoped({}), {}, PROGRAMS)).toBe(true);
  });

  it("allows any filter for a global scope", () => {
    expect(filterInScope({ all: true }, { college: COLLEGE_B }, PROGRAMS)).toBe(true);
  });

  it.each([
    ["their college", { college: COLLEGE_A }, true],
    ["a department in it", { department: DEPT_A2 }, true],
    ["a program in it", { program: PROG_A2 }, true],
    ["another college", { college: COLLEGE_B }, false],
    ["a department elsewhere", { department: DEPT_B1 }, false],
    ["a program elsewhere", { program: PROG_B1 }, false],
    ["an unknown id", { program: "zzzzzzzzzzzzzzz" }, false],
  ])("a dean filtering by %s: %s", (_label, filters, expected) => {
    expect(filterInScope(dean, filters, PROGRAMS)).toBe(expected);
  });

  it.each([
    ["their department", { department: DEPT_A1 }, true],
    ["their program", { program: PROG_A1 }, true],
    ["their college (it overlaps)", { college: COLLEGE_A }, true],
    ["a sibling department", { department: DEPT_A2 }, false],
    ["a sibling program", { program: PROG_A2 }, false],
  ])("a head filtering by %s: %s", (_label, filters, expected) => {
    expect(filterInScope(head, filters, PROGRAMS)).toBe(expected);
  });

  it.each([
    ["their program", { program: PROG_A1 }, true],
    ["their department (it overlaps)", { department: DEPT_A1 }, true],
    ["another program", { program: PROG_A2 }, false],
  ])("a chair filtering by %s: %s", (_label, filters, expected) => {
    expect(filterInScope(chair, filters, PROGRAMS)).toBe(expected);
  });

  it("allows a dean's own college before it has programs", () => {
    expect(filterInScope(scoped({ collegeIds: ["colNEWcolNEWcol"] }), { college: "colNEWcolNEWcol" }, PROGRAMS)).toBe(true);
  });

  it("refuses filters that contradict each other", () => {
    expect(filterInScope(dean, { college: COLLEGE_A, program: PROG_B1 }, PROGRAMS)).toBe(false);
  });
});

describe("scopePrograms", () => {
  const dean = scoped({ collegeIds: [COLLEGE_A] });

  it("keeps the matching programs inside the scope", () => {
    expect(scopePrograms(dean, {}, PROGRAMS)).toEqual({
      ok: true,
      programs: [PROGRAMS[0], PROGRAMS[1]],
      everything: false,
    });
  });

  it("covers everything only for a global viewer with no filter", () => {
    expect(scopePrograms({ all: true }, {}, PROGRAMS)).toMatchObject({ everything: true });
    expect(
      scopePrograms({ all: true }, { college: COLLEGE_B }, [PROGRAMS[2]]),
    ).toEqual({ ok: true, programs: [PROGRAMS[2]], everything: false });
  });

  it("refuses a filter outside the scope", () => {
    expect(scopePrograms(dean, { college: COLLEGE_B }, [PROGRAMS[2]])).toEqual({ ok: false });
  });
});
