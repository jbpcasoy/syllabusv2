import type { ApprovalStamp, ExportSyllabus } from "@/lib/forms/export";
import type { Syllabus } from "@/types/syllabus";
import type { SyllabusReview } from "@/types/syllabus-review";
import type { AppUser } from "@/types/user";
import type PocketBase from "pocketbase";
import "server-only";

/** The syllabus fields every form export prints. */
export async function loadExportSyllabus(
  pb: PocketBase,
  syllabusId: string,
): Promise<ExportSyllabus> {
  const syllabus = await pb.collection("syllabi").getOne<Syllabus>(syllabusId, {
    expand: "course,program,term.school_year,lead,co_authors",
  });
  const e = syllabus.expand;
  return {
    courseCode: e?.course?.code ?? "",
    courseTitle: e?.course?.title ?? "",
    programCode: e?.program?.code ?? "",
    programName: e?.program?.name ?? "",
    schoolYearLabel: e?.term?.expand?.school_year?.label ?? "",
    semester: e?.term?.semester ?? "",
    leadName: e?.lead?.name ?? "",
    coAuthorNames: (e?.co_authors ?? []).map((u) => u.name),
  };
}

/**
 * The latest approval at each stage. A return makes a stage approve again
 * on the new version; the newest approval is the one that is signed.
 */
export async function listApprovals(
  pb: PocketBase,
  syllabusId: string,
): Promise<ApprovalStamp[]> {
  const rows = await pb
    .collection("syllabus_reviews")
    .getFullList<SyllabusReview & { expand?: { reviewer?: AppUser } }>({
      expand: "reviewer",
      sort: "-created",
      filter: pb.filter("syllabus = {:syllabusId} && decision = 'approve'", {
        syllabusId,
      }),
    });

  const latest = new Map<number, ApprovalStamp>();
  for (const row of rows) {
    if (latest.has(row.stage)) continue;
    latest.set(row.stage, {
      stage: row.stage,
      reviewerName: row.expand?.reviewer?.name ?? "",
      actingAs: row.acting_as,
      approvalCode: row.approval_code,
      approvedAt: row.created,
    });
  }
  return [...latest.values()].sort((a, b) => a.stage - b.stage);
}
