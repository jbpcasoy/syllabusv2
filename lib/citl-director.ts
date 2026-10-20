import { PERMISSIONS } from "@/lib/permissions";
import { createAdminPb } from "@/lib/pocketbase";
import type { CitlDirector, CitlDirectorResponse } from "@/types/citl-director";
import type { AppUser, UserRole } from "@/types/user";
import "server-only";

/** Admins, plus any role listed in PERMISSIONS.citlDirector.write. */
export function canManageCitlDirectors(user: AppUser): boolean {
  if (user.role === "admin") return true;
  return (
    !!user.role &&
    (PERMISSIONS.citlDirector.write as readonly UserRole[]).includes(user.role)
  );
}

export function toCitlDirectorResponse(
  record: CitlDirector,
): CitlDirectorResponse {
  const user = record.expand?.user;
  return {
    id: record.id,
    user: record.user,
    active: record.active,
    created: record.created,
    updated: record.updated,
    expand: {
      ...(user && {
        user: { id: user.id, name: user.name, email: user.email },
      }),
    },
  };
}

/** True if there is already an active CITL director (optionally ignoring one record). */
export async function hasActiveCitlDirector(
  exceptId?: string,
): Promise<boolean> {
  const pb = await createAdminPb();
  const result = await pb.collection("citl_directors").getList(1, 1, {
    skipTotal: true,
    filter: exceptId
      ? pb.filter("active = true && id != {:exceptId}", { exceptId })
      : "active = true",
  });
  return result.items.length > 0;
}

/** Only the active record counts. Handy for future permission checks. */
export async function isCitlDirector(userId: string): Promise<boolean> {
  const pb = await createAdminPb();
  const result = await pb.collection("citl_directors").getList(1, 1, {
    skipTotal: true,
    filter: pb.filter("user = {:userId} && active = true", { userId }),
  });
  return result.items.length > 0;
}

/** The current CITL director, or null if none is assigned. */
export async function getActiveCitlDirector(): Promise<CitlDirector | null> {
  const pb = await createAdminPb();
  const result = await pb
    .collection("citl_directors")
    .getList<CitlDirector>(1, 1, {
      skipTotal: true,
      expand: "user",
      filter: "active = true",
    });
  return result.items[0] ?? null;
}
