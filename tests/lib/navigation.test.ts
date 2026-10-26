import { getNavItems, NAV_ITEMS } from "@/lib/navigation";
import { NO_ROLES } from "@/types/roles";
import { describe, expect, it } from "vitest";

const hrefs = (items: { href: string }[]) => items.map((i) => i.href);

describe("getNavItems", () => {
  it("shows everything to an admin", () => {
    expect(getNavItems({ ...NO_ROLES, isAdmin: true })).toEqual(NAV_ITEMS);
  });

  it("hides Users from everyone else, including unassigned users", () => {
    for (const roles of [
      NO_ROLES,
      { ...NO_ROLES, isVpaa: true },
      { ...NO_ROLES, deanOfColleges: ["c"] },
    ]) {
      const items = hrefs(getNavItems(roles));
      expect(items).not.toContain("/user");
      expect(items).toContain("/program");
    }
  });
});
