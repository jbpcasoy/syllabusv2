import type { Page } from "@playwright/test";
import { addCourse, approveThrough, draftWithVersion, returnAt, reviseAndResubmit, submitted } from "./arrange";
import { expect, test } from "./fixtures";
import { adminPb, createUser, escapeRegExp, ok, signIn, submit } from "./helpers";
import { inbox, linkIn, waitForMail } from "./mail";
import type { PersonRecord } from "./seed";
import type { World } from "./world";
import { APP_URL } from "./env";

// In-app notifications and the email outbox (walkthrough Parts 5 and 9).
// Emails go out from the once-a-minute PocketBase cron, so the email tests
// wait up to a few minutes.

/** The signed-in user's unread count, as the bell reads it. */
async function unread(page: Page) {
  const res = await ok<{ unread_count: number }>(
    await page.request.get("/api/notification?page=1&perPage=1&unread=true"),
    "unread count",
  );
  return res.unread_count;
}

async function unreadOf(page: Page, person: PersonRecord) {
  await signIn(page, person);
  return unread(page);
}

/** The bell's accessible name, on any page. */
async function bellLabel(page: Page) {
  await page.goto("/syllabus");
  const bell = page.getByRole("button", { name: /^Notifications(, \d+ unread)?$/ });
  await expect(bell).toBeVisible();
  return bell.getAttribute("aria-label");
}

/** The outbox row for one recipient, syllabus and kind. */
async function outboxRow(recipient: string, syllabus: string, kind: string) {
  const pb = await adminPb();
  const rows = await pb.collection("notifications").getFullList({
    filter: pb.filter("user = {:r} && syllabus = {:s} && kind = {:k}", { r: recipient, s: syllabus, k: kind }),
  });
  return rows[0];
}

test("each transition adds one unread notification for each recipient @NOT-01", async ({ page, world }) => {
  const course = await addCourse(world);
  const before = {
    reviewer: await unreadOf(page, world.people.reviewer),
    lead: await unreadOf(page, world.people.lead),
    dean: await unreadOf(page, world.people.dean),
  };

  const id = await submitted(page, world, course);
  expect(await unreadOf(page, world.people.reviewer)).toBe(before.reviewer + 1);
  expect(await bellLabel(page)).toBe(`Notifications, ${before.reviewer + 1} unread`);

  await returnAt(page, world, id, 1, "Add the class schedule.");
  expect(await unreadOf(page, world.people.lead)).toBe(before.lead + 1);

  await reviseAndResubmit(page, world, id);
  expect(await unreadOf(page, world.people.reviewer)).toBe(before.reviewer + 2);

  const [point] = (await (await page.request.get(`/api/syllabus/${id}/form18`)).json()).points as { id: string }[];
  await signIn(page, world.people.reviewer);
  await page.request.patch(`/api/syllabus/${id}/form18/${point.id}`, { data: { action: "judge", status: "resolved" } });
  await approveThrough(page, world, id, 1, 1);
  // An approval tells the next stage and the lead.
  expect(await unreadOf(page, world.people.dean)).toBe(before.dean + 1);
  expect(await unreadOf(page, world.people.lead)).toBe(before.lead + 2);
});

test("the notifications page opens a notification, marks one read, and marks all read @NOT-02", async ({
  page,
  world,
}) => {
  const course = await addCourse(world);
  const id = await submitted(page, world, course);
  await approveThrough(page, world, id, 1, 1);
  await returnAt(page, world, id, 2, "Add consultation hours.");

  await signIn(page, world.people.lead);
  await page.goto("/notifications");
  const tag = `${course.code} (${world.program.code})`;
  const returned = page.getByRole("link", { name: `${tag} was returned for revision` });
  const approved = page.getByRole("link", { name: new RegExp(`^${escapeRegExp(tag)} was approved by the`) });
  await expect(returned).toHaveAttribute("href", `/syllabus/${id}/revise`);
  await expect(approved).toBeVisible();

  const start = await unread(page);
  const item = (link: typeof approved) => page.getByRole("listitem").filter({ has: link });
  await item(approved).getByRole("button", { name: "Mark read" }).click();
  await expect(item(approved).getByRole("button", { name: "Mark unread" })).toBeVisible();
  expect(await unread(page)).toBe(start - 1);

  await page.getByRole("button", { name: "Mark all read" }).first().click();
  await expect.poll(() => unread(page)).toBe(0);
  await expect(page.getByRole("button", { name: "Mark all read" }).first()).toBeDisabled();
  expect(await bellLabel(page)).toBe("Notifications");

  await page.goto("/notifications");
  await returned.click();
  await expect(page).toHaveURL(`/syllabus/${id}/revise`);
  await expect(page.getByRole("button", { name: "Upload revision" })).toBeVisible();
});

