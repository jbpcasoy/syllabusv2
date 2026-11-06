import type { Page } from "@playwright/test";
import { addCourse, approveThrough, draftWithVersion } from "./arrange";
import { expect, test } from "./fixtures";
import {
  adminPb,
  alerts,
  answerForm17AllYes,
  escapeRegExp,
  approveInUi,
  getSyllabus,
  ok,
  signIn,
  submit,
} from "./helpers";
import type { PersonRecord } from "./seed";
import type { World } from "./world";

// The proxy and stand-ins (walkthrough Part 6): when a reviewer co-authors
// a syllabus, someone else decides at their stage.

const dialogOf = (page: Page) => page.getByRole("dialog");

/** The lead's draft with a PDF and `coAuthor` on it (still a draft). */
async function conflictedDraft(page: Page, world: World, coAuthor: PersonRecord) {
  const course = await addCourse(world);
  const id = await draftWithVersion(page, world, course);
  await ok(await page.request.patch(`/api/syllabus/${id}`, { data: { co_authors: [coAuthor.id] } }), "co-author");
  return { id, course };
}

async function nameStandIn(page: Page, id: string, stage: number, user: string) {
  return page.request.put(`/api/syllabus/${id}/stand-in`, { data: { stage, user } });
}

/** Notification titles on /notifications for whoever is signed in. */
async function notificationTitles(page: Page) {
  await page.goto("/notifications");
  await expect(page.getByRole("heading", { name: "Notifications" })).toBeVisible();
  await page.waitForLoadState("networkidle");
  return page.locator("main").innerText();
}

test("submitting with the reviewer as co-author warns, then waits for a proxy @STA-01", async ({ page, world }) => {
  const { id } = await conflictedDraft(page, world, world.people.reviewer);
  await page.goto(`/syllabus/${id}`);
  await page.getByRole("button", { name: "Submit for review" }).click();
  await expect(dialogOf(page)).toContainText("The program reviewer leads or co-authors this syllabus");
  await dialogOf(page).getByRole("button", { name: "Submit", exact: true }).click();
  await expect(dialogOf(page)).toHaveCount(0);
  await expect(page.getByText(/Waiting for a proxy/)).toBeVisible();
  expect(await getSyllabus(page, id)).toMatchObject({ status: "submitted", stage: 1 });
});

