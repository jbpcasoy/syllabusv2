import type { Page } from "@playwright/test";
import { addCourse, approveThrough, submitted } from "./arrange";
import { expect, test } from "./fixtures";
import { adminPb, alerts, escapeRegExp, ok, signIn } from "./helpers";
import type { PersonRecord } from "./seed";
import { createWorld, type Course, type World } from "./world";

// Syllabus references (walkthrough Part 7): another program's chair asks
// to use this program's syllabus instead of writing their own. `world` is
// the source program; a second world is the referencing program.

let other: Promise<World> | undefined;
const referencing = () => (other ??= createWorld("ref-user"));
const dialogOf = (page: Page) => page.getByRole("dialog");

interface Setup {
  source: World;
  them: World;
  course: Course;
  syllabus: string;
}

/** A submitted source syllabus for a fresh course both programs list. */
async function setup(page: Page, source: World): Promise<Setup> {
  const them = await referencing();
  const course = await addCourse(source);
  await (await adminPb()).collection("prospectus_items").create({
    prospectus: them.prospectus,
    course: course.id,
    semester: "First Semester",
    year_level: "First Year",
  });
  const syllabus = await submitted(page, source, course);
  return { source, them, course, syllabus };
}

/** As the referencing chair, through the Reference a syllabus form. */
async function requestInUi(page: Page, s: Setup, note = "") {
  await signIn(page, s.them.people.chair);
  await page.goto("/syllabus-reference");
  await page.getByRole("button", { name: "Reference a syllabus" }).click();
  const dialog = dialogOf(page);
  await dialog.getByLabel("Your program").selectOption(s.them.program.id);
  await dialog.getByLabel("Term").selectOption({ label: s.them.term.label });
  await dialog.getByRole("combobox", { name: "Syllabus" }).fill(s.course.code);
  await page.getByRole("listbox").getByRole("option", { name: new RegExp(escapeRegExp(s.course.code)) }).click();
  if (note) await dialog.getByLabel(/^Note/).fill(note);
  await dialog.getByRole("button", { name: "Send request" }).click();
  return dialog;
}

async function requestByApi(page: Page, s: Setup, as: PersonRecord = s.them.people.chair) {
  await signIn(page, as);
  return ok<{ id: string }>(
    await page.request.post("/api/syllabus-reference", { data: { syllabus: s.syllabus, program: s.them.program.id } }),
    "request reference",
  );
}

async function referenceStatus(id: string) {
  return (await (await adminPb()).collection("syllabus_references").getOne(id)).status as string;
}

/** Notification titles for whoever is signed in, newest first. */
async function notificationLinks(page: Page) {
  await page.goto("/notifications");
  await expect(page.getByRole("heading", { name: "Notifications" })).toBeVisible();
  return page.locator("main").getByRole("link");
}

/** The row for the referencing program in the syllabus page's References panel. */
const panelRow = (page: Page, s: Setup) =>
  page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "References" }) })
    .getByRole("listitem")
    .filter({ hasText: s.them.program.name });

/** "W5BSIT asks to reference W4 201 (W4BSIT)" and the like. */
const courseTag = (s: Setup) => `${s.course.code} (${s.source.program.code})`;

test("the chair requests with a note; a second is refused; withdraw and ask again @REF-01", async ({ page, world }) => {
  const s = await setup(page, world);
  let dialog = await requestInUi(page, s, "Our nursing students take the same GE course.");
  await expect(dialog).toHaveCount(0);
  const row = page.getByRole("row", { name: new RegExp(escapeRegExp(s.course.code)) });
  await expect(row).toContainText("Pending");

  dialog = await requestInUi(page, s);
  await expect(alerts(dialog)).toHaveText("This program already has a pending reference for this course and term.");
  await dialog.getByRole("button", { name: "Cancel" }).click();

  await row.getByRole("button", { name: "Withdraw" }).click();
  await dialogOf(page).getByRole("button", { name: "Withdraw", exact: true }).click();
  await expect(row.first()).toContainText(/Withdrawn/i);

  dialog = await requestInUi(page, s);
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("row", { name: new RegExp(escapeRegExp(s.course.code)) }).filter({ hasText: "Pending" })).toHaveCount(1);
});

