import { expect, test } from "@playwright/test";
import {
  answerForm17AllYes,
  approveInUi,
  auditFor,
  getSyllabus,
  loadSeed,
  pdfFile,
  signIn,
} from "./helpers";

// Draft to filed through the real UI: the lead creates, uploads and
// submits; each of the five stages approves from its queue; the lead files
// the signed copy; the audit log holds every status change.
test("a syllabus goes through all five stages and is filed", async ({ page }) => {
  const seed = loadSeed();
  const code = seed.courses.chain.code;

  // The lead starts a draft from My Syllabi.
  await signIn(page, "lead");
  await page.goto("/syllabus");
  await page.getByRole("button", { name: "New syllabus" }).click();
  const create = page.getByRole("dialog");
  await create.getByLabel("Term").selectOption({ label: "2026-2027 · First Semester" });
  await create.getByLabel("Program").selectOption({ label: "E2E BS Information Technology (E2EBSIT)" });
  await create.getByRole("combobox", { name: "Course" }).fill(code);
  await page.getByRole("option", { name: new RegExp(code) }).click();
  await create.getByRole("button", { name: "Create draft" }).click();
  await expect(page).toHaveURL(/\/syllabus\/[a-z0-9]{15}$/);
  const id = page.url().split("/").pop()!;

  // Upload a PDF, then submit.
  await page.getByRole("button", { name: "Upload new version" }).click();
  const upload = page.getByRole("dialog");
  await upload.getByLabel("PDF file").setInputFiles(pdfFile());
  await upload.getByRole("button", { name: "Upload", exact: true }).click();
  await expect(upload).toBeHidden();
  await page.getByRole("button", { name: "Submit for review" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Submit", exact: true }).click();
  await expect.poll(async () => (await getSyllabus(page, id)).status).toBe("submitted");

  // Stage 1 finds it in the queue and fills Form 17, shared by every stage.
  await signIn(page, "reviewer");
  await page.goto("/review");
  const row = page.getByRole("row", { name: new RegExp(code) });
  await row.getByRole("link", { name: "Review" }).click();
  await expect(page).toHaveURL(`/syllabus/${id}/review`);
  await answerForm17AllYes(page);
  await approveInUi(page, id);

  // Stages 2 to 5 approve in order.
  for (const person of ["dean", "fdis", "citl", "vpaa"] as const) {
    await signIn(page, person);
    await approveInUi(page, id);
  }

  await signIn(page, "lead");
  expect(await getSyllabus(page, id)).toMatchObject({ status: "approved", stage: 5 });

  // The lead files the wet-signed scan.
  await page.goto(`/syllabus/${id}`);
  await page
    .getByLabel("Scanned signed syllabus (PDF, max 20 MB)")
    .setInputFiles(pdfFile("signed.pdf"));
  await page.getByRole("button", { name: "Upload and file" }).click();
  await expect(page.getByText("Filed: the signed copy is on record.")).toBeVisible();

  // Admin sees every status change in the audit log.
  await signIn(page, "admin");
  const rows = await auditFor(page, id);
  const changes = rows
    .map((r) => r.action)
    .filter((a) => a !== "file.uploaded")
    .reverse();
  expect(changes).toEqual([
    "submitted",
    "approved",
    "approved",
    "approved",
    "approved",
    "approved",
    "filed",
  ]);
  expect(rows.filter((r) => r.action === "file.uploaded")).toHaveLength(2);

  await page.goto("/audit");
  await expect(page.getByRole("heading", { name: "Audit log" })).toBeVisible();
  await expect(page.getByRole("link", { name: `E2EBSIT · ${code}` }).first()).toBeVisible();
});
