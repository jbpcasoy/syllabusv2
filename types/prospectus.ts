import type { RecordModel } from "pocketbase";
import type { Program } from "./program";
import type { SchoolYear } from "./school-year";

export interface Prospectus extends RecordModel {
  /** ID of the program. */
  program: string;
  /** ID of the school year. */
  school_year: string;
  /** Unpublished prospectuses are only visible to managers. */
  published: boolean;
  expand?: {
    program?: Program;
    school_year?: SchoolYear;
  };
}

export interface ProspectusInput {
  program: string;
  /** School year record ID. */
  school_year: string;
  /** Defaults to false on create. */
  published?: boolean;
}

export interface ProspectusUpdateInput {
  /** School year record ID. */
  school_year?: string;
  published?: boolean;
}

/** Safe shape sent to the browser. */
export interface ProspectusResponse {
  id: string;
  program: string;
  school_year: string;
  published: boolean;
  created: string;
  updated: string;
  expand?: {
    program?: { id: string; name: string; code: string };
    school_year?: { id: string; label: string };
  };
}
