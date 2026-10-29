import { STATUS_LABELS } from "@/components/syllabus/syllabus-status";
import { toCsv, type CsvCell } from "@/lib/csv";
import {
  daysOverdue,
  deadlineEnd,
  isSubmissionOverdue,
  reviewDueAt,
} from "@/lib/deadlines";
import { CHAIN_ROLES } from "@/lib/syllabus-workflow";
import type { SyllabusExportFilters } from "@/lib/validators/dashboard";
import type {
  CompletionRow,
  JustificationRow,
  SignedCopyRow,
  SyllabusExportRow,
} from "@/types/dashboard";

/**
 * The CSV of each dashboard export (Phase 5, P8). Pure: the route loads,
 * scopes and caps the rows. Names only, never emails. Times are Philippine
 * time, like the deadlines.
 */

type TermDeadlines = { submission_deadline: string; review_days: number };

const DAY_MS = 24 * 60 * 60 * 1000;
const PHT_OFFSET_MS = 8 * 60 * 60 * 1000;

/** "2026-10-20 08:00:00.000Z" → "2026-10-20 16:00" (PHT); "" when unset. */
export function phtDateTime(value: string): string {
  if (!value) return "";
  const date = new Date(value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() + PHT_OFFSET_MS)
    .toISOString()
    .slice(0, 16)
    .replace("T", " ");
}

const stageLabel = (stage: number) =>
  CHAIN_ROLES[stage - 1]?.label ?? (stage > 0 ? `Stage ${stage}` : "");

const LEVEL_LABELS: Record<CompletionRow["level"], string> = {
  college: "College",
  department: "Department",
  program: "Program",
};

export function completionCsv(rows: readonly CompletionRow[]): string {
  return toCsv(
    [
      "Level",
      "Name",
      "Expected",
      "Filed",
      "Completion %",
      "Overdue submission",
      "Overdue review",
    ],
    rows.map((r): CsvCell[] => [
      LEVEL_LABELS[r.level],
      r.name,
      r.expected,
      r.filed,
      r.rate === null ? "" : Math.round(r.rate * 1000) / 10,
      r.overdueSubmission,
      r.overdueReview,
    ]),
  );
}

/** Days overdue for review (submitted) or submission (draft), else 0. */
export function syllabusOverdue(
  row: Pick<SyllabusExportRow, "status" | "status_changed_at">,
  term: TermDeadlines,
  now: Date,
): { review: number; submission: number } {
  const review =
    row.status === "submitted"
      ? daysOverdue(reviewDueAt(row.status_changed_at, term.review_days), now)
      : 0;
  const submission = isSubmissionOverdue(
    term,
    { syllabusStatus: row.status, referenceStatus: null },
    now,
  )
    ? daysOverdue(deadlineEnd(term.submission_deadline), now)
    : 0;
  return { review, submission };
}

/** Applies the `overdue` filter, which needs the term and the clock. */
export function filterOverdue(
  rows: readonly SyllabusExportRow[],
  overdue: SyllabusExportFilters["overdue"],
  term: TermDeadlines,
  now: Date,
): SyllabusExportRow[] {
  if (!overdue) return [...rows];
  return rows.filter((row) => syllabusOverdue(row, term, now)[overdue] > 0);
}

export function syllabiCsv(
  rows: readonly SyllabusExportRow[],
  term: TermDeadlines,
  now: Date,
): string {
  return toCsv(
    [
      "Program",
      "Course code",
      "Course title",
      "Lead",
      "Status",
      "Stage",
      "Last change (PHT)",
      "Review overdue (days)",
      "Past submission deadline (days)",
    ],
    rows.map((r): CsvCell[] => {
      const overdue = syllabusOverdue(r, term, now);
      return [
        r.program_code,
        r.course_code,
        r.course_title,
        r.lead_name,
        STATUS_LABELS[r.status],
        r.status === "submitted" || r.status === "returned" ? stageLabel(r.stage) : "",
        phtDateTime(r.status_changed_at),
        overdue.review || "",
        overdue.submission || "",
      ];
    }),
  );
}

export function signedCopiesCsv(rows: readonly SignedCopyRow[], now: Date): string {
  return toCsv(
    ["Program", "Course code", "Course title", "Lead", "Approved (PHT)", "Days waiting"],
    rows.map((r): CsvCell[] => {
      const approved = r.approved_at
        ? new Date(r.approved_at.replace(" ", "T")).getTime()
        : Number.NaN;
      return [
        r.program_code,
        r.course_code,
        r.course_title,
        r.lead_name,
        phtDateTime(r.approved_at),
        Number.isNaN(approved)
          ? ""
          : Math.max(0, Math.floor((now.getTime() - approved) / DAY_MS)),
      ];
    }),
  );
}

const JUSTIFICATION_LABELS: Record<JustificationRow["justification"], string> = {
  none: "Not started",
  draft: "Draft",
  submitted: "Submitted",
  returned: "Returned",
};

export function justificationsCsv(rows: readonly JustificationRow[]): string {
  return toCsv(
    [
      "Program",
      "Course code",
      "Course title",
      "Lead",
      "Syllabus status",
      "Justification",
      "Justification updated (PHT)",
    ],
    rows.map((r): CsvCell[] => [
      r.program_code,
      r.course_code,
      r.course_title,
      r.lead_name,
      STATUS_LABELS[r.syllabus_status],
      JUSTIFICATION_LABELS[r.justification],
      phtDateTime(r.justification_updated),
    ]),
  );
}
