import PocketBase from "pocketbase";
import { PASSWORD, PB_URL, SUPERUSER } from "./env";

export interface PersonRecord {
  id: string;
  name: string;
  email: string;
}

/**
 * What every world shares, created once by global setup. VPAA, FDIS Chair
 * and CITL Director allow one active holder system-wide, and `terms` is
 * unique per school year and semester, so these can't be per world.
 */
export interface GlobalSeed {
  people: Record<"admin" | "fdis" | "citl" | "vpaa", PersonRecord>;
  campus: string;
  term: { id: string; label: string };
}

export const GLOBAL_PEOPLE = {
  admin: { name: "E2E Admin", email: "e2e.admin@buksu.edu.ph" },
  fdis: { name: "E2E Fdis", email: "e2e.fdis@buksu.edu.ph" },
  citl: { name: "E2E Citl", email: "e2e.citl@buksu.edu.ph" },
  vpaa: { name: "E2E Vpaa", email: "e2e.vpaa@buksu.edu.ph" },
} as const;

/** Superuser client on the throwaway PocketBase, for arranging state. */
export async function adminPb(): Promise<PocketBase> {
  const pb = new PocketBase(PB_URL);
  pb.autoCancellation(false);
  await pb
    .collection("_superusers")
    .authWithPassword(SUPERUSER.email, SUPERUSER.password);
  return pb;
}

/** A verified user who signs in with `PASSWORD`; sign-in refuses unverified accounts. */
export async function createUser(
  pb: PocketBase,
  person: { name: string; email: string },
  isAdmin = false,
): Promise<PersonRecord> {
  const user = await pb.collection("users").create({
    ...person,
    password: PASSWORD,
    passwordConfirm: PASSWORD,
    verified: true,
    emailVisibility: false,
    isAdmin,
  });
  return { id: user.id, name: person.name, email: person.email };
}

/** The admin, the three global chain holders, one campus and one open term. */
export async function seedGlobal(): Promise<GlobalSeed> {
  const pb = await adminPb();
  const create = (collection: string, data: object) => pb.collection(collection).create(data);

  const people = {} as GlobalSeed["people"];
  for (const key of Object.keys(GLOBAL_PEOPLE) as (keyof typeof GLOBAL_PEOPLE)[]) {
    people[key] = await createUser(pb, GLOBAL_PEOPLE[key], key === "admin");
  }
  await create("fdis_chairs", { user: people.fdis.id, active: true });
  await create("citl_directors", { user: people.citl.id, active: true });
  await create("vpaas", { user: people.vpaa.id, active: true });

  const campus = await create("campuses", { name: "E2E Campus" });
  const schoolYear = await create("school_years", { label: "2026-2027" });
  const term = await create("terms", {
    school_year: schoolYear.id,
    semester: "First Semester",
    open: true,
    review_days: 0,
  });

  return {
    people,
    campus: campus.id,
    term: { id: term.id, label: "2026-2027 · First Semester" },
  };
}
