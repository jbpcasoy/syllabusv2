import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { adminPb, alerts, createUser, pickUser, signIn } from "./helpers";
import type { PersonRecord } from "./seed";
import { createWorld, type World } from "./world";

// Program membership: the chair adds faculty, and users ask to join
// (walkthrough Parts 2 and 3).

let other: Promise<World> | undefined;
const otherWorld = () => (other ??= createWorld("mem-other"));
const stamp = () => Date.now().toString(36);
const dialogOf = (page: Page) => page.getByRole("dialog");

async function freshUser(label: string): Promise<PersonRecord> {
  return createUser(await adminPb(), {
    name: `Mem ${label} ${stamp()}`,
    email: `e2e.mem.${label.toLowerCase()}.${stamp()}@buksu.edu.ph`,
  });
}

/** As whoever is signed in: asks to join `program` from the join-request page. */
async function requestToJoin(page: Page, program: string, note = "") {
  await page.goto("/program-join-request");
  await page.getByRole("button", { name: "Request to join" }).click();
  const dialog = dialogOf(page);
  await dialog.getByLabel("Program").selectOption(program);
  if (note) await dialog.getByLabel(/^Note/).fill(note);
  await dialog.getByRole("button", { name: "Send request" }).click();
  return dialog;
}

/** The join-request row for `person`. */
const requestRow = (page: Page, person: PersonRecord) =>
  page.getByRole("row", { name: new RegExp(person.email.replace(/\./g, "\\.")) });

async function isFaculty(user: string, program: string) {
  const pb = await adminPb();
  const rows = await pb
    .collection("faculties")
    .getFullList({ filter: pb.filter("user = {:u} && program = {:p}", { u: user, p: program }) });
  return rows.map((r) => r.active as boolean);
}

