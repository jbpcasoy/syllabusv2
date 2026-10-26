import { createAdminPb } from "@/lib/pocketbase";
import "server-only";

export type OrgParent = "college" | "department" | "program";

type Child = {
  collection: string;
  /** Relation field on the child that points at the parent. Constant, never user input. */
  field: string;
  singular: string;
  plural: string;
};

const CHILDREN: Record<OrgParent, Child[]> = {
  college: [
    {
      collection: "departments",
      field: "college",
      singular: "department",
      plural: "departments",
    },
    {
      collection: "deans",
      field: "college",
      singular: "dean record",
      plural: "dean records",
    },
  ],
  department: [
    {
      collection: "programs",
      field: "department",
      singular: "program",
      plural: "programs",
    },
    {
      collection: "department_heads",
      field: "department",
      singular: "department head record",
      plural: "department head records",
    },
  ],
  program: [
    {
      collection: "faculties",
      field: "program",
      singular: "faculty membership",
      plural: "faculty memberships",
    },
    {
      collection: "program_chairs",
      field: "program",
      singular: "program chair record",
      plural: "program chair records",
    },
    {
      collection: "prospectuses",
      field: "program",
      singular: "prospectus",
      plural: "prospectuses",
    },
    {
      collection: "courses",
      field: "program",
      singular: "course",
      plural: "courses",
    },
  ],
};

function joinParts(parts: string[]): string {
  if (parts.length <= 1) return parts.join("");
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

/**
 * Returns a human-readable reason when the parent still has children
 * (for example "This college still has 3 departments. ..."), or null when
 * it is safe to delete. Use it in DELETE routes before deleting.
 */
export async function describeChildren(
  parent: OrgParent,
  id: string,
): Promise<string | null> {
  const pb = await createAdminPb();

  const counts = await Promise.all(
    CHILDREN[parent].map(async (child) => {
      const result = await pb.collection(child.collection).getList(1, 1, {
        filter: pb.filter(`${child.field} = {:id}`, { id }),
      });
      return { child, count: result.totalItems };
    }),
  );

  const parts = counts
    .filter(({ count }) => count > 0)
    .map(
      ({ child, count }) =>
        `${count} ${count === 1 ? child.singular : child.plural}`,
    );

  if (parts.length === 0) return null;
  return `This ${parent} still has ${joinParts(parts)}. Remove or reassign them first.`;
}
