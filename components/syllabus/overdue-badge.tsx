import {
  daysOverdue,
  deadlineEnd,
  isSubmissionOverdue,
  reviewDueAt,
  type SlotState,
} from "@/lib/deadlines";
import type { SyllabusStatus } from "@/lib/syllabus-client";
import type { TermSummary } from "@/types/syllabus";

// Indicators only: deadlines never block an action. Text, not just colour.

type TermDeadlines = Pick<TermSummary, "submission_deadline" | "review_days">;

const plural = (days: number) => (days === 1 ? "1 day" : `${days} days`);

/** Days past the review limit at the syllabus's current stage, or 0. */
export function reviewOverdueDays(
  syllabus: { status: SyllabusStatus; status_changed_at: string },
  term: TermDeadlines | undefined,
): number {
  if (!term || syllabus.status !== "submitted") return 0;
  return daysOverdue(
    reviewDueAt(syllabus.status_changed_at, term.review_days),
    new Date(),
  );
}

/** Days past the term's submission deadline with nothing submitted, or 0. */
export function submissionOverdueDays(
  term: TermDeadlines | undefined,
  slot: SlotState,
): number {
  if (!term) return 0;
  const now = new Date();
  return isSubmissionOverdue(term, slot, now)
    ? daysOverdue(deadlineEnd(term.submission_deadline), now)
    : 0;
}

function Badge({ children, title }: { children: string; title?: string }) {
  return (
    <span
      title={title}
      className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20"
    >
      <span aria-hidden>!</span>
      {children}
    </span>
  );
}

/** "Overdue 3 days" on a syllabus waiting past the term's review limit. */
export function ReviewOverdueBadge({
  syllabus,
  term,
}: {
  syllabus: { status: SyllabusStatus; status_changed_at: string };
  term: TermDeadlines | undefined;
}) {
  const days = reviewOverdueDays(syllabus, term);
  if (days === 0) return null;
  return (
    <Badge title={`Waiting longer than the ${plural(term?.review_days ?? 0)} review limit`}>
      {`Overdue ${plural(days)}`}
    </Badge>
  );
}

/** "Past submission deadline" on a slot with nothing submitted in time. */
export function SubmissionOverdueBadge({
  term,
  slot,
}: {
  term: TermDeadlines | undefined;
  slot: SlotState;
}) {
  const days = submissionOverdueDays(term, slot);
  if (days === 0) return null;
  return (
    <Badge title={`Deadline ${term?.submission_deadline}, ${plural(days)} overdue`}>
      Past submission deadline
    </Badge>
  );
}
