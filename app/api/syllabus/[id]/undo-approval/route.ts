import { requireUser } from "@/lib/auth";
import {
  addNotifications,
  notificationFacts,
  notificationRecipients,
  NOTIFY_EXPAND,
} from "@/lib/notifications";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { SYLLABUS_EXPAND, toSyllabusResponse } from "@/lib/syllabus";
import { loadChainHolders, loadStandIns } from "@/lib/syllabus-chain";
import { addSyllabusEvent } from "@/lib/syllabus-events";
import { transition, undoableStage } from "@/lib/syllabus-workflow";
import { parseUndoApprovalInput } from "@/lib/validators/undo-approval";
import type { Syllabus } from "@/types/syllabus";
import type { SyllabusReview } from "@/types/syllabus-review";
import { NextResponse, type NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

const conflict = (error: string) =>
  NextResponse.json({ error }, { status: 409 });

// POST /api/syllabus/:id/undo-approval  { "reason": "<10-500 chars>" }
// syllabus.undoApproval: admin only, always an override. Takes back the
// latest approval, one stage at a time: submitted@N goes back to
// submitted@N-1, approved to submitted@5. Filed and returned syllabi are
// refused. One batch deletes that stage's approve row (so the stage can
// decide again; a copy goes into the audit row), moves the syllabus, adds
// an approval_undone event after the original "approved" one, and notifies
// the lead and whoever acts at that stage. A second undo racing this one
// fails on the already-deleted row.
export async function POST(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const auth = await requireUser("syllabus.undoApproval");
  if (!auth.ok) return auth.response;

  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseUndoApprovalInput(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { reason } = parsed.data;

    const me = auth.user.id;
    const pb = await createAdminPb();
    const syllabus = await pb
      .collection("syllabi")
      .getOne<Syllabus>(id, { expand: NOTIFY_EXPAND });

    const stage = undoableStage(syllabus);
    const review = stage
      ? ((
          await pb
            .collection("syllabus_reviews")
            .getList<SyllabusReview>(1, 1, {
              skipTotal: true,
              sort: "-created",
              filter: pb.filter(
                "syllabus = {:id} && stage = {:stage} && decision = 'approve'",
                { id, stage },
              ),
            })
        ).items[0] ?? null)
      : null;

    const result = transition(syllabus, {
      type: "undoApproval",
      approvalFound: !!review,
    });
    if (!result.ok) return conflict(result.error);
    if (!stage || !review) return conflict("There is no approval to undo.");

    const [holders, standIns] = await Promise.all([
      loadChainHolders(pb, syllabus.program),
      loadStandIns(pb, id),
    ]);
    const targets = notificationRecipients(
      { type: "approval_undone", stage, actor: me },
      syllabus,
      holders,
      standIns,
    );

    const now = new Date().toISOString();
    const batch = pb.createBatch();
    batch.collection("syllabus_reviews").delete(review.id);
    batch
      .collection("syllabi")
      .update(id, { ...result.next, status_changed_at: now });
    addSyllabusEvent(
      batch,
      id,
      {
        type: "approval_undone",
        actor: me,
        stage,
        version: review.version,
        reason,
      },
      { from: syllabus, to: result.next },
      {
        override: true,
        data: {
          undone_review: {
            id: review.id,
            version: review.version,
            stage: review.stage,
            reviewer: review.reviewer,
            acting_as: review.acting_as,
            approval_code: review.approval_code,
            created: review.created,
          },
        },
      },
    );
    addNotifications(batch, id, me, targets, {
      ...notificationFacts(syllabus, auth.user.name),
      reason,
    });
    await batch.send();

    const updated = await pb
      .collection("syllabi")
      .getOne<Syllabus>(id, { expand: SYLLABUS_EXPAND });
    return NextResponse.json(toSyllabusResponse(updated, "admin"));
  } catch (error) {
    return handlePbError(error);
  }
}
