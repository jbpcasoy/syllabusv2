import type { ScopeChain } from "@/lib/capability-rules";
import { createAdminPb } from "@/lib/pocketbase";
import "server-only";

/**
 * What a capability check is about. Creates pass the parent from the request
 * body; updates and deletes of assignment records pass the record id.
 */
export type ScopeTarget =
  | { program: string }
  | { department: string }
  | { college: string }
  | { programChair: string }
  | { departmentHead: string }
  | { faculty: string }
  | { programJoinRequest: string };

/**
 * Walks program → department → college. A missing record throws PocketBase's
 * 404, which routes already turn into a response via handlePbError.
 */
export async function resolveScope(target: ScopeTarget): Promise<ScopeChain> {
  if ("college" in target) return { collegeId: target.college };

  const pb = await createAdminPb();

  const departmentScope = async (departmentId: string) => {
    const department = await pb
      .collection("departments")
      .getOne<{ college: string }>(departmentId, { fields: "college" });
    return { departmentId, collegeId: department.college || undefined };
  };

  const programScope = async (programId: string): Promise<ScopeChain> => {
    const program = await pb
      .collection("programs")
      .getOne<{ department: string }>(programId, { fields: "department" });
    if (!program.department) return { programId };
    return { programId, ...(await departmentScope(program.department)) };
  };

  if ("department" in target) return departmentScope(target.department);
  if ("program" in target) return programScope(target.program);

  if ("departmentHead" in target) {
    const head = await pb
      .collection("department_heads")
      .getOne<{ department: string }>(target.departmentHead, {
        fields: "department",
      });
    return departmentScope(head.department);
  }

  const [collection, id] =
    "programChair" in target
      ? ["program_chairs", target.programChair]
      : "faculty" in target
        ? ["faculties", target.faculty]
        : ["program_join_requests", target.programJoinRequest];
  const record = await pb
    .collection(collection)
    .getOne<{ program: string }>(id, { fields: "program" });
  return programScope(record.program);
}
