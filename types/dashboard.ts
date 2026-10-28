import type { SyllabusStatus } from "@/lib/syllabus-workflow";

/**
 * Whose data a dashboard viewer sees. Global for admin, VPAA, FDIS chair and
 * CITL director; otherwise the union of a dean's colleges, a head's
 * departments, and a chair's or program reviewer's programs.
 */
export type DashboardScope =
  | { all: true }
  | {
      all: false;
      collegeIds: string[];
      departmentIds: string[];
      programIds: string[];
    };

/** Optional narrowing from the query string. Never widens the scope. */
export interface DashboardFilters {
  college?: string;
  department?: string;
  program?: string;
}

/** A program with its org chain, as the dashboard groups it. */
export interface ProgramOrg {
  id: string;
  code: string;
  name: string;
  departmentId: string;
  departmentName: string;
  collegeId: string;
  collegeName: string;
}

/** What aggregate() reads for one term. */
export interface TermSlots {
  programs: ProgramOrg[];
  /** Courses each program's published prospectus lists for the term. */
  expected: { program: string; course: string }[];
  syllabi: {
    program: string;
    course: string;
    status: SyllabusStatus;
    stage: number;
    status_changed_at: string;
  }[];
  /** Pending or approved references, with the source syllabus's status. */
  references: { program: string; course: string; sourceStatus: SyllabusStatus | "" }[];
}

export interface DashboardCounts {
  /** Expected slots with no syllabus and no reference. */
  notStarted: number;
  draft: number;
  /** Index 0 is stage 1. */
  waiting: number[];
  returned: number;
  /** Awaiting the signed copy. */
  approved: number;
  filed: number;
  /** Expected slots covered by a pending or approved reference. */
  referenced: number;
  overdueSubmission: number;
  overdueReview: number;
}

export type CompletionLevel = "college" | "department" | "program";

/** One row of the completion table, rolled up program → department → college. */
export interface CompletionRow {
  level: CompletionLevel;
  id: string;
  name: string;
  /** The department of a program, or the college of a department; "" for colleges. */
  parentId: string;
  expected: number;
  filed: number;
  /** filed ÷ expected, or null when nothing is expected. */
  rate: number | null;
  overdueSubmission: number;
  overdueReview: number;
}

/** One row of GET /api/dashboard/signed-copies: approved, no valid scan yet. */
export interface SignedCopyRow {
  /** Syllabus id. */
  id: string;
  course_code: string;
  course_title: string;
  program_code: string;
  lead_name: string;
  /** When the VPAA approved it (status_changed_at). */
  approved_at: string;
}

/** "none" when no justification has been started. */
export const JUSTIFICATION_STATES = ["none", "draft", "submitted", "returned"] as const;
export type JustificationState = (typeof JUSTIFICATION_STATES)[number];

/** One row of GET /api/dashboard/justifications. */
export interface JustificationRow {
  /** Syllabus id. */
  id: string;
  course_code: string;
  course_title: string;
  program_code: string;
  lead_name: string;
  syllabus_status: "approved" | "filed";
  justification: JustificationState;
  /** Last change to the justification, or "" for none. */
  justification_updated: string;
}

/** One row of the filtered syllabus export. */
export interface SyllabusExportRow {
  /** Syllabus id. */
  id: string;
  course_code: string;
  course_title: string;
  program_code: string;
  lead_name: string;
  status: SyllabusStatus;
  stage: number;
  status_changed_at: string;
}

export const EXPORT_VIEWS = [
  "completion",
  "syllabi",
  "signed-copies",
  "justifications",
] as const;
export type ExportView = (typeof EXPORT_VIEWS)[number];

/** Rows past this are cut and the response says so (X-Truncated). */
export const EXPORT_ROW_LIMIT = 5000;

/** Body of GET /api/dashboard/scope: what the filters may offer. */
export interface DashboardScopeResponse {
  /** Programs in the caller's dashboard scope, with their org chain. */
  programs: ProgramOrg[];
  /** The caller may open the justification panel. */
  justifications: boolean;
}

/** Body of GET /api/dashboard/summary. */
export interface DashboardSummary {
  counts: DashboardCounts;
  completion: CompletionRow[];
}
