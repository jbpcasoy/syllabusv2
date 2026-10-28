import {
  programScopeFilter,
  scopePrograms,
  type ScopedPrograms,
} from "@/lib/dashboard-scope";
import { anyOf } from "@/lib/syllabus";
import type { SyllabusStatus } from "@/lib/syllabus-workflow";
import type {
  DashboardFilters,
  DashboardScope,
  JustificationRow,
  JustificationState,
  ProgramOrg,
  SignedCopyRow,
  SyllabusExportRow,
  TermSlots,
} from "@/types/dashboard";
import type { Justification } from "@/types/justification";
import type { Term } from "@/types/term";
import type PocketBase from "pocketbase";
import type { ListResult } from "pocketbase";
import "server-only";

// Loaders for the dashboard. The counting is lib/dashboard-aggregate.ts
// (pure); who sees what is lib/dashboard-scope.ts (pure).

type ProgramRecord = {
  id: string;
  code: string;
  name: string;
  department: string;
  expand?: {
    department?: {
      id: string;
      name: string;
      college: string;
      expand?: { college?: { id: string; name: string } };
    };
  };
};

function toProgramOrg(record: ProgramRecord): ProgramOrg {
  const department = record.expand?.department;
  return {
    id: record.id,
    code: record.code,
    name: record.name,
    departmentId: record.department,
    departmentName: department?.name ?? "",
    collegeId: department?.college ?? "",
    collegeName: department?.expand?.college?.name ?? "",
  };
}

/**
 * Programs matching the filters, with their org chain, regardless of scope.
 * One query serves both the P6 check (filterInScope) and the scoped list
 * (inScope below), so an out-of-scope filter costs no further reads.
 */
export async function loadFilteredPrograms(
  pb: PocketBase,
  filters: DashboardFilters,
): Promise<ProgramOrg[]> {
  const filter = programScopeFilter(
    (expr, params) => pb.filter(expr, params),
    { all: true },
    filters,
  );
  const records = await pb.collection("programs").getFullList<ProgramRecord>({
    expand: "department.college",
    fields:
      "id,code,name,department,expand.department.id,expand.department.name,expand.department.college,expand.department.expand.college.id,expand.department.expand.college.name",
    sort: "code",
    ...(filter && { filter }),
  });
  return records.map(toProgramOrg);
}

/**
 * The programs a dashboard request covers: one read, then the pure
 * scopePrograms. `ok: false` when a filter falls outside the scope (P6);
 * the route answers 403 and reads nothing else.
 */
export async function resolveScopedPrograms(
  pb: PocketBase,
  scope: DashboardScope,
  filters: DashboardFilters,
): Promise<ScopedPrograms> {
  return scopePrograms(scope, filters, await loadFilteredPrograms(pb, filters));
}

/**
 * The program clause for the term's rows. Unrestricted only when the
 * viewer sees everything and nothing is filtered, which also keeps the
 * filter short for the largest scope.
 */
function programClause(
  pb: PocketBase,
  field: string,
  programs: readonly ProgramOrg[],
  everything: boolean,
): string | null {
  return everything ? null : anyOf(pb, field, programs.map((p) => p.id), "p");
}

/**
 * Every row aggregate() needs for one term: the expected slots from the
 * programs' published prospectuses (matching school year and semester),
 * the term's syllabi and its pending or approved references.
 * `everything` is true when `programs` is every program (global, unfiltered).
 */
