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

  it("shows My Syllabi to any signed-in user", () => {
    expect(hrefs(getNavItems(NO_ROLES))).toContain("/syllabus");
  });

  it("shows Syllabus References to program chairs only", () => {
    expect(
      hrefs(getNavItems({ ...NO_ROLES, chairOfPrograms: ["p"] })),
    ).toContain("/syllabus-reference");
    for (const roles of [
      NO_ROLES,
      { ...NO_ROLES, facultyOfPrograms: ["p"] },
      { ...NO_ROLES, isVpaa: true },
    ]) {
      expect(hrefs(getNavItems(roles))).not.toContain("/syllabus-reference");
    }
  });

  it("shows join requests to unassigned users so they can ask to join", () => {
    expect(hrefs(getNavItems(NO_ROLES))).toContain("/program-join-request");
  });

  it("shows the academic pages to any signed-in user (reads are open)", () => {
    expect(hrefs(getNavItems(NO_ROLES))).toEqual(
      expect.arrayContaining(["/school-year", "/course", "/prospectus"]),
    );
  });
});