test("the source lead is notified and approves; a lead who also chairs may approve their own @REF-02", async ({
  page,
  world,
}) => {
  const s = await setup(page, world);
  const { id } = await requestByApi(page, s);

  await signIn(page, world.people.lead);
  const links = await notificationLinks(page);
  const note = links.filter({ hasText: `${s.them.program.code} asks to reference ${courseTag(s)}` });
  await expect(note).toHaveAttribute("href", `/syllabus/${s.syllabus}`);
  await note.click();
  await expect(page).toHaveURL(`/syllabus/${s.syllabus}`);
  await panelRow(page, s).getByRole("button", { name: "Approve" }).click();
  await expect(panelRow(page, s)).toContainText(/Approved/i);
  expect(await referenceStatus(id)).toBe("approved");

  // Self-approval: the source lead also chairs the referencing program.
  const mine = await setup(page, world);
  const pb = await adminPb();
  const chairRow = await pb
    .collection("program_chairs")
    .create({ user: world.people.lead.id, program: mine.them.program.id, active: true });
  try {
    const own = await requestByApi(page, mine, world.people.lead);
    await page.goto(`/syllabus/${mine.syllabus}`);
    await panelRow(page, mine).getByRole("button", { name: "Approve" }).click();
    await expect.poll(() => referenceStatus(own.id)).toBe("approved");
  } finally {
    await pb.collection("program_chairs").update(chairRow.id, { active: false });
  }
});

test("the referencing program views it read-only, with PDFs and no justification @REF-03", async ({ page, world }) => {
  const s = await setup(page, world);
  const { id } = await requestByApi(page, s);
  await signIn(page, world.people.lead);
  await ok(await page.request.patch(`/api/syllabus-reference/${id}`, { data: { action: "approve" } }), "approve");
  await approveThrough(page, world, s.syllabus, 1, 5);

  for (const person of [s.them.people.chair, s.them.people.lead]) {
    await signIn(page, person);
    await page.goto(`/syllabus/${s.syllabus}`);
    await expect(page.getByText("Your program references this syllabus")).toBeVisible();
    const pdf = page.getByRole("link", { name: "View PDF" }).first();
    expect((await page.request.get((await pdf.getAttribute("href"))!)).status(), person.name).toBe(200);
    for (const control of ["Upload new version", "Submit for review", "Transfer lead", "Delete draft", "Upload and file"]) {
      await expect(page.getByRole("button", { name: control }), `${person.name}: ${control}`).toHaveCount(0);
    }
    await expect(page.getByRole("heading", { name: "Justification Form" })).toHaveCount(0);
  }
});