export async function loadTermSlots(
  pb: PocketBase,
  term: Pick<Term, "id" | "school_year" | "semester">,
  programs: ProgramOrg[],
  everything: boolean,
): Promise<TermSlots> {
  if (programs.length === 0) {
    return { programs, expected: [], syllabi: [], references: [] };
  }
  const and = (...parts: (string | null)[]) =>
    parts.filter((p): p is string => !!p).join(" && ");

  const [items, syllabi, references] = await Promise.all([
    pb.collection("prospectus_items").getFullList<{
      course: string;
      expand?: { prospectus?: { program: string } };
    }>({
      expand: "prospectus",
      fields: "course,expand.prospectus.program",
      filter: and(
        pb.filter(
          "prospectus.published = true && prospectus.school_year = {:year} && semester = {:semester}",
          { year: term.school_year, semester: term.semester },
        ),
        programClause(pb, "prospectus.program", programs, everything),
      ),
    }),
    pb.collection("syllabi").getFullList<TermSlots["syllabi"][number]>({
      fields: "program,course,status,stage,status_changed_at",
      filter: and(
        pb.filter("term = {:term}", { term: term.id }),
        programClause(pb, "program", programs, everything),
      ),
    }),
    pb.collection("syllabus_references").getFullList<{
      program: string;
      course: string;
      expand?: { syllabus?: { status: SyllabusStatus } };
    }>({
      expand: "syllabus",
      fields: "program,course,expand.syllabus.status",
      filter: and(
        pb.filter("term = {:term} && (status = 'pending' || status = 'approved')", {
          term: term.id,
        }),
        programClause(pb, "program", programs, everything),
      ),
    }),
  ]);

  return {
    programs,
    expected: items
      .filter((item) => item.expand?.prospectus?.program)
      .map((item) => ({
        program: item.expand!.prospectus!.program,
        course: item.course,
      })),
    syllabi: syllabi.map((s) => ({
      program: s.program,
      course: s.course,
      status: s.status,
      stage: s.stage,
      status_changed_at: s.status_changed_at ?? "",
    })),
    references: references.map((r) => ({
      program: r.program,
      course: r.course,
      sourceStatus: r.expand?.syllabus?.status ?? "",
    })),
  };
}

type RowSyllabus = {
  id: string;
  status: SyllabusStatus;
  status_changed_at?: string;
  expand?: {
    course?: { code: string; title: string };
    program?: { code: string };
    lead?: { name: string };
  };
};

const ROW_EXPAND = "course,program,lead";
const ROW_FIELDS =
  "id,status,status_changed_at,expand.course.code,expand.course.title,expand.program.code,expand.lead.name";

/** Clamped paging; perPage 1 to 100, default 30, as every list route. */
export function paging(params: URLSearchParams): { page: number; perPage: number } {
  return {
    page: Math.max(1, Number(params.get("page")) || 1),
    perPage: Math.min(100, Math.max(1, Number(params.get("perPage")) || 30)),
  };
}

function rowNames(s: RowSyllabus) {
  return {
    id: s.id,
    course_code: s.expand?.course?.code ?? "",
    course_title: s.expand?.course?.title ?? "",
    program_code: s.expand?.program?.code ?? "",
    lead_name: s.expand?.lead?.name ?? "",
  };
}

function termRowsFilter(
  pb: PocketBase,
  termId: string,
  scoped: { programs: ProgramOrg[]; everything: boolean },
  condition: string,
): string {
  const clause = programClause(pb, "program", scoped.programs, scoped.everything);
  return [pb.filter("term = {:term}", { term: termId }), condition, clause]
    .filter(Boolean)
    .join(" && ");
}

const emptyList = <T>(page: number, perPage: number): ListResult<T> => ({
  page,
  perPage,
  totalItems: 0,
  totalPages: 0,
  items: [],
});

type Scoped = { programs: ProgramOrg[]; everything: boolean };

/** Options for the term's approved syllabi, oldest approval first. */
function awaitingSignedCopyQuery(pb: PocketBase, termId: string, scoped: Scoped) {
  return {
    expand: ROW_EXPAND,
    fields: ROW_FIELDS,
    sort: "status_changed_at,id",
    filter: termRowsFilter(pb, termId, scoped, "status = 'approved'"),
  };
}

const toSignedCopyRow = (s: RowSyllabus): SignedCopyRow => ({
  ...rowNames(s),
  approved_at: s.status_changed_at ?? "",
});

/**
 * Approved syllabi of the term in the programs, awaiting a valid signed
 * copy. Oldest approval first: the longest wait is on top.
 */
