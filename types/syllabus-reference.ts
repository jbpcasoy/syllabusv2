import type { RecordModel } from "pocketbase";
import type { Course } from "./course";
import type { Program } from "./program";
import type { Syllabus, SyllabusStatus } from "./syllabus";
import type { Term } from "./term";
import type { AppUser } from "./user";

export const REFERENCE_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "withdrawn",
  "revoked",
] as const;
export type ReferenceStatus = (typeof REFERENCE_STATUSES)[number];

export const REFERENCE_ACTIONS = [
  "approve",
  "reject",
  "withdraw",
  "revoke",
] as const;
export type ReferenceAction = (typeof REFERENCE_ACTIONS)[number];

/** Matches the `max` on the note and reason fields. */
export const MAX_REFERENCE_TEXT = 500;

export interface SyllabusReference extends RecordModel {
  /** ID of the source syllabus (another program's). */
  syllabus: string;
  /** ID of the referencing program. */
  program: string;
  /** Copied from the source so the unique index can cover them. */
  course: string;
  term: string;
  /** ID of the chair who asked. */
  requested_by: string;
  /** "" when empty. */
  note: string;
  status: ReferenceStatus;
  /** Why it was rejected or revoked ("" otherwise). */
  reason: string;
  /** Approve or reject ("" while pending). */
  decided_by: string;
  decided_at: string;
  /** Withdraw or revoke ("" while live). */
  ended_by: string;
  ended_at: string;
  expand?: {
    syllabus?: Syllabus;
    program?: Program;
    course?: Course;
    term?: Term;
    requested_by?: AppUser;
    decided_by?: AppUser;
    ended_by?: AppUser;
  };
}

/** Body of POST /api/syllabus-reference. The requester is always the caller. */
export interface SyllabusReferenceInput {
  syllabus: string;
  program: string;
  note: string;
}

/** Body of PATCH /api/syllabus-reference/:id. */
export type ReferenceActionInput =
  | { action: "approve" | "withdraw" }
  | { action: "reject" | "revoke"; reason: string };

/** Safe shape sent to the browser. */
export interface SyllabusReferenceResponse {
  id: string;
  syllabus: string;
  program: string;
  course: string;
  term: string;
  requested_by: string;
  note: string;
  status: ReferenceStatus;
  reason: string;
  decided_by: string;
  decided_at: string;
  ended_by: string;
  ended_at: string;
  created: string;
  updated: string;
  expand?: {
    syllabus?: {
      id: string;
      status: SyllabusStatus;
      lead: string;
      program?: { id: string; name: string; code: string };
      lead_name?: string;
    };
    program?: { id: string; name: string; code: string };
    course?: { id: string; code: string; title: string };
    term?: { id: string; semester: string; school_year_label: string };
    requested_by?: { id: string; name: string };
    decided_by?: { id: string; name: string };
    ended_by?: { id: string; name: string };
  };
}
