import type { Page } from "@playwright/test";
import {
  addCourse,
  approveThrough,
  draftWithVersion,
  prospectusFor,
  returnAt,
  schoolYearWithTerm,
  submitted,
} from "./arrange";
import { expect, test } from "./fixtures";
import { adminPb, alerts, createDraft, getSyllabus, ok, pdfFile, signIn } from "./helpers";
import type { World } from "./world";

// A syllabus from draft to submitted, as its lead (walkthrough Parts 4, 5
// and 10): creating, uploading, co-authors, submitting and deleting.

const dialogOf = (page: Page) => page.getByRole("dialog");

/** Opens New syllabus and picks term and program; returns the dialog. */
async function newSyllabus(page: Page, world: World, termLabel = world.term.label) {
  await page.goto("/syllabus");
  await page.getByRole("button", { name: "New syllabus" }).click();
  const dialog = dialogOf(page);
  await dialog.getByLabel("Term").selectOption({ label: termLabel });
  await dialog.getByLabel("Program").selectOption({ label: world.program.label });
  return dialog;
}

/** Types `code` into the course picker and returns the matching options. */
async function searchCourse(page: Page, code: string) {
  const searched = page.waitForResponse((r) => new URL(r.url()).searchParams.get("search") === code);
  await dialogOf(page).getByRole("combobox", { name: "Course" }).fill(code);
  await searched;
  const listbox = page.getByRole("listbox");
  await expect(listbox.getByText("Searching…")).toHaveCount(0);
  return listbox.getByRole("option", { name: new RegExp(code) });
}

async function uploadInUi(page: Page, file: { name: string; mimeType: string; buffer: Buffer }) {
  await page.getByRole("button", { name: "Upload new version" }).click();
  const dialog = dialogOf(page);
  await dialog.getByLabel("PDF file").setInputFiles(file);
  await dialog.getByRole("button", { name: "Upload", exact: true }).click();
  return dialog;
}

