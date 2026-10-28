import type { SyllabusStatus } from "@/lib/syllabus-workflow";

/**
 * Overdue rules (Phase 5). Pure, so pages, routes and the browser share them.
 * Deadlines are indicators only and never block an action.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
/** Philippine time is UTC+8 all year (no daylight saving time). */
const PHT_OFFSET_MS = 8 * 60 * 60 * 1000;

/** A PocketBase datetime ("2026-12-01 00:00:00.000Z") or ISO string, or null. */
function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value.replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * When a deadline date stops being on time: 00:00 PHT the next day, which is
 * 16:00 UTC on the date itself. Takes "YYYY-MM-DD" or a PocketBase datetime
 * (only the day counts). Null when unset or malformed.
 */
export function deadlineEnd(date: string | null | undefined): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date ?? "");
  if (!match) return null;
  const [, y, m, d] = match.map(Number);
  const nextMidnightUtc = Date.UTC(y, m - 1, d + 1);
  return Number.isNaN(nextMidnightUtc)
    ? null
    : new Date(nextMidnightUtc - PHT_OFFSET_MS);
}

/**
 * Whole days late, counting the first (partial) day as 1: an hour late is
 * 1 day, a day and an hour is still 1, two full days is 2. 0 when on time
 * or there is no due date.
 */
export function daysOverdue(due: Date | null, now: Date): number {
  if (!due) return 0;
  const late = now.getTime() - due.getTime();
  return late >= 0 ? Math.max(1, Math.floor(late / DAY_MS)) : 0;
}

/** What occupies a (program, course, term) slot. */
export interface SlotState {
  /** The slot's own syllabus, or null when there is none. */
  syllabusStatus: SyllabusStatus | null;
  /** A pending or approved reference to another program's syllabus. */
  hasReference: boolean;
}

/**
 * Past the term's submission deadline with nothing submitted: no syllabus or
 * only a draft, and no pending or approved reference.
 */
export function isSubmissionOverdue(
  term: { submission_deadline: string },
  slot: SlotState,
  now: Date,
): boolean {
  if (slot.hasReference) return false;
  if (slot.syllabusStatus && slot.syllabusStatus !== "draft") return false;
  return daysOverdue(deadlineEnd(term.submission_deadline), now) > 0;
}

/** When a syllabus waiting since `statusChangedAt` becomes overdue, or null. */
export function reviewDueAt(
  statusChangedAt: string | null | undefined,
  reviewDays: number,
): Date | null {
  const since = parseDate(statusChangedAt);
  if (!since || !(reviewDays > 0)) return null;
  return new Date(since.getTime() + reviewDays * DAY_MS);
}

/**
 * Waiting at its stage longer than the term's review limit. Only `submitted`
 * syllabi wait on a reviewer: returned ones are with faculty, and approved
 * and filed ones are done.
 */
export function isReviewOverdue(
  syllabus: { status: SyllabusStatus; status_changed_at?: string },
  term: { review_days: number },
  now: Date,
): boolean {
  if (syllabus.status !== "submitted") return false;
  return (
    daysOverdue(reviewDueAt(syllabus.status_changed_at, term.review_days), now) >
    0
  );
}
