import type { Page } from "@playwright/test";
import { approveThrough, freshYearLabel, prospectusFor, schoolYearWithTerm } from "./arrange";
import { expect, test } from "./fixtures";
import { adminPb, alerts, createDraft, signIn, submit, uploadVersion } from "./helpers";
import type { World } from "./world";

// School years, terms, courses and prospectuses, as the admin (walkthrough
// Part 1). Each test makes its own school years (arrange.ts picks labels
// far from real ones).

const stamp = () => Date.now().toString(36);

const dialogOf = (page: Page) => page.getByRole("dialog");

async function submitDialog(page: Page, button: string) {
  const dialog = dialogOf(page);
  await dialog.getByRole("button", { name: button, exact: true }).click();
  await expect(dialog).toHaveCount(0);
}

/** As the lead: is `code` offered in the New syllabus course picker for this term? */
async function offered(page: Page, world: World, termLabel: string, code: string) {
  await page.goto("/syllabus");
  await page.getByRole("button", { name: "New syllabus" }).click();
  const dialog = dialogOf(page);
  await dialog.getByLabel("Term").selectOption({ label: termLabel });
  await dialog.getByLabel("Program").selectOption({ label: world.program.label });
  const searched = page.waitForResponse((r) => new URL(r.url()).searchParams.get("search") === code);
  await dialog.getByRole("combobox", { name: "Course" }).fill(code);
  await searched;
  const listbox = page.getByRole("listbox");
  await expect(listbox.getByText(/Searching…/)).toHaveCount(0);
  const found = await listbox.getByRole("option", { name: new RegExp(code) }).count();
  await page.keyboard.press("Escape");
  await dialog.getByRole("button", { name: "Cancel" }).click();
  return found > 0;
}

test("admin creates a school year and a term, then closes and reopens it @CUR-01", async ({ page, world }) => {
  const label = freshYearLabel();
  await signIn(page, world.people.admin);
  await page.goto("/school-year");

  await page.getByRole("button", { name: "New school year" }).click();
  await dialogOf(page).getByLabel("School year").fill(label);
  await submitDialog(page, "Create");
  await expect(page.getByRole("cell", { name: label, exact: true }).first()).toBeVisible();
  const schoolYear = (await (await adminPb()).collection("school_years").getFirstListItem(`label = "${label}"`)).id;

  await page.getByRole("button", { name: "New term" }).click();
  const dialog = dialogOf(page);
  await dialog.getByLabel("School year").selectOption(schoolYear);
  await dialog.getByLabel("Semester").selectOption("Second Semester");
  await dialog.getByRole("checkbox", { name: "Open for submissions" }).check();
  await submitDialog(page, "Create");

  const row = page
    .getByRole("row")
    .filter({ has: page.getByRole("cell", { name: label, exact: true }) })
    .filter({ hasText: "Second Semester" });
  await expect(row).toContainText("Open");
  await row.getByRole("button", { name: "Close" }).click();
  await expect(row.getByRole("button", { name: "Open" })).toBeVisible();
  await expect(row).toContainText("Closed");
  await row.getByRole("button", { name: "Open" }).click();
  await expect(row.getByRole("button", { name: "Close" })).toBeVisible();
});

test("admin creates courses owned by a program, including a GE program @CUR-02", async ({ page, world }) => {
  const pb = await adminPb();
  const program = await pb.collection("programs").getOne(world.program.id);
  const ge = await pb.collection("programs").create({
    name: `Cur General Education ${stamp()}`,
    code: `GE${stamp()}`.toUpperCase().slice(0, 10),
    department: program.department,
  });

  await signIn(page, world.people.admin);
  for (const [owner, ownerCode] of [
    [world.program.id, world.program.code],
    [ge.id, ge.code as string],
  ] as const) {
    const code = `CUR ${stamp()}`.toUpperCase().slice(0, 14);
    await page.goto("/course");
    await page.getByRole("button", { name: "New course" }).click();
    const dialog = dialogOf(page);
    await dialog.getByLabel("Code").fill(code);
    await dialog.getByLabel("Title").fill(`Curriculum Course ${code}`);
    await dialog.getByLabel("Owning program").selectOption(owner);
    await dialog.getByLabel("Credit units").fill("3");
    await dialog.getByLabel("Lecture units").fill("3");
    await dialog.getByLabel("Lab units").fill("0");
    await dialog.getByLabel("Nominal hours").fill("54");
    await submitDialog(page, "Create");
    await page.getByLabel("Search courses").fill(code);
    await expect(page.getByRole("row", { name: new RegExp(code) })).toContainText(ownerCode);
  }
});

test("a prospectus offers its courses only once published @CUR-03", async ({ page, world }) => {
  const year = await schoolYearWithTerm();
  const course = world.courses[1];

  await signIn(page, world.people.admin);
  await page.goto("/prospectus");
  await page.getByRole("button", { name: "New prospectus" }).click();
  let dialog = dialogOf(page);
  await dialog.getByLabel("Program").selectOption(world.program.id);
  await dialog.getByLabel("School year").selectOption(year.schoolYear);
  await expect(dialog.getByRole("checkbox", { name: "Published" })).not.toBeChecked();
  await submitDialog(page, "Create");
  const pb = await adminPb();
  const prospectus = await pb
    .collection("prospectuses")
    .getFirstListItem(pb.filter("program = {:p} && school_year = {:y}", { p: world.program.id, y: year.schoolYear }));

  await page.goto("/prospectus-item");
  await page.getByRole("button", { name: "New item" }).click();
  dialog = dialogOf(page);
  await dialog.getByLabel("Prospectus").selectOption(prospectus.id);
  await dialog.getByLabel("Year level").selectOption("First Year");
  await dialog.getByLabel("Semester").selectOption("First Semester");
  await dialog.getByRole("combobox", { name: "Course" }).fill(course.code);
  await page.getByRole("listbox").getByRole("option", { name: new RegExp(course.code) }).click();
  await submitDialog(page, "Create");

  await signIn(page, world.people.lead);
  expect(await offered(page, world, year.termLabel, course.code)).toBe(false);

  await signIn(page, world.people.admin);
  await page.goto("/prospectus");
  await page.getByLabel("Search prospectuses").fill(year.label);
  const row = page.getByRole("row", { name: new RegExp(year.label) }).filter({ hasText: world.program.name });
  await row.getByRole("button", { name: "Publish" }).click();
  await expect(row.getByRole("button", { name: "Unpublish" })).toBeVisible();

  await signIn(page, world.people.lead);
  expect(await offered(page, world, year.termLabel, course.code)).toBe(true);
});

