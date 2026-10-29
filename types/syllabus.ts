import type { ReviewContext } from "@/lib/syllabus-review";
import type { SyllabusStatus } from "@/lib/syllabus-workflow";
import type { RecordModel } from "pocketbase";
import type { Course } from "./course";
import type { Program } from "./program";
import type { Term } from "./term";
import type { AppUser } from "./user";

export { SYLLABUS_STATUSES, type SyllabusStatus } from "@/lib/syllabus-workflow";

/** Matches `maxSelect` on syllabi.co_authors. */
export const MAX_CO_AUTHORS = 50;

/**
 * How the caller relates to a syllabus. Callers with none get a 404.
 * `reviewer`: a chain holder or stand-in, once the syllabus leaves draft.
 * `referencer`: active faculty or the chair of a program with an approved
 * reference to it.
 * `designator`: may name a draft's proxy (canDesignate for stage 1). Only
 * GET /api/syllabus/:id grants it; it opens no PDFs, forms or timeline.
 */
export type SyllabusAccess =
  | "lead"
  | "coAuthor"
  | "admin"
  | "reviewer"
  | "referencer"
  | "designator";

export interface Syllabus extends RecordModel {
  /** ID of the course. */
  course: string;
  /** ID of the term. */
  term: string;
  /** ID of the target program. Unique with course and term. */
  program: string;
  /** ID of the lead author, the only editor. */
  lead: string;
  /** IDs of co-authors (view only). */
  co_authors: string[];
  /** Changes only through lib/syllabus-workflow.ts. */
  status: SyllabusStatus;
  /** 0 while not routed, otherwise 1 to 6. */
  stage: number;
  /** PocketBase datetime, or "" while a draft. */
  submitted_at: string;
  /** Prefix of every approval code; 0 until first submit. */
  ref_seq: number;
  /** PocketBase datetime of the latest return, or "". */
  returned_at: string;
  /** Last school year's syllabus for the slot, set on create; "" if none. */
  based_on: string;
  /** PocketBase datetime of the latest transition, or "" while a draft. */
  status_changed_at?: string;
  expand?: {
    course?: Course;
    term?: Term;
    program?: Program;
    lead?: AppUser;
    co_authors?: AppUser[];
  };
}

/** The term facts every syllabus row carries, including its deadlines. */
export interface TermSummary {
  id: string;
  semester: string;
  school_year_label: string;
  /** "YYYY-MM-DD" or "" when unset. */
  submission_deadline: string;
  /** Days per stage; 0 = no limit. */
  review_days: number;
}

/** Body of POST /api/syllabus. The lead is always the caller. */
export interface SyllabusInput {
  course: string;
  term: string;
  program: string;
}

/** Body of PUT /api/syllabus/:id/lead. */
export interface LeadTransferInput {
  lead: string;
  /** Keep the previous lead as a co-author. Defaults to true. */
  keep_previous: boolean;
  /** Why, 10 to 500 characters. Required when an admin overrides the chair. */
  reason?: string;
}

/** Body of PATCH /api/syllabus/:id. Replaces the whole co-author list. */
export interface SyllabusUpdateInput {
  co_authors: string[];
}

/**
 * A course the caller may author for an open term and one of their programs,
 * from GET /api/syllabus/available. `syllabus` is set when the program
 * already has one (the caller can ask its lead to be added as a co-author).
 */
export interface AvailableSyllabusRow {
  course: { id: string; code: string; title: string };
  term: TermSummary;
  program: { id: string; name: string; code: string };
  year_level: string;
  syllabus?: { id: string; status: SyllabusStatus; lead_name: string };
  /** A pending or approved reference to another program's syllabus. */
  reference?: {
    id: string;
    status: "pending" | "approved";
    source_program_code: string;
  };
}

/**
 * Another program's syllabus a chair may reference, from
 * GET /api/syllabus-reference/sources. Metadata only, no PDFs.
 */
export interface ReferenceSourceRow {
  id: string;
  status: SyllabusStatus;
  submitted_at: string;
  course: { id: string; code: string; title: string };
  program: { id: string; name: string; code: string };
  lead_name: string;
}

/** An eligible co-author, from GET /api/syllabus/:id/co-author-candidates. */
export interface CoAuthorCandidate {
  id: string;
  name: string;
  email: string;
}

/** Safe shape sent to the browser. */
export interface SyllabusResponse {
  id: string;
  course: string;
  term: string;
  program: string;
  lead: string;
  co_authors: string[];
  status: SyllabusStatus;
  stage: number;
  submitted_at: string;
  /** Latest return, or "". */
  returned_at: string;
  /** Last school year's syllabus for the slot, or "". */
  based_on: string;
  /** Latest transition, or "" while a draft. */
  status_changed_at: string;
  created: string;
  updated: string;
  /** The caller's relation, set by routes that know the caller. */
  access?: SyllabusAccess;
  /** What the caller may do in review, set by GET /api/syllabus/:id. */
  review?: ReviewContext;
  /** signedCopy.return in this program; set by GET /api/syllabus/:id. */
  can_return_signed_copy?: boolean;
  /** syllabus.transferLead in this program; set by GET /api/syllabus/:id. */
  can_transfer_lead?: boolean;
  /** An admin who isn't the chair: a transfer needs a reason. */
  lead_transfer_is_override?: boolean;
  expand?: {
    course?: { id: string; code: string; title: string };
    term?: TermSummary;
    program?: { id: string; name: string; code: string };
    lead?: { id: string; name: string; email: string };
    co_authors?: { id: string; name: string; email: string }[];
  };
}
