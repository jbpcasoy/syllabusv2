import type { RecordModel } from "pocketbase";
import type { Program } from "./program";

export interface Course extends RecordModel {
  /** 1-20 characters. Unique. */
  code: string;
  /** 1-255 characters. */
  title: string;
  /** ID of the owning program. GE courses belong to the GE program. */
  program: string;
  credit_units: number;
  lec_units: number;
  lab_units: number;
  /** Nominal duration in hours. */
  nominal_duration_hours: number;
  /** IDs of prerequisite courses. */
  prerequisites: string[];
  /** Free-text prerequisite such as "Third year standing". "" when unset. */
  prerequisite_note: string;
  expand?: {
    program?: Program;
    prerequisites?: Course[];
  };
}

export interface CourseInput {
  code: string;
  title: string;
  program: string;
  credit_units?: number;
  lec_units?: number;
  lab_units?: number;
  nominal_duration_hours?: number;
  prerequisites?: string[];
  prerequisite_note?: string;
}

export type CourseUpdateInput = Partial<CourseInput>;

/** Safe shape sent to the browser. */
export interface CourseResponse {
  id: string;
  code: string;
  title: string;
  program: string;
  credit_units: number;
  lec_units: number;
  lab_units: number;
  nominal_duration_hours: number;
  prerequisites: string[];
  prerequisite_note: string;
  created: string;
  updated: string;
  expand?: {
    program?: { id: string; name: string; code: string };
    prerequisites?: { id: string; code: string; title: string }[];
  };
}
