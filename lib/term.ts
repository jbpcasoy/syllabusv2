import type {
  Term,
  TermInput,
  TermResponse,
  TermUpdateInput,
} from "@/types/term";
import type PocketBase from "pocketbase";
import "server-only";

/**
 * True once a syllabus in the term holds a ref_seq. Approval codes embed
 * the semester (SYL-2627-1-...), so changing it then would let another
 * term reuse codes already printed on signed forms.
 */
export async function termHasRefSeqs(
  pb: PocketBase,
  id: string,
): Promise<boolean> {
  const result = await pb.collection("syllabi").getList(1, 1, {
    skipTotal: true,
    fields: "id",
    filter: pb.filter("term = {:id} && ref_seq > 0", { id }),
  });
  return result.items.length > 0;
}

export function toTermResponse(record: Term): TermResponse {
  const schoolYear = record.expand?.school_year;
  return {
    id: record.id,
    school_year: record.school_year,
    semester: record.semester,
    open: record.open,
    // PocketBase stores "2026-12-01 00:00:00.000Z"; the UI only needs the day.
    submission_deadline: record.submission_deadline
      ? record.submission_deadline.slice(0, 10)
      : "",
    review_days: record.review_days ?? 0,
    created: record.created,
    updated: record.updated,
    expand: {
      ...(schoolYear && {
        school_year: { id: schoolYear.id, label: schoolYear.label },
      }),
    },
  };
}

/** Maps the validated input to PocketBase fields ("" clears a date). */
export function toTermRecord<T extends TermInput | TermUpdateInput>(
  data: T,
): Omit<T, "submission_deadline"> & { submission_deadline?: string } {
  const { submission_deadline, ...rest } = data;
  if (submission_deadline === undefined) return rest;
  return {
    ...rest,
    submission_deadline: submission_deadline
      ? `${submission_deadline} 00:00:00.000Z`
      : "",
  };
}
