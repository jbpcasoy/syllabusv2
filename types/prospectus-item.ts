import type { RecordModel } from "pocketbase";
import type { Course } from "./course";
import type { Prospectus } from "./prospectus";
import type { Semester } from "./term";

export { SEMESTERS, type Semester } from "./term";

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
  /** ID of the course. Unique per prospectus. */
  course: string;
  semester: Semester;
  year_level: YearLevel;
  expand?: {
    prospectus?: Prospectus;
    course?: Course;
  };
}

export interface ProspectusItemInput {
  prospectus: string;
  course: string;
  semester: Semester;
  year_level: YearLevel;
}

/** The prospectus can't be changed after creation. */
export interface ProspectusItemUpdateInput {
  course?: string;
  semester?: Semester;
  year_level?: YearLevel;
}

/** Safe shape sent to the browser. */
export interface ProspectusItemResponse {
  id: string;
  prospectus: string;
  course: string;
  semester: Semester;
  year_level: YearLevel;
  created: string;
  updated: string;
  expand?: {
    prospectus?: {
      id: string;
      published: boolean;
      program?: { id: string; name: string; code: string };
      school_year?: { id: string; label: string };
    };
    course?: { id: string; code: string; title: string };
  };
}
