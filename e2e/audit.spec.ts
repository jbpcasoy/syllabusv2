import { addCourse, approveThrough, returnAt, reviseAndResubmit, submitted } from "./arrange";
import { expect, test } from "./fixtures";
import { auditFor, ok, signIn } from "./helpers";

// The audit log (walkthrough Part 9): every status change, PDF upload and
// override for a syllabus, read only by the admin.

test("the admin narrows the log to one syllabus and sees every change, upload and override @AUD-01", async ({
  page,
  world,
}) => {
  const course = await addCourse(world);
  const id = await submitted(page, world, course);
  await returnAt(page, world, id, 1, "Add the course calendar.");
  await reviseAndResubmit(page, world, id);
  const [point] = (await (await page.request.get(`/api/syllabus/${id}/form18`)).json()).points as { id: string }[];
  await signIn(page, world.people.reviewer);
  await page.request.patch(`/api/syllabus/${id}/form18/${point.id}`, { data: { action: "judge", status: "resolved" } });
  await approveThrough(page, world, id, 1, 1);

  const reason = "The lead moved to another campus mid-term.";
  await signIn(page, world.people.admin);
  await ok(
    await page.request.put(`/api/syllabus/${id}/lead`, { data: { lead: world.people.coAuthor.id, reason } }),
    "override transfer",
  );

  // The log has every entry, newest first.
  const actions = (await auditFor(page, id)).map((r) => r.action).reverse();
  expect(actions).toEqual([
    "file.uploaded",
    "submitted",
    "returned",
    "file.uploaded",
    "resubmitted",
    "approved",
    "lead.transferred",
  ]);

  // In the page: narrow to this syllabus from one of its rows.
  await page.goto("/audit");
  const label = `${world.program.code} · ${course.code}`;
  await page
    .getByRole("row", { name: new RegExp(label) })
    .first()
    .getByRole("button", { name: /Only this syllabus/ })
    .click();
  await expect(page.getByRole("button", { name: "Show all syllabi" })).toBeVisible();
  const rows = page.getByRole("row").filter({ hasText: label });
  await expect(rows).toHaveCount(7);
  for (const name of ["Submitted", "Returned", "Resubmitted", "Approved", "File uploaded", "Lead transferred"]) {
    await expect(rows.filter({ hasText: name }).first(), name).toBeVisible();
  }
  const override = rows.filter({ hasText: "Lead transferred" });
  await expect(override.getByText("Override", { exact: true })).toBeVisible();
  await expect(override).toContainText(reason);
});

test("the VPAA can't read the audit log @AUD-02", async ({ page, world }) => {
  await signIn(page, world.people.vpaa);
  await page.goto("/audit");
  await expect(page.getByText("You don't have permission to view the audit log.")).toBeVisible();
  expect((await page.request.get("/api/audit")).status()).toBe(403);
});
