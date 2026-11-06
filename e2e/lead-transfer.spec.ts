import { addCourse, draftWithVersion } from "./arrange";
import { expect, test } from "./fixtures";
import { escapeRegExp, getSyllabus, signIn } from "./helpers";

// The program chair hands a syllabus to another of its faculty (walkthrough
// Part 8). The admin override with its required reason is
// 03-lead-override.spec.ts.

test("the chair transfers the lead; only the new lead can edit @LEAD-01", async ({ page, world }) => {
  const id = await draftWithVersion(page, world, await addCourse(world));
  const next = world.people.coAuthor;

  await signIn(page, world.people.chair);
  await page.goto(`/syllabus/${id}`);
  await page.getByRole("button", { name: "Transfer lead" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("New lead").fill(next.name);
  await page.getByRole("listbox").getByRole("option", { name: new RegExp(escapeRegExp(next.email)) }).click();
  // The chair needs no reason: only an admin override does.
  await expect(dialog.getByLabel("Reason (required)")).toHaveCount(0);
  await dialog.getByRole("button", { name: "Transfer", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect.poll(async () => (await getSyllabus(page, id)).lead).toBe(next.id);
  await expect(page.getByText(`Lead: ${next.name}`)).toBeVisible();

  await signIn(page, next);
  await page.goto(`/syllabus/${id}`);
  await expect(page.getByRole("button", { name: "Upload new version" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit for review" })).toBeEnabled();

  await signIn(page, world.people.lead);
  await page.goto(`/syllabus/${id}`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("button", { name: "Upload new version" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Submit for review" })).toHaveCount(0);
});
