import { loadChainHolders, loadStandIns } from "@/lib/syllabus-chain";
import { isReviewer } from "@/lib/syllabus-review";
import type { ProspectusItem } from "@/types/prospectus-item";
import type { UserRoles } from "@/types/roles";
import type {
  AvailableSyllabusRow,
  CoAuthorCandidate,
  Syllabus,
  SyllabusAccess,
  SyllabusResponse,
} from "@/types/syllabus";
import type { Faculty } from "@/types/faculty";
import type { SyllabusReference } from "@/types/syllabus-reference";
import type { Term } from "@/types/term";
import type PocketBase from "pocketbase";
import "server-only";

/** Expand string used everywhere so responses can show names and codes. */
export const SYLLABUS_EXPAND =
  "course,term.school_year,program,lead,co_authors";

export function toSyllabusResponse(
  record: Syllabus,
  access?: SyllabusAccess,
): SyllabusResponse {
  const course = record.expand?.course;
  const term = record.expand?.term;
  const program = record.expand?.program;
  const lead = record.expand?.lead;
  const coAuthors = record.expand?.co_authors;
  return {
    id: record.id,
    course: record.course,
    term: record.term,
    program: record.program,
    lead: record.lead,
    co_authors: record.co_authors,
    status: record.status,
    stage: record.stage,
    submitted_at: record.submitted_at,
    returned_at: record.returned_at ?? "",
    based_on: record.based_on ?? "",
    created: record.created,
    updated: record.updated,
    ...(access && { access }),
    expand: {
      ...(course && {
        course: { id: course.id, code: course.code, title: course.title },
      }),
      ...(term && {
        term: {
          id: term.id,
          semester: term.semester,
          school_year_label: term.expand?.school_year?.label ?? "",
        },
      }),
      ...(program && {
        program: { id: program.id, name: program.name, code: program.code },
      }),
      ...(lead && {
        lead: { id: lead.id, name: lead.name, email: lead.email },
      }),
      ...(coAuthors && {
        co_authors: coAuthors.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
        })),
      }),
    },
  };
}

/**
 * True for PocketBase's unique-index rejection of `field`
 * (400 with `{ [field]: { code: "validation_not_unique" } }`).
 */
export function isNotUniqueError(error: unknown, field: string): boolean {
  const data = (error as { response?: { data?: Record<string, { code?: string }> } })
    ?.response?.data;
  return data?.[field]?.code === "validation_not_unique";
}

/**
 * How a user relates to a syllabus, strongest first. null means no access,
 * which routes answer with 404 so ids can't be probed.
 */
export function getSyllabusAccess(
  userId: string,
  roles: Pick<UserRoles, "isAdmin">,
  syllabus: Pick<Syllabus, "lead" | "co_authors">,
): SyllabusAccess | null {
  if (syllabus.lead === userId) return "lead";
  if (syllabus.co_authors.includes(userId)) return "coAuthor";
  if (roles.isAdmin) return "admin";
  return null;
}

/** True if the user holds any review-chain role, wherever its scope. */
function holdsChainRole(roles: UserRoles): boolean {
  return (
    roles.reviewerOfPrograms.length > 0 ||
    roles.deanOfColleges.length > 0 ||
    roles.isFdisChair ||
    roles.isCitlDirector ||
    roles.isVpaa
  );
}

/**
 * getSyllabusAccess plus two fallbacks for callers with no direct access:
 * `reviewer` (lib/syllabus-review.ts isReviewer, once out of draft), then
 * `referencer` (active faculty of a program holding an approved reference).
 * Each query only runs when it could match.
 */
export async function resolveSyllabusAccess(
  pb: PocketBase,
  userId: string,
  roles: UserRoles,
  syllabus: Pick<Syllabus, "id" | "lead" | "co_authors" | "status" | "program">,
): Promise<SyllabusAccess | null> {
  const direct = getSyllabusAccess(userId, roles, syllabus);
  if (direct) return direct;

  if (syllabus.status !== "draft") {
    const [holders, standIns] = await Promise.all([
      holdsChainRole(roles) ? loadChainHolders(pb, syllabus.program) : [],
      loadStandIns(pb, syllabus.id),
    ]);
    if (isReviewer(userId, syllabus, holders, standIns)) return "reviewer";
  }

  if (roles.facultyOfPrograms.length === 0) return null;

  const result = await pb.collection("syllabus_references").getList(1, 1, {
    skipTotal: true,
    fields: "id",
    filter: `${pb.filter("syllabus = {:id} && status = 'approved'", {
      id: syllabus.id,
    })} && ${anyOf(pb, "program", roles.facultyOfPrograms, "p")}`,
  });
  return result.items.length > 0 ? "referencer" : null;
}

