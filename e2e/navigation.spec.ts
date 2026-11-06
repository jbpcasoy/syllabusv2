import type { Page } from "@playwright/test";
import { submittedWithProxy } from "./arrange";
import { expect, test } from "./fixtures";
import { adminPb, createUser, signIn } from "./helpers";
import type { PersonRecord } from "./seed";
import type { Person } from "./world";

// What each role's main navigation shows, written out by hand: deriving
// it from lib/navigation.ts would only test that the code agrees with
// itself.

/** Shown to every signed-in user. */
const EVERYONE = [
  "My Syllabi",
  "Notifications",
  "Verify Approval",
  "Campuses",
  "Colleges",
  "Deans",
  "Departments",
  "Department Heads",
  "Programs",
  "Program Chairs",
  "Program Reviewers",
  "School Years & Terms",
  "Courses",
  "Prospectuses",
  "Prospectus Items",
  "VPAA",
  "FDIS Chair",
  "CITL Director",
  "Faculty",
  "Join Requests",
];

/** The gated items each role sees, in menu order. */
const GATED: Record<Person | "unassigned", string[]> = {
  admin: ["Dashboard", "Review Queue", "Syllabus References", "Users", "Audit Log"],
  vpaa: ["Dashboard", "Review Queue"],
  fdis: ["Dashboard", "Review Queue"],
  citl: ["Dashboard", "Review Queue"],
  dean: ["Dashboard", "Review Queue"],
  head: ["Dashboard"],
  chair: ["Dashboard", "Syllabus References"],
  reviewer: ["Dashboard", "Review Queue"],
  lead: [],
  coAuthor: [],
  unassigned: [],
};

/** The full menu in order: the gated items sit at fixed places in it. */
function expectedMenu(gated: string[]) {
  const has = (label: string) => gated.includes(label);
  return [
    ...(has("Dashboard") ? ["Dashboard"] : []),
    "My Syllabi",
    "Notifications",
    "Verify Approval",
    ...(has("Review Queue") ? ["Review Queue"] : []),
    ...(has("Syllabus References") ? ["Syllabus References"] : []),
    ...EVERYONE.slice(3),
    ...(has("Users") ? ["Users"] : []),
    ...(has("Audit Log") ? ["Audit Log"] : []),
  ];
}

async function menu(page: Page) {
  await page.goto("/syllabus");
  return page.getByRole("navigation", { name: "Main navigation" }).getByRole("link").allInnerTexts();
}

test("each role sees exactly its menu @NAV-01", async ({ page, world }) => {
  const pb = await adminPb();
  const unassigned = await createUser(pb, {
    name: "Nav Unassigned",
    email: `e2e.nav.unassigned.${Date.now()}@buksu.edu.ph`,
  });
  const people: [string, PersonRecord][] = [
    ...(Object.keys(GATED).filter((k) => k !== "unassigned") as Person[]).map(
      (k) => [k, world.people[k]] as [string, PersonRecord],
    ),
    ["unassigned", unassigned],
  ];

  for (const [role, person] of people) {
    await signIn(page, person);
    const items = (await menu(page)).map((t) => t.trim());
    expect(items, role).toEqual(expectedMenu(GATED[role as keyof typeof GATED]));
  }
});

test("a gated page refuses a role without it @NAV-02", async ({ page, world }) => {
  // The page stays put and says so, with none of the manager's controls.
  await signIn(page, world.people.vpaa);
  await page.goto("/user");
  await expect(page.getByText("You don't have permission to manage users.")).toBeVisible();
  await expect(page.getByRole("button", { name: "New user" })).toHaveCount(0);
  await page.goto("/audit");
  await expect(page.getByText("You don't have permission to view the audit log.")).toBeVisible();
  await expect(page.getByRole("table")).toHaveCount(0);

  await signIn(page, world.people.lead);
  await page.goto("/dashboard");
  await expect(page.getByText("No dashboard for your roles.")).toBeVisible();
});

test("being named a proxy adds Review Queue @NAV-03", async ({ page, world }) => {
  await signIn(page, world.people.coAuthor);
  expect(await menu(page)).not.toContain("Review Queue");

  await submittedWithProxy(page, world, world.courses[0]);
  await signIn(page, world.people.coAuthor);
  expect(await menu(page)).toContain("Review Queue");
});
