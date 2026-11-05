import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { adminPb, alerts, createUser, ok, pickUser, rowWith, signIn } from "./helpers";
import type { PersonRecord } from "./seed";
import { createWorld, loadGlobalSeed, type World } from "./world";

// Org chain and role assignments through the UI, by the role that owns
// each step (walkthrough Parts 1 and 2). A second world stands in for
// "another college" so scope can be checked both ways.

let other: Promise<World> | undefined;
const otherWorld = () => (other ??= createWorld("org-other"));

const stamp = () => Date.now().toString(36);

async function freshUser(label: string): Promise<PersonRecord> {
  const slug = `${label.toLowerCase().replace(/\s+/g, "-")}-${stamp()}`;
  return createUser(await adminPb(), { name: `Org ${label} ${stamp()}`, email: `e2e.org.${slug}@buksu.edu.ph` });
}

/** Ids behind a world's program: its department and college. */
async function chainOf(world: World) {
  const pb = await adminPb();
  const program = await pb.collection("programs").getOne(world.program.id, { expand: "department" });
  return { department: program.department as string, college: program.expand!.department.college as string };
}

const dialogOf = (page: Page) => page.getByRole("dialog");

async function submitDialog(page: Page, button: string) {
  const dialog = dialogOf(page);
  await dialog.getByRole("button", { name: button, exact: true }).click();
  await expect(dialog).toHaveCount(0);
}

test("admin creates a campus; the VPAA creates a college on it and assigns its dean @ORG-01", async ({
  page,
  world,
}) => {
  const campus = `Org Campus ${stamp()}`;
  await signIn(page, world.people.admin);
  await page.goto("/campus");
  await page.getByRole("button", { name: "New campus" }).click();
  await dialogOf(page).getByLabel("Name").fill(campus);
  await submitDialog(page, "Create");
  await expect(page.getByRole("cell", { name: campus, exact: true })).toBeVisible();
  const campusId = (
    await (await adminPb()).collection("campuses").getFirstListItem(`name = "${campus}"`)
  ).id;

  const college = `Org College ${stamp()}`;
  await signIn(page, world.people.vpaa);
  await page.goto("/college");
  await page.getByRole("button", { name: "New college" }).click();
  const dialog = dialogOf(page);
  await dialog.getByLabel("Name").fill(college);
  await dialog.getByLabel("Code").fill(`OC${stamp()}`.toUpperCase().slice(0, 10));
  await dialog.getByLabel("Campus").selectOption(campusId);
  await submitDialog(page, "Create");
  await page.getByLabel("Search colleges").fill(college);
  await expect(page.getByRole("cell", { name: college, exact: true })).toBeVisible();
  const collegeId = (
    await (await adminPb()).collection("colleges").getFirstListItem(`name = "${college}"`)
  ).id;

  const dean = await freshUser("Dean");
  await page.goto("/dean");
  await page.getByRole("button", { name: "Assign dean" }).click();
  await pickUser(page, dialogOf(page), dean);
  await dialogOf(page).getByLabel("College").selectOption(collegeId);
  await submitDialog(page, "Assign");
  await page.getByLabel("Search deans").fill(dean.name);
  await expect(page.getByRole("row", { name: new RegExp(dean.name) })).toContainText(college);
});

test("the VPAA swaps the FDIS chair and CITL director, then the originals return @ORG-01", async ({
  page,
  world,
}) => {
  const global = loadGlobalSeed();
  const pb = await adminPb();
  const roles = [
    { path: "/fdis-chair", collection: "fdis_chairs", button: "Assign chair", search: "Search FDIS chairs", original: global.people.fdis },
    { path: "/citl-director", collection: "citl_directors", button: "Assign director", search: "Search CITL directors", original: global.people.citl },
  ];
  const replacements: { collection: string; user: string; original: string }[] = [];
  try {
    await signIn(page, world.people.vpaa);
    for (const role of roles) {
      const replacement = await freshUser(role.collection === "fdis_chairs" ? "Fdis" : "Citl");
      replacements.push({ collection: role.collection, user: replacement.id, original: role.original.id });
      await page.goto(role.path);
      // Only one active holder: deactivate the current one first.
      await page.getByLabel(role.search).fill(role.original.name);
      await page.getByRole("row", { name: new RegExp(role.original.name) }).getByRole("button", { name: "Deactivate" }).click();
      await expect(page.getByRole("row", { name: new RegExp(role.original.name) }).getByRole("button", { name: "Activate" })).toBeVisible();

      await page.getByRole("button", { name: role.button }).click();
      await pickUser(page, dialogOf(page), replacement);
      await submitDialog(page, "Assign");
      await page.getByLabel(role.search).fill(replacement.name);
      await expect(page.getByRole("row", { name: new RegExp(replacement.name) }).getByRole("button", { name: "Deactivate" })).toBeVisible();
    }
  } finally {
    // Later specs rely on the seeded holders at stages 3 and 4.
    for (const r of replacements) {
      const rows = await pb.collection(r.collection).getFullList({ filter: pb.filter("user = {:u}", { u: r.user }) });
      for (const row of rows) await pb.collection(r.collection).update(row.id, { active: false });
      const original = await pb.collection(r.collection).getFirstListItem(pb.filter("user = {:u}", { u: r.original }));
      await pb.collection(r.collection).update(original.id, { active: true });
    }
  }
});