/** Syllabi the programs hold an approved reference to. */
export async function listReferencedSyllabusIds(
  pb: PocketBase,
  programIds: string[],
): Promise<string[]> {
  if (programIds.length === 0) return [];
  const rows = await pb
    .collection("syllabus_references")
    .getFullList<{ syllabus: string }>({
      fields: "syllabus",
      filter: `status = 'approved' && ${anyOf(pb, "program", programIds, "p")}`,
    });
  return [...new Set(rows.map((row) => row.syllabus))];
}

/** `(field = {:p0} || field = {:p1} ...)`, or a clause matching nothing. */
export function anyOf(
  pb: PocketBase,
  field: string,
  values: string[],
  prefix: string,
): string {
  if (values.length === 0) return "id = ''";
  const parts = values.map((value, i) =>
    pb.filter(`${field} = {:${prefix}${i}}`, { [`${prefix}${i}`]: value }),
  );
  return `(${parts.join(" || ")})`;
}

/**
 * True when the program's published prospectus for the term's school year
 * has the course in the term's semester.
 */
export async function isListedForProgram(
  pb: PocketBase,
  course: string,
  term: Pick<Term, "school_year" | "semester">,
  program: string,
): Promise<boolean> {
  const result = await pb.collection("prospectus_items").getList(1, 1, {
    skipTotal: true,
    fields: "id",
    filter: pb.filter(
      "course = {:course} && semester = {:semester} && prospectus.program = {:program} && prospectus.school_year = {:schoolYear} && prospectus.published = true",
      {
        course,
        semester: term.semester,
        program,
        schoolYear: term.school_year,
      },
    ),
  });
  return result.items.length > 0;
}

/** The subset of `userIds` with an active faculty record in the program. */
export async function activeFacultyAmong(
  pb: PocketBase,
  program: string,
  userIds: string[],
): Promise<Set<string>> {
  if (userIds.length === 0) return new Set();
  const rows = await pb.collection("faculties").getFullList<Faculty>({
    fields: "user",
    filter: `${pb.filter("program = {:program} && active = true", { program })} && ${anyOf(pb, "user", userIds, "u")}`,
  });
  return new Set(rows.map((row) => row.user));
}

/** Active faculty of the syllabus's program other than the lead, by name. */
export async function listCoAuthorCandidates(
  pb: PocketBase,
  syllabus: Pick<Syllabus, "program" | "lead">,
  search: string,
): Promise<CoAuthorCandidate[]> {
  const filters = [
    pb.filter("program = {:program} && active = true && user != {:lead}", {
      program: syllabus.program,
      lead: syllabus.lead,
    }),
  ];
  if (search) {
    filters.push(
      pb.filter("(user.name ~ {:search} || user.email ~ {:search})", {
        search,
      }),
    );
  }
  const result = await pb.collection("faculties").getList<Faculty>(1, 20, {
    skipTotal: true,
    expand: "user",
    sort: "user.name",
    filter: filters.join(" && "),
  });
  return result.items
    .map((row) => row.expand?.user)
    .filter((u) => !!u)
    .map((u) => ({ id: u.id, name: u.name, email: u.email }));
}

export interface AvailableQuery {
  term?: string;
  program?: string;
  search?: string;
  page: number;
  perPage: number;
}

export interface AvailableList {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  items: AvailableSyllabusRow[];
}

/**
 * Courses the user may author: items of published prospectuses of programs
 * where the user is active faculty, in terms that are open. Each row says
 * whether that program already has a syllabus for the course and term.
 */
