import type { RecordModel } from "pocketbase";
import type { Program } from "./program";

export interface Prospectus extends RecordModel {
  /** ID of the program. */
  program: string;
  /** Format "YYYY-YYYY", e.g. "2026-2027". */
  school_year: string;
  /** Unpublished prospectuses are only visible to managers. */
  published: boolean;
  expand?: {
    program?: Program;
  };
}

export interface ProspectusInput {
  program: string;
  school_year: string;
  /** Defaults to false on create. */
  published?: boolean;
}

export interface ProspectusUpdateInput {
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
  };
}
