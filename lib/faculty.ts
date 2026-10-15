import { PERMISSIONS } from "@/lib/permissions";
import { createAdminPb } from "@/lib/pocketbase";
import type { Department } from "@/types/department";
import type { Faculty, FacultyResponse } from "@/types/faculty";
import type { AppUser, UserRole } from "@/types/user";
import "server-only";

/** Admins, plus any role listed in PERMISSIONS.faculty.write. */
export function canManageFaculty(user: AppUser): boolean {
  if (user.role === "admin") return true;
  return (
    !!user.role &&
    (PERMISSIONS.faculty.write as readonly UserRole[]).includes(user.role)
  );
}

export function toFacultyResponse(record: Faculty): FacultyResponse {
  const user = record.expand?.user;
  const department = record.expand?.department;
  return {
    id: record.id,
    user: record.user,
    department: record.department,
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

export async function isFacultyOfDepartment(
  userId: string,
  departmentId: string,
): Promise<boolean> {
  const pb = await createAdminPb();
  const result = await pb.collection("faculties").getList(1, 1, {
    skipTotal: true,
    filter: pb.filter("user = {:userId} && department = {:departmentId}", {
      userId,
      departmentId,
    }),
  });
  return result.items.length > 0;
}

/** Departments a user can choose from when picking a syllabus reviewer. */
export async function listDepartmentsOfUser(
  userId: string,
): Promise<Department[]> {
  const pb = await createAdminPb();
  const rows = await pb.collection("faculties").getFullList<Faculty>({
    expand: "department",
    filter: pb.filter("user = {:userId}", { userId }),
  });
  return rows
    .map((row) => row.expand?.department)
    .filter((d): d is Department => !!d)
    .sort((a, b) => a.name.localeCompare(b.name));
}
