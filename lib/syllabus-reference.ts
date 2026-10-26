import { anyOf } from "@/lib/syllabus";
import type { ReferenceSourceRow, Syllabus } from "@/types/syllabus";
import type {
  ReferenceAction,
  ReferenceStatus,
  SyllabusReference,
  SyllabusReferenceResponse,
} from "@/types/syllabus-reference";
import type { Term } from "@/types/term";
import type PocketBase from "pocketbase";
import type { ListResult } from "pocketbase";
import "server-only";

/** Expand string used everywhere so responses can show names and codes. */
export const REFERENCE_EXPAND =
  "syllabus.program,syllabus.lead,program,course,term.school_year,requested_by,decided_by,ended_by";

/** Statuses that occupy the (program, course, term) slot. */
export const LIVE_REFERENCE_FILTER = "(status = 'pending' || status = 'approved')";

export function toSyllabusReferenceResponse(
  record: SyllabusReference,
): SyllabusReferenceResponse {
  const source = record.expand?.syllabus;
  const program = record.expand?.program;
  const course = record.expand?.course;
  const term = record.expand?.term;
  const person = (user?: { id: string; name: string }) =>
    user && { id: user.id, name: user.name };
  const requestedBy = person(record.expand?.requested_by);
  const decidedBy = person(record.expand?.decided_by);
  const endedBy = person(record.expand?.ended_by);
  return {
    id: record.id,
    syllabus: record.syllabus,
    program: record.program,
    course: record.course,
    term: record.term,
    requested_by: record.requested_by,
    note: record.note,
    status: record.status,
    reason: record.reason,
    decided_by: record.decided_by,
    decided_at: record.decided_at,
    ended_by: record.ended_by,
    ended_at: record.ended_at,
    created: record.created,
    updated: record.updated,
    expand: {
      ...(source && {
        syllabus: {
          id: source.id,
          status: source.status,
          lead: source.lead,
          ...(source.expand?.program && {
            program: {
              id: source.expand.program.id,
              name: source.expand.program.name,
              code: source.expand.program.code,
            },
          }),
          ...(source.expand?.lead && { lead_name: source.expand.lead.name }),
        },
      }),
      ...(program && {
        program: { id: program.id, name: program.name, code: program.code },
      }),
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
      ...(requestedBy && { requested_by: requestedBy }),
      ...(decidedBy && { decided_by: decidedBy }),
      ...(endedBy && { ended_by: endedBy }),
    },
  };
}

/** The program's pending or approved reference for a course and term, if any. */
export async function findLiveReference(
  pb: PocketBase,
  slot: { program: string; course: string; term: string },
): Promise<SyllabusReference | null> {
  const result = await pb
    .collection("syllabus_references")
    .getList<SyllabusReference>(1, 1, {
      skipTotal: true,
      expand: "syllabus.program",
      filter: `${pb.filter(
        "program = {:program} && course = {:course} && term = {:term}",
        slot,
      )} && ${LIVE_REFERENCE_FILTER}`,
    });
  return result.items[0] ?? null;
}

export interface SourceQuery {
  /** The referencing program. */
  program: string;
  term: Pick<Term, "id" | "school_year" | "semester">;
  search?: string;
  page: number;
  perPage: number;
}

/**
 * Other programs' syllabi for courses listed in the program's published
 * prospectus for the term: what its chair may reference. Metadata only.
 */
