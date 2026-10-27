import type { RecordModel } from "pocketbase";
import type { AppUser } from "./user";

/** Matches the text field limit in syllabus_signed_copies. */
export const MAX_SIGNED_COPY_REASON = 500;

/** A scan of the wet-signed syllabus. At most one "valid" per syllabus. */
export interface SignedCopy extends RecordModel {
  syllabus: string;
  /** Stored file name. Protected: never sent to the browser. */
  file: string;
  uploaded_by: string;
  status: "valid" | "returned";
  /** Why it was returned; "" while valid. */
  reason: string;
  returned_by: string;
  /** PocketBase datetime, or "". */
  returned_at: string;
  created: string;
  expand?: { uploaded_by?: AppUser; returned_by?: AppUser };
}

/** Body of PATCH /api/syllabus/:id/signed-copy/:copyId. */
export interface SignedCopyReturnInput {
  reason: string;
}

/** Safe shape sent to the browser. No file name or URL. */
export interface SignedCopyResponse {
  id: string;
  status: "valid" | "returned";
  reason: string;
  uploaded_by: { id: string; name: string };
  returned_by: { id: string; name: string } | null;
  returned_at: string;
  created: string;
}
