import { avatarUrl } from "@/lib/auth";
import { createAdminPb } from "@/lib/pocketbase";
import type {
  AppUser,
  UserAssignment,
  UserKind,
  UserResponse,
} from "@/types/user";
import "server-only";

/** Maps a PocketBase user record to the shape returned by the user API. */
export function toUserResponse(
  user: AppUser,
  assignments?: UserAssignment[],
): UserResponse {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: avatarUrl(user),
    isAdmin: user.isAdmin === true,
    verified: Boolean(user.verified),
    ...(assignments && { assignments }),
    created: user.created,
    updated: user.updated,
  };
}

/** True if at least one admin exists other than `exceptId`. */
export async function hasOtherAdmin(exceptId: string): Promise<boolean> {
  const pb = await createAdminPb();
  const result = await pb.collection("users").getList(1, 1, {
    skipTotal: true,
    filter: pb.filter("isAdmin = true && id != {:exceptId}", { exceptId }),
  });
  return result.items.length > 0;
}

type Named = { name?: string; code?: string };

/** Every assignment collection, how to label it, and which relation names its scope. */
const ASSIGNMENTS: {
  collection: string;
  title: string;
  scopeField?: "program" | "department" | "college";
}[] = [
  { collection: "vpaas", title: "VPAA" },
  { collection: "citl_directors", title: "CITL Director" },
  { collection: "fdis_chairs", title: "FDIS Chair" },
  { collection: "deans", title: "Dean", scopeField: "college" },
  {
    collection: "department_heads",
    title: "Department Head",
    scopeField: "department",
  },
  { collection: "program_chairs", title: "Program Chair", scopeField: "program" },
  {
    collection: "program_reviewers",
    title: "Program Reviewer",
    scopeField: "program",
  },
  { collection: "faculties", title: "Faculty", scopeField: "program" },
];

/**
 * PocketBase filter for GET /api/user?kind=... Uses back-relations
 * (`<collection>_via_user`). Without the `?` prefix a back-relation condition
 * must hold for every related record, so `!= true` means "no active record".
 */
export function userKindFilter(kind: UserKind): string {
  if (kind === "admin") return "isAdmin = true";
  if (kind === "assigned") {
    return `(${ASSIGNMENTS.map((a) => `${a.collection}_via_user.active ?= true`).join(" || ")})`;
  }
  return [
    "isAdmin = false",
    ...ASSIGNMENTS.map((a) => `${a.collection}_via_user.active != true`),
  ].join(" && ");
}

/** Active assignments for the given users, for the read-only list in the users UI. */
export async function listActiveAssignments(
  userIds: string[],
): Promise<Map<string, UserAssignment[]>> {
  const byUser = new Map<string, UserAssignment[]>(
    userIds.map((id) => [id, []]),
  );
  if (userIds.length === 0) return byUser;

  const pb = await createAdminPb();
  const users = userIds
    .map((id, i) => pb.filter(`user = {:u${i}}`, { [`u${i}`]: id }))
    .join(" || ");

  const results = await Promise.all(
    ASSIGNMENTS.map(({ collection, scopeField }) =>
      pb
        .collection(collection)
        .getFullList<{ user: string; expand?: Record<string, Named> }>({
          filter: `active = true && (${users})`,
          ...(scopeField && { expand: scopeField }),
        }),
    ),
  );

  ASSIGNMENTS.forEach(({ title, scopeField }, i) => {
    for (const row of results[i]) {
      const target = scopeField ? row.expand?.[scopeField] : undefined;
      const scope = target?.code || target?.name;
      byUser.get(row.user)?.push({ title, ...(scope && { scope }) });
    }
  });

  return byUser;
}
