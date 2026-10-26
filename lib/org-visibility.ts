import type { UserRoles } from "@/types/roles";

export type OrgVisibility =
  | { all: true }
  | { all: false; collegeIds: string[]; departmentIds: string[] };

type Bind = (expr: string, params: Record<string, unknown>) => string;

/**
 * Only deans and department heads are restricted, to their own college(s) and
 * department(s). Everyone else (including unassigned users, who need the list
 * to request to join a program) sees the whole structure.
 */
export function orgVisibility(roles: UserRoles): OrgVisibility {
  const global =
    roles.isAdmin || roles.isVpaa || roles.isFdisChair || roles.isCitlDirector;
  const scoped =
    roles.deanOfColleges.length > 0 || roles.headOfDepartments.length > 0;
  if (global || !scoped) return { all: true };
  return {
    all: false,
    collegeIds: roles.deanOfColleges,
    departmentIds: roles.headOfDepartments,
  };
}

export function departmentVisible(
  v: OrgVisibility,
  department: { id: string; college: string },
): boolean {
  return (
    v.all ||
    v.collegeIds.includes(department.college) ||
    v.departmentIds.includes(department.id)
  );
}

/** `departmentCollege` is the college of the program's department. */
export function programVisible(
  v: OrgVisibility,
  program: { department: string },
  departmentCollege?: string,
): boolean {
  return (
    v.all ||
    v.departmentIds.includes(program.department) ||
    (!!departmentCollege && v.collegeIds.includes(departmentCollege))
  );
}

function clauses(
  bind: Bind,
  field: string,
  ids: string[],
  prefix: string,
): string[] {
  return ids.map((id, i) =>
    bind(`${field} = {:${prefix}${i}}`, { [`${prefix}${i}`]: id }),
  );
}

/** PocketBase filter for the departments a user may see, or undefined for all. */
export function departmentScopeFilter(
  bind: Bind,
  v: OrgVisibility,
): string | undefined {
  if (v.all) return undefined;
  const parts = [
    ...clauses(bind, "college", v.collegeIds, "c"),
    ...clauses(bind, "id", v.departmentIds, "d"),
  ];
  return parts.length > 0 ? `(${parts.join(" || ")})` : "id = ''";
}

/**
 * Where an assignment collection's org chain lives, as PocketBase field paths.
 * Constants only, never user input.
 */
export type AssignmentPaths = {
  college?: string;
  department?: string;
  program?: string;
};

/**
 * PocketBase filter for the assignment records a user may see, or undefined
 * for all. University-wide roles see everything. Deans, department heads and
 * program chairs also see records inside their scope (where `paths` allows).
 * Everyone sees their own records.
 */
export function assignmentScopeFilter(
  bind: Bind,
  roles: UserRoles,
  userId: string,
  paths: AssignmentPaths,
): string | undefined {
  if (
    roles.isAdmin ||
    roles.isVpaa ||
    roles.isFdisChair ||
    roles.isCitlDirector
  ) {
    return undefined;
  }
  const parts = [
    bind("user = {:self}", { self: userId }),
    ...(paths.college
      ? clauses(bind, paths.college, roles.deanOfColleges, "c")
      : []),
    ...(paths.department
      ? clauses(bind, paths.department, roles.headOfDepartments, "d")
      : []),
    ...(paths.program
      ? clauses(bind, paths.program, roles.chairOfPrograms, "p")
      : []),
  ];
  return `(${parts.join(" || ")})`;
}

/** PocketBase filter for the programs a user may see, or undefined for all. */
export function programScopeFilter(
  bind: Bind,
  v: OrgVisibility,
): string | undefined {
  if (v.all) return undefined;
  const parts = [
    ...clauses(bind, "department.college", v.collegeIds, "c"),
    ...clauses(bind, "department", v.departmentIds, "d"),
  ];
  return parts.length > 0 ? `(${parts.join(" || ")})` : "id = ''";
}
