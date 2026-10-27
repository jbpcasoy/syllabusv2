import type { RecordModel } from "pocketbase";
import type { AppUser } from "./user";

export const FORM17_ANSWERS = ["yes", "no"] as const;
export type Form17Answer = (typeof FORM17_ANSWERS)[number];

/** Matches the text field limits in form17_answers and syllabus_versions. */
export const MAX_FORM17_REMARKS = 2000;
export const MAX_FORM17_SUGGESTIONS = 5000;

/** One criterion's answer for one syllabus version. */
export interface Form17AnswerRecord extends RecordModel {
  version: string;
  /** "A1" .. "I6". */
  criterion: string;
  answer: Form17Answer;
  remarks: string;
  /** Form revision the answer was given against. */
  form_revision: string;
  last_edited_by: string;
  created: string;
  updated: string;
  expand?: { last_edited_by?: AppUser };
}

/** An edit made after stage 1. Append-only. */
export interface Form17ChangeRecord extends RecordModel {
  answer: string;
  stage: number;
  by: string;
  /** "" when the change created the answer. */
  from_answer: string;
  to_answer: string;
  from_remarks: string;
  to_remarks: string;
  created: string;
  expand?: { by?: AppUser; answer?: Form17AnswerRecord };
}

export interface Form17AnswerInput {
  criterion: string;
  answer: Form17Answer;
  remarks: string;
}

/** Body of PUT /api/syllabus/:id/form17. Only the listed criteria change. */
export interface Form17Input {
  answers: Form17AnswerInput[];
  /** Omit to leave the suggestions as they are. */
  suggestions?: string;
}

/** Safe shape sent to the browser. */
export interface Form17Response {
  version: { id: string; version_no: number };
  /** The revision the answers use; the current one when there are none. */
  form_revision: string;
  answers: {
    criterion: string;
    answer: Form17Answer;
    remarks: string;
    last_edited_by: { id: string; name: string };
    updated: string;
  }[];
  suggestions: string;
  /** Every criterion answered. */
  complete: boolean;
  /** At least one "No", which blocks approval. */
  has_no: boolean;
  /** Edits after stage 1, oldest first. */
  changes: {
    criterion: string;
    stage: number;
    by: { id: string; name: string };
    from_answer: string;
    to_answer: string;
    from_remarks: string;
    to_remarks: string;
    created: string;
  }[];
}
