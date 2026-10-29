import {
  anyOf,
  getSyllabusAccess,
  SYLLABUS_EXPAND,
  toSyllabusResponse,
} from "@/lib/syllabus";
import { isAuthor, type StandIn } from "@/lib/syllabus-review";
import { CHAIN_ROLES } from "@/lib/syllabus-workflow";
import type { QueueStatus, ReviewQueueItem } from "@/types/review-queue";
import type { UserRoles } from "@/types/roles";
import type { Syllabus, SyllabusResponse } from "@/types/syllabus";
import type { AppUser } from "@/types/user";
import type PocketBase from "pocketbase";
import "server-only";

/** A stand-in row with its syllabus: whose stage the user covers where. */
export type StandInRow = StandIn & { syllabus: string };

/** The queue needs the college for stage 2, hence program.department. */
export const QUEUE_EXPAND = "course,term.school_year,program.department,lead";

const STAGES = CHAIN_ROLES.map((_, i) => i + 1);

/** Stages the user holds through an active assignment (admin holds none). */
export function heldStages(roles: UserRoles): number[] {
  return STAGES.filter((stage) => {
    switch (stage) {
      case 1:
        return roles.reviewerOfPrograms.length > 0;
      case 2:
        return roles.deanOfColleges.length > 0;
      case 3:
        return roles.isFdisChair;
      case 4:
        return roles.isCitlDirector;
      default:
        return roles.isVpaa;
    }
  });
}

/** The queue tabs: held stages plus stand-in stages; admin sees all five. */
export function queueStages(
  roles: UserRoles,
  standInStages: readonly number[],
): number[] {
  if (roles.isAdmin) return [...STAGES];
  const stages = new Set([...heldStages(roles), ...standInStages]);
  return STAGES.filter((stage) => stages.has(stage));
}

/**
 * Which syllabi the user sees at a stage: those in scope of the role they
 * hold there, plus those they stand in for there. "" means no constraint.
 */
export function stageScopeFilter(
  pb: PocketBase,
  stage: number,
  roles: UserRoles,
  standInSyllabusIds: readonly string[],
): string {
  if (roles.isAdmin || (stage >= 3 && heldStages(roles).includes(stage))) {
    return "";
  }
  const parts: string[] = [];
  if (stage === 1 && roles.reviewerOfPrograms.length > 0) {
    parts.push(anyOf(pb, "program", roles.reviewerOfPrograms, "p"));
  }
  if (stage === 2 && roles.deanOfColleges.length > 0) {
    parts.push(
      anyOf(pb, "program.department.college", roles.deanOfColleges, "c"),
    );
  }
  if (standInSyllabusIds.length > 0) {
    parts.push(anyOf(pb, "id", [...standInSyllabusIds], "s"));
  }
  return parts.length > 0 ? `(${parts.join(" || ")})` : "id = ''";
}

/** Rows of the status tab of a stage. */
export function statusFilter(
  pb: PocketBase,
  stage: number,
  status: QueueStatus,
): string {
  switch (status) {
    case "waiting":
      return pb.filter("(status = 'submitted' && stage = {:stage})", { stage });
    case "returned":
      return pb.filter("(status = 'returned' && stage = {:stage})", { stage });
    case "passed":
      return pb.filter(
        "(((status = 'submitted' || status = 'returned') && stage > {:stage}) || status = 'approved' || status = 'filed')",
        { stage },
      );
  }
}

/** Waiting work first in, first out; the rest most recent first. */
export function queueSort(status: QueueStatus): string {
  return status === "waiting"
    ? "status_changed_at,id"
    : "-status_changed_at,-id";
}

export interface QueueQuery {
  stage: number;
  status: QueueStatus;
  me: string;
  roles: UserRoles;
  standIns: readonly StandInRow[];
  program?: string;
  term?: string;
  search?: string;
}