test("a second active VPAA, FDIS chair, CITL director or program reviewer is refused @ORG-02", async ({
  page,
  world,
}) => {
  const cases: { as: PersonRecord; path: string; button: string; program?: string }[] = [
    { as: world.people.admin, path: "/vpaa", button: "Assign VPAA" },
    { as: world.people.vpaa, path: "/fdis-chair", button: "Assign chair" },
    { as: world.people.vpaa, path: "/citl-director", button: "Assign director" },
    { as: world.people.vpaa, path: "/program-reviewer", button: "Assign reviewer", program: world.program.id },
  ];
  for (const c of cases) {
    const second = await freshUser("Second");
    await signIn(page, c.as);
    await page.goto(c.path);
    await page.getByRole("button", { name: c.button }).click();
    const dialog = dialogOf(page);
    await pickUser(page, dialog, second);
    if (c.program) await dialog.getByLabel("Program").selectOption(c.program);
    await dialog.getByRole("button", { name: "Assign", exact: true }).click();
    await expect(alerts(dialog), c.path).toBeVisible();
    await expect(alerts(dialog), c.path).not.toBeEmpty();
    await expect(dialog.getByRole("button", { name: "Assign", exact: true })).toBeVisible();
  }
});

test("a dean creates a department in their college, never in another @ORG-03", async ({ page, world }) => {
  const mine = await chainOf(world);
  const theirs = await chainOf(await otherWorld());
  const name = `Org Department ${stamp()}`;

  await signIn(page, world.people.dean);
  await page.goto("/department");

  // The college list isn't scoped (it's the org list), so another college
  // can be picked; saving it is refused with the reason.
  await page.getByRole("button", { name: "New department" }).click();
  let dialog = dialogOf(page);
  await dialog.getByLabel("Name").fill(`${name} Elsewhere`);
  await dialog.getByLabel("College").selectOption(theirs.college);
  await dialog.getByRole("button", { name: "Create", exact: true }).click();
  await expect(alerts(dialog)).not.toBeEmpty();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toHaveCount(0);

  await page.getByRole("button", { name: "New department" }).click();
  dialog = dialogOf(page);
  await dialog.getByLabel("Name").fill(name);
  await dialog.getByLabel("College").selectOption(mine.college);
  await submitDialog(page, "Create");
  await page.getByLabel("Search departments").fill(name);
  await expect(page.getByRole("cell", { name, exact: true })).toBeVisible();
  await page.getByLabel("Search departments").fill(`${name} Elsewhere`);
  await expect(page.getByText(/0 results/)).toBeVisible();
});

test("a dean assigns a department head and creates a program @ORG-04", async ({ page, world }) => {
  const { college } = await chainOf(world);
  await signIn(page, world.people.dean);
  const department = await ok<{ id: string; name: string }>(
    await page.request.post("/api/department", { data: { name: `Org Dept ${stamp()}`, college } }),
    "department",
  );

  const head = await freshUser("Head");
  await page.goto("/department-head");
  await page.getByRole("button", { name: "Assign head" }).click();
  await pickUser(page, dialogOf(page), head);
  await dialogOf(page).getByLabel("Department").selectOption(department.id);
  await submitDialog(page, "Assign");
  await page.getByLabel("Search department heads").fill(head.name);
  await expect(page.getByRole("row", { name: new RegExp(department.name) })).toBeVisible();

  const program = `Org Program ${stamp()}`;
  await page.goto("/program");
  await page.getByRole("button", { name: "New program" }).click();
  const dialog = dialogOf(page);
  await dialog.getByLabel("Name").fill(program);
  await dialog.getByLabel("Code").fill(`OP${stamp()}`.toUpperCase().slice(0, 10));
  await dialog.getByLabel("Department").selectOption(department.id);
  await submitDialog(page, "Create");
  await page.getByLabel("Search programs").fill(program);
  await expect(page.getByRole("cell", { name: program, exact: true })).toBeVisible();
});