export async function listAwaitingSignedCopy(
  pb: PocketBase,
  termId: string,
  scoped: Scoped,
  page: number,
  perPage: number,
): Promise<ListResult<SignedCopyRow>> {
  if (scoped.programs.length === 0) return emptyList(page, perPage);
  const result = await pb
    .collection("syllabi")
    .getList<RowSyllabus>(page, perPage, awaitingSignedCopyQuery(pb, termId, scoped));
  return { ...result, items: result.items.map(toSignedCopyRow) };
}

/** Every row of listAwaitingSignedCopy, for the export. */
export async function allAwaitingSignedCopy(
  pb: PocketBase,
  termId: string,
  scoped: Scoped,
): Promise<SignedCopyRow[]> {
  if (scoped.programs.length === 0) return [];
  const records = await pb
    .collection("syllabi")
    .getFullList<RowSyllabus>(awaitingSignedCopyQuery(pb, termId, scoped));
  return records.map(toSignedCopyRow);
}

/**
 * Approved or filed syllabi of the term that build on last year's
 * (`based_on` set), with their justification's state, sorted by program and
 * course. A term holds few of these, so they are joined in memory, which
 * also lets the state filter include "none" (no justification yet).
 */
export async function justificationRows(
  pb: PocketBase,
  termId: string,
  scoped: Scoped,
  state: JustificationState | undefined,
): Promise<JustificationRow[]> {
  if (scoped.programs.length === 0) return [];
  const [syllabi, justifications] = await Promise.all([
    pb.collection("syllabi").getFullList<RowSyllabus>({
      expand: ROW_EXPAND,
      fields: ROW_FIELDS,
      filter: termRowsFilter(
        pb,
        termId,
        scoped,
        "(status = 'approved' || status = 'filed') && based_on != ''",
      ),
    }),
    pb
      .collection("syllabus_justifications")
      .getFullList<Pick<Justification, "syllabus" | "status" | "updated">>({
        fields: "syllabus,status,updated",
        filter: pb.filter("syllabus.term = {:term}", { term: termId }),
      }),
  ]);
  const bySyllabus = new Map(justifications.map((j) => [j.syllabus, j]));

  return syllabi
    .map((s) => {
      const justification = bySyllabus.get(s.id);
      return {
        ...rowNames(s),
        syllabus_status: s.status as "approved" | "filed",
        justification: justification?.status ?? ("none" as const),
        justification_updated: justification?.updated ?? "",
      };
    })
    .filter((row) => !state || row.justification === state)
    .sort(
      (a, b) =>
        a.program_code.localeCompare(b.program_code) ||
        a.course_code.localeCompare(b.course_code),
    );
}

/** justificationRows, one page at a time. */
export async function listJustifications(
  pb: PocketBase,
  termId: string,
  scoped: Scoped,
  state: JustificationState | undefined,
  page: number,
  perPage: number,
): Promise<ListResult<JustificationRow>> {
  const rows = await justificationRows(pb, termId, scoped, state);
  return {
    page,
    perPage,
    totalItems: rows.length,
    totalPages: Math.ceil(rows.length / perPage),
    items: rows.slice((page - 1) * perPage, page * perPage),
  };
}

/**
 * The term's syllabi in the programs, optionally one status or stage, for
 * the filtered syllabus export. Sorted by program and course code.
 */
export async function termSyllabusRows(
  pb: PocketBase,
  termId: string,
  scoped: Scoped,
  filters: { status?: SyllabusStatus; stage?: number },
): Promise<SyllabusExportRow[]> {
  if (scoped.programs.length === 0) return [];
  const conditions = [
    filters.status && pb.filter("status = {:status}", { status: filters.status }),
    filters.stage && pb.filter("stage = {:stage}", { stage: filters.stage }),
  ]
    .filter(Boolean)
    .join(" && ");
  const records = await pb
    .collection("syllabi")
    .getFullList<RowSyllabus & { stage: number }>({
      expand: ROW_EXPAND,
      fields: `${ROW_FIELDS},stage`,
      sort: "program.code,course.code",
      filter: termRowsFilter(pb, termId, scoped, conditions),
    });
  return records.map((s) => ({
    ...rowNames(s),
    status: s.status,
    stage: s.stage,
    status_changed_at: s.status_changed_at ?? "",
  }));
}
