import type {
  SyllabusVersion,
  SyllabusVersionResponse,
} from "@/types/syllabus-version";
import type PocketBase from "pocketbase";
import "server-only";

export const SYLLABUS_VERSION_EXPAND = "uploaded_by";

/** Never includes the stored file name: PDFs go through the file route. */
export function toSyllabusVersionResponse(
  record: SyllabusVersion,
): SyllabusVersionResponse {
  const uploader = record.expand?.uploaded_by;
  return {
    id: record.id,
    syllabus: record.syllabus,
    version_no: record.version_no,
    notes: record.notes,
    uploaded_by: record.uploaded_by,
    created: record.created,
    expand: {
      ...(uploader && {
        uploaded_by: { id: uploader.id, name: uploader.name },
      }),
    },
  };
}

/**
 * Fetches a protected PDF from PocketBase with a short-lived superuser file
 * token. Server-side only: the URL (and token) never reach the browser.
 */
export async function fetchVersionFile(
  pb: PocketBase,
  version: Pick<SyllabusVersion, "id" | "collectionId" | "collectionName" | "file">,
): Promise<Response> {
  const token = await pb.files.getToken();
  const url = pb.files.getURL(version, version.file, { token });
  return fetch(url, { cache: "no-store" });
}

/** "IT101-BSIT-v2.pdf": only letters, digits and dashes survive. */
export function versionFileName(
  courseCode: string,
  programCode: string,
  versionNo: number,
): string {
  const clean = (value: string) =>
    value.replace(/[^A-Za-z0-9-]+/g, "").slice(0, 40) || "syllabus";
  return `${clean(courseCode)}-${clean(programCode)}-v${versionNo}.pdf`;
}

/** The newest version (id, number, upload time), or null when there is none. */
export async function latestVersion(
  pb: PocketBase,
  syllabusId: string,
): Promise<Pick<SyllabusVersion, "id" | "version_no" | "created"> | null> {
  const result = await pb
    .collection("syllabus_versions")
    .getList<Pick<SyllabusVersion, "id" | "version_no" | "created">>(1, 1, {
      skipTotal: true,
      fields: "id,version_no,created",
      sort: "-version_no",
      filter: pb.filter("syllabus = {:syllabusId}", { syllabusId }),
    });
  return result.items[0] ?? null;
}

/** Highest version number of the syllabus, or 0 when it has none. */
export async function latestVersionNo(
  pb: PocketBase,
  syllabusId: string,
): Promise<number> {
  const result = await pb
    .collection("syllabus_versions")
    .getList<Pick<SyllabusVersion, "version_no">>(1, 1, {
      skipTotal: true,
      fields: "version_no",
      sort: "-version_no",
      filter: pb.filter("syllabus = {:syllabusId}", { syllabusId }),
    });
  return result.items[0]?.version_no ?? 0;
}
