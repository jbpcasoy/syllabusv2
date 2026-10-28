import PocketBase from "pocketbase";
import { PASSWORD, PB_URL, SUPERUSER } from "./env";

/** Who's who in the seeded data. Emails are on the default allowed domain. */
export const PEOPLE = {
  admin: { name: "E2E Admin", email: "e2e.admin@buksu.edu.ph" },
  chair: { name: "E2E Chair", email: "e2e.chair@buksu.edu.ph" },
  lead: { name: "E2E Lead", email: "e2e.lead@buksu.edu.ph" },
  coAuthor: { name: "E2E Coauthor", email: "e2e.coauthor@buksu.edu.ph" },
  reviewer: { name: "E2E Reviewer", email: "e2e.reviewer@buksu.edu.ph" },
  dean: { name: "E2E Dean", email: "e2e.dean@buksu.edu.ph" },
  fdis: { name: "E2E Fdis", email: "e2e.fdis@buksu.edu.ph" },
  citl: { name: "E2E Citl", email: "e2e.citl@buksu.edu.ph" },
  vpaa: { name: "E2E Vpaa", email: "e2e.vpaa@buksu.edu.ph" },
} as const;
export type Person = keyof typeof PEOPLE;

export interface Seed {
  users: Record<Person, string>;
  program: string;
  term: string;
  /** Course codes, one per spec that needs its own syllabus. */
  courses: Record<"chain" | "revise" | "lead" | "limit", { id: string; code: string }>;
}

/**
 * One college, department and program with every chain role filled, an
 * open term and a published prospectus listing four courses. Verified
 * users only: sign-in refuses unverified accounts.
 */
export async function seed(): Promise<Seed> {
  const pb = new PocketBase(PB_URL);
  pb.autoCancellation(false);
  await pb
    .collection("_superusers")
    .authWithPassword(SUPERUSER.email, SUPERUSER.password);

  const create = <T extends { id: string }>(collection: string, data: object) =>
    pb.collection(collection).create<T>(data);

  const users = {} as Record<Person, string>;
  for (const [key, person] of Object.entries(PEOPLE) as [Person, (typeof PEOPLE)[Person]][]) {
    const user = await create("users", {
      ...person,
      password: PASSWORD,
      passwordConfirm: PASSWORD,
      verified: true,
      emailVisibility: false,
      isAdmin: key === "admin",
    });
    users[key] = user.id;
  }

  const campus = await create("campuses", { name: "E2E Campus" });
  const college = await create("colleges", {
    name: "E2E College of Technologies",
    code: "E2ECOT",
    campus: campus.id,
  });
  const department = await create("departments", {
    name: "E2E Department of IT",
    college: college.id,
  });
  const program = await create("programs", {
    name: "E2E BS Information Technology",
    code: "E2EBSIT",
    department: department.id,
  });

  const schoolYear = await create("school_years", { label: "2026-2027" });
  const term = await create("terms", {
    school_year: schoolYear.id,
    semester: "First Semester",
    open: true,
    review_days: 0,
  });

  const courseDefs = {
    chain: { code: "E2E 101", title: "Full Chain" },
    revise: { code: "E2E 102", title: "Return And Revise" },
    lead: { code: "E2E 103", title: "Lead Override" },
    limit: { code: "E2E 104", title: "Upload Limit" },
  } as const;
  const prospectus = await create("prospectuses", {
    program: program.id,
    school_year: schoolYear.id,
    published: true,
  });
  const courses = {} as Seed["courses"];
  for (const [key, def] of Object.entries(courseDefs) as [keyof typeof courseDefs, (typeof courseDefs)[keyof typeof courseDefs]][]) {
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
    courses[key] = { id: course.id, code: def.code };
  }

  for (const user of [users.lead, users.coAuthor]) {
    await create("faculties", { user, program: program.id, active: true });
  }
  await create("program_chairs", { user: users.chair, program: program.id, active: true });
  await create("program_reviewers", { user: users.reviewer, program: program.id, active: true });
  await create("deans", { user: users.dean, college: college.id, active: true });
  await create("fdis_chairs", { user: users.fdis, active: true });
  await create("citl_directors", { user: users.citl, active: true });
  await create("vpaas", { user: users.vpaa, active: true });

  return { users, program: program.id, term: term.id, courses };
}
