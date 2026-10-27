import type { ChainHolders, StandIn } from "@/lib/syllabus-review";
import { CHAIN_ROLES, type ChainRole } from "@/lib/syllabus-workflow";
import type PocketBase from "pocketbase";
import "server-only";

/**
 * Active holder user ids per stage for the program: its program reviewer,
 * its college's dean, and the global FDIS chair, CITL director and VPAA.
 * Index 0 is stage 1.
 */
export async function loadChainHolders(
  pb: PocketBase,
  programId: string,
): Promise<ChainHolders> {
  const program = await pb
    .collection("programs")
    .getOne<{ department: string }>(programId, { fields: "department" });
  const department = program.department
    ? await pb
        .collection("departments")
        .getOne<{ college: string }>(program.department, { fields: "college" })
    : null;

  const activeUsers = async (
    collection: string,
    field?: string,
    id?: string,
  ): Promise<string[]> => {
    if (field && !id) return [];
    const filter = field
      ? pb.filter(`active = true && ${field} = {:id}`, { id })
      : "active = true";
    const rows = await pb
      .collection(collection)
      .getFullList<{ user: string }>({ fields: "user", filter });
    return rows.map((row) => row.user);
  };

  // Same order as CHAIN_ROLES.
  return Promise.all([
    activeUsers("program_reviewers", "program", programId),
    activeUsers("deans", "college", department?.college),
    activeUsers("fdis_chairs"),
    activeUsers("citl_directors"),
    activeUsers("vpaas"),
  ]);
}

/** The syllabus's stand-ins (stage 1 is the proxy). */
export async function loadStandIns(
  pb: PocketBase,
  syllabusId: string,
): Promise<StandIn[]> {
  return pb.collection("syllabus_stand_ins").getFullList<StandIn>({
    fields: "stage,user",
    filter: pb.filter("syllabus = {:syllabusId}", { syllabusId }),
  });
}

/** Chain roles with no active holder. Feeds the workflow's submit check. */
export function missingChainRoles(holders: ChainHolders): ChainRole[] {
  return CHAIN_ROLES.filter((_, i) => (holders[i] ?? []).length === 0).map(
    (r) => r.key,
  );
}

export async function findMissingChainRoles(
  pb: PocketBase,
  programId: string,
): Promise<ChainRole[]> {
  return missingChainRoles(await loadChainHolders(pb, programId));
}
