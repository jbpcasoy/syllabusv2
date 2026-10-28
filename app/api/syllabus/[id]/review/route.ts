import { approvalCode } from "@/lib/approval-code";
import { requireUser } from "@/lib/auth";
import {
  notificationFacts,
  notificationRecipients,
  NOTIFY_EXPAND,
} from "@/lib/notifications";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { getUserRoles } from "@/lib/roles";
import {
  resolveSyllabusAccess,
  SYLLABUS_EXPAND,
  toSyllabusResponse,
} from "@/lib/syllabus";
import { loadChainHolders, loadStandIns } from "@/lib/syllabus-chain";
import {
  explainConflict,
  loadFormFacts,
  nextRefSeq,
  recordDecision,
  type DecisionConflict,
} from "@/lib/syllabus-decision";
import { isAuthor, resolveActor } from "@/lib/syllabus-review";
import { latestVersion } from "@/lib/syllabus-version";
import { transition, type WorkflowEvent } from "@/lib/syllabus-workflow";
import { parseReviewInput } from "@/lib/validators/syllabus-review";
import type { Syllabus } from "@/types/syllabus";
import type { ReviewResult } from "@/types/syllabus-review";
import { NextResponse, type NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

const conflict = (error: string) =>
  NextResponse.json({ error }, { status: 409 });

/** What the reviewer is told when the decision's batch hit a unique index. */
function conflictMessage(
  why: DecisionConflict,
  { stage, approvalCode }: { stage: number; approvalCode: string },
): string {
  switch (why) {
    case "decided":
      return "Another decision on this stage finished first.";
    case "duplicateReview":
      return `A stage ${stage} decision is already recorded for the latest version, but the syllabus is still waiting at that stage. Ask an administrator to check its review records.`;
    case "duplicateCode":
      return `Approval code ${approvalCode} is already used by another review. Ask an administrator to check the review records.`;
    case "unexplained":
      return "This decision clashed with another record and wasn't saved. Refresh the page and try again.";
  }
}

// POST /api/syllabus/:id/review  { "decision": "approve" | "return" }
// The reviewer at the current stage: its holder, or the stand-in (proxy at
// stage 1) when one is set. Never an author, and an admin only through a
// stand-in. The workflow decides; the review row and the syllabus update
// are written in one batch, so a second decision on the stage gets a 409
// whose message says whether it lost a race or the records disagree.
export async function POST(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseReviewInput(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { decision } = parsed.data;

    const me = auth.user.id;
    const pb = await createAdminPb();
    const [syllabus, roles] = await Promise.all([
      pb
        .collection("syllabi")
        .getOne<Syllabus>(id, { expand: `term.school_year,${NOTIFY_EXPAND}` }),
      getUserRoles(me),
    ]);
    const [holders, standIns] = await Promise.all([
      loadChainHolders(pb, syllabus.program),
      loadStandIns(pb, syllabus.id),
    ]);
    const actor = resolveActor(me, syllabus, holders, standIns);

    // While in review, only the stage's reviewer gets past here. Otherwise
    // the workflow below reports why nothing can be decided.
    if (!actor) {
      if (!(await resolveSyllabusAccess(pb, me, roles, syllabus))) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      if (syllabus.status === "submitted") {
        return NextResponse.json(
          {
            error: isAuthor(me, syllabus)
              ? "You can't review a syllabus you lead or co-author. A stand-in must be assigned for this stage."
              : "You are not the reviewer at this stage.",
          },
          { status: 403 },
        );
      }
    }

    const version = await latestVersion(pb, id);
    const facts = await loadFormFacts(pb, {
      syllabusId: id,
      versionId: version?.id ?? null,
      stage: syllabus.stage,
    });
    const actorStage = actor?.stage ?? null;
    const event: WorkflowEvent =
      decision === "approve"
        ? {
            type: "approve",
            actorStage,
            form17Complete: facts.form17Complete,
            form17HasNo: facts.form17HasNo,
            pendingPoints: facts.pendingPoints,
          }
        : {
            type: "return",
            actorStage,
            openPoints: facts.openPoints,
            unjudgedPoints: facts.unjudgedPoints,
          };
    const result = transition(syllabus, event);
    if (!result.ok) return conflict(result.error);
    if (!actor || !version) return conflict("This syllabus has no version to review.");

    // Submit assigns ref_seq. A syllabus submitted before that gets one with
    // its first approval, written in the decision's batch so a losing
    // request can't change it. A fresh number that clashes is retried.
    const assignsRefSeq = decision === "approve" && syllabus.ref_seq === 0;
    const notify = {
      targets: notificationRecipients(
        {
          type: decision === "approve" ? "approved" : "returned",
          stage: actor.stage,
          actor: me,
        },
        syllabus,
        holders,
        standIns,
      ),
      facts: notificationFacts(syllabus, auth.user.name),
    };
    let code = "";
    for (let attempt = 1; ; attempt++) {
      const refSeq = assignsRefSeq
        ? await nextRefSeq(pb, syllabus.term)
        : syllabus.ref_seq;
      if (decision === "approve") {
        const term = syllabus.expand?.term;
        if (!term) throw new Error("The syllabus's term didn't load.");
        code = approvalCode({
          schoolYearLabel: term.expand?.school_year?.label ?? "",
          semester: term.semester,
          refSeq,
          stage: actor.stage,
        });
      }

      const decided = {
        syllabusId: id,
        versionId: version.id,
        stage: actor.stage,
        approvalCode: code,
      };
      const outcome = await recordDecision(pb, {
        ...decided,
        reviewer: me,
        actingAs: actor.actingAs,
        decision,
        ...(assignsRefSeq && { refSeq }),
        next: result.next,
        now: new Date().toISOString(),
        reopenPointIds: decision === "return" ? facts.unresolvedIds : [],
        notify,
      });
      if (outcome === "ok") break;

      const why = await explainConflict(pb, decided);
      const settled = why === "decided" || why === "duplicateReview";
      if (assignsRefSeq && !settled && attempt < 3) continue;
      return conflict(conflictMessage(why, decided));
    }

    const updated = await pb
      .collection("syllabi")
      .getOne<Syllabus>(id, { expand: SYLLABUS_EXPAND });
    const reviewed: ReviewResult = {
      syllabus: toSyllabusResponse(updated, "reviewer"),
      review: {
        stage: actor.stage,
        decision,
        acting_as: actor.actingAs,
        approval_code: code,
      },
    };
    return NextResponse.json(reviewed);
  } catch (error) {
    return handlePbError(error);
  }
}
