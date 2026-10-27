import type { RecordModel } from "pocketbase";
import type { AppUser } from "./user";

export const JUSTIFICATION_STATUSES = ["draft", "submitted", "returned"] as const;
export type JustificationStatus = (typeof JUSTIFICATION_STATUSES)[number];

/** Matches the limits in syllabus_justifications. */
export const MAX_JUSTIFICATION_REASON = 2000;
export const MAX_JUSTIFICATION_RETURN_REASON = 500;

/** One previous author who can't sign, and why. */
export interface JustificationEntry {
  /** User id of an author of last school year's syllabus. */
  author: string;
  reason: string;
}

export interface Justification extends RecordModel {
  syllabus: string;
  entries: JustificationEntry[];
  status: JustificationStatus;
  /** Stored file name of the signed letter's scan. Protected. */
  scan: string;
  submitted_at: string;
  return_reason: string;
  returned_by: string;
  returned_at: string;
  created: string;
  updated: string;
  expand?: { returned_by?: AppUser };
}

/** Body of PUT /api/syllabus/:id/justification. [] deletes a draft. */
export interface JustificationInput {
  entries: JustificationEntry[];
}

/** Body of PATCH /api/syllabus/:id/justification. */
export interface JustificationReturnInput {
  reason: string;
}

/** GET /api/syllabus/:id/justification. No file names. */
export interface JustificationResponse {
  /** A previous syllabus exists, so its authors are acknowledged. */
  applies: boolean;
  /** Previous authors who may get an entry (not current authors). */
  eligible_authors: { id: string; name: string }[];
  justification: {
    id: string;
    status: JustificationStatus;
    entries: { author: { id: string; name: string }; reason: string }[];
    has_scan: boolean;
    submitted_at: string;
    return_reason: string;
    returned_by: { id: string; name: string } | null;
    returned_at: string;
    updated: string;
  } | null;
  /** The caller is the lead and the entries can change now. */
  can_edit: boolean;
  /** The caller holds justification.return for this program. */
  can_return: boolean;
}
