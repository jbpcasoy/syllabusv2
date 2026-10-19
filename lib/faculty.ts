import { PERMISSIONS } from "@/lib/permissions";
import { createAdminPb } from "@/lib/pocketbase";
import type { Faculty, FacultyResponse } from "@/types/faculty";
import type { Program } from "@/types/program";
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
  const program = record.expand?.program;
  return {
    id: record.id,
    user: record.user,
    program: record.program,
    active: record.active,
    created: record.created,
    updated: record.updated,
    expand: {
      ...(user && {
        user: { id: user.id, name: user.name, email: user.email },
      }),
      ...(program && {
        program: { id: program.id, name: program.name, code: program.code },
      }),
    },
  };
}

/** Only active memberships count. */
export async function isFacultyOfProgram(
  userId: string,
  programId: string,
): Promise<boolean> {
  const pb = await createAdminPb();
  const result = await pb.collection("faculties").getList(1, 1, {
    skipTotal: true,
    filter: pb.filter(
      "user = {:userId} && program = {:programId} && active = true",
      { userId, programId },
    ),
  });
  return result.items.length > 0;
}

/** Programs a user can choose from (active memberships only). */
export async function listProgramsOfUser(userId: string): Promise<Program[]> {
  const pb = await createAdminPb();
  const rows = await pb.collection("faculties").getFullList<Faculty>({
    expand: "program",
    filter: pb.filter("user = {:userId} && active = true", { userId }),
  });
  return rows
    .map((row) => row.expand?.program)
    .filter((p): p is Program => !!p)
    .sort((a, b) => a.name.localeCompare(b.name));
}
