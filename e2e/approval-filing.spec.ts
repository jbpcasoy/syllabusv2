import type { Page } from "@playwright/test";
import {
  addCourse,
  approveThrough,
  fileSignedCopy,
  returnAt,
  reviseAndResubmit,
  submitted,
} from "./arrange";
import { expect, test } from "./fixtures";
import { alerts, answerForm17AllYes, getSyllabus, pdfFile, signIn } from "./helpers";

// After approval (walkthrough Part 5): verifying a code, the printed
// forms, the timeline, and filing the wet-signed scan.

const dialogOf = (page: Page) => page.getByRole("dialog");

/** Approves at stage 1 in the workspace and returns the approval code shown. */
async function approveStageOne(page: Page, id: string) {
  await page.goto(`/syllabus/${id}/review`);
  await answerForm17AllYes(page);
  await page.getByRole("button", { name: "Approve", exact: true }).click();
  await dialogOf(page).getByRole("button", { name: "Approve", exact: true }).click();
  const code = (await dialogOf(page).getByText(/^SYL-/).innerText()).trim();
  await dialogOf(page).getByRole("button", { name: "Done" }).click();
  await expect(page).toHaveURL(/:\d+\/review$/);
  return code;
}

test("an approval code verifies; a made-up one doesn't @FIL-01", async ({ page, world }) => {
  const course = await addCourse(world);
  const id = await submitted(page, world, course);
  await signIn(page, world.people.reviewer);
  const code = await approveStageOne(page, id);

  // Any signed-in user can check a code.
  await signIn(page, world.people.coAuthor);
  await page.goto("/verify");
  await page.getByLabel("Approval code").fill(code);
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(page).toHaveURL(`/verify/${encodeURIComponent(code)}`);
  const result = page.locator("main");
  await expect(result).toContainText("Valid approval");
  await expect(result).toContainText(`${course.code} — ${course.title}`);
  await expect(result).toContainText("Stage 1, Program Reviewer");
  await expect(result).toContainText(world.people.reviewer.name);

  await page.getByLabel("Approval code").fill("SYL-FAKE");
  await page.getByRole("button", { name: "Verify" }).click();
  await expect(alerts(page)).toContainText("No approval matches this code.");
});

test("the print view shows both forms with approval codes and signature lines @FIL-02", async ({ page, world }) => {
  const id = await submitted(page, world, await addCourse(world));
  await signIn(page, world.people.reviewer);
  const code = await approveStageOne(page, id);

  await signIn(page, world.people.lead);
  await page.goto(`/syllabus/${id}`);
  await page.getByRole("link", { name: "Review forms (print view)" }).click();
  await expect(page).toHaveURL(`/syllabus/${id}/forms`);
  const main = page.locator("main");
  await expect(main).toContainText("Document Code: OVPAA-F-INS-017");
  await expect(main).toContainText("Document Code: CITL-F-018");
  await expect(main).toContainText(code);
  await expect(main).toContainText(world.people.reviewer.name);
  await expect(page.getByRole("button", { name: "Print" })).toBeVisible();
});

test("the timeline lists every transition and each version's decisions @FIL-03", async ({ page, world }) => {
  const id = await submitted(page, world, await addCourse(world));
  await returnAt(page, world, id, 1, "Add the grading system.");
  await reviseAndResubmit(page, world, id);
  await signIn(page, world.people.reviewer);
  const { points } = (await (await page.request.get(`/api/syllabus/${id}/form18`)).json()) as { points: { id: string }[] };
  await page.request.patch(`/api/syllabus/${id}/form18/${points[0].id}`, { data: { action: "judge", status: "resolved" } });
  await approveThrough(page, world, id, 1, 1);

  await signIn(page, world.people.lead);
  await page.goto(`/syllabus/${id}`);
  const timeline = page.locator("section").filter({ has: page.getByRole("heading", { name: "Timeline" }) });
  for (const entry of [
    "Draft created",
    "Version 1 uploaded",
    "Submitted for review",
    "Returned for revision at stage 1 (Program Reviewer)",
    "Version 2 uploaded",
    "Resubmitted to stage 1 (Program Reviewer)",
    "Approved at stage 1 (Program Reviewer)",
  ]) {
    await expect(timeline, entry).toContainText(entry);
  }
  await expect(timeline).toContainText(/SYL-\S+-S1/);
  await expect(timeline).toContainText("Waiting on Dean (stage 2)");

  const versions = page.locator("section").filter({ has: page.getByRole("heading", { name: "PDF versions" }) });
  await expect(versions.getByRole("row").filter({ hasText: "S1 returned" })).toHaveCount(1);
  await expect(versions.getByRole("row").filter({ hasText: "S1 approved" })).toHaveCount(1);
});