test("a prospectus is duplicated into the next school year, extended and published @CUR-04", async ({
  page,
  world,
}) => {
  const source = await schoolYearWithTerm();
  const target = await schoolYearWithTerm();
  await prospectusFor(world, source.schoolYear, [world.courses[0].id, world.courses[1].id], true);

  await signIn(page, world.people.admin);
  await page.goto("/prospectus");
  await page.getByLabel("Search prospectuses").fill(source.label);
  const sourceRow = page.getByRole("row", { name: new RegExp(source.label) }).filter({ hasText: world.program.name });
  await sourceRow.getByRole("button", { name: "Duplicate" }).click();
  await dialogOf(page).getByLabel("Target school year").selectOption(target.schoolYear);
  // The dialog previews what it will copy before confirming.
  await submitDialog(page, "Copy 2 items");

  const pb = await adminPb();
  const copy = await pb
    .collection("prospectuses")
    .getFirstListItem(pb.filter("program = {:p} && school_year = {:y}", { p: world.program.id, y: target.schoolYear }));
  const items = () => pb.collection("prospectus_items").getFullList({ filter: pb.filter("prospectus = {:p}", { p: copy.id }) });
  expect((await items()).map((i) => i.course).sort()).toEqual([world.courses[0].id, world.courses[1].id].sort());

  await page.goto("/prospectus-item");
  await page.getByRole("button", { name: "New item" }).click();
  const dialog = dialogOf(page);
  await dialog.getByLabel("Prospectus").selectOption(copy.id);
  await dialog.getByLabel("Year level").selectOption("First Year");
  await dialog.getByLabel("Semester").selectOption("First Semester");
  await dialog.getByRole("combobox", { name: "Course" }).fill(world.courses[2].code);
  await page.getByRole("listbox").getByRole("option", { name: new RegExp(world.courses[2].code) }).click();
  await submitDialog(page, "Create");
  expect(await items()).toHaveLength(3);

  await page.goto("/prospectus");
  await page.getByLabel("Search prospectuses").fill(target.label);
  const targetRow = page.getByRole("row", { name: new RegExp(target.label) }).filter({ hasText: world.program.name });
  // A new copy starts unpublished.
  expect(copy.published).toBe(false);
  await targetRow.getByRole("button", { name: "Publish" }).click();
  await expect(targetRow.getByRole("button", { name: "Unpublish" })).toBeVisible();
});

test("an issued approval code locks the school year label and term semester @CUR-05", async ({ page, world }) => {
  const year = await schoolYearWithTerm();
  await prospectusFor(world, year.schoolYear, [world.courses[3].id], true);

  // One stage-1 approval issues a reference sequence on this term.
  await signIn(page, world.people.lead);
  const id = await createDraft(page, world, world.courses[3], year.term);
  await uploadVersion(page, id);
  await submit(page, id);
  await approveThrough(page, world, id, 1, 1);

  await signIn(page, world.people.admin);
  await page.goto("/school-year");
  await page.getByRole("row", { name: new RegExp(year.label) }).first().getByRole("button", { name: "Edit" }).click();
  let dialog = dialogOf(page);
  await dialog.getByLabel("School year").fill(freshYearLabel());
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(alerts(dialog)).toHaveText(/label is part of approval codes already issued.*can't be renamed/);
  await dialog.getByRole("button", { name: "Cancel" }).click();

  const termRow = page
    .getByRole("row")
    .filter({ has: page.getByRole("cell", { name: year.label, exact: true }) })
    .filter({ hasText: "First Semester" });
  await termRow.getByRole("button", { name: "Edit" }).click();
  dialog = dialogOf(page);
  await dialog.getByLabel("Semester").selectOption("Summer");
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(alerts(dialog)).toHaveText(/semester is part of approval codes already issued.*can't be changed/);
});

test("admin sets a term's review days and submission deadline @CUR-06", async ({ page, world }) => {
  const year = await schoolYearWithTerm();
  await signIn(page, world.people.admin);
  await page.goto("/school-year");
  const row = page
    .getByRole("row")
    .filter({ has: page.getByRole("cell", { name: year.label, exact: true }) })
    .filter({ hasText: "First Semester" });
  await row.getByRole("button", { name: "Edit" }).click();
  const dialog = dialogOf(page);
  await dialog.getByLabel("Review limit (days per stage)").fill("3");
  await dialog.getByLabel("Submission deadline").fill("2100-06-30");
  await submitDialog(page, "Save changes");
  await expect(row).toContainText("2100-06-30");

  const term = await (await adminPb()).collection("terms").getOne(year.term);
  expect(term.review_days).toBe(3);
});