export async function listAvailable(
  pb: PocketBase,
  userId: string,
  query: AvailableQuery,
): Promise<AvailableList> {
  const empty: AvailableList = {
    page: query.page,
    perPage: query.perPage,
    totalItems: 0,
    totalPages: 0,
    items: [],
  };

  const [memberships, terms] = await Promise.all([
    pb.collection("faculties").getFullList<Faculty>({
      fields: "program",
      filter: query.program
        ? pb.filter("user = {:userId} && active = true && program = {:program}", {
            userId,
            program: query.program,
          })
        : pb.filter("user = {:userId} && active = true", { userId }),
    }),
    pb.collection("terms").getFullList<Term>({
      expand: "school_year",
      filter: query.term
        ? pb.filter("open = true && id = {:term}", { term: query.term })
        : "open = true",
    }),
  ]);
  const programIds = [...new Set(memberships.map((m) => m.program))];
  if (programIds.length === 0 || terms.length === 0) return empty;

  const termClauses = terms.map((t, i) =>
    pb.filter(
      `(prospectus.school_year = {:y${i}} && semester = {:s${i}})`,
      { [`y${i}`]: t.school_year, [`s${i}`]: t.semester },
    ),
  );
  const filters = [
    "prospectus.published = true",
    anyOf(pb, "prospectus.program", programIds, "p"),
    `(${termClauses.join(" || ")})`,
  ];
  if (query.search) {
    filters.push(
      pb.filter("(course.code ~ {:search} || course.title ~ {:search})", {
        search: query.search,
      }),
    );
  }

  const result = await pb
    .collection("prospectus_items")
    .getList<ProspectusItem>(query.page, query.perPage, {
      expand: "course,prospectus.program",
      sort: "course.code,prospectus.program.code",
      filter: filters.join(" && "),
    });

  const termOf = (item: ProspectusItem) =>
    terms.find(
      (t) =>
        t.school_year === item.expand?.prospectus?.school_year &&
        t.semester === item.semester,
    );

  const courseIds = [...new Set(result.items.map((item) => item.course))];
  const slotFilter = [
    anyOf(pb, "course", courseIds, "c"),
    anyOf(pb, "term", terms.map((t) => t.id), "t"),
    anyOf(pb, "program", programIds, "p"),
  ].join(" && ");
  const [existing, references] =
    courseIds.length === 0
      ? [[], []]
      : await Promise.all([
          pb.collection("syllabi").getFullList<Syllabus>({
            expand: "lead",
            fields: "id,course,term,program,status,expand.lead.name",
            filter: slotFilter,
          }),
          pb.collection("syllabus_references").getFullList<SyllabusReference>({
            expand: "syllabus.program",
            fields:
              "id,course,term,program,status,expand.syllabus.expand.program.code",
            // Same as LIVE_REFERENCE_FILTER; not imported to avoid a cycle.
            filter: `${slotFilter} && (status = 'pending' || status = 'approved')`,
          }),
        ]);
  const key = (course: string, term: string, program: string) =>
    `${course}|${term}|${program}`;
  const byKey = new Map(
    existing.map((s) => [key(s.course, s.term, s.program), s]),
  );
  const referenceByKey = new Map(
    references.map((r) => [key(r.course, r.term, r.program), r]),
  );

  const items: AvailableSyllabusRow[] = [];
  for (const item of result.items) {
    const term = termOf(item);
    const course = item.expand?.course;
    const prospectus = item.expand?.prospectus;
    const program = prospectus?.expand?.program;
    if (!term || !course || !prospectus || !program) continue;
    const syllabus = byKey.get(key(course.id, term.id, program.id));
    const reference = referenceByKey.get(key(course.id, term.id, program.id));
    items.push({
      course: { id: course.id, code: course.code, title: course.title },
      term: {
        id: term.id,
        semester: term.semester,
        school_year_label: term.expand?.school_year?.label ?? "",
      },
      program: { id: program.id, name: program.name, code: program.code },
      year_level: item.year_level,
      ...(syllabus && {
        syllabus: {
          id: syllabus.id,
          status: syllabus.status,
          lead_name: syllabus.expand?.lead?.name ?? "",
        },
      }),
      ...(reference && {
        reference: {
          id: reference.id,
          status: reference.status as "pending" | "approved",
          source_program_code:
            reference.expand?.syllabus?.expand?.program?.code ?? "",
        },
      }),
    });
  }

  return {
    page: result.page,
    perPage: result.perPage,
    totalItems: result.totalItems,
    totalPages: result.totalPages,
    items,
  };
}
