import type { RecordModel } from "pocketbase";
import type { Syllabus } from "./syllabus";
import type { AppUser } from "./user";

/** 20 MB. Matches `maxSize` on syllabus_versions.file. */
export const MAX_PDF_BYTES = 20 * 1024 * 1024;

/** Matches the `max` on syllabus_versions.notes. */
export const MAX_VERSION_NOTES = 1000;

export interface SyllabusVersion extends RecordModel {
  /** ID of the syllabus. */
  syllabus: string;
  /** 1, 2, 3... Unique per syllabus. */
  version_no: number;
  /** Stored file name. Protected: never sent to the browser. */
  file: string;
  /** ID of the user who uploaded it. */
  uploaded_by: string;
  /** "" when empty. */
  notes: string;
  expand?: {
    syllabus?: Syllabus;
    uploaded_by?: AppUser;
  };
}

/** Text fields of the multipart POST /api/syllabus/:id/version. */
export interface SyllabusVersionInput {
  notes: string;
}

/**
 * Safe shape sent to the browser. No file name or URL: the PDF is only
 * reachable through /api/syllabus/:id/version/:versionId/file.
 */
export interface SyllabusVersionResponse {
  id: string;
  syllabus: string;
  version_no: number;
  notes: string;
  uploaded_by: string;
  created: string;
  expand?: {
    uploaded_by?: { id: string; name: string };
  };
}
