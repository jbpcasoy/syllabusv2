import { createAdminPb } from "@/lib/pocketbase";
import type { College } from "@/types/college";
import type { Dean, DeanResponse } from "@/types/dean";
import "server-only";

export function toDeanResponse(record: Dean): DeanResponse {
  const user = record.expand?.user;
  const college = record.expand?.college;
  return {
    id: record.id,
    user: record.user,
    college: record.college,
    active: record.active,
    created: record.created,
    updated: record.updated,
    expand: {
      ...(user && {
        user: { id: user.id, name: user.name, email: user.email },
      }),
      ...(college && {
        college: { id: college.id, name: college.name, code: college.code },
      }),
    },
  };
}

/** True if the college already has an active dean (optionally ignoring one record). */
export async function collegeHasActiveDean(
  collegeId: string,
  exceptId?: string,
): Promise<boolean> {
  const pb = await createAdminPb();
  const result = await pb.collection("deans").getList(1, 1, {
    skipTotal: true,
    filter: exceptId
      ? pb.filter(
          "college = {:collegeId} && active = true && id != {:exceptId}",
          { collegeId, exceptId },
        )
      : pb.filter("college = {:collegeId} && active = true", { collegeId }),
  });
  return result.items.length > 0;
}

/** Only active assignments count. Handy for future permission checks. */
export async function isDeanOfCollege(
  userId: string,
  collegeId: string,
): Promise<boolean> {
  const pb = await createAdminPb();
  const result = await pb.collection("deans").getList(1, 1, {
    skipTotal: true,
    filter: pb.filter(
      "user = {:userId} && college = {:collegeId} && active = true",
      { userId, collegeId },
    ),
  });
  return result.items.length > 0;
}

/** Colleges a user currently serves as dean. */
export async function listCollegesDeanedBy(userId: string): Promise<College[]> {
  const pb = await createAdminPb();
  const rows = await pb.collection("deans").getFullList<Dean>({
    expand: "college",
    filter: pb.filter("user = {:userId} && active = true", { userId }),
  });
  return rows
    .map((row) => row.expand?.college)
    .filter((c): c is College => !!c)
    .sort((a, b) => a.name.localeCompare(b.name));
}
