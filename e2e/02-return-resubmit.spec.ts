import { expect, test } from "@playwright/test";
import {
  answerForm17AllYes,
  approveInUi,
  auditFor,
  createDraft,
  getSyllabus,
  loadSeed,
  pdfFile,
  signIn,
  submit,
  uploadVersion,
} from "./helpers";

// The dean returns with a Form 18-1 point; the lead uploads a revision,
// answers the point and resubmits; review resumes at the dean.
test("a returned syllabus resumes at the stage that returned it", async ({ page }) => {
  const seed = loadSeed();

  await signIn(page, "lead");
  const id = await createDraft(page, seed, "revise");
  await uploadVersion(page, id);
  await submit(page, id);

  await signIn(page, "reviewer");
  await page.goto(`/syllabus/${id}/review`);
  await answerForm17AllYes(page);
  await approveInUi(page, id);

  // The dean raises a point (Part A, no legend code) and returns.
  await signIn(page, "dean");
  await page.goto(`/syllabus/${id}/review`);
  await page.getByRole("tab", { name: "Form 18-1" }).click();
  await page.getByLabel("Review point").fill("Align the course outcomes with the program outcomes.");
  await page.getByRole("button", { name: "Add point" }).click();
  await expect(page.getByText("Align the course outcomes with the program outcomes.")).toBeVisible();
  await page.getByRole("button", { name: "Return for revision" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Return", exact: true }).click();
  await expect(page).toHaveURL(/\/review$/);

  // The lead revises.
  await signIn(page, "lead");
  expect(await getSyllabus(page, id)).toMatchObject({ status: "returned", stage: 2 });
  await page.goto(`/syllabus/${id}/revise`);
  const resubmit = page.getByRole("button", { name: "Resubmit", exact: true });
  await expect(resubmit).toBeDisabled();

  await page.getByRole("button", { name: "Upload revision" }).click();
  const upload = page.getByRole("dialog");
  await upload.getByLabel("PDF file").setInputFiles(pdfFile("revision.pdf"));
  await upload.getByRole("button", { name: "Upload", exact: true }).click();
  await expect(upload).toBeHidden();

  await page.getByLabel("Action taken").fill("Mapped every course outcome to a program outcome.");
  await page.getByLabel("Page number").fill("3");
  await page.getByRole("button", { name: "Save answer" }).click();
  await expect(page.getByText("Answered", { exact: true })).toBeVisible();

  await expect(resubmit).toBeEnabled();
  await resubmit.click();
  await page.getByRole("dialog").getByRole("button", { name: "Resubmit", exact: true }).click();
  await expect(page).toHaveURL(`/syllabus/${id}`);
  expect(await getSyllabus(page, id)).toMatchObject({ status: "submitted", stage: 2 });

  await signIn(page, "admin");
  const actions = (await auditFor(page, id))
    .map((r) => r.action)
    .filter((a) => a !== "file.uploaded")
    .reverse();
  expect(actions).toEqual(["submitted", "approved", "returned", "resubmitted"]);
});
