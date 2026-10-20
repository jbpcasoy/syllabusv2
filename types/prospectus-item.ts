import type { RecordModel } from "pocketbase";
import type { Prospectus } from "./prospectus";

export const SEMESTERS = [
  "First Semester",
  "Second Semester",
  "Summer",
] as const;
export type Semester = (typeof SEMESTERS)[number];

export const YEAR_LEVELS = [
  "First Year",
  "Second Year",
  "Third Year",
  "Fourth Year",
  "Masteral",
  "Doctoral",
] as const;
export type YearLevel = (typeof YEAR_LEVELS)[number];

export interface ProspectusItem extends RecordModel {
  /** ID of the prospectus. */
  prospectus: string;
  semester: Semester;
  year_level: YearLevel;
  /** 1-10 characters. */
  subject_code: string;
  /** 1-255 characters. */
  title: string;
  expand?: {
    prospectus?: Prospectus;
  };
}

export interface ProspectusItemInput {
  prospectus: string;
  semester: Semester;
  year_level: YearLevel;
  subject_code: string;
  title: string;
}

/** The prospectus can't be changed after creation. */
export interface ProspectusItemUpdateInput {
  semester?: Semester;
  year_level?: YearLevel;
  subject_code?: string;
  title?: string;
}

/** Safe shape sent to the browser. */
export interface ProspectusItemResponse {
  id: string;
  prospectus: string;
  semester: Semester;
  year_level: YearLevel;
  subject_code: string;
  title: string;
  created: string;
  updated: string;
  expand?: {
    prospectus?: {
      id: string;
      school_year: string;
      published: boolean;
      program?: { id: string; name: string; code: string };
    };
  };
}
