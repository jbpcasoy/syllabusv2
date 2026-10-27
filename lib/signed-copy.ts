import type { SignedCopy, SignedCopyResponse } from "@/types/signed-copy";
import type PocketBase from "pocketbase";
import "server-only";

export const SIGNED_COPY_EXPAND = "uploaded_by,returned_by";

export function toSignedCopyResponse(record: SignedCopy): SignedCopyResponse {
  const returnedBy = record.expand?.returned_by;
  return {
    id: record.id,
    status: record.status,
    reason: record.reason,
    uploaded_by: {
      id: record.uploaded_by,
      name: record.expand?.uploaded_by?.name ?? "",
    },
    returned_by: record.returned_by
      ? { id: record.returned_by, name: returnedBy?.name ?? "" }
      : null,
    returned_at: record.returned_at,
    created: record.created,
  };
}

/** Every signed copy of the syllabus, newest first. */
export async function listSignedCopies(
  pb: PocketBase,
  syllabusId: string,
): Promise<SignedCopyResponse[]> {
  const rows = await pb
    .collection("syllabus_signed_copies")
    .getFullList<SignedCopy>({
      expand: SIGNED_COPY_EXPAND,
      sort: "-created",
      filter: pb.filter("syllabus = {:syllabusId}", { syllabusId }),
    });
  return rows.map(toSignedCopyResponse);
}

/** "IT101-BSIT-signed.pdf": only letters, digits and dashes survive. */
export function signedCopyFileName(courseCode: string, programCode: string) {
  const clean = (value: string) =>
    value.replace(/[^A-Za-z0-9-]+/g, "").slice(0, 40) || "syllabus";
  return `${clean(courseCode)}-${clean(programCode)}-signed.pdf`;
}
