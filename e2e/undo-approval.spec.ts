import { addCourse, approveThrough, submitted } from "./arrange";
import { expect, test } from "./fixtures";
import type { Page } from "@playwright/test";
import { adminPb, approveInUi, auditFor, getSyllabus, ok, signIn } from "./helpers";

// An admin takes back the latest approval, one stage at a time, with a
// required reason. The original approval stays on the timeline, the undo
// follows it, the stage decides again and gets the same approval code.

type Entry = { kind: string; stage: number; approval_code: string; reason: string };

async function timelineOf(page: Page, id: string) {
  return (await ok<{ items: Entry[] }>(await page.request.get(`/api/syllabus/${id}/timeline`), "timeline")).items;
}

/** Undoes the latest approval through the syllabus page's dialog. */
async function undoInUi(page: Page, id: string, role: string, reason: string) {
  await page.goto(`/syllabus/${id}`);
  await page.getByRole("button", { name: `Undo ${role} approval` }).click();
  const dialog = page.getByRole("dialog");
  const confirm = dialog.getByRole("button", { name: "Undo approval" });
  await expect(confirm).toBeDisabled();
  await dialog.getByLabel("Reason (required)").fill("too short");
  await expect(confirm).toBeDisabled();
  await dialog.getByLabel("Reason (required)").fill(reason);
  await confirm.click();
  await expect(dialog).toHaveCount(0);
}

test("an admin undoes the dean's then the program reviewer's approval, one stage at a time @UND-01", async ({ page, world }) => {
  const id = await submitted(page, world, await addCourse(world));
  await approveThrough(page, world, id, 1, 2);

  await signIn(page, world.people.admin);
  const s1Code = (await timelineOf(page, id)).find((e) => e.kind === "approved" && e.stage === 1)!.approval_code;
  expect(s1Code).toMatch(/^SYL-\S+-S1$/);

  const deanReason = "Dean approved the wrong version by mistake.";
  await undoInUi(page, id, "Dean", deanReason);
  await expect.poll(async () => getSyllabus(page, id)).toMatchObject({ status: "submitted", stage: 2 });

  const timeline = page.locator("section").filter({ has: page.getByRole("heading", { name: "Timeline" }) });
  await expect(timeline).toContainText("Approval undone at stage 2 (Dean) by E2E Admin");
  await expect(timeline).toContainText(`Reason: ${deanReason}`);
  await expect(timeline).toContainText("Approved at stage 2 (Dean)");
  await expect(timeline).toContainText("Waiting on Dean (stage 2)");

  const reviewerReason = "Program reviewer asked to re-check Form 17.";
  await undoInUi(page, id, "Program Reviewer", reviewerReason);
  await expect.poll(async () => getSyllabus(page, id)).toMatchObject({ status: "submitted", stage: 1 });
  // Nothing left to undo at stage 1.
  await expect(page.getByRole("button", { name: /^Undo .* approval$/ })).toHaveCount(0);
  // An undone code no longer verifies.
  await page.goto(`/verify/${encodeURIComponent(s1Code)}`);
  await expect(page.locator("main")).toContainText("No approval matches this code.");

  // Plain chronological order: each undo right after the approval it took back.
  expect((await timelineOf(page, id)).map((e) => `${e.kind}@${e.stage}`)).toEqual([
    "created@0",
    "uploaded@0",
    "submitted@1",
    "approved@1",
    "approved@2",
    "approval_undone@2",
    "approval_undone@1",
  ]);
  expect((await auditFor(page, id)).filter((a) => a.action === "approval_undone")).toEqual([
    expect.objectContaining({ override: true, reason: reviewerReason }),
    expect.objectContaining({ override: true, reason: deanReason }),
  ]);

  // The lead and each undone stage's reviewer were told why.
  const pb = await adminPb();
  const notices = await pb.collection("notifications").getFullList<{ user: string; stage: number; body: string }>({
    filter: pb.filter("syllabus = {:id} && kind = 'approval_undone'", { id }),
    sort: "stage",
  });
  expect(notices.map((n) => [n.user, n.stage]).sort()).toEqual(
    [
      [world.people.reviewer.id, 1],
      [world.people.lead.id, 1],
      [world.people.dean.id, 2],
      [world.people.lead.id, 2],
    ].sort(),
  );
  expect(notices.find((n) => n.stage === 2)!.body).toContain(deanReason);

  // Stage 1 decides again, in the UI, and gets the same code back.
  await signIn(page, world.people.reviewer);
  await approveInUi(page, id);
  expect(await getSyllabus(page, id)).toMatchObject({ status: "submitted", stage: 2 });
  const reapproved = (await timelineOf(page, id)).filter((e) => e.kind === "approved" && e.stage === 1);
  expect(reapproved.map((e) => e.approval_code)).toEqual([s1Code, s1Code]);
  await page.goto(`/verify/${encodeURIComponent(s1Code)}`);
  await expect(page.locator("main")).toContainText("Valid approval");
  await expect(page.locator("main")).toContainText(world.people.reviewer.name);
});

test("an admin undoes the final approval; the VPAA approves again @UND-02", async ({ page, world }) => {
  const id = await submitted(page, world, await addCourse(world));
  await approveThrough(page, world, id, 1, 5);

  await signIn(page, world.people.admin);
  await undoInUi(page, id, "VPAA", "Signed before the CITL comments were settled.");
  await expect.poll(async () => getSyllabus(page, id)).toMatchObject({ status: "submitted", stage: 5 });

  await approveThrough(page, world, id, 5, 5);
  await signIn(page, world.people.admin);
  expect(await getSyllabus(page, id)).toMatchObject({ status: "approved", stage: 5 });
});

test("only an admin is offered undo; others are refused @UND-03", async ({ page, world }) => {
  const id = await submitted(page, world, await addCourse(world));
  await approveThrough(page, world, id, 1, 1);

  for (const person of [world.people.vpaa, world.people.dean, world.people.lead]) {
    await signIn(page, person);
    await page.goto(`/syllabus/${id}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Undo .* approval$/ })).toHaveCount(0);
    const res = await page.request.post(`/api/syllabus/${id}/undo-approval`, {
      data: { reason: "I would like to undo this." },
    });
    expect(res.status(), person.email).toBe(403);
  }

  await signIn(page, world.people.admin);
  expect(await getSyllabus(page, id)).toMatchObject({ status: "submitted", stage: 2 });
});
