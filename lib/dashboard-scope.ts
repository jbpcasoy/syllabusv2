import type {
  DashboardFilters,
  DashboardScope,
  ProgramOrg,
} from "@/types/dashboard";
import type { UserRoles } from "@/types/roles";

/**
 * Who sees what on the dashboard (Phase 5, P5 and P6). Pure, so it can be
 * tested exhaustively; the routes bind it to PocketBase with pb.filter.
 */

type Bind = (expr: string, params: Record<string, unknown>) => string;

const unique = (ids: string[]) => [...new Set(ids)];

/** Admin, VPAA, FDIS chair and CITL director see every program. */
export function dashboardScope(roles: UserRoles): DashboardScope {
  if (roles.isAdmin || roles.isVpaa || roles.isFdisChair || roles.isCitlDirector) {
    return { all: true };
  }
  return {
    all: false,
    collegeIds: unique(roles.deanOfColleges),
    departmentIds: unique(roles.headOfDepartments),
    programIds: unique([...roles.chairOfPrograms, ...roles.reviewerOfPrograms]),
  };
}

/**
 * The narrower scope of the justification panel: the roles that may return a
 * justification (justification.return), never a department head or program
 * chair. canAnywhere can't see program-reviewer scopes, so it is derived here.
 */
export function justificationScope(roles: UserRoles): DashboardScope {
  if (roles.isAdmin || roles.isVpaa || roles.isFdisChair || roles.isCitlDirector) {
    return { all: true };
  }
  return {
    all: false,
    collegeIds: unique(roles.deanOfColleges),
    departmentIds: [],
    programIds: unique(roles.reviewerOfPrograms),
  };
}

export function scopeIsEmpty(scope: DashboardScope): boolean {
  return (
    !scope.all &&
    scope.collegeIds.length + scope.departmentIds.length + scope.programIds.length === 0
  );
}

function anyOf(bind: Bind, field: string, ids: string[], prefix: string): string[] {
  return ids.map((id, i) =>
    bind(`${field} = {:${prefix}${i}}`, { [`${prefix}${i}`]: id }),
  );
}

/**
 * Filter on the `programs` collection for the scope, narrowed by the filters.
 * Field paths are constants; every id goes through `bind`.
 */
export function programScopeFilter(
  bind: Bind,
  scope: DashboardScope,
  filters: DashboardFilters = {},
): string {
  const parts: string[] = [];
  if (!scope.all) {
    const clauses = [
      ...anyOf(bind, "department.college", scope.collegeIds, "sc"),
      ...anyOf(bind, "department", scope.departmentIds, "sd"),
      ...anyOf(bind, "id", scope.programIds, "sp"),
    ];
    parts.push(clauses.length > 0 ? `(${clauses.join(" || ")})` : "id = ''");
  }
  if (filters.college) {
    parts.push(bind("department.college = {:fc}", { fc: filters.college }));
  }
  if (filters.department) {
    parts.push(bind("department = {:fd}", { fd: filters.department }));
  }
  if (filters.program) {
    parts.push(bind("id = {:fp}", { fp: filters.program }));
  }
  return parts.join(" && ");
}

/** True when the program sits inside the scope. */
export function programInScope(scope: DashboardScope, program: ProgramOrg): boolean {
  return (
    scope.all ||
    scope.programIds.includes(program.id) ||
    scope.departmentIds.includes(program.departmentId) ||
    scope.collegeIds.includes(program.collegeId)
  );
}

/** True when the program matches every filter given. */
export function programMatches(filters: DashboardFilters, program: ProgramOrg): boolean {
  return (
    (!filters.college || program.collegeId === filters.college) &&
    (!filters.department || program.departmentId === filters.department) &&
    (!filters.program || program.id === filters.program)
  );
}

/**
 * P6: a filter is allowed only when at least one program both sits in the
 * scope and matches it. Otherwise it names something outside the viewer's
 * scope (or nothing at all), and the route answers 403. No filter always
 * passes. `programs` is every program with its org chain.
 */
export function filterInScope(
  scope: DashboardScope,
  filters: DashboardFilters,
  programs: readonly ProgramOrg[],
): boolean {
  if (!filters.college && !filters.department && !filters.program) return true;
  if (scope.all) return true;
  // A filter naming the viewer's own college, department or program passes
  // even before it has programs (a new college shows an empty dashboard).
  const own =
    (!filters.college || scope.collegeIds.includes(filters.college)) &&
    (!filters.department || scope.departmentIds.includes(filters.department)) &&
    (!filters.program || scope.programIds.includes(filters.program));
  if (own) return true;
  return programs.some(
    (p) => programInScope(scope, p) && programMatches(filters, p),
  );
}

export type ScopedPrograms =
  | { ok: false }
  | {
      ok: true;
      programs: ProgramOrg[];
      /** Every program: a global viewer with no filter. */
      everything: boolean;
    };

/**
 * From the programs matching the filters (read regardless of scope), the
 * ones the request covers, or `ok: false` for an out-of-scope filter.
 */
export function scopePrograms(
  scope: DashboardScope,
  filters: DashboardFilters,
  matching: readonly ProgramOrg[],
): ScopedPrograms {
  if (!filterInScope(scope, filters, matching)) return { ok: false };
  const unfiltered = !filters.college && !filters.department && !filters.program;
  return {
    ok: true,
    programs: matching.filter((p) => programInScope(scope, p)),
    everything: scope.all && unfiltered,
  };
}

/** The 403 body for an out-of-scope filter. */
export const OUT_OF_SCOPE_ERROR =
  "That college, department or program is outside your scope.";
