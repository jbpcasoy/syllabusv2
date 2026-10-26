import { createAdminPb } from "@/lib/pocketbase";
import type { Department } from "@/types/department";
import type {
  DepartmentHead,
  DepartmentHeadResponse,
} from "@/types/department-head";
import "server-only";

export function toDepartmentHeadResponse(
  record: DepartmentHead,
): DepartmentHeadResponse {
  const user = record.expand?.user;
  const department = record.expand?.department;
  return {
    id: record.id,
    user: record.user,
    department: record.department,
    active: record.active,
    created: record.created,
    updated: record.updated,
    expand: {
      ...(user && {
        user: { id: user.id, name: user.name, email: user.email },
      }),
      ...(department && {
        department: { id: department.id, name: department.name },
      }),
    },
  };
}

/** True if the department already has an active head (optionally ignoring one record). */
export async function departmentHasActiveHead(
  departmentId: string,
  exceptId?: string,
): Promise<boolean> {
  const pb = await createAdminPb();
  const result = await pb.collection("department_heads").getList(1, 1, {
    skipTotal: true,
    filter: exceptId
      ? pb.filter(
          "department = {:departmentId} && active = true && id != {:exceptId}",
          { departmentId, exceptId },
        )
      : pb.filter("department = {:departmentId} && active = true", {
          departmentId,
        }),
  });
  return result.items.length > 0;
}

/** Only active assignments count. Handy for future permission checks. */
export async function isHeadOfDepartment(
  userId: string,
  departmentId: string,
): Promise<boolean> {
  const pb = await createAdminPb();
  const result = await pb.collection("department_heads").getList(1, 1, {
    skipTotal: true,
    filter: pb.filter(
      "user = {:userId} && department = {:departmentId} && active = true",
      { userId, departmentId },
    ),
  });
  return result.items.length > 0;
}

/** Departments a user currently heads. */
export async function listDepartmentsHeadedBy(
  userId: string,
): Promise<Department[]> {
  const pb = await createAdminPb();
  const rows = await pb
    .collection("department_heads")
    .getFullList<DepartmentHead>({
      expand: "department",
      filter: pb.filter("user = {:userId} && active = true", { userId }),
    });
  return rows
    .map((row) => row.expand?.department)
    .filter((d): d is Department => !!d)
    .sort((a, b) => a.name.localeCompare(b.name));
}
