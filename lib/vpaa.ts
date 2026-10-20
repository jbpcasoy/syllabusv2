import { PERMISSIONS } from "@/lib/permissions";
import { createAdminPb } from "@/lib/pocketbase";
import type { AppUser, UserRole } from "@/types/user";
import type { Vpaa, VpaaResponse } from "@/types/vpaa";
import "server-only";

/** Admins, plus any role listed in PERMISSIONS.vpaa.write. */
export function canManageVpaas(user: AppUser): boolean {
  if (user.role === "admin") return true;
  return (
    !!user.role &&
    (PERMISSIONS.vpaa.write as readonly UserRole[]).includes(user.role)
  );
}

export function toVpaaResponse(record: Vpaa): VpaaResponse {
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

/** True if there is already an active VPAA (optionally ignoring one record). */
export async function hasActiveVpaa(exceptId?: string): Promise<boolean> {
  const pb = await createAdminPb();
  const result = await pb.collection("vpaas").getList(1, 1, {
    skipTotal: true,
    filter: exceptId
      ? pb.filter("active = true && id != {:exceptId}", { exceptId })
      : "active = true",
  });
  return result.items.length > 0;
}

/** Only the active record counts. Handy for future permission checks. */
export async function isVpaa(userId: string): Promise<boolean> {
  const pb = await createAdminPb();
  const result = await pb.collection("vpaas").getList(1, 1, {
    skipTotal: true,
    filter: pb.filter("user = {:userId} && active = true", { userId }),
  });
  return result.items.length > 0;
}

/** The current VPAA, or null if none is assigned. */
export async function getActiveVpaa(): Promise<Vpaa | null> {
  const pb = await createAdminPb();
  const result = await pb.collection("vpaas").getList<Vpaa>(1, 1, {
    skipTotal: true,
    expand: "user",
    filter: "active = true",
  });
  return result.items[0] ?? null;
}
