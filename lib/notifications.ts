import type { ChainHolders, StandIn } from "@/lib/syllabus-review";
import { CHAIN_ROLES, FINAL_STAGE } from "@/lib/syllabus-workflow";
import type {
  NotificationKind,
  NotificationTarget,
} from "@/types/notification";
import type { Syllabus } from "@/types/syllabus";
import type PocketBase from "pocketbase";

type Batch = ReturnType<PocketBase["createBatch"]>;
type Authors = Pick<Syllabus, "lead" | "co_authors">;

/** The transitions that notify (Phase 5, D2). */
export interface NotifyEvent {
  type: "submitted" | "resubmitted" | "approved" | "returned";
  /** The stage submitted to, decided at, or returned from. */
  stage: number;
  /** ID of the user who made the transition. Never notified. */
  actor: string;
}

/** What the message text names. Course and program codes, never emails. */
export interface NotificationFacts {
  courseCode: string;
  courseTitle: string;
  programCode: string;
  actorName: string;
  /** For reference_requested: the program asking to reference it. */
  referencingProgramCode?: string;
}

/** Add to the transition's syllabus read so notificationFacts() has names. */
export const NOTIFY_EXPAND = "course,program";

/** Facts from a syllabus loaded with NOTIFY_EXPAND. */
export function notificationFacts(
  syllabus: Pick<Syllabus, "expand">,
  actorName: string,
): NotificationFacts {
  const course = syllabus.expand?.course;
  return {
    courseCode: course?.code ?? "",
    courseTitle: course?.title ?? "",
    programCode: syllabus.expand?.program?.code ?? "",
    actorName: actorName || "Someone",
  };
}

const TITLE_MAX = 200;
const BODY_MAX = 1000;

const clip = (text: string, max: number) =>
  text.length <= max ? text : `${text.slice(0, max - 1)}…`;

const stageLabel = (stage: number) =>
  CHAIN_ROLES[stage - 1]?.label ?? `Stage ${stage}`;

/**
 * Who may act at the stage: its stand-in when one is set, otherwise its
 * holders. Authors never act, as in resolveActor.
 */
export function stageActors(
  stage: number,
  syllabus: Authors,
  holders: ChainHolders,
  standIns: readonly StandIn[],
): string[] {
  const standIn = standIns.find((s) => s.stage === stage);
  const users = standIn ? [standIn.user] : (holders[stage - 1] ?? []);
  return users.filter(
    (u) => u !== syllabus.lead && !syllabus.co_authors.includes(u),
  );
}

/**
 * Who hears about a transition, and as what. Pure: callers pass the chain
 * holders and stand-ins they already loaded for the transition. The actor
 * is never notified, and each user appears once. With no proxy set, a
 * program reviewer who writes the syllabus still hears at stage 1: the
 * review workspace then asks them to name a proxy.
 */
export function notificationRecipients(
  event: NotifyEvent,
  syllabus: Authors,
  holders: ChainHolders,
  standIns: readonly StandIn[],
): NotificationTarget[] {
  const reviewers = (stage: number): NotificationTarget[] =>
    (stage === 1 && !standIns.some((s) => s.stage === 1)
      ? (holders[0] ?? [])
      : stageActors(stage, syllabus, holders, standIns)
    ).map((user) => ({
      user,
      kind: "review_requested",
      stage,
    }));
  const authors = (kind: NotificationKind): NotificationTarget[] =>
    [syllabus.lead, ...syllabus.co_authors].map((user) => ({
      user,
      kind,
      stage: event.stage,
    }));

  let targets: NotificationTarget[];
  switch (event.type) {
    case "submitted":
    case "resubmitted":
      targets = reviewers(event.stage);
      break;
    case "approved":
      targets =
        event.stage >= FINAL_STAGE
          ? authors("final_approved")
          : [
              ...reviewers(event.stage + 1),
              { user: syllabus.lead, kind: "approved", stage: event.stage },
            ];
      break;
    case "returned":
      targets = authors("returned");
      break;
  }

  const seen = new Set<string>([event.actor]);
  return targets.filter((t) => {
    if (!t.user || seen.has(t.user)) return false;
    seen.add(t.user);
    return true;
  });
}

/** Title, body and app link for one notification. Shown in-app and emailed. */
export function notificationText(
  kind: NotificationKind,
  stage: number,
  syllabusId: string,
  facts: NotificationFacts,
): { title: string; body: string; link: string } {
  const course = `${facts.courseCode} (${facts.programCode})`;
  const full = `${facts.courseCode} ${facts.courseTitle} (${facts.programCode})`;
  const role = stageLabel(stage);

  let title: string;
  let body: string;
  let link = `/syllabus/${syllabusId}`;
  switch (kind) {
    case "review_requested":
      title = `${course} is waiting for your review`;
      body = `${full} is waiting for your review as ${role}. Last action by ${facts.actorName}.`;
      link = `/syllabus/${syllabusId}/review`;
      break;
    case "approved":
      title = `${course} was approved by the ${role}`;
      body = `${facts.actorName} approved ${full} as ${role}. It now waits on the ${stageLabel(stage + 1)}.`;
      break;
    case "final_approved":
      title = `${course} is fully approved`;
      body = `${facts.actorName} gave final approval to ${full}. Upload the wet-signed scan of the syllabus to file it.`;
      break;
    case "returned":
      title = `${course} was returned for revision`;
      body = `${facts.actorName} returned ${full} as ${role}. Respond to each review point, upload a revised version, then resubmit.`;
      link = `/syllabus/${syllabusId}/revise`;
      break;
    case "reference_requested": {
      const referencing = facts.referencingProgramCode || "Another program";
      title = `${referencing} asks to reference ${course}`;
      body = `${facts.actorName} asked for ${referencing} to use ${full} instead of writing its own. Approve or reject the request from the syllabus's References panel.`;
      break;
    }
  }
  return { title: clip(title, TITLE_MAX), body: clip(body, BODY_MAX), link };
}

/**
 * Queues one notification per target on the batch that makes the
 * transition, so they land together or not at all. Pure: no reads, nothing
 * sent. Each row starts `pending`; pb_hooks/notifications.pb.js emails it.
 */
export function addNotifications(
  batch: Batch,
  syllabusId: string,
  actor: string,
  targets: readonly NotificationTarget[],
  facts: NotificationFacts,
): void {
  for (const target of targets) {
    batch.collection("notifications").create({
      user: target.user,
      syllabus: syllabusId,
      kind: target.kind,
      stage: target.stage,
      actor,
      ...notificationText(target.kind, target.stage, syllabusId, facts),
      email_status: "pending",
      email_attempts: 0,
    });
  }
}
