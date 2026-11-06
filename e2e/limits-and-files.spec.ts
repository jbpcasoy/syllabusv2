import type { Response } from "@playwright/test";
import { addCourse, approveThrough, fileSignedCopy, submitted } from "./arrange";
import { expect, test } from "./fixtures";
import { signIn } from "./helpers";

// Files are served only through routes that check access, and storage
// URLs never reach the browser (walkthrough Part 10). The upload limit is
// 04-upload-limit.spec.ts.

/** Anything that looks like a direct PocketBase or S3 file URL. */
const STORAGE_URL = /\/api\/files\/|127\.0\.0\.1:8099|localhost:8099|amazonaws\.com|s3[.-][a-z0-9-]+\./i;

test("no page or response leaks a storage URL, and files 404 without access @LIM-02", async ({ page, world }) => {
  const id = await submitted(page, world, await addCourse(world));
  await approveThrough(page, world, id, 1, 5);
  await fileSignedCopy(page, world, id);

  // Everything the browser receives while the lead opens the syllabus.
  const bodies: { url: string; body: string }[] = [];
  const pending: Promise<void>[] = [];
  page.on("response", (response: Response) => {
    const type = response.headers()["content-type"] ?? "";
    if (!/json|html|text|javascript/.test(type)) return;
    pending.push(
      response
        .text()
        .then((body) => void bodies.push({ url: response.url(), body }))
        .catch(() => undefined),
    );
  });
  await signIn(page, world.people.lead);
  await page.goto(`/syllabus/${id}`);
  await expect(page.getByText("Filed: the signed copy is on record.")).toBeVisible();
  await page.waitForLoadState("networkidle");
  await Promise.all(pending);

  expect(bodies.length).toBeGreaterThan(3);
  for (const { url, body } of bodies) {
    expect(body.match(STORAGE_URL)?.[0] ?? null, url).toBeNull();
  }

  // The scoped routes the page links to: a syllabus PDF and the signed scan.
  const links = await page
    .getByRole("link", { name: "View PDF" })
    .evaluateAll((as) => as.map((a) => a.getAttribute("href")!));
  expect(links.some((l) => l.includes("/version/"))).toBe(true);
  expect(links.some((l) => l.includes("/signed-copy/"))).toBe(true);
  for (const href of links) {
    expect((await page.request.get(href)).status(), href).toBe(200);
  }

  // Someone with no relationship to the syllabus gets 404 for each.
  await signIn(page, world.people.head);
  for (const href of links) {
    expect((await page.request.get(href)).status(), href).toBe(404);
  }
});
