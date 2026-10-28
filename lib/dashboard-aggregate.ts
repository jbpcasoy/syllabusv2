import { isReviewOverdue, isSubmissionOverdue } from "@/lib/deadlines";
import { FINAL_STAGE } from "@/lib/syllabus-workflow";
import type {
  CompletionLevel,
  CompletionRow,
  DashboardCounts,
  DashboardSummary,
  TermSlots,
} from "@/types/dashboard";

/**
 * Counts and completion for one term (Phase 5, D4). Pure: the route loads
 * the rows (scoped and filtered) and passes them in.
 *
 * - Counts by stage cover every syllabus of the term in the programs given.
 * - Completion covers expected slots only: each course in a program's
 *   published prospectus for the term. A slot is complete when its own
 *   syllabus is filed, or it references a filed syllabus.
 */

type Tally = Pick<
  CompletionRow,
  "expected" | "filed" | "overdueSubmission" | "overdueReview"
>;

const blankTally = (): Tally => ({
  expected: 0,
  filed: 0,
  overdueSubmission: 0,
  overdueReview: 0,
});

export function aggregate(
  slots: TermSlots,
  term: { submission_deadline: string; review_days: number },
  now: Date,
): DashboardSummary {
  const key = (program: string, course: string) => `${program}|${course}`;
  const programIds = new Set(slots.programs.map((p) => p.id));
  const syllabi = slots.syllabi.filter((s) => programIds.has(s.program));
  const syllabusBySlot = new Map(
    syllabi.map((s) => [key(s.program, s.course), s]),
  );
  const referenceBySlot = new Map(
    slots.references
      .filter((r) => programIds.has(r.program))
      .map((r) => [key(r.program, r.course), r]),
  );

  const counts: DashboardCounts = {
    notStarted: 0,
    draft: 0,
    waiting: Array.from({ length: FINAL_STAGE }, () => 0),
    returned: 0,
    approved: 0,
    filed: 0,
    referenced: 0,
    overdueSubmission: 0,
    overdueReview: 0,
  };
  const perProgram = new Map(slots.programs.map((p) => [p.id, blankTally()]));

  for (const s of syllabi) {
    if (s.status === "submitted") {
      if (s.stage >= 1 && s.stage <= FINAL_STAGE) counts.waiting[s.stage - 1]++;
    } else {
      counts[s.status]++;
    }
    if (isReviewOverdue(s, term, now)) {
      counts.overdueReview++;
      perProgram.get(s.program)!.overdueReview++;
    }
  }

  const seen = new Set<string>();
  for (const slot of slots.expected) {
    const k = key(slot.program, slot.course);
    if (!programIds.has(slot.program) || seen.has(k)) continue;
    seen.add(k);
    const tally = perProgram.get(slot.program)!;
    const syllabus = syllabusBySlot.get(k);
    // A program has its own syllabus or a reference, never both.
    const reference = syllabus ? undefined : referenceBySlot.get(k);

    tally.expected++;
    if (syllabus?.status === "filed" || reference?.sourceStatus === "filed") {
      tally.filed++;
    }
    if (reference) counts.referenced++;
    else if (!syllabus) counts.notStarted++;

    const slotState = {
      syllabusStatus: syllabus?.status ?? null,
      hasReference: !!reference,
    };
    if (isSubmissionOverdue(term, slotState, now)) {
      counts.overdueSubmission++;
      tally.overdueSubmission++;
    }
  }

  return { counts, completion: completionRows(slots, perProgram) };
}

function row(
  level: CompletionLevel,
  id: string,
  name: string,
  parentId: string,
): CompletionRow {
  return { level, id, name, parentId, ...blankTally(), rate: null };
}

function addTally(into: Tally, from: Tally) {
  into.expected += from.expected;
  into.filed += from.filed;
  into.overdueSubmission += from.overdueSubmission;
  into.overdueReview += from.overdueReview;
}

const withRate = (r: CompletionRow): CompletionRow => ({
  ...r,
  rate: r.expected > 0 ? r.filed / r.expected : null,
});

const byName = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name);

/** Each college, followed by its departments, each followed by its programs. */
function completionRows(
  slots: TermSlots,
  perProgram: ReadonlyMap<string, Tally>,
): CompletionRow[] {
  const colleges = new Map<string, CompletionRow>();
  const departments = new Map<string, CompletionRow>();
  const programs: CompletionRow[] = [];

  for (const p of slots.programs) {
    const tally = perProgram.get(p.id)!;
    if (!colleges.has(p.collegeId)) {
      colleges.set(p.collegeId, row("college", p.collegeId, p.collegeName, ""));
    }
    if (!departments.has(p.departmentId)) {
      departments.set(
        p.departmentId,
        row("department", p.departmentId, p.departmentName, p.collegeId),
      );
    }
    const program = row(
      "program",
      p.id,
      p.code ? `${p.code} · ${p.name}` : p.name,
      p.departmentId,
    );
    addTally(program, tally);
    addTally(departments.get(p.departmentId)!, tally);
    addTally(colleges.get(p.collegeId)!, tally);
    programs.push(program);
  }

  const rows: CompletionRow[] = [];
  for (const college of [...colleges.values()].sort(byName)) {
    rows.push(withRate(college));
    const inCollege = [...departments.values()].filter(
      (d) => d.parentId === college.id,
    );
    for (const department of inCollege.sort(byName)) {
      rows.push(withRate(department));
      const inDepartment = programs.filter((p) => p.parentId === department.id);
      for (const program of inDepartment.sort(byName)) {
        rows.push(withRate(program));
      }
    }
  }
  return rows;
}
