import type { SyllabusStatus } from "@/lib/syllabus-workflow";
import type { JustificationStatus } from "@/types/justification";

/**
 * Pure rules for the Justification Form. It never blocks the syllabus;
 * these only say when the justification itself may change.
 */

type Current = JustificationStatus | null;

/** Previous authors who still need acknowledging: those not on the current syllabus. */
export function eligibleAuthors(
  previous: { lead: string; co_authors: string[] },
  current: { lead: string; co_authors: string[] },
): string[] {
  const now = new Set([current.lead, ...current.co_authors]);
  return [previous.lead, ...previous.co_authors].filter(
    (id, i, all) => !!id && !now.has(id) && all.indexOf(id) === i,
  );
}

/** Why the lead can't edit the entries now, or null. */
export function editError(syllabus: SyllabusStatus, current: Current): string | null {
  if (syllabus !== "approved" && syllabus !== "filed") {
    return "A justification can be written once the syllabus is approved.";
  }
  if (current === "submitted") {
    return "The signed justification is submitted. It can change only if it is returned.";
  }
  return null;
}

/** Why the signed scan can't be submitted now, or null. */
export function submitScanError(
  syllabus: SyllabusStatus,
  current: Current,
  entryCount: number,
): string | null {
  const edit = editError(syllabus, current);
  if (edit) return edit;
  if (current === null || entryCount === 0) {
    return "Add at least one author and reason before uploading the signed letter.";
  }
  return null;
}

/** Why it can't be returned for revision now, or null. */
export function returnError(current: Current): string | null {
  return current === "submitted"
    ? null
    : "Only a submitted justification can be returned.";
}
