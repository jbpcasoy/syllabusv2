import { requireUser } from "@/lib/auth";
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
import { copyForm17, listForm17Answers } from "@/lib/form17";
import {
  lastReturnedVersionId,
  loadFormFacts,
} from "@/lib/syllabus-decision";
import { needsStandIn } from "@/lib/syllabus-review";
import { latestVersion } from "@/lib/syllabus-version";
import { transition } from "@/lib/syllabus-workflow";
import type { Syllabus } from "@/types/syllabus";
import type { SyllabusVersion } from "@/types/syllabus-version";
import type { Term } from "@/types/term";
import { NextResponse, type NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

// POST /api/syllabus/:id/resubmit  (no body)
// Lead only, after a return. The workflow decides: open term, a version
// uploaded since the return, every open review point answered, a complete
// chain and a proxy when needed. Resumes at the stage that returned it, with
// Form 17 copied forward from the returned version.
export async function POST(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const me = auth.user.id;
    const pb = await createAdminPb();
    const [syllabus, roles] = await Promise.all([
      pb.collection("syllabi").getOne<Syllabus>(id),
      getUserRoles(me),
    ]);
    const access = getSyllabusAccess(me, roles, syllabus);
    if (!access) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (access !== "lead") {
      return NextResponse.json(
        { error: "Only the lead can resubmit this syllabus." },
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

    const facts = await loadFormFacts(pb, {
      syllabusId: id,
      versionId: version?.id ?? null,
      stage: syllabus.stage,
    });
    const result = transition(syllabus, {
      type: "resubmit",
      termOpen: term.open,
      // PocketBase datetimes share one format, so they compare as strings.
      newVersionSinceReturn:
        !!version &&
        !!syllabus.returned_at &&
        version.created > syllabus.returned_at,
      unansweredPoints: facts.unansweredPoints,
      missingRoles: missingChainRoles(holders),
      proxyNeeded: needsStandIn(1, syllabus, holders, standIns),
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    // The new version starts with the returned version's Form 17 answers,
    // written in the same batch as the status change.
    const batch = pb.createBatch();
    const returnedVersionId = await lastReturnedVersionId(pb, id);
    if (version && returnedVersionId && returnedVersionId !== version.id) {
      const [answers, returnedVersion] = await Promise.all([
        listForm17Answers(pb, returnedVersionId),
        pb
          .collection("syllabus_versions")
          .getOne<SyllabusVersion>(returnedVersionId, {
            fields: "form17_suggestions",
          }),
      ]);
      copyForm17(
        batch,
        { answers, suggestions: returnedVersion.form17_suggestions ?? "" },
        version.id,
      );
    }
    batch.collection("syllabi").update(id, result.next);
    await batch.send();

    const updated = await pb
      .collection("syllabi")
      .getOne<Syllabus>(id, { expand: SYLLABUS_EXPAND });
    return NextResponse.json(toSyllabusResponse(updated, "lead"));
  } catch (error) {
    return handlePbError(error);
  }
}
