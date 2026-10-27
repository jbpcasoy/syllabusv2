/**
 * What a user is, derived from ACTIVE assignment records plus the isAdmin flag.
 * A user can hold several of these at once.
 */
export interface UserRoles {
  isAdmin: boolean;
  /** Program ids the user currently chairs. */
  chairOfPrograms: string[];
  /** Program ids whose syllabi the user reviews at stage 1. */
  reviewerOfPrograms: string[];
  /** Department ids the user currently heads. */
  headOfDepartments: string[];
  /** College ids the user is currently dean of. */
  deanOfColleges: string[];
  /** Program ids the user is an active faculty member of. */
  facultyOfPrograms: string[];
  isFdisChair: boolean;
  isCitlDirector: boolean;
  isVpaa: boolean;
}

export const NO_ROLES: UserRoles = {
  isAdmin: false,
  chairOfPrograms: [],
  reviewerOfPrograms: [],
  headOfDepartments: [],
  deanOfColleges: [],
  facultyOfPrograms: [],
  isFdisChair: false,
  isCitlDirector: false,
  isVpaa: false,
};

/** Labels for the header and the users list. Empty when the user is unassigned. */
export function roleLabels(roles: UserRoles): string[] {
  const labels: string[] = [];
  if (roles.isAdmin) labels.push("Administrator");
  if (roles.isVpaa) labels.push("VPAA");
  if (roles.isCitlDirector) labels.push("CITL Director");
  if (roles.isFdisChair) labels.push("FDIS Chair");
  if (roles.deanOfColleges.length > 0) labels.push("Dean");
  if (roles.headOfDepartments.length > 0) labels.push("Department Head");
  if (roles.chairOfPrograms.length > 0) labels.push("Program Chair");
  if (roles.reviewerOfPrograms.length > 0) labels.push("Program Reviewer");
  if (roles.facultyOfPrograms.length > 0) labels.push("Faculty");
  return labels;
}

/** True if the user is an admin or holds at least one active assignment. */
export function hasAnyRole(roles: UserRoles): boolean {
  return (
    roles.isAdmin ||
    roles.chairOfPrograms.length > 0 ||
    roles.reviewerOfPrograms.length > 0 ||
    roles.headOfDepartments.length > 0 ||
    roles.deanOfColleges.length > 0 ||
    roles.facultyOfPrograms.length > 0 ||
    roles.isFdisChair ||
    roles.isCitlDirector ||
    roles.isVpaa
  );
}
