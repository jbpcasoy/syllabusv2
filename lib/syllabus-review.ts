import { FINAL_STAGE, type SyllabusStatus } from "@/lib/syllabus-workflow";
import type { Syllabus } from "@/types/syllabus";

/**
 * Who reviews a syllabus. These are relationships to one record, like
 * getSyllabusAccess, so they live here and not in capability-rules.ts. Pure:
 * callers load the chain holders (lib/syllabus-chain.ts) and stand-ins.
 */

/**
 * Active holder user ids per stage; index 0 is stage 1 (program chair or
 * department head, by program level). See lib/syllabus-chain.ts.
 */
export type ChainHolders = readonly (readonly string[])[];

/** A per-syllabus stand-in. The stage-1 stand-in is the proxy. */
export interface StandIn {
  stage: number;
  user: string;
}

export type ActingAs = "holder" | "proxy" | "standIn";

type Authors = Pick<Syllabus, "lead" | "co_authors">;
type Routed = Authors & { status: SyllabusStatus; stage: number };

export function isAuthor(userId: string, syllabus: Authors): boolean {
  return syllabus.lead === userId || syllabus.co_authors.includes(userId);
}

const holdersAt = (holders: ChainHolders, stage: number) =>
  holders[stage - 1] ?? [];

const standInAt = (standIns: readonly StandIn[], stage: number) =>
  standIns.find((s) => s.stage === stage);

/**
 * The stage the user may decide at now, and in what capacity. A stand-in
 * replaces the holders of its stage. Authors never act.
 */
export function resolveActor(
  userId: string,
  syllabus: Routed,
  holders: ChainHolders,
  standIns: readonly StandIn[],
): { stage: number; actingAs: ActingAs } | null {
  if (syllabus.status !== "submitted") return null;
  if (isAuthor(userId, syllabus)) return null;

  const { stage } = syllabus;
  const standIn = standInAt(standIns, stage);
  if (standIn) {
    if (standIn.user !== userId) return null;
    return { stage, actingAs: stage === 1 ? "proxy" : "standIn" };
  }
  return holdersAt(holders, stage).includes(userId)
    ? { stage, actingAs: "holder" }
    : null;
}

/**
 * True when nobody may act at the stage because every holder is an author
 * and no stand-in is set. A stage with no holder at all is the missing-role
 * check's business, not this one's. Stage 1 feeds the workflow's proxyNeeded.
 */
export function needsStandIn(
  stage: number,
  syllabus: Authors,
  holders: ChainHolders,
  standIns: readonly StandIn[],
): boolean {
  if (standInAt(standIns, stage)) return false;
  const atStage = holdersAt(holders, stage);
  return atStage.length > 0 && atStage.every((id) => isAuthor(id, syllabus));
}

/**
 * Who may set or clear the stand-in for a stage: an admin, or an active
 * holder of a later stage. The stage-1 holder also names their own proxy.
 */
export function canDesignate(
  userId: string,
  isAdmin: boolean,
  stage: number,
  holders: ChainHolders,
): boolean {
  if (isAdmin) return true;
  const first = stage === 1 ? 1 : stage + 1;
  for (let s = first; s <= FINAL_STAGE; s++) {
    if (holdersAt(holders, s).includes(userId)) return true;
  }
  return false;
}

/**
 * Why a stand-in for `stage` can't be set or cleared now, or null. The proxy
 * may be named while drafting; later stages once routed. A stage that has
 * passed, and anything after approval, is fixed.
 */
export function standInWindowError(
  syllabus: Pick<Routed, "status" | "stage">,
  stage: number,
): string | null {
  switch (syllabus.status) {
    case "approved":
    case "filed":
      return "Stand-ins can't change after the syllabus is approved.";
    case "draft":
      return stage === 1
        ? null
        : "Stand-ins for later stages can be set once the syllabus is submitted.";
    case "submitted":
    case "returned":
      return stage < syllabus.stage ? "That stage has already passed." : null;
  }
}

/** What the viewer may do in review right now; drives the detail page. */
export interface ReviewContext {
  /** The stage the viewer may decide now, or null. */
  actorStage: number | null;
  actingAs: ActingAs | null;
  /** Stages whose stand-in the viewer may set or clear now. */
  designatableStages: number[];
}

export function reviewContext(
  userId: string,
  isAdmin: boolean,
  syllabus: Routed,
  holders: ChainHolders,
  standIns: readonly StandIn[],
): ReviewContext {
  const actor = resolveActor(userId, syllabus, holders, standIns);
  const designatableStages: number[] = [];
  for (let stage = 1; stage <= FINAL_STAGE; stage++) {
    if (
      canDesignate(userId, isAdmin, stage, holders) &&
      !standInWindowError(syllabus, stage)
    ) {
      designatableStages.push(stage);
    }
  }
  return {
    actorStage: actor?.stage ?? null,
    actingAs: actor?.actingAs ?? null,
    designatableStages,
  };
}

/**
 * Reviewers may view a syllabus once it leaves draft: every active holder
 * of its chain and every stand-in, whatever the current stage.
 */
export function isReviewer(
  userId: string,
  syllabus: Pick<Syllabus, "status">,
  holders: ChainHolders,
  standIns: readonly StandIn[],
): boolean {
  if (syllabus.status === "draft") return false;
  return (
    standIns.some((s) => s.user === userId) ||
    holders.some((atStage) => atStage.includes(userId))
  );
}
