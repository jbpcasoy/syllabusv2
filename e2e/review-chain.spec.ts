import type { Page } from "@playwright/test";
import { CURRENT_FORM17, checklistCriteria } from "@/lib/forms";
import { addCourse, approveThrough, draftWithVersion, submitted } from "./arrange";
import { expect, test } from "./fixtures";
import { alerts, answerForm17AllYes, getSyllabus, ok, signIn, submit } from "./helpers";

// The reviewer's side of the chain (walkthrough Part 5): queues, the
// review workspace, Form 17 and Form 18-1, and who may decide. The full
// five-stage walk is 01-full-chain.spec.ts.

const CRITERIA = checklistCriteria(CURRENT_FORM17).map((c) => c.key);
const dialogOf = (page: Page) => page.getByRole("dialog");

/** Opens Approve or Return in the workspace and confirms; returns the dialog. */
async function decide(page: Page, decision: "Approve" | "Return") {
  await page.getByRole("button", { name: decision === "Approve" ? "Approve" : "Return for revision", exact: true }).click();
  const dialog = dialogOf(page);
  await dialog.getByRole("button", { name: decision, exact: true }).click();
  return dialog;
}

/** Answers every criterion through the API, as the signed-in stage reviewer. */
async function answerAll(page: Page, id: string, answer: "yes" | "no" = "yes") {
  await ok(
    await page.request.put(`/api/syllabus/${id}/form17`, {
      data: { answers: CRITERIA.map((criterion) => ({ criterion, answer, remarks: answer === "no" ? "x" : "" })) },
    }),
    "form 17",
  );
}

/** The queue row for a course code, if listed. */
const queueRow = (page: Page, code: string) => page.getByRole("row", { name: new RegExp(code) });

