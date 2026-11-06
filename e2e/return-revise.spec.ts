import type { Page } from "@playwright/test";
import { CURRENT_FORM17, checklistCriteria } from "@/lib/forms";
import { addCourse, approveThrough, points, returnAt, reviseAndResubmit, submitted } from "./arrange";
import { expect, test } from "./fixtures";
import { alerts, getSyllabus, ok, pdfFile, signIn } from "./helpers";
import type { World } from "./world";

// A returned syllabus and its way back (walkthrough Part 5): where it
// resumes, how points are judged and re-opened, and the history of rounds.
// The stage-2 case and the Resubmit gate are in 02-return-resubmit.spec.ts.

const CRITERIA = checklistCriteria(CURRENT_FORM17).map((c) => c.key);
const dialogOf = (page: Page) => page.getByRole("dialog");

/** As the stage-1 reviewer: every Form 17 answer Yes, through the API. */
async function form17AllYes(page: Page, world: World, id: string) {
  await signIn(page, world.people.reviewer);
  await ok(
    await page.request.put(`/api/syllabus/${id}/form17`, {
      data: { answers: CRITERIA.map((criterion) => ({ criterion, answer: "yes" })) },
    }),
    "form 17",
  );
}

/** The lead revises in the workspace: uploads, answers every point shown, resubmits. */
async function reviseInUi(page: Page, world: World, id: string) {
  await signIn(page, world.people.lead);
  await page.goto(`/syllabus/${id}/revise`);
  await page.getByRole("button", { name: "Upload revision" }).click();
  await dialogOf(page).getByLabel("PDF file").setInputFiles(pdfFile("revision.pdf"));
  await dialogOf(page).getByRole("button", { name: "Upload", exact: true }).click();
  await expect(dialogOf(page)).toHaveCount(0);

  const actions = page.getByLabel("Action taken");
  const count = await actions.count();
  for (let i = 0; i < count; i++) {
    await actions.nth(i).fill("Revised as asked.");
    await page.getByRole("button", { name: "Save answer" }).first().click();
    await expect(page.getByText("Answered", { exact: true }).nth(i)).toBeVisible();
  }
  await page.getByRole("button", { name: "Resubmit", exact: true }).click();
  await dialogOf(page).getByRole("button", { name: "Resubmit", exact: true }).click();
  await expect(page).toHaveURL(`/syllabus/${id}`);
  return count;
}

test("a stage-1 return resumes at stage 1 @RET-02", async ({ page, world }) => {
  const id = await submitted(page, world, await addCourse(world));
  await returnAt(page, world, id, 1, "List the references in APA format.");
  await signIn(page, world.people.lead);
  expect(await getSyllabus(page, id)).toMatchObject({ status: "returned", stage: 1 });

  expect(await reviseInUi(page, world, id)).toBe(1);
  expect(await getSyllabus(page, id)).toMatchObject({ status: "submitted", stage: 1 });
});