test("the dean finds it under Needs a proxy and sees only what naming one needs @STA-02", async ({ page, world }) => {
  const { id, course } = await conflictedDraft(page, world, world.people.reviewer);

  await signIn(page, world.people.dean);
  await page.goto("/review");
  const panel = page.locator("section").filter({ has: page.getByRole("heading", { name: "Needs a proxy" }) });
  const row = panel.getByRole("row", { name: new RegExp(course.code) }).or(panel.getByRole("listitem").filter({ hasText: course.code }));
  await expect(row.first()).toBeVisible();
  await row.first().getByRole("link", { name: "Name a proxy" }).click();
  await expect(page).toHaveURL(`/syllabus/${id}`);

  await expect(page.getByRole("heading", { name: "Proxy and stand-ins" })).toBeVisible();
  await expect(page.getByText(world.people.reviewer.name).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "PDF versions" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Timeline" })).toHaveCount(0);
});

test("the conflicted reviewer is notified, refused, and offered the proxy picker @STA-03", async ({ page, world }) => {
  const { id, course } = await conflictedDraft(page, world, world.people.reviewer);
  await submit(page, id);

  await signIn(page, world.people.reviewer);
  expect(await notificationTitles(page)).toContain(`${course.code} (${world.program.code}) is waiting for your review`);
  await page.goto(`/syllabus/${id}/review`);
  await expect(alerts(page)).toContainText("You lead or co-author this syllabus, so you can't review it.");
  await expect(alerts(page)).toContainText("Name a proxy from the program's faculty below");
  await expect(page.getByRole("combobox", { name: "Designate stand-in for stage 1" })).toBeVisible();
});

test("a proxy must be program faculty and not an author @STA-04", async ({ page, world }) => {
  const { id } = await conflictedDraft(page, world, world.people.reviewer);
  await submit(page, id);

  await signIn(page, world.people.reviewer);
  let res = await nameStandIn(page, id, 1, world.people.dean.id);
  expect(res.status()).toBe(409);
  expect((await res.json()).error).toBe("A proxy must be active faculty of the program.");
  res = await nameStandIn(page, id, 1, world.people.lead.id);
  expect(res.status()).toBe(409);
  expect((await res.json()).error).toBe("A stand-in can't lead or co-author this syllabus.");

  // In the workspace picker, the dean isn't offered; the co-author-free faculty member is.
  await page.goto(`/syllabus/${id}/review`);
  const picker = page.getByRole("combobox", { name: "Designate stand-in for stage 1" });
  await picker.fill(world.people.dean.name);
  await expect(page.getByRole("listbox").getByText("No one found.")).toBeVisible();
  await picker.fill(world.people.coAuthor.name);
  await page.getByRole("listbox").getByRole("option", { name: new RegExp(escapeRegExp(world.people.coAuthor.email)) }).click();
  // Once named, the workspace no longer asks for one.
  await expect(page.getByText("You lead or co-author this syllabus")).toHaveCount(0);
  await page.goto(`/syllabus/${id}`);
  const stage1 = page.getByRole("listitem").filter({ hasText: "Stage 1: Program Reviewer (proxy)" });
  await expect(stage1).toContainText(world.people.coAuthor.name);
});

test("the proxy is notified, sees it as proxy, and approves; the reviewer can't @STA-05", async ({ page, world }) => {
  const { id, course } = await conflictedDraft(page, world, world.people.reviewer);
  await submit(page, id);
  await signIn(page, world.people.reviewer);
  await ok(await nameStandIn(page, id, 1, world.people.coAuthor.id), "name proxy");

  await page.goto("/review");
  await expect(page.getByRole("row", { name: new RegExp(course.code) })).toHaveCount(0);

  await signIn(page, world.people.coAuthor);
  expect(await notificationTitles(page)).toContain(`${course.code} (${world.program.code}) is waiting for your review`);
  await page.goto("/review");
  const row = page.getByRole("row", { name: new RegExp(course.code) });
  await expect(row).toContainText("As proxy");
  await row.getByRole("link", { name: "Review" }).click();
  await expect(page.getByText(/Reviewing at stage 1 \(.+, as proxy\)/)).toBeVisible();
  await answerForm17AllYes(page);
  await approveInUi(page, id);
  expect((await getSyllabus(page, id)).stage).toBe(2);
});

test("a later stage's holder names a stand-in for a conflicted dean @STA-06", async ({ page, world }) => {
  // The dean teaches in the program too, so they can co-author.
  const pb = await adminPb();
  await pb.collection("faculties").create({ user: world.people.dean.id, program: world.program.id, active: true });
  const { id, course } = await conflictedDraft(page, world, world.people.dean);
  await submit(page, id);

  // The FDIS chair (stage 3) names the department head for stage 2.
  await signIn(page, world.people.fdis);
  await page.goto(`/syllabus/${id}`);
  const picker = page.getByRole("combobox", { name: "Designate stand-in for stage 2" });
  await picker.fill(world.people.head.name);
  await page.getByRole("listbox").getByRole("option", { name: new RegExp(escapeRegExp(world.people.head.email)) }).click();
  const stage2 = page.getByRole("listitem").filter({ hasText: "Stage 2: Dean" });
  await expect(stage2).toContainText(world.people.head.name);

  await approveThrough(page, world, id, 1, 1);

  await signIn(page, world.people.dean);
  await page.goto(`/syllabus/${id}/review`);
  await expect(page.getByRole("button", { name: "Approve", exact: true })).toHaveCount(0);

  await signIn(page, world.people.head);
  await page.goto("/review");
  await expect(page.getByRole("row", { name: new RegExp(course.code) })).toContainText("As stand-in");
  await page.goto(`/syllabus/${id}/review`);
  await expect(page.getByText(/Reviewing at stage 2 \(.+, as stand-in\)/)).toBeVisible();
  await approveInUi(page, id);
  expect((await getSyllabus(page, id)).stage).toBe(3);
});
