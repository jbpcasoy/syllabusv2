import { requireUser } from "@/lib/auth";
import {
  addNotifications,
  notificationFacts,
  notificationRecipients,
  NOTIFY_EXPAND,
} from "@/lib/notifications";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { getUserRoles } from "@/lib/roles";
import {
  activeFacultyAmong,
  getSyllabusAccess,
  SYLLABUS_EXPAND,
  toSyllabusResponse,
} from "@/lib/syllabus";
import {
  loadChainHolders,
  loadStandIns,
  missingChainRoles,
} from "@/lib/syllabus-chain";
import { ensureRefSeq } from "@/lib/syllabus-decision";
import { addSyllabusEvent } from "@/lib/syllabus-events";
import { needsStandIn } from "@/lib/syllabus-review";
import { latestVersion } from "@/lib/syllabus-version";
import { transition } from "@/lib/syllabus-workflow";
import type { Syllabus } from "@/types/syllabus";
import type { Term } from "@/types/term";
import { NextResponse, type NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

// POST /api/syllabus/:id/submit  (no body)
// Lead only. The workflow decides: draft, open term, at least one version,
// an active holder for every stage of the target program's chain, and a
// proxy when the program reviewer is an author.
export async function POST(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const me = auth.user.id;
    const pb = await createAdminPb();
    const [syllabus, roles] = await Promise.all([
      pb.collection("syllabi").getOne<Syllabus>(id, { expand: NOTIFY_EXPAND }),
      getUserRoles(me),
    ]);
    const access = getSyllabusAccess(me, roles, syllabus);
    if (!access) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (access !== "lead") {
      return NextResponse.json(
        { error: "Only the lead can submit this syllabus." },
        { status: 403 },
      );
    }

    const [term, version, holders, standIns, faculty] = await Promise.all([
      pb.collection("terms").getOne<Term>(syllabus.term, { fields: "id,open" }),
      latestVersion(pb, id),
      loadChainHolders(pb, syllabus.program),
      loadStandIns(pb, id),
      activeFacultyAmong(pb, syllabus.program, [me]),
    ]);
    if (!faculty.has(me)) {
      return NextResponse.json(
        { error: "You are no longer active faculty of this program." },
        { status: 403 },
      );
    }

    const result = transition(syllabus, {
      type: "submit",
      hasVersion: !!version,
      termOpen: term.open,
      missingRoles: missingChainRoles(holders),
      proxyNeeded: needsStandIn(1, syllabus, holders, standIns),
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    // Prefix of every approval code this syllabus will get.
    await ensureRefSeq(pb, syllabus);

    const now = new Date().toISOString();
    const batch = pb.createBatch();
    batch.collection("syllabi").update(id, {
      ...result.next,
      submitted_at: now,
      status_changed_at: now,
    });
    addSyllabusEvent(batch, id, {
      type: "submitted",
      actor: me,
      stage: result.next.stage,
      version: version?.id,
    });
    addNotifications(
      batch,
      id,
      me,
      notificationRecipients(
        { type: "submitted", stage: result.next.stage, actor: me },
        syllabus,
        holders,
        standIns,
      ),
      notificationFacts(syllabus, auth.user.name),
    );
    await batch.send();

    const updated = await pb
      .collection("syllabi")
      .getOne<Syllabus>(id, { expand: SYLLABUS_EXPAND });
    return NextResponse.json(toSyllabusResponse(updated, "lead"));
  } catch (error) {
    return handlePbError(error);
  }
}
