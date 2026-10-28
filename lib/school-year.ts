import { createAdminPb } from "@/lib/pocketbase";
import type { SchoolYear, SchoolYearResponse } from "@/types/school-year";
import type PocketBase from "pocketbase";
import "server-only";

export function toSchoolYearResponse(record: SchoolYear): SchoolYearResponse {
  return {
    id: record.id,
    label: record.label,
    created: record.created,
    updated: record.updated,
  };
}

/** Collections that point at a school year. Constant, never user input. */
const DEPENDENTS = [
  { collection: "terms", singular: "term", plural: "terms" },
  { collection: "prospectuses", singular: "prospectus", plural: "prospectuses" },
];

/**
 * Returns a human-readable reason when terms or prospectuses still use the
 * school year, or null when it is safe to delete.
 */
export async function describeSchoolYearDependents(
  id: string,
): Promise<string | null> {
  const pb = await createAdminPb();

  const counts = await Promise.all(
    DEPENDENTS.map(async (dep) => {
      const result = await pb.collection(dep.collection).getList(1, 1, {
        filter: pb.filter("school_year = {:id}", { id }),
      });
      return { dep, count: result.totalItems };
    }),
  );

  const parts = counts
    .filter(({ count }) => count > 0)
    .map(({ dep, count }) => `${count} ${count === 1 ? dep.singular : dep.plural}`);

  if (parts.length === 0) return null;
  return `This school year still has ${parts.join(" and ")}. Delete them first.`;
}

/**
 * True once a syllabus in one of the school year's terms holds a ref_seq.
 * Approval codes embed the label (SYL-2627-...), so renaming it then would
 * let a new school year reuse codes already printed on signed forms.
 */
export async function schoolYearHasRefSeqs(
  pb: PocketBase,
  id: string,
): Promise<boolean> {
  const result = await pb.collection("syllabi").getList(1, 1, {
    skipTotal: true,
    fields: "id",
    filter: pb.filter("term.school_year = {:id} && ref_seq > 0", { id }),
  });
  return result.items.length > 0;
}