/** The whole filter of one queue page. Authors never see their own work. */
export function queueFilter(pb: PocketBase, query: QueueQuery): string {
  const { stage, me } = query;
  const standInIds = query.standIns
    .filter((s) => s.stage === stage)
    .map((s) => s.syllabus);
  const filters = [
    statusFilter(pb, stage, query.status),
    stageScopeFilter(pb, stage, query.roles, standInIds),
    pb.filter("lead != {:me} && co_authors:each != {:me}", { me }),
  ];
  if (query.program) {
    filters.push(pb.filter("program = {:program}", { program: query.program }));
  }
  if (query.term) {
    filters.push(pb.filter("term = {:term}", { term: query.term }));
  }
  if (query.search) {
    filters.push(
      pb.filter(
        "(course.code ~ {:search} || course.title ~ {:search} || program.code ~ {:search})",
        { search: query.search },
      ),
    );
  }
  return filters.filter(Boolean).join(" && ");
}

/** True when the user holds the stage's role for this syllabus's program. */
export function holdsStageFor(
  roles: UserRoles,
  stage: number,
  syllabus: Pick<Syllabus, "program" | "expand">,
): boolean {
  switch (stage) {
    case 1:
      return roles.reviewerOfPrograms.includes(syllabus.program);
    case 2: {
      const college = syllabus.expand?.program?.expand?.department?.college;
      return !!college && roles.deanOfColleges.includes(college);
    }
    default:
      return heldStages(roles).includes(stage);
  }
}

type Cover = StandInRow & { expand?: { user?: Pick<AppUser, "name"> } };

/**
 * Queue rows. Actionable means waiting at this stage and the viewer is the
 * one who acts: the stand-in if one is set for the stage, else a holder.
 * The review route re-checks this; here it only picks the link.
 */
export function toQueueItems(
  records: readonly Syllabus[],
  context: {
    stage: number;
    me: string;
    roles: UserRoles;
    covers: readonly Cover[];
    versionNos: ReadonlyMap<string, number>;
  },
): ReviewQueueItem[] {
  const { stage, me, roles } = context;
  return records.map((record) => {
    const cover = context.covers.find(
      (c) => c.syllabus === record.id && c.stage === stage,
    );
    const waiting = record.status === "submitted" && record.stage === stage;
    const actionable =
      waiting &&
      !isAuthor(me, record) &&
      (cover ? cover.user === me : holdsStageFor(roles, stage, record));
    return {
      syllabus: toSyllabusResponse(
        record,
        getSyllabusAccess(me, roles, record) ?? "reviewer",
      ),
      version_no: context.versionNos.get(record.id) ?? 0,
      actionable,
      covered_by:
        waiting && cover && cover.user !== me
          ? (cover.expand?.user?.name ?? "")
          : null,
    };
  });
}

/** The user's own stand-ins, for queueStages and the stage scope. */
export async function loadMyStandIns(
  pb: PocketBase,
  userId: string,
): Promise<StandInRow[]> {
  return pb.collection("syllabus_stand_ins").getFullList<StandInRow>({
    fields: "syllabus,stage,user",
    filter: pb.filter("user = {:userId}", { userId }),
  });
}

/** Stand-ins (with names) and latest version numbers for a page of rows. */
export async function loadQueueExtras(
  pb: PocketBase,
  syllabusIds: readonly string[],
): Promise<{ covers: Cover[]; versionNos: Map<string, number> }> {
  if (syllabusIds.length === 0) return { covers: [], versionNos: new Map() };
  const ids = [...syllabusIds];
  const [covers, versions] = await Promise.all([
    pb.collection("syllabus_stand_ins").getFullList<Cover>({
      fields: "syllabus,stage,user,expand.user.name",
      expand: "user",
      filter: anyOf(pb, "syllabus", ids, "y"),
    }),
    pb
      .collection("syllabus_versions")
      .getFullList<{ syllabus: string; version_no: number }>({
        fields: "syllabus,version_no",
        filter: anyOf(pb, "syllabus", ids, "v"),
      }),
  ]);
  const versionNos = new Map<string, number>();
  for (const v of versions) {
    versionNos.set(v.syllabus, Math.max(versionNos.get(v.syllabus) ?? 0, v.version_no));
  }
  return { covers, versionNos };
}

/**
 * Ids of syllabi waiting on the user's decision now, across their stages
 * (My syllabi's "Waiting on me"). Admin acts at no stage, so admin counts
 * only roles they hold. A stage covered by someone else's stand-in, and
 * anything the user wrote, drop out.
 */
