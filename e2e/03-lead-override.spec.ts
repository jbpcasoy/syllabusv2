import { expect, test } from "@playwright/test";
import { auditFor, createDraft, getSyllabus, loadSeed, signIn } from "./helpers";

// Admin isn't the program's chair, so reassigning the lead is an override:
// the dialog asks for a reason and the audit log marks it.
test("an admin reassigns the lead only with a reason, marked as an override", async ({ page }) => {
  const seed = loadSeed();
  const reason = "The lead is on study leave this semester.";

  await signIn(page, "lead");
  const id = await createDraft(page, seed, "lead");

  await signIn(page, "admin");
  await page.goto(`/syllabus/${id}`);
  await page.getByRole("button", { name: "Transfer lead" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("New lead").fill("Coauthor");
  await page.getByRole("option", { name: /E2E Coauthor/ }).click();

  const transfer = dialog.getByRole("button", { name: "Transfer", exact: true });
  await expect(dialog.getByLabel("Reason (required)")).toBeVisible();
  await expect(transfer).toBeDisabled();
  await dialog.getByLabel("Reason (required)").fill(reason);
  await transfer.click();
  // The dialog can read as hidden mid-transition, before the PUT returns.
  await expect.poll(async () => (await getSyllabus(page, id)).lead).toBe(seed.users.coAuthor);
  await expect(page.getByText(/Lead: E2E Coauthor/)).toBeVisible();
  expect(await auditFor(page, id)).toEqual([
    expect.objectContaining({ action: "lead.transferred", override: true, reason }),
  ]);

  // The audit page's override filter finds it, with the reason shown.
  await page.goto("/audit");
  await page.getByLabel("Overrides").selectOption({ label: "Admin overrides only" });
  const row = page.getByRole("row", { name: /Lead transferred/ }).first();
  await expect(row.getByText("Override", { exact: true })).toBeVisible();
  await expect(row.getByText(reason)).toBeVisible();
  await expect(row.getByText("From E2E Lead to E2E Coauthor")).toBeVisible();
});
