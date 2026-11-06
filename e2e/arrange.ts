import type { Page } from "@playwright/test";
import { CURRENT_FORM17, checklistCriteria } from "@/lib/forms";
import { adminPb, createDraft, ok, pdfFile, signIn, submit, uploadVersion } from "./helpers";
import type { Course, Person, World } from "./world";

// Multi-person arrangements through the real API routes, for states a spec
// isn't about. Statuses are never written directly, so the workflow stays
// the only thing that moves a syllabus. Each step signs in as its actor,
// so re-sign in afterwards before acting in the browser.

const CHAIN: Person[] = ["reviewer", "dean", "fdis", "citl", "vpaa"];

/** The lead's draft with one PDF version (world's term unless given). Returns the syllabus id. */
export async function draftWithVersion(page: Page, world: World, course: Course, term = world.term.id) {
  await signIn(page, world.people.lead);
  const id = await createDraft(page, world, course, term);
  await uploadVersion(page, id);
  return id;
}

/** A draft with a version, submitted by the lead (now at stage 1). */
export async function submitted(page: Page, world: World, course: Course, term = world.term.id) {
  const id = await draftWithVersion(page, world, course, term);
  await submit(page, id);
  return id;
}

/**
 * The program reviewer co-authors the lead's syllabus, so after submit
 * stage 1 waits for a proxy; the dean names the co-author as proxy.
 */
export async function submittedWithProxy(page: Page, world: World, course: Course) {
  const id = await draftWithVersion(page, world, course);
  await ok(
    await page.request.patch(`/api/syllabus/${id}`, {
      data: { co_authors: [world.people.reviewer.id] },
    }),
    "add co-author",
  );
  await submit(page, id);
  await signIn(page, world.people.dean);
  await ok(
    await page.request.put(`/api/syllabus/${id}/stand-in`, {
      data: { stage: 1, user: world.people.coAuthor.id },
    }),
    "name proxy",
  );
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

/**
 * Raises one point and returns, as that stage's holder. Stages 3 to 5 are
 * Part B and need a legend code (default B.2).
 */
export async function returnAt(page: Page, world: World, id: string, stage: number, point: string, code = "B.2") {
  await signIn(page, world.people[CHAIN[stage - 1]]);
  await ok(
    await page.request.post(`/api/syllabus/${id}/form18`, {
      data: { review_point: point, ...(stage >= 3 && { code }) },
    }),
    "add point",
  );
  await decide(page, id, "return");
}

export interface Point {
  id: string;
  stage: number;
  status: "open" | "responded" | "resolved" | "unresolved";
  review_point: string;
}

/** Every Form 18-1 point, as whoever is signed in. */
export async function points(page: Page, id: string) {
  return (await ok<{ points: Point[] }>(await page.request.get(`/api/syllabus/${id}/form18`), "form 18")).points;
}

/** As the lead: uploads a revision, answers every open point, resubmits. */
export async function reviseAndResubmit(page: Page, world: World, id: string) {
  await signIn(page, world.people.lead);
  await uploadVersion(page, id);
  for (const point of (await points(page, id)).filter((p) => p.status === "open")) {
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

// Setup records that aren't workflow state, straight in the database.

let nextYear = 2100 + (Math.floor(Date.now() / 1000) % 400) * 2;
/** An unused school year label: unique, two consecutive years, far from real ones. */
export function freshYearLabel() {
  nextYear += 2;
  return `${nextYear}-${nextYear + 1}`;
}

/**
 * A school year with a First Semester term (open unless told otherwise).
 * Reuses the school year if the label exists, so a fixed label such as the
 * year before the shared term survives a retried test.
 */
export async function schoolYearWithTerm(label = freshYearLabel(), open = true) {
  const pb = await adminPb();
  const existing = await pb
    .collection("school_years")
    .getFullList({ filter: pb.filter("label = {:label}", { label }) });
  const schoolYear = existing[0] ?? (await pb.collection("school_years").create({ label }));
  const terms = await pb.collection("terms").getFullList({
    filter: pb.filter("school_year = {:sy} && semester = 'First Semester'", { sy: schoolYear.id }),
  });
  const term =
    terms[0] ??
    (await pb.collection("terms").create({
      school_year: schoolYear.id,
      semester: "First Semester",
      open,
      review_days: 0,
    }));
  return { schoolYear: schoolYear.id, label, term: term.id, termLabel: `${label} · First Semester` };
}

let extra = 0;
/**
 * Another course of the world's program, listed in its prospectus on the
 * shared term, for specs that need more than the four seeded ones (one
 * syllabus per course, term and program).
 */
export async function addCourse(world: World): Promise<Course> {
  const pb = await adminPb();
  extra += 1;
  const prefix = world.courses[0].code.split(" ")[0];
  const def = { code: `${prefix} ${200 + extra}-${Date.now().toString(36).slice(-3)}`, title: `Extra Course ${extra}` };
  const course = await pb.collection("courses").create({
    ...def,
    program: world.program.id,
    credit_units: 3,
    lec_units: 3,
    lab_units: 0,
    nominal_duration_hours: 54,
  });
  await pb.collection("prospectus_items").create({
    prospectus: world.prospectus,
    course: course.id,
    semester: "First Semester",
    year_level: "First Year",
  });
  return { id: course.id, ...def };
}

/** The world's prospectus for a school year listing `courses` (First Semester, First Year). */
export async function prospectusFor(world: World, schoolYear: string, courses: string[], published: boolean) {
  const pb = await adminPb();
  const prospectus = await pb
    .collection("prospectuses")
    .create({ program: world.program.id, school_year: schoolYear, published });
  for (const course of courses) {
    await pb.collection("prospectus_items").create({
      prospectus: prospectus.id,
      course,
      semester: "First Semester",
      year_level: "First Year",
    });
  }
  return prospectus.id;
}