test("a department head renames their department but can't move it or create programs @ORG-05", async ({
  page,
  world,
}) => {
  const { department } = await chainOf(world);
  const current = (await (await adminPb()).collection("departments").getOne(department)).name as string;
  const renamed = `${current} Renamed`;

  await signIn(page, world.people.head);
  await page.goto("/department");
  await page.getByLabel("Search departments").fill(current);
  await rowWith(page, current).getByRole("button", { name: "Edit" }).click();
  const dialog = dialogOf(page);
  await expect(dialog.getByLabel("College")).toBeDisabled();
  await dialog.getByLabel("Name").fill(renamed);
  await submitDialog(page, "Save changes");
  await page.getByLabel("Search departments").fill(renamed);
  await expect(page.getByRole("cell", { name: renamed, exact: true })).toBeVisible();

  await page.goto("/program");
  await expect(page.getByRole("heading", { name: "Programs" })).toBeVisible();
  await expect(page.getByRole("button", { name: "New program" })).toHaveCount(0);
  const refused = await page.request.post("/api/program", {
    data: { name: "Org Not Allowed", code: "ONA", department },
  });
  expect(refused.status()).toBe(403);
});

test("a department head assigns a chair and a reviewer in their department only @ORG-06", async ({
  page,
  world,
}) => {
  const { department } = await chainOf(world);
  const pb = await adminPb();
  // A program without a reviewer yet (one active reviewer per program).
  const program = await pb.collection("programs").create({
    name: `Org Head Program ${stamp()}`,
    code: `OH${stamp()}`.toUpperCase().slice(0, 10),
    department,
  });
  const otherProgram = (await otherWorld()).program.id;

  await signIn(page, world.people.head);
  for (const [path, button, api] of [
    ["/program-chair", "Assign chair", "/api/program-chair"],
    ["/program-reviewer", "Assign reviewer", "/api/program-reviewer"],
  ] as const) {
    const person = await freshUser("Assignee");
    await page.goto(path);
    await page.getByRole("button", { name: button }).click();
    const dialog = dialogOf(page);
    const values = () =>
      dialog
        .getByLabel("Program")
        .locator("option")
        .evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value));
    // The options load after the dialog opens.
    await expect.poll(values, { message: path }).toContain(program.id);
    expect(await values(), path).not.toContain(otherProgram);
    await pickUser(page, dialog, person);
    await dialog.getByLabel("Program").selectOption(program.id);
    await submitDialog(page, "Assign");
    await page.getByRole("searchbox").first().fill(person.name);
    await expect(page.getByRole("row", { name: new RegExp(person.name) })).toBeVisible();

    const outsider = await freshUser("Outsider");
    const refused = await page.request.post(api, { data: { user: outsider.id, program: otherProgram } });
    expect(refused.status(), path).toBe(403);
  }
});

test("the VPAA can't manage admin-only records @ORG-07", async ({ page, world }) => {
  await signIn(page, world.people.vpaa);
  await page.goto("/user");
  await expect(page.getByText("You don't have permission to manage users.")).toBeVisible();

  await page.goto("/course");
  await expect(page.getByRole("heading", { name: "Courses" })).toBeVisible();
  await page.getByLabel("Search courses").fill(world.courses[0].code);
  await expect(page.getByRole("cell", { name: world.courses[0].code, exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "New course" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Edit" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(0);

  for (const [path, button] of [
    ["/school-year", "New school year"],
    ["/prospectus", "New prospectus"],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole("table").first()).toBeVisible();
    await expect(page.getByRole("button", { name: button }), path).toHaveCount(0);
  }
});

test("assignment lists are scoped; org lists stay fully visible @ORG-08", async ({ page, world }) => {
  const theirs = await otherWorld();
  const visible = async (path: string, search: string, text: string) => {
    await page.goto(path);
    const searchBox = page.getByRole("searchbox").first();
    const answered = page.waitForResponse((r) => new URL(r.url()).searchParams.get("search") === search);
    await searchBox.fill(search);
    await answered;
    return page.getByRole("row", { name: new RegExp(text) }).count();
  };

  // Dean: department heads in their college only.
  await signIn(page, world.people.dean);
  expect(await visible("/department-head", world.people.head.name, world.people.head.name)).toBe(1);
  expect(await visible("/department-head", theirs.people.head.name, theirs.people.head.name)).toBe(0);

  // Department head: program chairs in their department only.
  await signIn(page, world.people.head);
  expect(await visible("/program-chair", world.people.chair.name, world.people.chair.name)).toBe(1);
  expect(await visible("/program-chair", theirs.people.chair.name, theirs.people.chair.name)).toBe(0);

  // Program chair: faculty of their program only.
  await signIn(page, world.people.chair);
  expect(await visible("/faculty", world.people.lead.name, world.people.lead.name)).toBe(1);
  expect(await visible("/faculty", theirs.people.lead.name, theirs.people.lead.name)).toBe(0);

  // Someone with no role still sees every program, to find one to join.
  const unassigned = await freshUser("Unassigned");
  await signIn(page, unassigned);
  expect(await visible("/program", world.program.code, world.program.code)).toBeGreaterThan(0);
  expect(await visible("/program", theirs.program.code, theirs.program.code)).toBeGreaterThan(0);
});
