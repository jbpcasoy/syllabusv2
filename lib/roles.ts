import { createAdminPb } from "@/lib/pocketbase";
import type { UserRoles } from "@/types/roles";
import { cache } from "react";
import "server-only";

type ProgramRef = { program: string };
type DepartmentRef = { department: string };
type CollegeRef = { college: string };

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

/**
 * Derives a user's roles from active assignment records.
 * Runs all queries in parallel and is cached per request (keyed by user id).
 * Never reads `users.role`.
 */
export const getUserRoles = cache(
  async (userId: string): Promise<UserRoles> => {
    const pb = await createAdminPb();

    const activeFor = () =>
      pb.filter("user = {:userId} && active = true", { userId });

    const [
      user,
      chairs,
      reviewers,
      heads,
      deans,
      faculties,
      fdisChairs,
      citlDirectors,
      vpaas,
    ] = await Promise.all([
      pb
        .collection("users")
        .getOne<{ isAdmin?: boolean }>(userId, { fields: "isAdmin" }),
      pb.collection("program_chairs").getFullList<ProgramRef>({
        fields: "program",
        filter: activeFor(),
      }),
      pb.collection("program_reviewers").getFullList<ProgramRef>({
        fields: "program",
        filter: activeFor(),
      }),
      pb.collection("department_heads").getFullList<DepartmentRef>({
        fields: "department",
        filter: activeFor(),
      }),
      pb.collection("deans").getFullList<CollegeRef>({
        fields: "college",
        filter: activeFor(),
      }),
      pb.collection("faculties").getFullList<ProgramRef>({
        fields: "program",
        filter: activeFor(),
      }),
      pb.collection("fdis_chairs").getFullList({
        fields: "id",
        filter: activeFor(),
      }),
      pb.collection("citl_directors").getFullList({
        fields: "id",
        filter: activeFor(),
      }),
      pb.collection("vpaas").getFullList({
        fields: "id",
        filter: activeFor(),
      }),
    ]);

    return {
      isAdmin: user.isAdmin === true,
      chairOfPrograms: unique(chairs.map((r) => r.program)),
      reviewerOfPrograms: unique(reviewers.map((r) => r.program)),
      headOfDepartments: unique(heads.map((r) => r.department)),
      deanOfColleges: unique(deans.map((r) => r.college)),
      facultyOfPrograms: unique(faculties.map((r) => r.program)),
      isFdisChair: fdisChairs.length > 0,
      isCitlDirector: citlDirectors.length > 0,
      isVpaa: vpaas.length > 0,
    };
  },
);