test("a stand-in hears only once their stage is waiting @NOT-03", async ({ page, world }) => {
  // Conflict the dean (stage 2) and name the head before stage 1 is done.
  const pb = await adminPb();
  await pb.collection("faculties").create({ user: world.people.dean.id, program: world.program.id, active: true });
  const course = await addCourse(world);
  const id = await draftWithVersion(page, world, course);
  await ok(await page.request.patch(`/api/syllabus/${id}`, { data: { co_authors: [world.people.dean.id] } }), "co-author");
  await submit(page, id);

  const before = await unreadOf(page, world.people.head);
  await signIn(page, world.people.fdis);
  await ok(
    await page.request.put(`/api/syllabus/${id}/stand-in`, { data: { stage: 2, user: world.people.head.id } }),
    "name stand-in",
  );
  expect(await unreadOf(page, world.people.head)).toBe(before);

  await approveThrough(page, world, id, 1, 1);
  expect(await unreadOf(page, world.people.head)).toBe(before + 1);
  await page.goto("/notifications");
  await expect(page.getByRole("link", { name: `${course.code} (${world.program.code}) is waiting for your review` })).toHaveAttribute(
    "href",
    new RegExp(`/syllabus/${id}`),
  );
});

test("a return emails the lead with an absolute link, and the row ends sent @NOT-04", async ({ page, world }) => {
  test.setTimeout(180_000);
  const course = await addCourse(world);
  const id = await submitted(page, world, course);
  await returnAt(page, world, id, 1, "Add the course policies.");

  const subject = new RegExp(`${escapeRegExp(course.code)}.*was returned for revision`);
  const mail = await waitForMail(world.people.lead.email, { subject, timeout: 120_000 });
  expect(mail.text + mail.html).toContain(course.title);
  const link = linkIn(mail, new RegExp(`/syllabus/${id}`));
  expect(link.startsWith(`${APP_URL}/`)).toBe(true);

  await signIn(page, world.people.lead);
  await page.goto(link);
  await expect(page).toHaveURL(new RegExp(`/syllabus/${id}`));

  const row = await outboxRow(world.people.lead.id, id, "returned");
  expect(row.email_status).toBe("sent");
});

test("an unverified recipient's notification is skipped, with no email @NOT-05", async ({ page, world }) => {
  test.setTimeout(180_000);
  const pb = await adminPb();
  const course = await addCourse(world);
  const id = await draftWithVersion(page, world, course);
  try {
    await pb.collection("users").update(world.people.reviewer.id, { verified: false });
    await submit(page, id);
    await expect
      .poll(async () => (await outboxRow(world.people.reviewer.id, id, "review_requested"))?.email_status, {
        timeout: 120_000,
        intervals: [5_000],
      })
      .toBe("skipped");
    expect(inbox(world.people.reviewer.email).filter((m) => m.subject.includes(course.code))).toEqual([]);
  } finally {
    await pb.collection("users").update(world.people.reviewer.id, { verified: true });
  }
});

/** A faculty member whose mailbox refuses mail (see mail-catcher.ts). */
async function bouncingFaculty(world: World): Promise<PersonRecord> {
  const pb = await adminPb();
  const stamp = Date.now().toString(36);
  const person = await createUser(pb, { name: `Bounce Lead ${stamp}`, email: `e2e.bounce.${stamp}@buksu.edu.ph` });
  await pb.collection("faculties").create({ user: person.id, program: world.program.id, active: true });
  return person;
}

test("a refused delivery is retried, ends failed, and still shows in the app @NOT-06", async ({ page, world }) => {
  test.setTimeout(330_000);
  const lead = await bouncingFaculty(world);
  const id = await draftWithVersion(page, world, await addCourse(world), world.term.id, lead);
  await submit(page, id);
  await returnAt(page, world, id, 1, "Add learning resources.");

  await expect
    .poll(
      async () => {
        const row = await outboxRow(lead.id, id, "returned");
        return row ? `${row.email_status}/${row.email_attempts}` : "none";
      },
      { timeout: 300_000, intervals: [10_000] },
    )
    .toBe("failed/3");

  await signIn(page, lead);
  expect(await unread(page)).toBeGreaterThanOrEqual(1);
  expect(await bellLabel(page)).toMatch(/^Notifications, \d+ unread$/);
});