export async function listAwaitingReviewIds(
  pb: PocketBase,
  userId: string,
  roles: UserRoles,
): Promise<string[]> {
  const mine = await loadMyStandIns(pb, userId);
  const asHolder = { ...roles, isAdmin: false };
  const clauses = queueStages(asHolder, mine.map((s) => s.stage)).map(
    (stage) => {
      const scope = stageScopeFilter(
        pb,
        stage,
        asHolder,
        mine.filter((s) => s.stage === stage).map((s) => s.syllabus),
      );
      const waiting = statusFilter(pb, stage, "waiting");
      return scope ? `(${waiting} && ${scope})` : waiting;
    },
  );
  if (clauses.length === 0) return [];

  const candidates = await pb
    .collection("syllabi")
    .getFullList<Pick<Syllabus, "id" | "stage" | "lead" | "co_authors">>({
      fields: "id,stage,lead,co_authors",
      filter: clauses.join(" || "),
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

type SyllabusAuthors = Pick<Syllabus, "id" | "program" | "lead" | "co_authors">;

/** Syllabi whose stage 1 is still to be decided: drafts, or waiting at 1. */
const STAGE_ONE_AHEAD =
  "(status = 'draft' || ((status = 'submitted' || status = 'returned') && stage = 1))";

/**
 * Syllabi whose stage 1 can't be reviewed until someone names a proxy (the
 * program reviewer leads or co-authors them and no stage-1 stand-in is set;
 * proxyNeeded in lib/syllabus-review.ts). Drafts count, so it can be done
 * early. Among those the user may name one for (canDesignate for stage 1):
 * every program for an admin, FDIS chair, CITL director or VPAA, a dean's
 * college, a program reviewer's own programs. Authors may name the proxy
 * too, so the user's own syllabi stay (the conflicted reviewer's always
 * are). Oldest first.
 */
export async function listNeedsProxy(
  pb: PocketBase,
  userId: string,
  roles: UserRoles,
): Promise<SyllabusResponse[]> {
  const everywhere =
    roles.isAdmin || roles.isFdisChair || roles.isCitlDirector || roles.isVpaa;
  const scoped: string[] = [];
  if (roles.deanOfColleges.length > 0) {
    scoped.push(
      anyOf(pb, "program.department.college", roles.deanOfColleges, "c"),
    );
  }
  if (roles.reviewerOfPrograms.length > 0) {
    scoped.push(anyOf(pb, "program", roles.reviewerOfPrograms, "p"));
  }
  if (!everywhere && scoped.length === 0) return [];
  const scope = everywhere ? "" : ` && (${scoped.join(" || ")})`;

  const [reviewers, candidates] = await Promise.all([
    pb
      .collection("program_reviewers")
      .getFullList<{ user: string; program: string }>({
        fields: "user,program",
        filter: `active = true${scope}`,
      }),
    pb.collection("syllabi").getFullList<SyllabusAuthors>({
      fields: "id,program,lead,co_authors",
      filter: `${STAGE_ONE_AHEAD}${scope}`,
    }),
  ]);
  const reviewerOf = new Map(reviewers.map((r) => [r.program, r.user]));
  const conflicted = candidates
    .filter((syllabus) => {
      const reviewer = reviewerOf.get(syllabus.program);
      return !!reviewer && isAuthor(reviewer, syllabus);
    })
    .map((syllabus) => syllabus.id);
  if (conflicted.length === 0) return [];

  const proxied = await pb
    .collection("syllabus_stand_ins")
    .getFullList<{ syllabus: string }>({
      fields: "syllabus",
      filter: `stage = 1 && ${anyOf(pb, "syllabus", conflicted, "y")}`,
    });
  const covered = new Set(proxied.map((p) => p.syllabus));
  const open = conflicted.filter((id) => !covered.has(id));
  if (open.length === 0) return [];

  const records = await pb.collection("syllabi").getFullList<Syllabus>({
    expand: SYLLABUS_EXPAND,
    filter: anyOf(pb, "id", open, "s"),
    sort: "created,id",
  });
  return records.map((record) =>
    toSyllabusResponse(
      record,
      getSyllabusAccess(userId, roles, record) ?? "designator",
    ),
  );
}
