import { createAdminPb } from "@/lib/pocketbase";
import type { FdisChair, FdisChairResponse } from "@/types/fdis-chair";
import "server-only";

export function toFdisChairResponse(record: FdisChair): FdisChairResponse {
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

/** True if there is already an active FDIS chair (optionally ignoring one record). */
export async function hasActiveFdisChair(exceptId?: string): Promise<boolean> {
  const pb = await createAdminPb();
  const result = await pb.collection("fdis_chairs").getList(1, 1, {
    skipTotal: true,
    filter: exceptId
      ? pb.filter("active = true && id != {:exceptId}", { exceptId })
      : "active = true",
  });
  return result.items.length > 0;
}

/** Only the active record counts. Handy for future permission checks. */
export async function isFdisChair(userId: string): Promise<boolean> {
  const pb = await createAdminPb();
  const result = await pb.collection("fdis_chairs").getList(1, 1, {
    skipTotal: true,
    filter: pb.filter("user = {:userId} && active = true", { userId }),
  });
  return result.items.length > 0;
}

/** The current FDIS chair, or null if none is assigned. */
export async function getActiveFdisChair(): Promise<FdisChair | null> {
  const pb = await createAdminPb();
  const result = await pb.collection("fdis_chairs").getList<FdisChair>(1, 1, {
    skipTotal: true,
    expand: "user",
    filter: "active = true",
  });
  return result.items[0] ?? null;
}
