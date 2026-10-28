import { expect, test } from "@playwright/test";
import { adminPb, createDraft, loadSeed, pdfFile, signIn } from "./helpers";

// Seeds 20 recent upload rows for the lead instead of uploading 20 files,
// then checks the next upload is refused with the wait in the message.
// Runs after the specs where the lead uploads.
test("the 21st upload within an hour is refused", async ({ page }) => {
  const seed = loadSeed();
  await signIn(page, "lead");
  const id = await createDraft(page, seed, "limit");

  const pb = await adminPb();
  const recent = await pb.collection("audit_log").getList(1, 1, {
    filter: pb.filter("actor = {:lead} && action = 'file.uploaded'", {
      lead: seed.users.lead,
    }),
  });
  for (let i = recent.totalItems; i < 20; i++) {
    await pb.collection("audit_log").create({
      actor: seed.users.lead,
      action: "file.uploaded",
      target_collection: "syllabus_versions",
      target_id: "e2eseede2eseede",
      syllabus: id,
      data: { kind: "version" },
    });
  }

  await page.goto(`/syllabus/${id}`);
  await page.getByRole("button", { name: "Upload new version" }).click();
  const upload = page.getByRole("dialog");
  await upload.getByLabel("PDF file").setInputFiles(pdfFile());
  await upload.getByRole("button", { name: "Upload", exact: true }).click();
  await expect(upload.getByRole("alert")).toHaveText(
    /Too many uploads\. Try again in \d+ minutes?\./,
  );

  const res = await page.request.post(`/api/syllabus/${id}/version`, {
    multipart: { file: pdfFile() },
  });
  expect(res.status()).toBe(429);
  expect(Number(res.headers()["retry-after"])).toBeGreaterThan(0);
});
