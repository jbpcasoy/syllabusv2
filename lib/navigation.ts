import type { UserRole } from "@/types/user";

export type NavItem = {
  label: string;
  href: string;
  /** Omit for "any signed-in user". Admin always passes. */
  roles?: readonly UserRole[];
};

export const NAV_ITEMS: readonly NavItem[] = [
  { label: "Campuses", href: "/campus" },
  { label: "Colleges", href: "/college" },
  { label: "Deans", href: "/dean" },
  { label: "Departments", href: "/department" },
  { label: "Department Heads", href: "/department-head" },
  { label: "Programs", href: "/program" },
  { label: "Program Chairs", href: "/program-chair" },
  { label: "VPAA", href: "/vpaa" },
  { label: "FDIS Chair", href: "/fdis-chair" },
  { label: "CITL Director", href: "/citl-director" },
  { label: "Faculty", href: "/faculty" },
  { label: "Users", href: "/user", roles: [] }, // empty = admin only
];

export function getNavItemsForRole(role: UserRole | null): NavItem[] {
  return NAV_ITEMS.filter((item) => {
    if (!item.roles) return true;
    if (role === "admin") return true;
    return role !== null && item.roles.includes(role);
  });
}
