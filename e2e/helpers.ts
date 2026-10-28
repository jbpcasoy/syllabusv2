import { expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import PocketBase from "pocketbase";
import { PASSWORD, PB_URL, SEED_FILE, SUPERUSER } from "./env";
import { PEOPLE, type Person, type Seed } from "./seed";

export function loadSeed(): Seed {
  return JSON.parse(readFileSync(SEED_FILE, "utf8")) as Seed;
}

/** Superuser client on the throwaway PocketBase, for arranging state. */
export async function adminPb(): Promise<PocketBase> {
  const pb = new PocketBase(PB_URL);
  pb.autoCancellation(false);
  await pb
    .collection("_superusers")
    .authWithPassword(SUPERUSER.email, SUPERUSER.password);
  return pb;
}

/**
 * Signs in through the API on the page's own context, so the session
 * cookie is shared with the browser. The login form itself is covered by
 * the accessibility spec.
 */
export async function signIn(page: Page, person: Person) {
  await page.context().clearCookies();
  const res = await page.request.post("/api/auth/login", {
    data: { email: PEOPLE[person].email, password: PASSWORD },
  });
  expect(res.status(), `sign-in as ${person}`).toBe(200);
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

async function ok<T>(res: Awaited<ReturnType<Page["request"]["get"]>>, what: string): Promise<T> {
  expect(res.ok(), `${what}: ${res.status()} ${await res.text()}`).toBeTruthy();
  return (res.status() === 204 ? null : await res.json()) as T;
}

// API shortcuts for arranging state a spec isn't about. Each runs as
// whoever is signed in on `page`.

export async function createDraft(page: Page, seed: Seed, course: keyof Seed["courses"]) {
  const created = await ok<{ id: string }>(
    await page.request.post("/api/syllabus", {
      data: { course: seed.courses[course].id, term: seed.term, program: seed.program },
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

/** The id of the signed-in user's syllabus for a seeded course code. */
export async function findSyllabusId(page: Page, code: string): Promise<string> {
  const list = await ok<{ items: { id: string; expand?: { course?: { code: string } } }[] }>(
    await page.request.get(`/api/syllabus?search=${encodeURIComponent(code)}&perPage=10`),
    "find syllabus",
  );
  const match = list.items.find((s) => s.expand?.course?.code === code);
  expect(match, `syllabus for ${code}`).toBeTruthy();
  return match!.id;
}

// UI steps shared by several specs.

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
