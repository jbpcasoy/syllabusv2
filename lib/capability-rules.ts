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
  | "audit.view"
  // Any manager, global
  | "user.pick"
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
  | "programReviewer.write"
  | "faculty.write"
  | "programJoinRequest.review"
  | "programJoinRequest.approveOwn"
  | "syllabusReference.request"
  | "syllabus.transferLead"
  | "signedCopy.return"
  | "justification.return"
  | "reviewQueue.view"
  | "dashboard.view";

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
const programReviewer: Rule = (r, s) =>
  !!s?.programId && r.reviewerOfPrograms.includes(s.programId);
const fdisChair: Rule = (r) => r.isFdisChair;
const citlDirector: Rule = (r) => r.isCitlDirector;
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
  // The audit log (Phase 6, P5).
  "audit.view": adminOnly,

  // Search users (id, name, email only) to assign a role: anyone who can
  // write an assignment somewhere. Global because the directory isn't scoped.
  "user.pick": (r) =>
    r.isVpaa ||
    r.deanOfColleges.length > 0 ||
    r.headOfDepartments.length > 0 ||
    r.chairOfPrograms.length > 0,

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
  // Stage 1 of syllabus review; assigned by the same people as chairs.
  "programReviewer.write": anyOf(vpaa, dean, head),
  "faculty.write": chair,
  // Approving creates a faculty record, so it mirrors faculty.write.
  "programJoinRequest.review": chair,
  // Approve your own request: the department head who chairs a program in
  // their own department (one-program departments). The route still needs
  // programJoinRequest.review too.
  "programJoinRequest.approveOwn": head,
  // Request or withdraw a reference to another program's syllabus. The
  // source lead's decision is a relationship check, not a capability.
  "syllabusReference.request": chair,
  // Hand a syllabus of the program to another of its faculty.
  "syllabus.transferLead": chair,
  // Return a signed scan as invalid. Not the department head (by decision).
  "signedCopy.return": anyOf(programReviewer, dean, fdisChair, citlDirector, vpaa),
  // Return a justification scan for revision: the program reviewer or any
  // higher role in the chain.
  "justification.return": anyOf(programReviewer, dean, fdisChair, citlDirector, vpaa),
  // Open the Review Queue: holds a chain role anywhere, or stands in (or
  // proxies) on some syllabus. Global on purpose, since canAnywhere has no
  // program-reviewer scopes; the queue route still shows only the stages
  // the user holds or stands in for.
  "reviewQueue.view": (r) =>
    r.reviewerOfPrograms.length > 0 ||
    r.deanOfColleges.length > 0 ||
    r.isFdisChair ||
    r.isCitlDirector ||
    r.isVpaa ||
    r.standsIn,
  // Open the dashboard: any manager or chain role, anywhere. Global for the
  // same reason as the queue; lib/dashboard-scope.ts limits what they see.
  // Faculty alone don't get one (they have My syllabi).
  "dashboard.view": (r) =>
    r.reviewerOfPrograms.length > 0 ||
    r.chairOfPrograms.length > 0 ||
    r.headOfDepartments.length > 0 ||
    r.deanOfColleges.length > 0 ||
    r.isFdisChair ||
    r.isCitlDirector ||
    r.isVpaa,
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
 * True when only the admin bypass grants the capability: the user is admin
 * and the rule itself would refuse them. Such an action is an override and
 * is audited with a reason.
 */
export function isAdminOverride(
  roles: UserRoles,
  capability: Capability,
  scope?: ScopeChain,
): boolean {
  return roles.isAdmin && !RULES[capability](roles, scope);
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
