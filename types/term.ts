import type { RecordModel } from "pocketbase";
import type { SchoolYear } from "./school-year";

export const SEMESTERS = [
  "First Semester",
  "Second Semester",
  "Summer",
] as const;
export type Semester = (typeof SEMESTERS)[number];

/** Matches the max on terms.review_days. */
export const MAX_REVIEW_DAYS = 90;

export interface Term extends RecordModel {
  /** ID of the school year. */
  school_year: string;
  semester: Semester;
  /** Open terms accept syllabus submissions (Phase 2). */
  open: boolean;
  /** PocketBase datetime ("2026-12-01 00:00:00.000Z") or "" when unset. */
  submission_deadline: string;
  /** Days a syllabus may wait at one stage before it is overdue; 0 = no limit. */
  review_days: number;
  expand?: {
    school_year?: SchoolYear;
  };
}

export interface TermInput {
  school_year: string;
  semester: Semester;
  /** Defaults to false on create. */
  open?: boolean;
  /** "YYYY-MM-DD", or null for none. */
  submission_deadline?: string | null;
  /** Days per stage, 0 to MAX_REVIEW_DAYS; 0 = no limit. Defaults to 0. */
  review_days?: number;
}

/** The school year can't be changed after creation. */
export interface TermUpdateInput {
  semester?: Semester;
  open?: boolean;
  /** "YYYY-MM-DD", or null to clear. */
  submission_deadline?: string | null;
  /** 0 removes the limit. */
  review_days?: number;
}

/** Safe shape sent to the browser. */
export interface TermResponse {
  id: string;
  school_year: string;
  semester: Semester;
  open: boolean;
  /** "YYYY-MM-DD" or "" when unset. */
  submission_deadline: string;
  /** Days a syllabus may wait at one stage; 0 = no limit. */
  review_days: number;
  created: string;
  updated: string;
  expand?: {
    school_year?: { id: string; label: string };
  };
}
