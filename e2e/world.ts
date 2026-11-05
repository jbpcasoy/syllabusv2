import { readFileSync } from "node:fs";
import { SEED_FILE } from "./env";
import { adminPb, createUser, type GlobalSeed, type PersonRecord } from "./seed";

export type Person = "admin" | "chair" | "lead" | "coAuthor" | "reviewer" | "dean" | "fdis" | "citl" | "vpaa";

export interface Course {
  id: string;
  code: string;
  title: string;
}

/**
 * One spec file's own org: college, department and program with every
 * chain role filled, a published prospectus with four courses on the
 * shared term, and its own users. Stages 3 to 5 and the admin are the
 * global holders, so their queues also list other worlds' syllabi:
 * find rows by course code, never by position.
 */
export interface World {
  name: string;
  people: Record<Person, PersonRecord>;
  program: { id: string; code: string; name: string; /** As the selects show it. */ label: string };
  term: GlobalSeed["term"];
  courses: [Course, Course, Course, Course];
}

export function loadGlobalSeed(): GlobalSeed {
  return JSON.parse(readFileSync(SEED_FILE, "utf8")) as GlobalSeed;
}

/**
 * `name` is a short slug ("full-chain"); it goes into display names. The
 * tag (W1, W2, ...) comes from the database, not a module counter, because
 * Playwright starts a new worker after a failure and the new world must
 * not collide with unique course codes or emails.
 */
export async function createWorld(name: string): Promise<World> {
  const global = loadGlobalSeed();
  const pb = await adminPb();
  const create = (collection: string, data: object) => pb.collection(collection).create(data);

  const tag = `W${(await pb.collection("colleges").getList(1, 1)).totalItems + 1}`;
  const title = name
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");

  const local = async (key: string, role: string) =>
    createUser(pb, { name: `${title} ${role}`, email: `e2e.${tag.toLowerCase()}.${name}.${key}@buksu.edu.ph` });
  const people: World["people"] = {
    ...global.people,
    chair: await local("chair", "Chair"),
    lead: await local("lead", "Lead"),
    coAuthor: await local("coauthor", "Coauthor"),
    reviewer: await local("reviewer", "Reviewer"),
    dean: await local("dean", "Dean"),
  };

  const college = await create("colleges", {
    name: `${title} College`,
    code: `${tag}COL`,
    campus: global.campus,
  });
  const department = await create("departments", {
    name: `${title} Department`,
    college: college.id,
  });
  const programCode = `${tag}BSIT`;
  const programName = `${title} BS Information Technology`;
  const program = await create("programs", {
    name: programName,
    code: programCode,
    department: department.id,
  });

  const termRecord = await pb.collection("terms").getOne(global.term.id);
  const prospectus = await create("prospectuses", {
    program: program.id,
    school_year: termRecord.school_year,
    published: true,
  });
  const courses: Course[] = [];
  for (let i = 1; i <= 4; i++) {
    const def = { code: `${tag} 10${i}`, title: `${title} Course ${i}` };
    const course = await create("courses", {
      ...def,
      program: program.id,
      credit_units: 3,
      lec_units: 3,
      lab_units: 0,
      nominal_duration_hours: 54,
    });
    await create("prospectus_items", {
      prospectus: prospectus.id,
      course: course.id,
      semester: "First Semester",
      year_level: "First Year",
    });
    courses.push({ id: course.id, ...def });
  }

  for (const user of [people.lead, people.coAuthor]) {
    await create("faculties", { user: user.id, program: program.id, active: true });
  }
  await create("program_chairs", { user: people.chair.id, program: program.id, active: true });
  await create("program_reviewers", { user: people.reviewer.id, program: program.id, active: true });
  await create("deans", { user: people.dean.id, college: college.id, active: true });

  return {
    name,
    people,
    program: {
      id: program.id,
      code: programCode,
      name: programName,
      label: `${programName} (${programCode})`,
    },
    term: global.term,
    courses: courses as World["courses"],
  };
}
