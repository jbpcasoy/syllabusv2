import {
  assignmentScopeFilter,
  departmentScopeFilter,
  departmentVisible,
  orgVisibility,
  programScopeFilter,
  programVisible,
} from "@/lib/org-visibility";
import { NO_ROLES, type UserRoles } from "@/types/roles";
import { describe, expect, it } from "vitest";

const roles = (partial: Partial<UserRoles>): UserRoles => ({
  ...NO_ROLES,
  ...partial,
});
const C1 = "colgAcolgAcolgA";
const C2 = "colgBcolgBcolgB";
const D1 = "deptAdeptAdeptA";
const D2 = "deptBdeptBdeptB";
const bind = (expr: string) => expr;

describe("orgVisibility", () => {
  it.each([
    ["admin", { isAdmin: true }],
    ["VPAA", { isVpaa: true }],
    ["FDIS chair", { isFdisChair: true }],
    ["CITL director", { isCitlDirector: true }],
    ["unassigned user", {}],
    ["chair", { chairOfPrograms: ["p"] }],
    ["faculty", { facultyOfPrograms: ["p"] }],
    ["dean who is also VPAA", { deanOfColleges: [C1], isVpaa: true }],
  ])("%s sees everything", (_label, partial) => {
    expect(orgVisibility(roles(partial))).toEqual({ all: true });
  });

  it("restricts a dean to their colleges", () => {
    expect(orgVisibility(roles({ deanOfColleges: [C1] }))).toEqual({
      all: false,
      collegeIds: [C1],
      departmentIds: [],
    });
  });

  it("restricts a department head to their departments", () => {
    expect(orgVisibility(roles({ headOfDepartments: [D1] }))).toEqual({
      all: false,
      collegeIds: [],
      departmentIds: [D1],
    });
  });

  it("unions dean and head scopes", () => {
    expect(
      orgVisibility(roles({ deanOfColleges: [C1], headOfDepartments: [D2] })),
    ).toEqual({ all: false, collegeIds: [C1], departmentIds: [D2] });
  });
});

describe("visibility predicates", () => {
  const dean = orgVisibility(roles({ deanOfColleges: [C1] }));
  const head = orgVisibility(roles({ headOfDepartments: [D1] }));

  it("departments", () => {
    expect(departmentVisible({ all: true }, { id: D2, college: C2 })).toBe(
      true,
    );
    expect(departmentVisible(dean, { id: D1, college: C1 })).toBe(true);
    expect(departmentVisible(dean, { id: D1, college: C2 })).toBe(false);
    expect(departmentVisible(head, { id: D1, college: C2 })).toBe(true);
    expect(departmentVisible(head, { id: D2, college: C1 })).toBe(false);
  });

  it("programs", () => {
    expect(programVisible({ all: true }, { department: D2 })).toBe(true);
    expect(programVisible(dean, { department: D1 }, C1)).toBe(true);
    expect(programVisible(dean, { department: D1 }, C2)).toBe(false);
    expect(programVisible(dean, { department: D1 })).toBe(false);
    expect(programVisible(head, { department: D1 }, C2)).toBe(true);
    expect(programVisible(head, { department: D2 }, C1)).toBe(false);
  });
});

describe("scope filters", () => {
  it("return undefined when everything is visible", () => {
    expect(departmentScopeFilter(bind, { all: true })).toBeUndefined();
    expect(programScopeFilter(bind, { all: true })).toBeUndefined();
  });

  it("build department filters from colleges and departments", () => {
    expect(
      departmentScopeFilter(bind, {
        all: false,
        collegeIds: [C1, C2],
        departmentIds: [D1],
      }),
    ).toBe("(college = {:c0} || college = {:c1} || id = {:d0})");
  });

  it("build program filters through department.college", () => {
    expect(
      programScopeFilter(bind, {
        all: false,
        collegeIds: [C1],
        departmentIds: [D1],
      }),
    ).toBe("(department.college = {:c0} || department = {:d0})");
  });

  it("bind each id as a parameter", () => {
    const calls: Array<[string, Record<string, unknown>]> = [];
    departmentScopeFilter(
      (expr, params) => {
        calls.push([expr, params]);
        return expr;
      },
      { all: false, collegeIds: [C1], departmentIds: [D1] },
    );
    expect(calls).toEqual([
      ["college = {:c0}", { c0: C1 }],
      ["id = {:d0}", { d0: D1 }],
    ]);
  });

  it("match nothing for an empty restricted scope", () => {
    const empty = { all: false as const, collegeIds: [], departmentIds: [] };
    expect(departmentScopeFilter(bind, empty)).toBe("id = ''");
    expect(programScopeFilter(bind, empty)).toBe("id = ''");
  });
});

describe("assignmentScopeFilter", () => {
  const ME = "me1me1me1me1me1";
  const P1 = "progAprogAprogA";
  const paths = {
    college: "program.department.college",
    department: "program.department",
    program: "program",
  };
  const bindParams = (expr: string, params: Record<string, unknown>) =>
    `${expr}|${JSON.stringify(params)}`;

  it("returns undefined for university-wide roles", () => {
    for (const r of [
      { isAdmin: true },
      { isVpaa: true },
      { isFdisChair: true },
      { isCitlDirector: true },
    ]) {
      expect(assignmentScopeFilter(bind, roles(r), ME, paths)).toBeUndefined();
    }
  });

  it("limits everyone else to their own records", () => {
    expect(
      assignmentScopeFilter(
        bindParams,
        roles({ facultyOfPrograms: [P1] }),
        ME,
        paths,
      ),
    ).toBe(`(user = {:self}|{"self":"${ME}"})`);
  });

  it("adds the dean's colleges, head's departments and chair's programs", () => {
    const filter = assignmentScopeFilter(
      bindParams,
      roles({
        deanOfColleges: [C1, C2],
        headOfDepartments: [D1],
        chairOfPrograms: [P1],
      }),
      ME,
      paths,
    );
    expect(filter).toBe(
      "(" +
        [
          `user = {:self}|{"self":"${ME}"}`,
          `program.department.college = {:c0}|{"c0":"${C1}"}`,
          `program.department.college = {:c1}|{"c1":"${C2}"}`,
          `program.department = {:d0}|{"d0":"${D1}"}`,
          `program = {:p0}|{"p0":"${P1}"}`,
        ].join(" || ") +
        ")",
    );
  });

  it("ignores scopes the collection has no path for", () => {
    expect(
      assignmentScopeFilter(
        bind,
        roles({ deanOfColleges: [C1], chairOfPrograms: [P1] }),
        ME,
        { college: "department.college" },
      ),
    ).toBe("(user = {:self} || department.college = {:c0})");
  });
});