export async function listReferenceSources(
  pb: PocketBase,
  query: SourceQuery,
): Promise<ListResult<ReferenceSourceRow>> {
  const listed = await pb
    .collection("prospectus_items")
    .getFullList<{ course: string }>({
      fields: "course",
      filter: pb.filter(
        "semester = {:semester} && prospectus.program = {:program} && prospectus.school_year = {:schoolYear} && prospectus.published = true",
        {
          semester: query.term.semester,
          program: query.program,
          schoolYear: query.term.school_year,
        },
      ),
    });
  const courseIds = [...new Set(listed.map((item) => item.course))];
  if (courseIds.length === 0) {
    return {
      page: query.page,
      perPage: query.perPage,
      totalItems: 0,
      totalPages: 0,
      items: [],
    };
  }

  const filters = [
    pb.filter("term = {:term} && program != {:program}", {
      term: query.term.id,
      program: query.program,
    }),
    anyOf(pb, "course", courseIds, "c"),
  ];
  if (query.search) {
    filters.push(
      pb.filter(
        "(course.code ~ {:search} || course.title ~ {:search} || program.code ~ {:search})",
        { search: query.search },
      ),
    );
  }
  const result = await pb
    .collection("syllabi")
    .getList<Syllabus>(query.page, query.perPage, {
      expand: "course,program,lead",
      sort: "course.code,program.code",
      filter: filters.join(" && "),
    });

  const items: ReferenceSourceRow[] = [];
  for (const s of result.items) {
    const course = s.expand?.course;
    const program = s.expand?.program;
    if (!course || !program) continue;
    items.push({
      id: s.id,
      status: s.status,
      submitted_at: s.submitted_at,
      course: { id: course.id, code: course.code, title: course.title },
      program: { id: program.id, name: program.name, code: program.code },
      lead_name: s.expand?.lead?.name ?? "",
    });
  }
  return { ...result, items };
}

/** True while any reference to the syllabus is pending or approved. */
export async function hasLiveReferenceTo(
  pb: PocketBase,
  syllabusId: string,
): Promise<boolean> {
  const result = await pb.collection("syllabus_references").getList(1, 1, {
    skipTotal: true,
    fields: "id",
    filter: `${pb.filter("syllabus = {:syllabusId}", { syllabusId })} && ${LIVE_REFERENCE_FILTER}`,
  });
  return result.items.length > 0;
}

/** Facts about the caller, gathered by the route. */
export interface ReferenceActor {
  /** Leads the referenced (source) syllabus. */
  isSourceLead: boolean;
  /** Holds syllabusReference.request for the referencing program. */
  canRequest: boolean;
  /** Admins may act for the source lead (e.g. when the lead has left). */
  isAdmin: boolean;
}

const leadOrAdmin = (a: ReferenceActor) => a.isSourceLead || a.isAdmin;

export type ReferenceTransition =
  | { ok: true; next: ReferenceStatus; stamp: "decided" | "ended" }
  | { ok: false; status: 403 | 409; error: string };

const RULES: Record<
  ReferenceAction,
  {
    from: readonly ReferenceStatus[];
    to: ReferenceStatus;
    stamp: "decided" | "ended";
    allowed: (actor: ReferenceActor) => boolean;
    denied: string;
  }
> = {
  approve: {
    from: ["pending"],
    to: "approved",
    stamp: "decided",
    allowed: leadOrAdmin,
    denied: "Only the lead of the referenced syllabus can do this.",
  },
  reject: {
    from: ["pending"],
    to: "rejected",
    stamp: "decided",
    allowed: leadOrAdmin,
    denied: "Only the lead of the referenced syllabus can do this.",
  },
  revoke: {
    from: ["approved"],
    to: "revoked",
    stamp: "ended",
    allowed: leadOrAdmin,
    denied: "Only the lead of the referenced syllabus can do this.",
  },
  withdraw: {
    from: ["pending", "approved"],
    to: "withdrawn",
    stamp: "ended",
    allowed: (a) => a.canRequest,
    denied: "Only the referencing program's chair can withdraw it.",
  },
};

/**
 * Pure decision for a reference action. Permission is checked before
 * status so callers without a say learn nothing about the request. A lead
 * may approve their own request (self-approval is allowed by design), and
 * an admin may approve, reject or revoke on the lead's behalf.
 */
export function referenceTransition(
  status: ReferenceStatus,
  action: ReferenceAction,
  actor: ReferenceActor,
): ReferenceTransition {
  const rule = RULES[action];
  if (!rule.allowed(actor)) {
    return { ok: false, status: 403, error: rule.denied };
  }
  if (!rule.from.includes(status)) {
    return {
      ok: false,
      status: 409,
      error: `This reference is already ${status}.`,
    };
  }
  return { ok: true, next: rule.to, stamp: rule.stamp };
}