test("the lead files the scan; the dean finds it and returns it as invalid; the lead files again @FIL-04 @FIL-05 @FIL-06 @FIL-08 @FIL-09", async ({
  page,
  world,
}) => {
  const course = await addCourse(world);
  const id = await submitted(page, world, course);
  await approveThrough(page, world, id, 1, 5);

  await signIn(page, world.people.lead);
  await page.goto(`/syllabus/${id}`);
  await page.getByLabel("Scanned signed syllabus (PDF, max 20 MB)").setInputFiles(pdfFile("signed.pdf"));
  await page.getByRole("button", { name: "Upload and file" }).click();
  await expect(page.getByText("Filed: the signed copy is on record.")).toBeVisible();
  expect((await getSyllabus(page, id)).status).toBe("filed");

  // The lead and the program chair can open it but not return the scan.
  for (const person of [world.people.lead, world.people.chair]) {
    await signIn(page, person);
    await page.goto(`/syllabus/${id}`);
    await expect(page.getByText("Filed: the signed copy is on record.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Return as invalid" }), person.name).toHaveCount(0);
  }

  const reason = "The CITL director's signature is missing.";
  // The dean hears about the filing and finds the syllabus in the queue.
  await signIn(page, world.people.dean);
  await page.goto("/notifications");
  await expect(
    page.getByRole("link", { name: `${course.code} (${world.program.code}) was filed with its signed scan` }),
  ).toHaveAttribute("href", `/syllabus/${id}`);
  await page.goto("/review");
  await page.getByLabel("Status").selectOption({ label: "Filed (check the scan)" });
  await page.getByRole("link", { name: course.code, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/syllabus/${id}$`));
  await page.getByRole("button", { name: "Return as invalid" }).click();
  await expect(alerts(page).filter({ hasText: "reason" })).toHaveText("Give a reason for returning it.");
  await page.getByLabel("Return the scan as invalid").fill(reason);
  await page.getByRole("button", { name: "Return as invalid" }).click();
  const copies = page.locator("section").filter({ has: page.getByRole("heading", { name: "Signed copy" }) });
  await expect(copies.getByRole("listitem").filter({ hasText: "Returned" })).toContainText(reason);
  expect((await getSyllabus(page, id)).status).toBe("approved");

  // The lead hears why, with a link back to the syllabus.
  await signIn(page, world.people.lead);
  await page.goto("/notifications");
  const returned = page.getByRole("link", {
    name: `The signed scan of ${course.code} (${world.program.code}) was returned as invalid`,
  });
  await expect(returned).toHaveAttribute("href", `/syllabus/${id}`);
  await expect(page.getByRole("listitem").filter({ has: returned })).toContainText(reason);

  await fileSignedCopy(page, world, id);
  await page.goto(`/syllabus/${id}`);
  await expect(page.getByText("Filed: the signed copy is on record.")).toBeVisible();
  await expect(copies.getByRole("listitem")).toHaveCount(2);
  await expect(copies.getByRole("listitem").filter({ hasText: "On file" })).toHaveCount(1);
});

test("form data for printing is served only to people with access @FIL-07", async ({ page, world }) => {
  const id = await submitted(page, world, await addCourse(world));
  await approveThrough(page, world, id, 1, 1);

  await signIn(page, world.people.lead);
  for (const form of ["form17", "form18"]) {
    const res = await page.request.get(`/api/syllabus/${id}/export/${form}`);
    expect(res.status(), form).toBe(200);
    expect(res.headers()["content-type"], form).toContain("application/json");
  }

  // The department head takes no part in review and isn't an author.
  await signIn(page, world.people.head);
  for (const form of ["form17", "form18", "justification"]) {
    expect((await page.request.get(`/api/syllabus/${id}/export/${form}`)).status(), form).toBe(404);
  }
});