test("an unresolved point blocks Approve; a return re-opens only unresolved points @RET-03", async ({
  page,
  world,
}) => {
  const id = await submitted(page, world, await addCourse(world));
  await signIn(page, world.people.reviewer);
  for (const text of ["Point to resolve: add week numbers.", "Point left unresolved: add a rubric."]) {
    await ok(await page.request.post(`/api/syllabus/${id}/form18`, { data: { review_point: text } }), "add point");
  }
  await ok(await page.request.post(`/api/syllabus/${id}/review`, { data: { decision: "return" } }), "return");
  await reviseAndResubmit(page, world, id);
  await form17AllYes(page, world, id);

  // The reviewer judges both answers in the workspace.
  await page.goto(`/syllabus/${id}/review`);
  await page.getByRole("tab", { name: "Form 18-1" }).click();
  const resolveMe = page.getByRole("listitem").filter({ hasText: "Point to resolve" });
  const leaveMe = page.getByRole("listitem").filter({ hasText: "Point left unresolved" });
  await resolveMe.getByRole("button", { name: "Resolved", exact: true }).click();
  await expect(resolveMe.getByText("Resolved", { exact: true })).toBeVisible();
  await leaveMe.getByRole("button", { name: "Unresolved", exact: true }).click();
  await expect(leaveMe.getByText("Unresolved", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Approve", exact: true }).click();
  await dialogOf(page).getByRole("button", { name: "Approve", exact: true }).click();
  await expect(alerts(dialogOf(page))).toHaveText("Settle every review point at this stage before approving.");
  await dialogOf(page).getByRole("button", { name: "Cancel" }).click();

  // Returning again needs no new point: the unresolved one counts.
  await page.getByRole("button", { name: "Return for revision" }).click();
  await dialogOf(page).getByRole("button", { name: "Return", exact: true }).click();
  await expect(page).toHaveURL(/:\d+\/review$/);

  const after = await points(page, id);
  expect(after.find((p) => p.review_point.startsWith("Point to resolve"))!.status).toBe("resolved");
  expect(after.find((p) => p.review_point.startsWith("Point left unresolved"))!.status).toBe("open");

  // The lead answers only the re-opened point.
  await signIn(page, world.people.lead);
  await page.goto(`/syllabus/${id}/revise`);
  await expect(page.getByLabel("Action taken")).toHaveCount(1);
});

test("a later return leaves earlier stages' points resolved and resumes at its own stage @RET-04 @RET-02", async ({
  page,
  world,
}) => {
  const id = await submitted(page, world, await addCourse(world));
  await returnAt(page, world, id, 1, "Stage one point: align outcomes.");
  await reviseAndResubmit(page, world, id);
  await form17AllYes(page, world, id);
  const [first] = await points(page, id);
  await ok(
    await page.request.patch(`/api/syllabus/${id}/form18/${first.id}`, { data: { action: "judge", status: "resolved" } }),
    "resolve",
  );
  await approveThrough(page, world, id, 1, 2);
  await returnAt(page, world, id, 3, "Stage three point: cite the CMO.");

  await signIn(page, world.people.lead);
  expect(await getSyllabus(page, id)).toMatchObject({ status: "returned", stage: 3 });
  const now = await points(page, id);
  expect(now.find((p) => p.stage === 1)!.status).toBe("resolved");
  expect(now.find((p) => p.stage === 3)!.status).toBe("open");

  expect(await reviseInUi(page, world, id)).toBe(1);
  expect(await getSyllabus(page, id)).toMatchObject({ status: "submitted", stage: 3 });
});

test("the review points history shows every round by version and stage @RET-05", async ({ page, world }) => {
  const id = await submitted(page, world, await addCourse(world));
  await returnAt(page, world, id, 1, "Round one: number the weeks.");
  await reviseAndResubmit(page, world, id);
  await form17AllYes(page, world, id);
  const [first] = await points(page, id);
  await ok(
    await page.request.patch(`/api/syllabus/${id}/form18/${first.id}`, { data: { action: "judge", status: "resolved" } }),
    "resolve",
  );
  await approveThrough(page, world, id, 1, 1);
  await returnAt(page, world, id, 2, "Round two: add office hours.");

  await signIn(page, world.people.lead);
  await page.goto(`/syllabus/${id}`);
  const history = page.locator("section").filter({ has: page.getByRole("heading", { name: "Review points" }) });
  await expect(history.getByRole("heading", { name: "Version 1" })).toBeVisible();
  await expect(history.getByRole("heading", { name: "Version 2" })).toBeVisible();
  await expect(history.getByRole("heading", { name: /Stage 1 · Program Reviewer/i })).toBeVisible();
  await expect(history.getByRole("heading", { name: /Stage 2 · Dean/i })).toBeVisible();
  const roundOne = history.getByRole("listitem").filter({ hasText: "Round one" });
  const roundTwo = history.getByRole("listitem").filter({ hasText: "Round two" });
  await expect(roundOne).toContainText("Resolved");
  await expect(roundTwo).toContainText("Open");
});
