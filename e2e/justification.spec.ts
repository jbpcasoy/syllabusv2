import type { Page } from "@playwright/test";
import {
  addCourse,
  approveThrough,
  draftWithVersion,
  fileSignedCopy,
  prospectusFor,
  schoolYearWithTerm,
  submitted,
} from "./arrange";
import { expect, test } from "./fixtures";
import { adminPb, alerts, createUser, getSyllabus, ok, pdfFile, signIn, submit } from "./helpers";
import type { World } from "./world";

// The Justification Form (walkthrough Part 5): last school year's authors
// are acknowledged, and the lead explains who can't sign. Informational
// only: it never blocks the syllabus.

const panelOf = (page: Page) =>
  page.locator("section").filter({ has: page.getByRole("heading", { name: "Justification Form" }) });

/**
 * Last year (2025-2026) the world's co-author wrote and got approved this
 * course; this year the lead's syllabus for it, with `coAuthors`, is
 * submitted. Returns this year's id.
 */
async function acknowledgedSyllabus(page: Page, world: World, coAuthors: string[] = []) {
  const course = await addCourse(world);
  const previous = await schoolYearWithTerm("2025-2026");
  await prospectusFor(world, previous.schoolYear, [course.id], true);
  const old = await submitted(page, world, course, previous.term, world.people.coAuthor);
  await approveThrough(page, world, old, 1, 5);
  const id = await draftWithVersion(page, world, course);
  if (coAuthors.length) {
    await ok(await page.request.patch(`/api/syllabus/${id}`, { data: { co_authors: coAuthors } }), "co-authors");
  }
  await submit(page, id);
  return { id, course };
}

