import { approvalCode, parseApprovalCode } from "@/lib/approval-code";
import type { ActingAs } from "@/lib/syllabus-review";
import { CHAIN_ROLES } from "@/lib/syllabus-workflow";
import type { Course } from "@/types/course";
import type { Program } from "@/types/program";
import type { SyllabusReview } from "@/types/syllabus-review";
import type { Term } from "@/types/term";
import type { AppUser } from "@/types/user";
import type PocketBase from "pocketbase";
import "server-only";

/** What a printed approval code refers to. Metadata only, never the PDF. */
export interface VerifiedApproval {
  code: string;
  stage: number;
  stageLabel: string;
  actingAs: ActingAs;
  reviewerName: string;
  /** PocketBase datetime of the approval. */
  approvedAt: string;
  syllabusId: string;
  course: { code: string; title: string };
  program: { code: string; name: string };
  term: { semester: string; schoolYearLabel: string };
}

type ReviewWithExpand = SyllabusReview & {
  expand?: {
    reviewer?: AppUser;
    syllabus?: {
      expand?: { course?: Course; program?: Program; term?: Term };
    };
  };
};

/**
 * The approval behind a code, or null when the code is malformed or unknown.
 * The code is normalised first, so case and spacing don't matter.
 */
export async function findApproval(
  pb: PocketBase,
  code: string,
): Promise<VerifiedApproval | null> {
  const parts = parseApprovalCode(code);
  if (!parts) return null;
  const normalised = approvalCode(parts);

  const result = await pb
    .collection("syllabus_reviews")
    .getList<ReviewWithExpand>(1, 1, {
      skipTotal: true,
      expand: "reviewer,syllabus.course,syllabus.program,syllabus.term.school_year",
      filter: pb.filter("approval_code = {:code} && decision = 'approve'", {
        code: normalised,
      }),
    });
  const review = result.items[0];
  if (!review) return null;

  const syllabus = review.expand?.syllabus?.expand;
  return {
    code: normalised,
    stage: review.stage,
    stageLabel: CHAIN_ROLES[review.stage - 1]?.label ?? `Stage ${review.stage}`,
    actingAs: review.acting_as,
    reviewerName: review.expand?.reviewer?.name ?? "",
    approvedAt: review.created,
    syllabusId: review.syllabus,
    course: {
      code: syllabus?.course?.code ?? "",
      title: syllabus?.course?.title ?? "",
    },
    program: {
      code: syllabus?.program?.code ?? "",
      name: syllabus?.program?.name ?? "",
    },
    term: {
      semester: syllabus?.term?.semester ?? "",
      schoolYearLabel: syllabus?.term?.expand?.school_year?.label ?? "",
    },
  };
}
