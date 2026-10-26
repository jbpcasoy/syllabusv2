import { requireUser } from "@/lib/auth";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { getUserRoles } from "@/lib/roles";
import {
  activeFacultyAmong,
  getSyllabusAccess,
  SYLLABUS_EXPAND,
  toSyllabusResponse,
} from "@/lib/syllabus";
import { findMissingChainRoles } from "@/lib/syllabus-chain";
import { latestVersionNo } from "@/lib/syllabus-version";
import { transition } from "@/lib/syllabus-workflow";
import type { Syllabus } from "@/types/syllabus";
import type { Term } from "@/types/term";
import { NextResponse, type NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

// POST /api/syllabus/:id/submit  (no body)
// Lead only. The workflow decides: draft, open term, at least one version,
// and an active holder for every role in the target program's chain.
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
        { error: "Only the lead can submit this syllabus." },
        { status: 403 },
      );
    }

    const [term, latest, missingRoles, faculty] = await Promise.all([
      pb.collection("terms").getOne<Term>(syllabus.term, { fields: "id,open" }),
      latestVersionNo(pb, id),
      findMissingChainRoles(pb, syllabus.program),
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
      hasVersion: latest > 0,
      termOpen: term.open,
      missingRoles,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    const updated = await pb.collection("syllabi").update<Syllabus>(
      id,
      { ...result.next, submitted_at: new Date().toISOString() },
      { expand: SYLLABUS_EXPAND },
    );
    return NextResponse.json(toSyllabusResponse(updated, "lead"));
  } catch (error) {
    return handlePbError(error);
  }
}
