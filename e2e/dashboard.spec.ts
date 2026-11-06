import type { Page } from "@playwright/test";
import { addCourse, draftWithVersion, prospectusFor, schoolYearWithTerm, submitted } from "./arrange";
import { expect, test } from "./fixtures";
import { adminPb, ok, signIn } from "./helpers";
import { createWorld, type World } from "./world";

// Dashboards (walkthrough Part 9): who sees what, scope filters, CSV
// exports, and the overdue indicators, which never block anything.

let other: Promise<World> | undefined;
const otherWorld = () => (other ??= createWorld("dsh-other"));

/** Names behind a world's program, as the completion table shows them. */
async function namesOf(world: World) {
  const pb = await adminPb();
  const program = await pb.collection("programs").getOne(world.program.id, { expand: "department.college" });
  const department = program.expand!.department;
  return {
    program: world.program.name,
    department: department.name as string,
    departmentId: department.id as string,
    college: department.expand.college.name as string,
    collegeId: department.expand.college.id as string,
  };
}

/** Opens the dashboard on a term, chosen by id (labels carry " (open)"). */
async function openDashboard(page: Page, term: string) {
  await page.goto("/dashboard");
  const loaded = page.waitForResponse((r) => r.url().includes("/api/dashboard/summary") && r.url().includes(`term=${term}`) && r.ok());
  await page.getByLabel("Term").selectOption(term);
  await loaded;
  await expect(completion(page).locator("tbody.opacity-50")).toHaveCount(0);
}

const completion = (page: Page) => page.getByRole("region", { name: "Completion" });

/** The completion row for one program, from the summary API. */
async function completionRow(page: Page, term: string, program: string) {
  const data = await ok<{ completion: { level: string; id: string; overdueSubmission: number; overdueReview: number }[] }>(
    await page.request.get(`/api/dashboard/summary?term=${term}&program=${program}`),
    "summary",
  );
  return data.completion.find((r) => r.level === "program" && r.id === program)!;
}

const HEADERS: Record<string, string> = {
  completion: "Level,Name,Expected,Filed,Completion %,Overdue submission,Overdue review",
  syllabi: "Program,Course code,Course title,Lead,Status,Stage",
  "signed-copies": "Program,Course code,Course title,Lead,Approved (PHT),Days waiting",
  justifications: "Program,Course code,Course title,Lead,Syllabus status,Justification",
};

test("the VPAA sees every panel, and every export is a CSV with its header @DSH-01", async ({ page, world }) => {
  await signIn(page, world.people.vpaa);
  await openDashboard(page, world.term.id);
  for (const panel of ["By stage", "Completion", "Awaiting signed copy", "Justifications"]) {
    await expect(page.getByRole("region", { name: panel })).toBeVisible();
  }

  const links = page.getByRole("link", { name: /^(Export CSV|Download .* as CSV)/ });
  const hrefs = await links.evaluateAll((as) => as.map((a) => a.getAttribute("href")!));
  expect(hrefs.length).toBeGreaterThanOrEqual(10);
  for (const href of new Set(hrefs)) {
    const res = await page.request.get(href);
    expect(res.status(), href).toBe(200);
    expect(res.headers()["content-type"], href).toContain("text/csv");
    const view = new URL(href, "http://x").searchParams.get("view")!;
    const firstLine = (await res.text()).replace(/^﻿/, "").split("\r\n")[0];
    expect(firstLine.startsWith(HEADERS[view]), `${href}: ${firstLine}`).toBe(true);
  }
});

test("a dean, head and chair each see only their scope; heads and chairs get no justifications @DSH-02", async ({
  page,
  world,
}) => {
  const mine = await namesOf(world);
  const theirs = await namesOf(await otherWorld());

  await signIn(page, world.people.dean);
  await openDashboard(page, world.term.id);
  await expect(completion(page)).toContainText(mine.college);
  await expect(completion(page)).not.toContainText(theirs.college);
  await expect(page.getByRole("region", { name: "Justifications" })).toBeVisible();

  await signIn(page, world.people.head);
  await openDashboard(page, world.term.id);
  await expect(completion(page)).toContainText(mine.department);
  await expect(completion(page)).not.toContainText(theirs.department);
  await expect(page.getByRole("region", { name: "Justifications" })).toHaveCount(0);

  await signIn(page, world.people.chair);
  await openDashboard(page, world.term.id);
  await expect(completion(page)).toContainText(mine.program);
  await expect(completion(page)).not.toContainText(theirs.program);
  await expect(page.getByRole("region", { name: "Justifications" })).toHaveCount(0);
  const justifications = await page.request.get(`/api/dashboard/justifications?term=${world.term.id}`);
  expect(justifications.status()).toBe(403);
});

