import { CHAIN_ROLES, type ChainRole } from "@/lib/syllabus-workflow";
import type PocketBase from "pocketbase";
import "server-only";

/**
 * Chain roles with no active holder for the program: its chair, its
 * department's head, its college's dean, and the global FDIS chair, CITL
 * director and VPAA. Feeds the workflow's submit check.
 */
export async function findMissingChainRoles(
  pb: PocketBase,
  programId: string,
): Promise<ChainRole[]> {
  const program = await pb
    .collection("programs")
    .getOne<{ department: string }>(programId, { fields: "department" });
  const department = program.department
    ? await pb
        .collection("departments")
        .getOne<{ college: string }>(program.department, { fields: "college" })
    : null;

  const hasActive = async (collection: string, field?: string, id?: string) => {
    if (field && !id) return false;
    const filter = field
      ? pb.filter(`active = true && ${field} = {:id}`, { id })
      : "active = true";
    const result = await pb
      .collection(collection)
      .getList(1, 1, { skipTotal: true, fields: "id", filter });
    return result.items.length > 0;
  };

  // Same order as CHAIN_ROLES.
  const present = await Promise.all([
    hasActive("program_chairs", "program", programId),
    hasActive("department_heads", "department", program.department),
    hasActive("deans", "college", department?.college),
    hasActive("fdis_chairs"),
    hasActive("citl_directors"),
    hasActive("vpaas"),
  ]);

  return CHAIN_ROLES.filter((_, i) => !present[i]).map((r) => r.key);
}
