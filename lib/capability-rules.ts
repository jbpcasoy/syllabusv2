import type { UserRoles } from "@/types/roles";

export type Capability =
  // Admin only
  | "campus.write"
  | "user.read"
  | "user.write"
  | "vpaa.write"
  | "schoolYear.write"
  | "term.write"
  | "course.write"
  | "prospectus.write"
  | "prospectusItem.write"
  // VPAA, global
  | "college.write"
  | "dean.write"
  | "fdisChair.write"
  | "citlDirector.write"
  // Scoped
  | "department.create"
  | "department.update"
  | "department.delete"
  | "program.create"
  | "program.update"
  | "program.delete"
  | "departmentHead.write"
  | "programChair.write"
  | "faculty.write"
  | "programJoinRequest.review"
  | "syllabusReference.request";

/** The org chain a target sits in, resolved program → department → college. */
export type ScopeChain = {
  collegeId?: string;
  departmentId?: string;
  programId?: string;
};

type Rule = (roles: UserRoles, scope?: ScopeChain) => boolean;

const adminOnly: Rule = () => false;
const vpaa: Rule = (r) => r.isVpaa;
const dean: Rule = (r, s) =>
  !!s?.collegeId && r.deanOfColleges.includes(s.collegeId);
const head: Rule = (r, s) =>
  !!s?.departmentId && r.headOfDepartments.includes(s.departmentId);
const chair: Rule = (r, s) =>
  !!s?.programId && r.chairOfPrograms.includes(s.programId);
const anyOf =
  (...rules: Rule[]): Rule =>
  (r, s) =>
    rules.some((rule) => rule(r, s));

// Record<Capability, Rule> makes the compiler force a rule for every capability.
const RULES: Record<Capability, Rule> = {
  "campus.write": adminOnly,
  "user.read": adminOnly,
  "user.write": adminOnly,
  "vpaa.write": adminOnly,
  "schoolYear.write": adminOnly,
  "term.write": adminOnly,
  "course.write": adminOnly,
  "prospectus.write": adminOnly,
  "prospectusItem.write": adminOnly,

  "college.write": vpaa,
  "dean.write": vpaa,
  "fdisChair.write": vpaa,
  "citlDirector.write": vpaa,

  // Department heads may edit, but not create or delete.
  "department.create": anyOf(vpaa, dean),
  "department.update": anyOf(vpaa, dean, head),
  "department.delete": anyOf(vpaa, dean),
  "program.create": anyOf(vpaa, dean),
  "program.update": anyOf(vpaa, dean, head),
  "program.delete": anyOf(vpaa, dean),

  "departmentHead.write": anyOf(vpaa, dean),
  "programChair.write": anyOf(vpaa, dean, head),
  "faculty.write": chair,
  // Approving creates a faculty record, so it mirrors faculty.write.
  "programJoinRequest.review": chair,
  // Request or withdraw a reference to another program's syllabus. The
  // source lead's decision is a relationship check, not a capability.
  "syllabusReference.request": chair,
};

export const CAPABILITIES = Object.keys(RULES) as Capability[];

/** Pure decision. Admin always passes. */
export function evaluateCapability(
  roles: UserRoles,
  capability: Capability,
  scope?: ScopeChain,
): boolean {
  return roles.isAdmin || RULES[capability](roles, scope);
}

/**
 * True if the capability holds globally or within at least one of the user's
 * own scopes. Use it to decide whether to show "Add" or "Edit" controls; the
 * route still checks the actual target.
 */
export function canAnywhere(roles: UserRoles, capability: Capability): boolean {
  const scopes: ScopeChain[] = [
    {},
    ...roles.deanOfColleges.map((collegeId) => ({ collegeId })),
    ...roles.headOfDepartments.map((departmentId) => ({ departmentId })),
    ...roles.chairOfPrograms.map((programId) => ({ programId })),
  ];
  return scopes.some((scope) => evaluateCapability(roles, capability, scope));
}