test("faculty have no dashboard @DSH-03", async ({ page, world }) => {
  await signIn(page, world.people.lead);
  await page.goto("/dashboard");
  await expect(page.getByText("No dashboard for your roles.")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Dashboard" })).toHaveCount(0);
  expect((await page.request.get(`/api/dashboard/summary?term=${world.term.id}`)).status()).toBe(403);
});

test("the college and department filters narrow every panel @DSH-04", async ({ page, world }) => {
  const mine = await namesOf(world);
  const theirs = await namesOf(await otherWorld());
  // A second department with a program, so this college has a department to choose.
  const pb = await adminPb();
  const second = await pb.collection("departments").create({ name: `${mine.department} Annex`, college: mine.collegeId });
  await pb.collection("programs").create({
    name: `${world.program.name} Annex`,
    code: `${world.program.code}AX`.slice(0, 20),
    department: second.id,
  });

  await signIn(page, world.people.vpaa);
  await openDashboard(page, world.term.id);
  await expect(completion(page)).toContainText(theirs.college);

  let filtered = page.waitForResponse((r) => r.url().includes("/api/dashboard/summary") && r.url().includes(`college=${mine.collegeId}`));
  await page.getByLabel("College", { exact: true }).selectOption(mine.collegeId);
  await filtered;
  await expect(completion(page)).toContainText(mine.college);
  await expect(completion(page)).not.toContainText(theirs.college);
  await expect(completion(page)).toContainText(`${mine.department} Annex`);

  filtered = page.waitForResponse((r) => r.url().includes("/api/dashboard/summary") && r.url().includes(`department=${mine.departmentId}`));
  await page.getByLabel("Department", { exact: true }).selectOption(mine.departmentId);
  await filtered;
  await expect(completion(page)).toContainText(mine.department);
  await expect(completion(page)).not.toContainText(`${mine.department} Annex`);

  // A college with a single department offers no department filter.
  await page.getByLabel("College", { exact: true }).selectOption(theirs.collegeId);
  await expect(page.getByLabel("Department", { exact: true })).toHaveCount(0);
});

test("a syllabus waiting past the review limit is flagged overdue for review @DSH-05", async ({ page, world }) => {
  const year = await schoolYearWithTerm();
  const pb = await adminPb();
  await pb.collection("terms").update(year.term, { review_days: 1 });
  const course = await addCourse(world);
  await prospectusFor(world, year.schoolYear, [course.id], true);
  const id = await submitted(page, world, course, year.term);
  // Pretend it has waited three days at stage 1.
  const threeDaysAgo = new Date(Date.now() - 3 * 86_400_000).toISOString().replace("T", " ");
  await pb.collection("syllabi").update(id, { status_changed_at: threeDaysAgo });

  await signIn(page, world.people.dean);
  expect((await completionRow(page, year.term, world.program.id)).overdueReview).toBe(1);
  await openDashboard(page, year.term);
  const tile = page.getByRole("region", { name: "By stage" }).getByRole("listitem").filter({ hasText: "Overdue for review" });
  await expect(tile).toContainText("1");

  // The reviewer's queue shows it too; nothing is blocked.
  await signIn(page, world.people.reviewer);
  await page.goto("/review");
  await expect(page.getByRole("row", { name: new RegExp(course.code) })).toContainText(/Overdue \d+ days?/);
});

test("past the submission deadline, missing, draft-only and referenced-draft courses are overdue @DSH-06", async ({
  page,
  world,
}) => {
  const them = await otherWorld();
  const year = await schoolYearWithTerm();
  const pb = await adminPb();
  // Yesterday in Philippine time.
  const yesterday = new Date(Date.now() + 8 * 3_600_000 - 86_400_000).toISOString().slice(0, 10);
  await pb.collection("terms").update(year.term, { submission_deadline: yesterday });

  const [none, draft, inReview, referenced] = [
    await addCourse(world),
    await addCourse(world),
    await addCourse(world),
    await addCourse(world),
  ];
  await prospectusFor(world, year.schoolYear, [none.id, draft.id, inReview.id, referenced.id], true);
  await prospectusFor(them, year.schoolYear, [referenced.id], true);

  // Deadline already past: create the drafts and submission as of before it.
  await pb.collection("terms").update(year.term, { submission_deadline: "" });
  await draftWithVersion(page, world, draft, year.term);
  const source = await draftWithVersion(page, world, referenced, year.term);
  await submitted(page, world, inReview, year.term);
  await signIn(page, them.people.chair);
  await ok(
    await page.request.post("/api/syllabus-reference", { data: { syllabus: source, program: them.program.id } }),
    "reference a draft",
  );
  await pb.collection("terms").update(year.term, { submission_deadline: yesterday });

  await signIn(page, world.people.vpaa);
  // This program: the course with no syllabus and its two drafts.
  expect((await completionRow(page, year.term, world.program.id)).overdueSubmission).toBe(3);
  // The referencing program: its reference points at a draft.
  expect((await completionRow(page, year.term, them.program.id)).overdueSubmission).toBe(1);

  await openDashboard(page, year.term);
  const tile = page.getByRole("region", { name: "By stage" }).getByRole("listitem").filter({ hasText: "Overdue for submission" });
  await expect(tile).toContainText(/[1-9]/);
});
