import { approvalCode } from "@/lib/approval-code";
import { requireUser } from "@/lib/auth";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { getUserRoles } from "@/lib/roles";
import {
  resolveSyllabusAccess,
  SYLLABUS_EXPAND,
  toSyllabusResponse,
} from "@/lib/syllabus";
import { loadChainHolders, loadStandIns } from "@/lib/syllabus-chain";
import {
  ensureRefSeq,
  loadFormFacts,
  recordDecision,
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

// POST /api/syllabus/:id/review  { "decision": "approve" | "return" }
// The reviewer at the current stage: its holder, or the stand-in (proxy at
// stage 1) when one is set. Never an author, and an admin only through a
// stand-in. The workflow decides; the review row and the syllabus update
// are written in one batch, so a second decision on the stage gets a 409.
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
        .getOne<Syllabus>(id, { expand: "term.school_year" }),
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

    let code = "";
    if (decision === "approve") {
      const term = syllabus.expand?.term;
      if (!term) throw new Error("The syllabus's term didn't load.");
      code = approvalCode({
        schoolYearLabel: term.expand?.school_year?.label ?? "",
        semester: term.semester,
        refSeq: await ensureRefSeq(pb, syllabus),
        stage: actor.stage,
      });
    }

    const outcome = await recordDecision(pb, {
      syllabusId: id,
      versionId: version.id,
      stage: actor.stage,
      reviewer: me,
      actingAs: actor.actingAs,
      decision,
      approvalCode: code,
      next: result.next,
      now: new Date().toISOString(),
      reopenPointIds: decision === "return" ? facts.unresolvedIds : [],
    });
    if (outcome === "conflict") {
      return conflict("Another decision on this stage finished first.");
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
