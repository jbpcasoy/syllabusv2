import type { Locator, Page } from "@playwright/test";
import { CURRENT_FORM17, checklistCriteria } from "@/lib/forms";
import { addCourse, submitted } from "./arrange";
import { hold } from "./faults";
import { expect, test } from "./fixtures";
import { getSyllabus, ok, pdfFile, signIn } from "./helpers";

// Phase 6 keyboard pass (walkthrough Part 11), automated: a return and
// resubmit using only Tab, Shift+Tab, arrows, Space, Enter and Esc. Focus
// must be visible on every control reached. Choosing a PDF is the one
// exception: headless Chromium can't drive the OS file picker, so the file
// is set on the focused input. Screen-reader announcements stay manual.

const CRITERIA = checklistCriteria(CURRENT_FORM17).map((c) => c.key);

/** True when the focused element shows an outline or a focus ring. */
async function focusIsVisible(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return false;
    const style = getComputedStyle(el);
    const outline = style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0;
    const ring = style.boxShadow !== "none" && style.boxShadow !== "";
    return outline || ring;
  });
}

/**
 * Presses Tab (or Shift+Tab) until `target` has focus, then checks the
 * focus is visible. Fails if it takes more than `max` presses.
 */
async function tabTo(page: Page, target: Locator, { max = 120, back = false } = {}) {
  for (let i = 0; i < max; i++) {
    if (await target.evaluate((el) => el === document.activeElement).catch(() => false)) {
      expect(await focusIsVisible(page), `visible focus on ${target}`).toBe(true);
      return;
    }
    await page.keyboard.press(back ? "Shift+Tab" : "Tab");
  }
  throw new Error(`Couldn't reach ${target} with the keyboard in ${max} presses`);
}

test("Form 17 can be answered with the keyboard @A11Y-02", async ({ page, world }) => {
  const id = await submitted(page, world, await addCourse(world));
  await signIn(page, world.people.reviewer);
  await page.goto(`/syllabus/${id}/review`);
  await expect(page.getByText(`0 of ${CRITERIA.length} answered`)).toBeVisible();
  for (const key of CRITERIA) {
    const yes = page.getByRole("radiogroup", { name: `Answer for ${key}` }).getByRole("radio", { name: "Yes" });
    await tabTo(page, yes, { max: 80 });
    await page.keyboard.press("Space");
    await expect(yes).toBeChecked();
  }
  await tabTo(page, page.getByRole("button", { name: "Save checklist" }));
  await page.keyboard.press("Enter");
  await expect(page.getByText(`${CRITERIA.length} of ${CRITERIA.length} answered`)).toBeVisible();
});

test("a reviewer returns and the lead resubmits, keyboard only @A11Y-02", async ({ page, world }) => {
  test.setTimeout(180_000);
  const id = await submitted(page, world, await addCourse(world));

  // Form 17 by keyboard is the test above; here it's answered through the API.
  await signIn(page, world.people.reviewer);
  await ok(
    await page.request.put(`/api/syllabus/${id}/form17`, {
      data: { answers: CRITERIA.map((criterion) => ({ criterion, answer: "yes" })) },
    }),
    "form 17",
  );
  await page.goto(`/syllabus/${id}/review`);
  await expect(page.getByText(`${CRITERIA.length} of ${CRITERIA.length} answered`)).toBeVisible();

  // Arrow keys move between the Form 17 and Form 18-1 tabs.
  await tabTo(page, page.getByRole("tab", { name: "Form 17" }), { back: true });
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Form 18-1" })).toHaveAttribute("aria-selected", "true");

  await tabTo(page, page.getByLabel("Review point"));
  await page.keyboard.type("List office hours and consultation channels.");
  await tabTo(page, page.getByRole("button", { name: "Add point" }));
  await page.keyboard.press("Enter");
  await expect(page.getByRole("listitem").filter({ hasText: "List office hours" })).toBeVisible();

  // Esc closes the decision dialog; Enter opens and confirms it.
  await tabTo(page, page.getByRole("button", { name: "Return for revision" }));
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Return for revision" })).toBeFocused();
  await page.keyboard.press("Enter");
  await tabTo(page, page.getByRole("dialog").getByRole("button", { name: "Return", exact: true }));
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/:\d+\/review$/);

  // The lead uploads, answers and resubmits.
  await signIn(page, world.people.lead);
  await page.goto(`/syllabus/${id}/revise`);
  await tabTo(page, page.getByRole("button", { name: "Upload revision" }));
  await page.keyboard.press("Enter");
  const upload = page.getByRole("dialog");
  const fileInput = upload.getByLabel("PDF file");
  await tabTo(page, fileInput);
  await fileInput.setInputFiles(pdfFile("revision.pdf"));
  await tabTo(page, upload.getByRole("button", { name: "Upload", exact: true }));
  await page.keyboard.press("Enter");
  await expect(upload).toHaveCount(0);

  await tabTo(page, page.getByLabel("Action taken"));
  await page.keyboard.type("Added office hours and the class Messenger group.");
  await tabTo(page, page.getByRole("button", { name: "Save answer" }));
  await page.keyboard.press("Enter");
  await expect(page.getByText("Answered", { exact: true })).toBeVisible();

  // While resubmitting, Esc doesn't close the dialog.
  const release = await hold(page, `/api/syllabus/${id}/resubmit`, "POST");
  await tabTo(page, page.getByRole("button", { name: "Resubmit", exact: true }));
  await page.keyboard.press("Enter");
  const confirm = page.getByRole("dialog");
  await tabTo(page, confirm.getByRole("button", { name: "Resubmit", exact: true }));
  await page.keyboard.press("Enter");
  await expect(confirm.getByRole("button", { name: "Resubmitting…" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(confirm.getByRole("button", { name: "Resubmitting…" })).toBeVisible();
  release();
  await expect(page).toHaveURL(`/syllabus/${id}`);
  expect(await getSyllabus(page, id)).toMatchObject({ status: "submitted", stage: 1 });
});

test("the course picker works with typing, arrows and Enter @A11Y-02", async ({ page, world }) => {
  const course = await addCourse(world);
  await signIn(page, world.people.lead);
  await page.goto("/syllabus");
  await tabTo(page, page.getByRole("button", { name: "New syllabus" }));
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");

  // Native selects: focus them by keyboard, choose the option.
  await tabTo(page, dialog.getByLabel("Term"));
  await dialog.getByLabel("Term").selectOption({ label: world.term.label });
  await tabTo(page, dialog.getByLabel("Program"));
  await dialog.getByLabel("Program").selectOption({ label: world.program.label });

  const picker = dialog.getByRole("combobox", { name: "Course" });
  await tabTo(page, picker);
  const searched = page.waitForResponse((r) => new URL(r.url()).searchParams.get("search") === course.code);
  await page.keyboard.type(course.code);
  await searched;
  await expect(page.getByRole("listbox").getByRole("option")).toHaveCount(1);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(picker).toHaveValue(new RegExp(course.code));

  await tabTo(page, dialog.getByRole("button", { name: "Create draft" }));
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/syllabus\/[a-z0-9]{15}$/);
});
