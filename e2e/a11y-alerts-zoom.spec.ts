import type { Page } from "@playwright/test";
import { addCourse, approveThrough, fileSignedCopy, submitted } from "./arrange";
import { expect, test } from "./fixtures";
import { signIn } from "./helpers";

// Phase 6 accessibility, the parts axe can't see: refusals reach screen
// readers as alerts, and the busiest pages survive 200% zoom.

/** The alert carrying `text`, found by ARIA role as assistive tech would. */
const alertWith = (page: Page, text: string | RegExp) => page.getByRole("alert").filter({ hasText: text });

test("every refusal is announced as an alert @A11Y-03", async ({ page, world }) => {
  // Sign-in form.
  await page.goto("/login");
  await page.getByLabel("Email").fill(world.people.lead.email);
  await page.getByLabel("Password").fill("not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(alertWith(page, "Invalid email or password")).toBeVisible();

  // Registration form.
  await page.goto("/register");
  await page.getByLabel("Name").fill("Outside Person");
  await page.getByLabel("Email").fill("outside@gmail.com");
  await page.getByLabel("Password", { exact: true }).fill("e2e-password-123");
  await page.getByLabel("Confirm password").fill("e2e-password-123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(alertWith(page, "Use your institutional email")).toBeVisible();

  // A manager's create form, saved empty.
  await signIn(page, world.people.admin);
  await page.goto("/campus");
  await page.getByRole("button", { name: "New campus" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Create", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).not.toBeEmpty();

  // The review decision, refused by the server.
  const id = await submitted(page, world, await addCourse(world));
  await signIn(page, world.people.reviewer);
  await page.goto(`/syllabus/${id}/review`);
  await page.getByRole("button", { name: "Approve", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Approve", exact: true }).click();
  await expect(alertWith(page, "Answer every Form 17 criterion before approving.")).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Cancel" }).click();

  // A Form 18-1 point without text.
  await page.getByRole("tab", { name: "Form 18-1" }).click();
  await page.getByRole("button", { name: "Add point" }).click();
  await expect(alertWith(page, "Write the review point.")).toBeVisible();

  // Returning a filed scan without a reason.
  const filed = await submitted(page, world, await addCourse(world));
  await approveThrough(page, world, filed, 1, 5);
  await fileSignedCopy(page, world, filed);
  await signIn(page, world.people.dean);
  await page.goto(`/syllabus/${filed}`);
  await page.getByRole("button", { name: "Return as invalid" }).click();
  await expect(alertWith(page, "Give a reason for returning it.")).toBeVisible();
});

/** The page doesn't scroll sideways; wide tables scroll in their own box. */
async function expectNoSidewaysScroll(page: Page, label: string) {
  await page.waitForLoadState("networkidle");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, `${label}: page is ${overflow}px wider than the viewport`).toBeLessThanOrEqual(1);
}

/** The control is on screen horizontally once scrolled to. */
async function expectReachable(page: Page, name: string) {
  const control = page.getByRole("button", { name, exact: true }).first();
  await control.scrollIntoViewIfNeeded();
  const box = (await control.boundingBox())!;
  expect(box.x, name).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width, name).toBeLessThanOrEqual(page.viewportSize()!.width + 1);
}

test("the queue, review workspace and dashboard work at 200% zoom @A11Y-04", async ({ page, world }) => {
  const id = await submitted(page, world, await addCourse(world));
  // 1280×720 at 200% zoom lays out like a 640×360 window.
  await page.setViewportSize({ width: 640, height: 360 });

  await signIn(page, world.people.reviewer);
  await page.goto("/review");
  await expect(page.getByRole("heading", { name: "Review queue" })).toBeVisible();
  await expectNoSidewaysScroll(page, "/review");

  await page.goto(`/syllabus/${id}/review`);
  await expect(page.getByRole("tab", { name: "Form 17" })).toBeVisible();
  await expectNoSidewaysScroll(page, "review workspace");
  await expectReachable(page, "Approve");
  await expectReachable(page, "Return for revision");
  await expectReachable(page, "Save checklist");

  await signIn(page, world.people.vpaa);
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expectNoSidewaysScroll(page, "/dashboard");
});
