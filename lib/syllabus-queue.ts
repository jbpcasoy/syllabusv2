import { anyOf } from "@/lib/syllabus";
import { isAuthor, type StandIn } from "@/lib/syllabus-review";
import type { UserRoles } from "@/types/roles";
import type { Syllabus } from "@/types/syllabus";
import type PocketBase from "pocketbase";
import "server-only";

type StandInRow = StandIn & { syllabus: string };

/**
 * Ids of syllabi waiting on the user's decision now: resolveActor in bulk.
 * Candidates are in-review syllabi at a stage the user holds (in scope) or
 * stands in for; a stage covered by someone else's stand-in, and anything
 * the user wrote, drop out. Phase 4 replaces this with real queues.
 */
export async function listAwaitingReviewIds(
  pb: PocketBase,
  userId: string,
  roles: UserRoles,
): Promise<string[]> {
  const mine = await pb
    .collection("syllabus_stand_ins")
    .getFullList<StandInRow>({
      fields: "syllabus,stage",
      filter: pb.filter("user = {:userId}", { userId }),
    });

  const clauses: string[] = [];
  if (roles.reviewerOfPrograms.length > 0) {
    clauses.push(
      `(stage = 1 && ${anyOf(pb, "program", roles.reviewerOfPrograms, "p")})`,
    );
  }
  if (roles.deanOfColleges.length > 0) {
    clauses.push(
      `(stage = 2 && ${anyOf(pb, "program.department.college", roles.deanOfColleges, "c")})`,
    );
  }
  if (roles.isFdisChair) clauses.push("stage = 3");
  if (roles.isCitlDirector) clauses.push("stage = 4");
  if (roles.isVpaa) clauses.push("stage = 5");
  mine.forEach((row, i) =>
    clauses.push(
      pb.filter(`(id = {:s${i}} && stage = {:t${i}})`, {
        [`s${i}`]: row.syllabus,
        [`t${i}`]: row.stage,
      }),
    ),
  );
  if (clauses.length === 0) return [];

  const candidates = await pb
    .collection("syllabi")
    .getFullList<Pick<Syllabus, "id" | "stage" | "lead" | "co_authors">>({
      fields: "id,stage,lead,co_authors",
      filter: `status = 'submitted' && (${clauses.join(" || ")})`,
    });
  if (candidates.length === 0) return [];

  const covers = await pb
    .collection("syllabus_stand_ins")
    .getFullList<StandInRow>({
      fields: "syllabus,stage,user",
      filter: anyOf(pb, "syllabus", candidates.map((s) => s.id), "y"),
    });

  return candidates
    .filter((syllabus) => {
      if (isAuthor(userId, syllabus)) return false;
      const cover = covers.find(
        (s) => s.syllabus === syllabus.id && s.stage === syllabus.stage,
      );
      // Matched as holder or as stand-in; a stand-in set for the stage wins.
      return cover ? cover.user === userId : true;
    })
    .map((syllabus) => syllabus.id);
}
