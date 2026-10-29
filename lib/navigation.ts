import { canAnywhere, type Capability } from "@/lib/capability-rules";
import type { UserRoles } from "@/types/roles";

export type NavItem = {
  label: string;
  href: string;
  /** Omit for "any signed-in user". Admin always passes. */
  capability?: Capability;
};

export const NAV_ITEMS: readonly NavItem[] = [
  { label: "Dashboard", href: "/dashboard", capability: "dashboard.view" },
  { label: "My Syllabi", href: "/syllabus" },
  { label: "Notifications", href: "/notifications" },
  { label: "Verify Approval", href: "/verify" },
  { label: "Review Queue", href: "/review", capability: "reviewQueue.view" },
  {
    label: "Syllabus References",
    href: "/syllabus-reference",
    capability: "syllabusReference.request",
  },
  { label: "Campuses", href: "/campus" },
  { label: "Colleges", href: "/college" },
  { label: "Deans", href: "/dean" },
  { label: "Departments", href: "/department" },
  { label: "Department Heads", href: "/department-head" },
  { label: "Programs", href: "/program" },
  { label: "Program Chairs", href: "/program-chair" },
  { label: "Program Reviewers", href: "/program-reviewer" },
  { label: "School Years & Terms", href: "/school-year" },
  { label: "Courses", href: "/course" },
  { label: "Prospectuses", href: "/prospectus" },
  { label: "Prospectus Items", href: "/prospectus-item" },
  { label: "VPAA", href: "/vpaa" },
  { label: "FDIS Chair", href: "/fdis-chair" },
  { label: "CITL Director", href: "/citl-director" },
  { label: "Faculty", href: "/faculty" },
  { label: "Join Requests", href: "/program-join-request" },
  { label: "Users", href: "/user", capability: "user.read" },
  { label: "Audit Log", href: "/audit", capability: "audit.view" },
];

export function getNavItems(roles: UserRoles): NavItem[] {
  return NAV_ITEMS.filter(
    (item) => !item.capability || canAnywhere(roles, item.capability),
  );
}