test("the panel appears only once approved, and only with last year's syllabus @JUS-01", async ({ page, world }) => {
  const { id } = await acknowledgedSyllabus(page, world);
  await signIn(page, world.people.lead);
  await page.goto(`/syllabus/${id}`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(panelOf(page)).toHaveCount(0);

  await approveThrough(page, world, id, 1, 5);
  await signIn(page, world.people.lead);
  await page.goto(`/syllabus/${id}`);
  await expect(panelOf(page)).toBeVisible();

  // An approved syllabus with nothing last year has no panel.
  const fresh = await submitted(page, world, await addCourse(world));
  await approveThrough(page, world, fresh, 1, 5);
  await signIn(page, world.people.lead);
  await page.goto(`/syllabus/${fresh}`);
  await expect(page.getByRole("heading", { name: "Signed copy" })).toBeVisible();
  await expect(panelOf(page)).toHaveCount(0);
});

test("a ticked author needs a reason; the letter names them and goes to the CITL director @JUS-02", async ({
  page,
  world,
}) => {
  const { id, course } = await acknowledgedSyllabus(page, world);
  await approveThrough(page, world, id, 1, 5);
  const previous = world.people.coAuthor;

  await signIn(page, world.people.lead);
  await page.goto(`/syllabus/${id}`);
  const panel = panelOf(page);
  await panel.getByRole("checkbox", { name: `${previous.name} can't sign` }).check();
  await panel.getByRole("button", { name: "Save justification" }).click();
  await expect(alerts(panel)).toHaveText("Give a reason for every author you tick.");

  await panel.getByLabel(`Reason for ${previous.name}`).fill("On official leave this semester.");
  await panel.getByRole("button", { name: "Save justification" }).click();
  await expect(alerts(panel)).toHaveCount(0);
  await expect(panel).toContainText("Draft");

  await panel.getByRole("button", { name: "Preview the letter" }).click();
  await expect(panel).toContainText(course.code);
  await expect(panel).toContainText(course.title);
  await expect(panel).toContainText(previous.name);
  await expect(panel).toContainText("On official leave this semester.");
  await expect(panel).toContainText(world.people.citl.name);
});

test("uploading the signed letter submits it and locks the entries @JUS-03", async ({ page, world }) => {
  const { id } = await acknowledgedSyllabus(page, world);
  await approveThrough(page, world, id, 1, 5);
  const previous = world.people.coAuthor;
  await signIn(page, world.people.lead);
  await ok(
    await page.request.put(`/api/syllabus/${id}/justification`, {
      data: { entries: [{ author: previous.id, reason: "Retired last June." }] },
    }),
    "save justification",
  );

  await page.goto(`/syllabus/${id}`);
  const panel = panelOf(page);
  await panel.getByLabel("Signed letter (PDF, max 20 MB)").setInputFiles(pdfFile("letter.pdf"));
  await panel.getByRole("button", { name: "Upload and submit" }).click();
  await expect(panel).toContainText("Submitted");
  await expect(panel.getByRole("button", { name: "Save justification" })).toHaveCount(0);
  await expect(panel.getByRole("link", { name: "View the signed letter" })).toBeVisible();

  const locked = await page.request.put(`/api/syllabus/${id}/justification`, {
    data: { entries: [] },
  });
  expect(locked.status()).toBeGreaterThanOrEqual(400);
});

test("the program reviewer returns the letter with a reason; the lead re-uploads @JUS-04", async ({ page, world }) => {
  const { id } = await acknowledgedSyllabus(page, world);
  await approveThrough(page, world, id, 1, 5);
  await signIn(page, world.people.lead);
  // A letter needs at least one entry first.
  await ok(
    await page.request.put(`/api/syllabus/${id}/justification`, {
      data: { entries: [{ author: world.people.coAuthor.id, reason: "Transferred to another campus." }] },
    }),
    "save justification",
  );
  await ok(
    await page.request.post(`/api/syllabus/${id}/justification/scan`, { multipart: { file: pdfFile("letter.pdf") } }),
    "upload letter",
  );

  await signIn(page, world.people.reviewer);
  await page.goto(`/syllabus/${id}`);
  const panel = panelOf(page);
  await panel.getByRole("button", { name: "Return for revision", exact: true }).click();
  await expect(alerts(panel)).toHaveText("Give a reason for returning it.");
  await panel.getByLabel("Return for revision").fill("The letter isn't signed by the dean.");
  await panel.getByRole("button", { name: "Return for revision", exact: true }).click();
  await expect(panel).toContainText("Returned for revision");
  await expect(panel).toContainText("The letter isn't signed by the dean.");

  await signIn(page, world.people.lead);
  await page.goto(`/syllabus/${id}`);
  await panelOf(page).getByLabel("Signed letter (PDF, max 20 MB)").setInputFiles(pdfFile("letter-2.pdf"));
  await panelOf(page).getByRole("button", { name: "Upload and submit" }).click();
  await expect(panelOf(page)).toContainText("Submitted");
});

test("it never blocks filing; co-authors see it, the program chair never does @JUS-05", async ({ page, world }) => {
  const colleague = await createUser(await adminPb(), {
    name: `Jus Colleague ${Date.now().toString(36)}`,
    email: `e2e.jus.colleague.${Date.now().toString(36)}@buksu.edu.ph`,
  });
  await (await adminPb()).collection("faculties").create({ user: colleague.id, program: world.program.id, active: true });
  const { id } = await acknowledgedSyllabus(page, world, [colleague.id]);
  await approveThrough(page, world, id, 1, 5);

  // Filed with no justification started at all.
  await fileSignedCopy(page, world, id);
  expect((await getSyllabus(page, id)).status).toBe("filed");

  await signIn(page, colleague);
  await page.goto(`/syllabus/${id}`);
  await expect(panelOf(page)).toBeVisible();
  await expect(panelOf(page).getByRole("button", { name: "Save justification" })).toHaveCount(0);

  await signIn(page, world.people.chair);
  await page.goto(`/syllabus/${id}`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(panelOf(page)).toHaveCount(0);
  expect((await page.request.get(`/api/syllabus/${id}/justification`)).status()).toBeGreaterThanOrEqual(400);
});