test("the source lead revokes with a reason; the referencing chair is told and pointed to their list @REF-04", async ({
  page,
  world,
}) => {
  const s = await setup(page, world);
  const { id } = await requestByApi(page, s);
  await signIn(page, world.people.lead);
  await ok(await page.request.patch(`/api/syllabus-reference/${id}`, { data: { action: "approve" } }), "approve");

  await page.goto(`/syllabus/${s.syllabus}`);
  await panelRow(page, s).getByRole("button", { name: "Revoke" }).click();
  const dialog = dialogOf(page);
  await dialog.getByRole("button", { name: "Revoke", exact: true }).click();
  await expect(alerts(dialog)).toHaveText("Give a reason.");
  await dialog.getByLabel("Reason").fill("We're rewriting this syllabus for our own program.");
  await dialog.getByRole("button", { name: "Revoke", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(await referenceStatus(id)).toBe("revoked");

  await signIn(page, s.them.people.chair);
  const links = await notificationLinks(page);
  const note = links.filter({ hasText: `${s.them.program.code}'s reference to ${courseTag(s)} was revoked` });
  await expect(note).toHaveAttribute("href", "/syllabus-reference");
  await expect(page.locator("main")).toContainText("We're rewriting this syllabus for our own program.");
});

test("an admin rejects and revokes on the lead's behalf @REF-05", async ({ page, world }) => {
  const rejectMe = await setup(page, world);
  const pending = await requestByApi(page, rejectMe);
  const revokeMe = await setup(page, world);
  const approved = await requestByApi(page, revokeMe);
  await signIn(page, world.people.lead);
  await ok(await page.request.patch(`/api/syllabus-reference/${approved.id}`, { data: { action: "approve" } }), "approve");

  await signIn(page, world.people.admin);
  for (const [s, button, id, status] of [
    [rejectMe, "Reject", pending.id, "rejected"],
    [revokeMe, "Revoke", approved.id, "revoked"],
  ] as const) {
    await page.goto(`/syllabus/${s.syllabus}`);
    await panelRow(page, s).getByRole("button", { name: button }).click();
    await dialogOf(page).getByLabel("Reason").fill("Handled by the admin while the lead is on leave.");
    await dialogOf(page).getByRole("button", { name: button, exact: true }).click();
    await expect(dialogOf(page)).toHaveCount(0);
    expect(await referenceStatus(id)).toBe(status);
  }
});

test("a program that references a syllabus can't also write its own @REF-06", async ({ page, world }) => {
  const s = await setup(page, world);
  await requestByApi(page, s);

  await signIn(page, s.them.people.lead);
  const res = await page.request.post("/api/syllabus", {
    data: { course: s.course.id, term: s.them.term.id, program: s.them.program.id },
  });
  expect(res.status()).toBe(409);

  await page.goto("/syllabus");
  await page.getByRole("button", { name: "New syllabus" }).click();
  const dialog = dialogOf(page);
  await dialog.getByLabel("Term").selectOption({ label: s.them.term.label });
  await dialog.getByLabel("Program").selectOption({ label: s.them.program.label });
  await dialog.getByRole("combobox", { name: "Course" }).fill(s.course.code);
  const option = page.getByRole("listbox").getByRole("option", { name: new RegExp(escapeRegExp(s.course.code)) });
  await expect(option).toContainText("Reference requested");
  await expect(option).toBeDisabled();
});

test("withdrawing a request and stopping a reference both notify the source lead @REF-07", async ({ page, world }) => {
  const withdrawMe = await setup(page, world);
  const pending = await requestByApi(page, withdrawMe);
  await ok(await page.request.patch(`/api/syllabus-reference/${pending.id}`, { data: { action: "withdraw" } }), "withdraw");

  const stopMe = await setup(page, world);
  const live = await requestByApi(page, stopMe);
  await signIn(page, world.people.lead);
  await ok(await page.request.patch(`/api/syllabus-reference/${live.id}`, { data: { action: "approve" } }), "approve");

  // The referencing chair stops it from their list.
  await signIn(page, stopMe.them.people.chair);
  await page.goto("/syllabus-reference");
  const row = page.getByRole("row", { name: new RegExp(escapeRegExp(stopMe.course.code)) });
  await row.getByRole("button", { name: "Stop referencing" }).click();
  await dialogOf(page).getByRole("button", { name: "Stop referencing", exact: true }).click();
  await expect(dialogOf(page)).toHaveCount(0);

  await signIn(page, world.people.lead);
  const main = (await notificationLinks(page)).first().locator("xpath=ancestor::main");
  await expect(main).toContainText(`${withdrawMe.them.program.code} withdrew its request to reference ${courseTag(withdrawMe)}`);
  await expect(main).toContainText(`${stopMe.them.program.code} stopped referencing ${courseTag(stopMe)}`);
});