test("the lead creates a draft from New syllabus @SYL-01", async ({ page, world }) => {
  const course0 = await addCourse(world);
  await signIn(page, world.people.lead);
  await newSyllabus(page, world);
  const code = course0.code;
  await (await searchCourse(page, code)).click();
  await dialogOf(page).getByRole("button", { name: "Create draft" }).click();
  await expect(page).toHaveURL(/\/syllabus\/[a-z0-9]{15}$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(code);
  const id = page.url().split("/").pop()!;
  expect(await getSyllabus(page, id)).toMatchObject({ status: "draft", lead: world.people.lead.id });
});

test("only courses in a published prospectus of an open term are offered @SYL-02", async ({ page, world }) => {
  // A closed term whose prospectus does list the course.
  const closed = await schoolYearWithTerm(undefined, false);
  await prospectusFor(world, closed.schoolYear, [world.courses[1].id], true);
  // A course of this program that no prospectus lists.
  const pb = await adminPb();
  const unlisted = await pb.collection("courses").create({
    code: `${world.courses[0].code.split(" ")[0]} 199`,
    title: "Not In Any Prospectus",
    program: world.program.id,
    credit_units: 3,
    lec_units: 3,
    lab_units: 0,
    nominal_duration_hours: 54,
  });

  await signIn(page, world.people.lead);
  await page.goto("/syllabus");
  await page.getByRole("button", { name: "New syllabus" }).click();
  const terms = await dialogOf(page).getByLabel("Term").locator("option").allInnerTexts();
  expect(terms).toContain(world.term.label);
  expect(terms).not.toContain(closed.termLabel);
  await dialogOf(page).getByRole("button", { name: "Cancel" }).click();

  await newSyllabus(page, world);
  await expect(await searchCourse(page, unlisted.code as string)).toHaveCount(0);

  for (const data of [
    { course: unlisted.id, term: world.term.id, program: world.program.id },
    { course: world.courses[1].id, term: closed.term, program: world.program.id },
  ]) {
    const res = await page.request.post("/api/syllabus", { data });
    expect(res.status(), JSON.stringify(data)).toBeGreaterThanOrEqual(400);
  }
});

test("someone who isn't faculty of the program can't create one @SYL-03", async ({ page, world }) => {
  await signIn(page, world.people.fdis);
  const res = await page.request.post("/api/syllabus", {
    data: { course: world.courses[2].id, term: world.term.id, program: world.program.id },
  });
  expect(res.status()).toBe(403);

  await page.goto("/syllabus");
  await expect(page.getByRole("button", { name: "New syllabus" })).toBeDisabled();
  await expect(page.getByRole("link", { name: "Request to join a program" })).toBeVisible();
});

test("a second syllabus for the same course, term and program is refused @SYL-04", async ({ page, world }) => {
  const course3 = await addCourse(world);
  await signIn(page, world.people.lead);
  await createDraft(page, world, course3);

  await newSyllabus(page, world);
  // The picker shows the course but won't let it be picked again.
  await expect(await searchCourse(page, course3.code)).toBeDisabled();
  const res = await page.request.post("/api/syllabus", {
    data: { course: course3.id, term: world.term.id, program: world.program.id },
  });
  expect(res.status()).toBe(409);
});

test("uploads accept a real PDF and refuse a fake or oversized one @SYL-05", async ({ page, world }) => {
  const course0 = await addCourse(world);
  await signIn(page, world.people.lead);
  const id = await createDraft(page, world, course0);
  await page.goto(`/syllabus/${id}`);

  // Named .pdf with the PDF type, but the bytes aren't a PDF.
  let dialog = await uploadInUi(page, {
    name: "fake.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("This is a text file renamed to .pdf\n"),
  });
  await expect(alerts(dialog)).not.toBeEmpty();
  await dialog.getByRole("button", { name: "Cancel" }).click();

  // Over the 20 MB limit, with a real PDF header.
  const big = Buffer.alloc(21 * 1024 * 1024, 0x20);
  big.write("%PDF-1.4\n");
  dialog = await uploadInUi(page, { name: "big.pdf", mimeType: "application/pdf", buffer: big });
  await expect(alerts(dialog)).not.toBeEmpty();
  await dialog.getByRole("button", { name: "Cancel" }).click();

  // A good upload keeps the dialog open to say it isn't submitted yet.
  dialog = await uploadInUi(page, pdfFile());
  await expect(dialog).toContainText("not submitted yet");
  await dialog.getByRole("button", { name: "Keep as draft" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Submit for review" })).toBeEnabled();
  await expect(page.getByText("Not submitted yet.")).toBeVisible();

  // My syllabi reminds the lead too.
  await page.goto("/syllabus");
  await expect(page.getByText(/You have \d+ drafts? not yet submitted/)).toBeVisible();
  const row = page.getByRole("row", { name: new RegExp(course0.code) });
  await expect(row).toContainText("Not submitted yet");
});

test("submit waits for a PDF, then asks to confirm @SYL-06", async ({ page, world }) => {
  const course1 = await addCourse(world);
  await signIn(page, world.people.lead);
  const id = await createDraft(page, world, course1);
  await page.goto(`/syllabus/${id}`);
  const submitButton = page.getByRole("button", { name: "Submit for review" });
  await expect(submitButton).toBeDisabled();
  await expect(submitButton).toHaveAttribute("title", "Upload a PDF first");

  // Straight from the upload dialog into the submit confirmation.
  const upload = await uploadInUi(page, pdfFile());
  await upload.getByRole("button", { name: "Submit for review now" }).click();
  await dialogOf(page).getByRole("button", { name: "Submit", exact: true }).click();
  await expect(dialogOf(page)).toHaveCount(0);
  await expect.poll(async () => (await getSyllabus(page, id)).status).toBe("submitted");
  await expect(page.getByText("In review").first()).toBeVisible();
});

test("submit is refused while a chain stage has no active holder @SYL-07", async ({ page, world }) => {
  const course2 = await addCourse(world);
  const pb = await adminPb();
  const dean = await pb.collection("deans").getFirstListItem(pb.filter("user = {:u}", { u: world.people.dean.id }));
  const id = await draftWithVersion(page, world, course2);
  try {
    await pb.collection("deans").update(dean.id, { active: false });
    await page.goto(`/syllabus/${id}`);
    await page.getByRole("button", { name: "Submit for review" }).click();
    await dialogOf(page).getByRole("button", { name: "Submit", exact: true }).click();
    await expect(alerts(dialogOf(page))).toHaveText("The review chain is incomplete. No active Dean.");
    expect((await getSyllabus(page, id)).status).toBe("draft");
  } finally {
    await pb.collection("deans").update(dean.id, { active: true });
  }
});

test("last year's approved syllabus is offered as a starting point @SYL-08", async ({ page, world }) => {
  const course3 = await addCourse(world);
  // The year before the shared 2026-2027 term, with this course approved.
  const previous = await schoolYearWithTerm("2025-2026");
  await prospectusFor(world, previous.schoolYear, [course3.id], true);
  const old = await submitted(page, world, course3, previous.term);
  await approveThrough(page, world, old, 1, 5);

  // A different lead's draft this year still gets it (authors are acknowledged).
  await signIn(page, world.people.coAuthor);
  const id = await createDraft(page, world, course3);
  await page.goto(`/syllabus/${id}`);
  await page.getByRole("button", { name: "Start from last year's syllabus" }).click();
  await expect(page.getByRole("button", { name: "Submit for review" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Start from last year's syllabus" })).toHaveCount(0);
});

test("co-authors: faculty can be added, others can't, and co-authors only view @SYL-09", async ({ page, world }) => {
  const course2 = await addCourse(world);
  await signIn(page, world.people.lead);
  const id = await createDraft(page, world, course2);
  await page.goto(`/syllabus/${id}`);

  const picker = page.getByRole("combobox", { name: "Add a co-author" });
  await picker.fill(world.people.dean.name);
  await expect(page.getByRole("listbox").getByText("No other faculty found.")).toBeVisible();
  await page.keyboard.press("Escape");
  const refused = await page.request.patch(`/api/syllabus/${id}`, { data: { co_authors: [world.people.dean.id] } });
  expect(refused.status()).toBe(409);

  await picker.fill(world.people.coAuthor.name);
  await page.getByRole("listbox").getByRole("option", { name: new RegExp(world.people.coAuthor.name) }).click();
  const listed = page.getByRole("listitem").filter({ hasText: world.people.coAuthor.name });
  await expect(listed.getByRole("button", { name: "Remove" })).toBeVisible();

  // The co-author finds it in My syllabi, not only by its URL.
  await signIn(page, world.people.coAuthor);
  await page.goto("/syllabus");
  await page.getByRole("link", { name: course2.code, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/syllabus/${id}$`));
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("button", { name: "Upload new version" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Submit for review" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Delete draft" })).toHaveCount(0);
});

test("co-authors change only in draft or returned, and never to a decider @SYL-10", async ({ page, world }) => {
  const course0 = await addCourse(world);
  const id = await submitted(page, world, course0);
  await signIn(page, world.people.lead);
  await page.goto(`/syllabus/${id}`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Add a co-author" })).toHaveCount(0);

  // The program reviewer approves, the dean returns: the reviewer has decided on it.
  await approveThrough(page, world, id, 1, 1);
  await returnAt(page, world, id, 2, "Tighten the course outcomes.");
  await signIn(page, world.people.lead);
  await page.goto(`/syllabus/${id}`);
  await expect(page.getByRole("combobox", { name: "Add a co-author" })).toBeVisible();
  const refused = await page.request.patch(`/api/syllabus/${id}`, {
    data: { co_authors: [world.people.reviewer.id] },
  });
  expect(refused.status()).toBe(409);
  await ok(
    await page.request.patch(`/api/syllabus/${id}`, { data: { co_authors: [world.people.coAuthor.id] } }),
    "add co-author while returned",
  );
});

test("a draft can be deleted; a submitted syllabus can't @SYL-11", async ({ page, world }) => {
  const course1 = await addCourse(world);
  await signIn(page, world.people.lead);
  const draft = await createDraft(page, world, course1);
  await page.goto(`/syllabus/${draft}`);
  await page.getByRole("button", { name: "Delete draft" }).click();
  await dialogOf(page).getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page).toHaveURL(/\/syllabus$/);
  expect((await page.request.get(`/api/syllabus/${draft}`)).status()).toBe(404);

  const id = await submitted(page, world, course1);
  await page.goto(`/syllabus/${id}`);
  await expect(page.getByRole("button", { name: "Submit for review" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Delete draft" })).toHaveCount(0);
  expect((await page.request.delete(`/api/syllabus/${id}`)).status()).toBeGreaterThanOrEqual(400);
});

test("versions open through the scoped file route, never a storage URL @SYL-12", async ({ page, world }) => {
  const course2 = await addCourse(world);
  const id = await draftWithVersion(page, world, course2);
  await page.goto(`/syllabus/${id}`);
  const link = page.getByRole("link", { name: "View PDF" }).first();
  const href = (await link.getAttribute("href"))!;
  expect(href).toMatch(new RegExp(`^/api/syllabus/${id}/version/[a-z0-9]{15}/`));
  expect(await page.content()).not.toMatch(/\/api\/files\/|127\.0\.0\.1:8099|amazonaws|s3\./);

  const file = await page.request.get(href);
  expect(file.status()).toBe(200);
  expect(file.headers()["content-type"]).toContain("application/pdf");
  expect((await file.body()).subarray(0, 5).toString()).toBe("%PDF-");

  // Someone without access gets 404, not the file.
  await signIn(page, world.people.fdis);
  expect((await page.request.get(href)).status()).toBe(404);
});
