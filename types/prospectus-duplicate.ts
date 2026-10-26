import type { Semester, YearLevel } from "./prospectus-item";

/** Copy one program's prospectus from one school year into another. */
export interface ProspectusDuplicateInput {
  program: string;
  /** School year ID of the prospectus to copy. */
  source_school_year: string;
  /** School year ID to copy into. Its prospectus is created if missing. */
  target_school_year: string;
}

export interface ProspectusDuplicateItem {
  course: { id: string; code: string; title: string };
  year_level: YearLevel;
  semester: Semester;
}

/** Safe shape sent to the browser, for both the preview and the result. */
export interface ProspectusDuplicateResponse {
  source: {
    id: string;
    program: { id: string; name: string; code: string };
    school_year: { id: string; label: string };
  };
  target_school_year: { id: string; label: string };
  /** The existing target prospectus, or null when it will be created. */
  target: { id: string; published: boolean } | null;
  /** Items that will be (or were) copied. */
  copy: ProspectusDuplicateItem[];
  /** Items skipped because the target already lists that course. */
  skip: ProspectusDuplicateItem[];
}
