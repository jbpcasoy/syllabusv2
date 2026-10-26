import type { RecordModel } from "pocketbase";
import type { SchoolYear } from "./school-year";

export const SEMESTERS = [
  "First Semester",
  "Second Semester",
  "Summer",
] as const;
export type Semester = (typeof SEMESTERS)[number];

export interface Term extends RecordModel {
  /** ID of the school year. */
  school_year: string;
  semester: Semester;
  /** Open terms accept syllabus submissions (Phase 2). */
  open: boolean;
  /** PocketBase datetime ("2026-12-01 00:00:00.000Z") or "" when unset. */
  submission_deadline: string;
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
}

/** The school year can't be changed after creation. */
export interface TermUpdateInput {
  semester?: Semester;
  open?: boolean;
  /** "YYYY-MM-DD", or null to clear. */
  submission_deadline?: string | null;
}

/** Safe shape sent to the browser. */
export interface TermResponse {
  id: string;
  school_year: string;
  semester: Semester;
  open: boolean;
  /** "YYYY-MM-DD" or "" when unset. */
  submission_deadline: string;
  created: string;
  updated: string;
  expand?: {
    school_year?: { id: string; label: string };
  };
}
