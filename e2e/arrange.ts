import type { Page } from "@playwright/test";
import { CURRENT_FORM17, checklistCriteria } from "@/lib/forms";
import { createDraft, ok, pdfFile, signIn, submit, uploadVersion } from "./helpers";
import type { Course, Person, World } from "./world";

// Multi-person arrangements through the real API routes, for states a spec
// isn't about. Statuses are never written directly, so the workflow stays
// the only thing that moves a syllabus. Each step signs in as its actor,
// so re-sign in afterwards before acting in the browser.

const CHAIN: Person[] = ["reviewer", "dean", "fdis", "citl", "vpaa"];

/** The lead's draft with one PDF version. Returns the syllabus id. */
export async function draftWithVersion(page: Page, world: World, course: Course) {
  await signIn(page, world.people.lead);
  const id = await createDraft(page, world, course);
  await uploadVersion(page, id);
  return id;
}

/** A draft with a version, submitted by the lead (now at stage 1). */
export async function submitted(page: Page, world: World, course: Course) {
  const id = await draftWithVersion(page, world, course);
  await submit(page, id);
  return id;
}

/** Answers every Form 17 criterion Yes as the signed-in stage reviewer. */
async function form17AllYes(page: Page, id: string) {
  const answers = checklistCriteria(CURRENT_FORM17).map((c) => ({
    criterion: c.key,
    answer: "yes",
  }));
  await ok(await page.request.put(`/api/syllabus/${id}/form17`, { data: { answers } }), "form 17");
}

async function decide(page: Page, id: string, decision: "approve" | "return") {
  await ok(
    await page.request.post(`/api/syllabus/${id}/review`, { data: { decision } }),
    decision,
  );
}

/**
 * Approves from the syllabus's current stage up to and including `through`
 * (1 to 5). Stage 1 fills Form 17 first.
 */
export async function approveThrough(page: Page, world: World, id: string, from: number, through: number) {
  for (let stage = from; stage <= through; stage++) {
    await signIn(page, world.people[CHAIN[stage - 1]]);
    if (stage === 1) await form17AllYes(page, id);
    await decide(page, id, "approve");
  }
}

/** Raises one Part A point at stage 1 or 2 and returns, as that stage's holder. */
export async function returnAt(page: Page, world: World, id: string, stage: 1 | 2, point: string) {
  await signIn(page, world.people[CHAIN[stage - 1]]);
  await ok(
    await page.request.post(`/api/syllabus/${id}/form18`, { data: { review_point: point } }),
    "add point",
  );
  await decide(page, id, "return");
}

/** As the lead: uploads a revision, answers every open point, resubmits. */
export async function reviseAndResubmit(page: Page, world: World, id: string) {
  await signIn(page, world.people.lead);
  await uploadVersion(page, id);
  const { points } = await ok<{ points: { id: string; status: string }[] }>(
    await page.request.get(`/api/syllabus/${id}/form18`),
    "form 18",
  );
  for (const point of points.filter((p) => p.status === "open")) {
    await ok(
      await page.request.patch(`/api/syllabus/${id}/form18/${point.id}`, {
        data: { action: "respond", action_taken: "Revised as asked.", page_number: "1" },
      }),
      "respond",
    );
  }
  await ok(await page.request.post(`/api/syllabus/${id}/resubmit`), "resubmit");
}

/** As the lead: uploads the signed scan of an approved syllabus (now filed). */
export async function fileSignedCopy(page: Page, world: World, id: string) {
  await signIn(page, world.people.lead);
  await ok(
    await page.request.post(`/api/syllabus/${id}/signed-copy`, {
      multipart: { file: pdfFile("signed.pdf") },
    }),
    "file signed copy",
  );
}
