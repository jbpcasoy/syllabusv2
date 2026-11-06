import { expect, test } from "./fixtures";
import { auditFor, createDraft, getSyllabus, signIn } from "./helpers";

// Admin isn't the program's chair, so reassigning the lead is an override:
// the dialog asks for a reason and the audit log marks it.
test("an admin reassigns the lead only with a reason, marked as an override @LEAD-02", async ({ page, world }) => {
  const coAuthor = world.people.coAuthor;
  const reason = "The lead is on study leave this semester.";

  await signIn(page, world.people.lead);
  const id = await createDraft(page, world, world.courses[0]);

  await signIn(page, world.people.admin);
  await page.goto(`/syllabus/${id}`);
  await page.getByRole("button", { name: "Transfer lead" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("New lead").fill(coAuthor.name);
  await page.getByRole("option", { name: coAuthor.name }).click();

  const transfer = dialog.getByRole("button", { name: "Transfer", exact: true });
  await expect(dialog.getByLabel("Reason (required)")).toBeVisible();
  await expect(transfer).toBeDisabled();
  await dialog.getByLabel("Reason (required)").fill(reason);
  await transfer.click();
  // The dialog can read as hidden mid-transition, before the PUT returns.
  await expect.poll(async () => (await getSyllabus(page, id)).lead).toBe(coAuthor.id);
  await expect(page.getByText(`Lead: ${coAuthor.name}`)).toBeVisible();
  expect(await auditFor(page, id)).toEqual([
    expect.objectContaining({ action: "lead.transferred", override: true, reason }),
  ]);

  // The audit page's override filter finds it, with the reason shown.
  await page.goto("/audit");
  await page.getByLabel("Overrides").selectOption({ label: "Admin overrides only" });
  const row = page.getByRole("row", { name: /Lead transferred/ }).first();
  await expect(row.getByText("Override", { exact: true })).toBeVisible();
  await expect(row.getByText(reason)).toBeVisible();
  await expect(row.getByText(`From ${world.people.lead.name} to ${coAuthor.name}`)).toBeVisible();
});