test("each queue lists only what waits at that stage; Review opens the workspace @REV-02", async ({ page, world }) => {
  const atOne = await addCourse(world);
  const atTwo = await addCourse(world);
  const one = await submitted(page, world, atOne);
  const two = await submitted(page, world, atTwo);
  await approveThrough(page, world, two, 1, 1);

  await signIn(page, world.people.reviewer);
  await page.goto("/review");
  await expect(queueRow(page, atOne.code)).toBeVisible();
  await expect(queueRow(page, atTwo.code)).toHaveCount(0);

  await signIn(page, world.people.dean);
  await page.goto("/review");
  await expect(queueRow(page, atTwo.code)).toBeVisible();
  await expect(queueRow(page, atOne.code)).toHaveCount(0);
  await queueRow(page, atTwo.code).getByRole("link", { name: "Review" }).click();
  await expect(page).toHaveURL(`/syllabus/${two}/review`);
  await expect(page.getByText(/Reviewing at stage 2 \(Dean/)).toBeVisible();
  expect(one).not.toBe(two);
});

test("a later stage can't approve early, in the UI or the API @REV-03", async ({ page, world }) => {
  const id = await submitted(page, world, await addCourse(world));
  await signIn(page, world.people.dean);
  await page.goto(`/syllabus/${id}/review`);
  await expect(page.getByText(/is at stage 1 \(.+\) and isn't waiting on you/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Approve", exact: true })).toHaveCount(0);

  const res = await page.request.post(`/api/syllabus/${id}/review`, { data: { decision: "approve" } });
  expect(res.status()).toBeGreaterThanOrEqual(400);
  expect((await res.json()).error).toBe("You are not the reviewer at this stage.");
  expect((await getSyllabus(page, id)).stage).toBe(1);
});

test("Form 17 needs every answer, remarks on a No, and a No blocks Approve @REV-04", async ({ page, world }) => {
  const id = await submitted(page, world, await addCourse(world));
  await signIn(page, world.people.reviewer);
  await page.goto(`/syllabus/${id}/review`);

  let dialog = await decide(page, "Approve");
  await expect(alerts(dialog)).toHaveText("Answer every Form 17 criterion before approving.");
  await dialog.getByRole("button", { name: "Cancel" }).click();

  const first = CRITERIA[0];
  const group = page.getByRole("radiogroup", { name: `Answer for ${first}` });
  await group.getByRole("radio", { name: "No" }).click();
  await page.getByRole("button", { name: "Save checklist" }).click();
  await expect(alerts(page).filter({ hasText: "needs remarks" })).toHaveText(`A "No" on ${first} needs remarks.`);

  await page.getByLabel(`Remarks for ${first}`).fill("Course outcomes don't map to program outcomes.");
  for (const key of CRITERIA.slice(1)) {
    await page.getByRole("radiogroup", { name: `Answer for ${key}` }).getByRole("radio", { name: "Yes" }).click();
  }
  await page.getByRole("button", { name: "Save checklist" }).click();
  await expect(page.getByText(`${CRITERIA.length} of ${CRITERIA.length} answered`)).toBeVisible();

  dialog = await decide(page, "Approve");
  await expect(alerts(dialog)).toHaveText('Form 17 has a "No". Return the syllabus for revision instead.');
  expect((await getSyllabus(page, id)).stage).toBe(1);
});

test("a later reviewer's Form 17 change is logged with who and which stage @REV-05", async ({ page, world }) => {
  const id = await submitted(page, world, await addCourse(world));
  await approveThrough(page, world, id, 1, 1);

  await signIn(page, world.people.dean);
  await page.goto(`/syllabus/${id}/review`);
  const key = CRITERIA[1];
  await page.getByRole("radiogroup", { name: `Answer for ${key}` }).getByRole("radio", { name: "No" }).click();
  await page.getByLabel(`Remarks for ${key}`).fill("Assessment weights don't add up.");
  await page.getByRole("button", { name: "Save checklist" }).click();

  const log = page.getByRole("button", { name: "Edit log (1)" });
  await expect(log).toBeVisible();
  await log.click();
  await expect(page.getByText(new RegExp(`yes → no by ${world.people.dean.name} \\(stage 2\\)`))).toBeVisible();
});

test("Form 18-1 Part A takes no code; Part B needs a legend code @REV-06", async ({ page, world }) => {
  const id = await submitted(page, world, await addCourse(world));
  await signIn(page, world.people.reviewer);
  await page.goto(`/syllabus/${id}/review`);
  await page.getByRole("tab", { name: "Form 18-1" }).click();
  await expect(page.getByLabel("Review point")).toBeVisible();
  await expect(page.getByLabel("Legend code")).toHaveCount(0);

  await approveThrough(page, world, id, 1, 2);
  await signIn(page, world.people.fdis);
  await page.goto(`/syllabus/${id}/review`);
  await page.getByRole("tab", { name: "Form 18-1" }).click();
  await page.getByLabel("Review point").fill("Cite the CHED memorandum the outcomes follow.");
  await page.getByRole("button", { name: "Add point" }).click();
  await expect(alerts(page).filter({ hasText: "legend" })).toHaveText("Pick a code from the legend.");

  await page.getByLabel("Legend code").selectOption("B.2");
  await page.getByRole("button", { name: "Add point" }).click();
  const point = page.getByRole("listitem").filter({ hasText: "Cite the CHED memorandum" });
  await expect(point).toContainText("B.2");
});

test("a return needs at least one review point @REV-07", async ({ page, world }) => {
  const id = await submitted(page, world, await addCourse(world));
  await signIn(page, world.people.reviewer);
  await page.goto(`/syllabus/${id}/review`);

  const dialog = await decide(page, "Return");
  await expect(alerts(dialog)).toHaveText("Add at least one Form 18-1 review point before returning.");
  await dialog.getByRole("button", { name: "Cancel" }).click();

  await page.getByRole("tab", { name: "Form 18-1" }).click();
  await page.getByLabel("Review point").fill("Add a grading rubric for the final project.");
  await page.getByRole("button", { name: "Add point" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: "grading rubric" })).toBeVisible();
  await decide(page, "Return");
  await expect(page).toHaveURL(/:\d+\/review$/);
  expect(await getSyllabus(page, id)).toMatchObject({ status: "returned", stage: 1 });
});

test("approving shows the approval code for the paper form @REV-08", async ({ page, world }) => {
  const id = await submitted(page, world, await addCourse(world));
  await signIn(page, world.people.reviewer);
  await page.goto(`/syllabus/${id}/review`);
  await answerForm17AllYes(page);
  const dialog = await decide(page, "Approve");
  await expect(dialog.getByRole("heading", { name: "Approved" })).toBeVisible();
  await expect(dialog.getByText(/^SYL-\S+-S1$/)).toBeVisible();
  await dialog.getByRole("button", { name: "Done" }).click();
  await expect(page).toHaveURL(/:\d+\/review$/);
  expect((await getSyllabus(page, id)).stage).toBe(2);
});

test("an admin can open the workspace but never review @REV-09", async ({ page, world }) => {
  const id = await submitted(page, world, await addCourse(world));
  await signIn(page, world.people.admin);
  await page.goto(`/syllabus/${id}/review`);
  await expect(page.getByText(/isn't waiting on you/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Approve", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Return for revision" })).toHaveCount(0);

  await answerAll(page, id).catch(() => undefined);
  const res = await page.request.post(`/api/syllabus/${id}/review`, { data: { decision: "approve" } });
  expect(res.status()).toBeGreaterThanOrEqual(400);
  expect((await getSyllabus(page, id)).stage).toBe(1);
});

test("a reviewer who co-authors the syllabus is refused in the workspace @REV-10", async ({ page, world }) => {
  const id = await draftWithVersion(page, world, await addCourse(world));
  await ok(
    await page.request.patch(`/api/syllabus/${id}`, { data: { co_authors: [world.people.reviewer.id] } }),
    "add the reviewer as co-author",
  );
  await submit(page, id);

  await signIn(page, world.people.reviewer);
  await page.goto(`/syllabus/${id}/review`);
  await expect(alerts(page)).toContainText("You lead or co-author this syllabus, so you can't review it.");
  await expect(page.getByRole("button", { name: "Approve", exact: true })).toHaveCount(0);
});
