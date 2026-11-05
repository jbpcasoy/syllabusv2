import { expect, type Locator, type Page } from "@playwright/test";
import { PASSWORD } from "./env";
import type { PersonRecord } from "./seed";
import type { Course, World } from "./world";

export { adminPb, createUser } from "./seed";

/**
 * Signs in through the API on the page's own context, so the session
 * cookie is shared with the browser. The login form itself is covered by
 * the accessibility spec.
 */
export async function signIn(page: Page, person: PersonRecord) {
  await page.context().clearCookies();
  const res = await page.request.post("/api/auth/login", {
    data: { email: person.email, password: PASSWORD },
  });
  expect(res.status(), `sign-in as ${person.name}`).toBe(200);
}

/**
 * The page's error alerts, without Next.js's route announcer (an empty
 * `role="alert"` on every page).
 */
export function alerts(scope: Page | Locator) {
  return scope.locator('[role="alert"]:not(#__next-route-announcer__)');
}

/** The page is the sign-in form, asked to return to `path` afterwards. */
export async function expectSignInFor(page: Page, path: string) {
  await expect
    .poll(() => {
      const url = new URL(page.url());
      return url.pathname === "/login" ? url.searchParams.get("next") : url.pathname;
    }, { message: `sign-in redirect for ${path}` })
    .toBe(path);
}

/** The smallest file the server's magic-byte check accepts as a PDF. */
export function pdfFile(name = "syllabus.pdf") {
  return {
    name,
    mimeType: "application/pdf",
    buffer: Buffer.from(
      "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n",
    ),
  };
}

type ApiResponse = Awaited<ReturnType<Page["request"]["get"]>>;

export async function ok<T>(res: ApiResponse, what: string): Promise<T> {
  expect(res.ok(), `${what}: ${res.status()} ${await res.text()}`).toBeTruthy();
  return (res.status() === 204 ? null : await res.json()) as T;
}

// API shortcuts for arranging state a spec isn't about. Each runs as
// whoever is signed in on `page`. Multi-person arrangements are in arrange.ts.

/** The lead's draft for `course`, on the world's term unless `term` is given. */
export async function createDraft(page: Page, world: World, course: Course, term = world.term.id) {
  const created = await ok<{ id: string }>(
    await page.request.post("/api/syllabus", {
      data: { course: course.id, term, program: world.program.id },
    }),
    "create draft",
  );
  return created.id;
}

export async function uploadVersion(page: Page, syllabusId: string) {
  await ok(
    await page.request.post(`/api/syllabus/${syllabusId}/version`, {
      multipart: { file: pdfFile(), notes: "e2e" },
    }),
    "upload version",
  );
}

export async function submit(page: Page, syllabusId: string) {
  await ok(await page.request.post(`/api/syllabus/${syllabusId}/submit`), "submit");
}

export async function getSyllabus(page: Page, syllabusId: string) {
  return ok<{ status: string; stage: number; lead: string }>(
    await page.request.get(`/api/syllabus/${syllabusId}`),
    "get syllabus",
  );
}

// UI steps shared by several specs.

/** Picks `person` in a dialog's "User" picker (search, then click the option). */
export async function pickUser(page: Page, dialog: Locator, person: PersonRecord) {
  await dialog.getByRole("combobox", { name: "User" }).fill(person.name);
  await page.getByRole("listbox").getByRole("option", { name: new RegExp(escapeRegExp(person.email)) }).click();
}

export const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** A table row by the exact text of one of its cells. */
export function rowWith(page: Page, cell: string) {
  return page.getByRole("row").filter({ has: page.getByRole("cell", { name: cell, exact: true }) });
}

/** Answers every Form 17 criterion Yes and saves (review workspace). */
export async function answerForm17AllYes(page: Page) {
  const groups = page.getByRole("radiogroup", { name: /^Answer for / });
  await expect(groups.first()).toBeVisible();
  const count = await groups.count();
  // The counter appears once the saved answers have loaded.
  await expect(page.getByText(new RegExp(`^\\d+ of ${count} answered`))).toBeVisible();
  for (let i = 0; i < count; i++) {
    await groups.nth(i).getByRole("radio", { name: "Yes" }).click();
  }
  await page.getByRole("button", { name: "Save checklist" }).click();
  await expect(page.getByText(`${count} of ${count} answered`)).toBeVisible();
}

/** Opens the syllabus's review workspace and approves it at the caller's stage. */
export async function approveInUi(page: Page, syllabusId: string) {
  await page.goto(`/syllabus/${syllabusId}/review`);
  await page.getByRole("button", { name: "Approve", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Approve", exact: true }).click();
  await expect(dialog.getByText(/^SYL-/)).toBeVisible();
  await dialog.getByRole("button", { name: "Done" }).click();
  await expect(page).toHaveURL(/\/review$/);
}

/** Audit rows for one syllabus, as the signed-in admin. */
export async function auditFor(page: Page, syllabusId: string) {
  const body = await ok<{ items: { action: string; override: boolean; reason: string }[] }>(
    await page.request.get(`/api/audit?syllabus=${syllabusId}&perPage=100`),
    "audit",
  );
  return body.items;
}
