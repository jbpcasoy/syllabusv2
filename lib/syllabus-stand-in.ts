import type { Faculty } from "@/types/faculty";
import type { Syllabus } from "@/types/syllabus";
import type {
  StandInCandidate,
  StandInResponse,
  SyllabusStandIn,
} from "@/types/syllabus-stand-in";
import type { AppUser } from "@/types/user";
import type PocketBase from "pocketbase";
import "server-only";

export const STAND_IN_EXPAND = "user,assigned_by";

export function toStandInResponse(record: SyllabusStandIn): StandInResponse {
  const user = record.expand?.user;
  const assignedBy = record.expand?.assigned_by;
  return {
    id: record.id,
    stage: record.stage,
    kind: record.stage === 1 ? "proxy" : "standIn",
    user: { id: record.user, name: user?.name ?? "", email: user?.email ?? "" },
    assigned_by: { id: record.assigned_by, name: assignedBy?.name ?? "" },
    updated: record.updated,
  };
}

/** The syllabus's stand-ins with names, by stage. */
export async function listStandIns(
  pb: PocketBase,
  syllabusId: string,
): Promise<StandInResponse[]> {
  const rows = await pb
    .collection("syllabus_stand_ins")
    .getFullList<SyllabusStandIn>({
      expand: STAND_IN_EXPAND,
      sort: "stage",
      filter: pb.filter("syllabus = {:syllabusId}", { syllabusId }),
    });
  return rows.map(toStandInResponse);
}

/**
 * Up to 20 users who may stand in at `stage`, by name, never an author.
 * Stage 1 (the proxy) draws from the program's active faculty; later stages
 * from all verified users.
 */
export async function listStandInCandidates(
  pb: PocketBase,
  syllabus: Pick<Syllabus, "program" | "lead" | "co_authors">,
  stage: number,
  search: string,
): Promise<StandInCandidate[]> {
  const authors = [syllabus.lead, ...syllabus.co_authors];
  // PocketBase filters have no unary "not", so exclude one id at a time.
  const notAuthor = (field: string) =>
    authors
      .map((id, i) => pb.filter(`${field} != {:a${i}}`, { [`a${i}`]: id }))
      .join(" && ");
  const matches = (prefix: string) =>
    pb.filter(`(${prefix}name ~ {:search} || ${prefix}email ~ {:search})`, {
      search,
    });

  if (stage === 1) {
    const filters = [
      pb.filter("program = {:program} && active = true", {
        program: syllabus.program,
      }),
      notAuthor("user"),
    ];
    if (search) filters.push(matches("user."));
    const result = await pb.collection("faculties").getList<Faculty>(1, 20, {
      skipTotal: true,
      expand: "user",
      sort: "user.name",
      filter: filters.join(" && "),
    });
    return result.items
      .map((row) => row.expand?.user)
      .filter((u) => !!u)
      .map((u) => ({ id: u.id, name: u.name, email: u.email }));
  }

  const filters = ["verified = true", notAuthor("id")];
  if (search) filters.push(matches(""));
  const result = await pb.collection("users").getList<AppUser>(1, 20, {
    skipTotal: true,
    fields: "id,name,email",
    sort: "name",
    filter: filters.join(" && "),
  });
  return result.items.map((u) => ({ id: u.id, name: u.name, email: u.email }));
}