test("a chair adds faculty to their own program only @MEM-01", async ({ page, world }) => {
  const newcomer = await freshUser("Newcomer");
  const theirs = await otherWorld();

  await signIn(page, world.people.chair);
  await page.goto("/faculty");
  await page.getByRole("button", { name: "Add faculty" }).click();
  const dialog = dialogOf(page);
  await pickUser(page, dialog, newcomer);
  await dialog.getByLabel("Program").selectOption(world.program.id);
  await dialog.getByRole("button", { name: "Add", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await page.getByLabel("Search faculty").fill(newcomer.name);
  await expect(page.getByRole("row", { name: new RegExp(newcomer.name) })).toBeVisible();
  expect(await isFaculty(newcomer.id, world.program.id)).toEqual([true]);

  const outsider = await freshUser("Outsider");
  const refused = await page.request.post("/api/faculty", { data: { user: outsider.id, program: theirs.program.id } });
  expect(refused.status()).toBe(403);
});

test("a user asks to join with a note, can't ask twice, withdraws and asks again @MEM-02", async ({
  page,
  world,
}) => {
  const user = await freshUser("Joiner");
  await signIn(page, user);

  let dialog = await requestToJoin(page, world.program.id, "I teach IT 101 this term.");
  await expect(dialog).toHaveCount(0);
  const row = requestRow(page, user);
  await expect(row).toContainText("Pending");
  await expect(row).toContainText("I teach IT 101 this term.");

  dialog = await requestToJoin(page, world.program.id);
  await expect(alerts(dialog)).toHaveText("You already have a pending request for this program");
  await dialog.getByRole("button", { name: "Cancel" }).click();

  await row.getByRole("button", { name: "Withdraw" }).click();
  await dialogOf(page).getByRole("button", { name: "Withdraw", exact: true }).click();
  await expect(dialogOf(page)).toHaveCount(0);
  await expect(row).toHaveCount(0);

  dialog = await requestToJoin(page, world.program.id);
  await expect(dialog).toHaveCount(0);
  await expect(row).toContainText("Pending");
});

test("the chair rejects with a required reason, which the requester sees @MEM-03", async ({ page, world }) => {
  const user = await freshUser("Rejected");
  const reason = "Please ask your department head to confirm your load first.";
  await signIn(page, user);
  await requestToJoin(page, world.program.id);

  await signIn(page, world.people.chair);
  await page.goto("/program-join-request");
  await requestRow(page, user).getByRole("button", { name: "Reject" }).click();
  const dialog = dialogOf(page);
  await dialog.getByRole("button", { name: "Reject", exact: true }).click();
  await expect(alerts(dialog)).toHaveText("Give a reason so the requester knows why.");
  await dialog.getByLabel("Reason").fill(reason);
  await dialog.getByRole("button", { name: "Reject", exact: true }).click();
  await expect(dialog).toHaveCount(0);

  await signIn(page, user);
  await page.goto("/program-join-request");
  await expect(requestRow(page, user)).toContainText("Rejected");
  await expect(requestRow(page, user)).toContainText(reason);
  expect(await isFaculty(user.id, world.program.id)).toEqual([]);
});

test("approving adds faculty, and reactivates an inactive faculty record @MEM-04", async ({ page, world }) => {
  const user = await freshUser("Approved");
  const approve = async () => {
    await signIn(page, world.people.chair);
    await page.goto("/program-join-request");
    const row = requestRow(page, user).filter({ hasText: "Pending" });
    await row.getByRole("button", { name: "Approve" }).click();
    await expect(row).toHaveCount(0);
  };

  await signIn(page, user);
  await requestToJoin(page, world.program.id);
  await approve();
  expect(await isFaculty(user.id, world.program.id)).toEqual([true]);
  await page.goto("/faculty");
  await page.getByLabel("Search faculty").fill(user.name);
  const facultyRow = page.getByRole("row", { name: new RegExp(user.name) });
  await expect(facultyRow).toBeVisible();

  // The chair deactivates them; a new approved request reactivates the same record.
  await facultyRow.getByRole("button", { name: "Deactivate" }).click();
  await expect(facultyRow.getByRole("button", { name: "Activate" })).toBeVisible();
  await expect.poll(() => isFaculty(user.id, world.program.id)).toEqual([false]);

  await signIn(page, user);
  await requestToJoin(page, world.program.id);
  await approve();
  expect(await isFaculty(user.id, world.program.id)).toEqual([true]);
});

test("nobody decides their own request, except a head who chairs the program, who may only approve @MEM-05", async ({
  page,
  world,
}) => {
  // A requester sees only Withdraw on their own row.
  const user = await freshUser("Self");
  await signIn(page, user);
  await requestToJoin(page, world.program.id);
  const own = requestRow(page, user);
  await expect(own.getByRole("button", { name: "Withdraw" })).toBeVisible();
  await expect(own.getByRole("button", { name: "Approve" })).toHaveCount(0);
  await expect(own.getByRole("button", { name: "Reject" })).toHaveCount(0);

  // The department head also chairs a program in their department.
  const pb = await adminPb();
  const department = (await pb.collection("programs").getOne(world.program.id)).department as string;
  const program = await pb.collection("programs").create({
    name: `Mem Head Program ${stamp()}`,
    code: `MH${stamp()}`.toUpperCase().slice(0, 10),
    department,
  });
  await pb.collection("program_chairs").create({ user: world.people.head.id, program: program.id, active: true });

  await signIn(page, world.people.head);
  await requestToJoin(page, program.id);
  const headRow = requestRow(page, world.people.head).filter({ hasText: "Pending" });
  await expect(headRow.getByRole("button", { name: "Reject" })).toHaveCount(0);
  const decided = page.waitForResponse((r) => r.request().method() === "PATCH" && r.url().includes("/api/program-join-request/"));
  await headRow.getByRole("button", { name: "Approve" }).click();
  const response = await decided;
  expect(response.status(), await response.text()).toBe(200);
  // The list shows pending requests to a reviewer by default, so it leaves.
  await expect(requestRow(page, world.people.head)).toHaveCount(0);
  await page.getByLabel("Filter by status").selectOption("approved");
  await expect(requestRow(page, world.people.head)).toContainText("Approved");
  expect(await isFaculty(world.people.head.id, program.id)).toEqual([true]);
});
