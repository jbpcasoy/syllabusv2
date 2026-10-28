import { requireUser } from "@/lib/auth";
import { can } from "@/lib/capabilities";
import { isAdminOverride } from "@/lib/capability-rules";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { getUserRoles } from "@/lib/roles";
import {
  activeFacultyAmong,
  getSyllabusAccess,
  resolveSyllabusAccess,
  SYLLABUS_EXPAND,
  toSyllabusResponse,
} from "@/lib/syllabus";
import {
  loadChainHolders,
  loadReviewerIds,
  loadStandIns,
} from "@/lib/syllabus-chain";
import { hasLiveReferenceTo } from "@/lib/syllabus-reference";
import { isPersonalReviewer, reviewContext } from "@/lib/syllabus-review";
import { parseSyllabusUpdateInput } from "@/lib/validators/syllabus";
import type { Syllabus } from "@/types/syllabus";
import { NextResponse, type NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

// Same answer as a missing record, so ids can't be probed.
function notFound() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

function leadOnly() {
  return NextResponse.json(
    { error: "Only the lead can change this syllabus." },
    { status: 403 },
  );
}

function notEditable() {
  return NextResponse.json(
    {
      error:
        "Co-authors can only be changed while the syllabus is a draft or returned for revision.",
    },
    { status: 409 },
  );
}

// GET /api/syllabus/:id
// Lead, co-authors, admin, reviewers, and faculty of programs referencing
// it. `review` says what the caller may do in review right now.
export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const pb = await createAdminPb();
    const [syllabus, roles] = await Promise.all([
      pb.collection("syllabi").getOne<Syllabus>(id, { expand: SYLLABUS_EXPAND }),
      getUserRoles(auth.user.id),
    ]);
    const access = await resolveSyllabusAccess(
      pb,
      auth.user.id,
      roles,
      syllabus,
    );
    if (!access) return notFound();

    const target = { program: syllabus.program };
    const [holders, standIns, canReturnSignedCopy, canTransferLead] =
      await Promise.all([
        loadChainHolders(pb, syllabus.program),
        loadStandIns(pb, syllabus.id),
        can(auth.user, "signedCopy.return", target),
        can(auth.user, "syllabus.transferLead", target),
      ]);
    return NextResponse.json({
      ...toSyllabusResponse(syllabus, access),
      can_return_signed_copy: canReturnSignedCopy,
      can_transfer_lead: canTransferLead,
      lead_transfer_is_override: isAdminOverride(
        roles,
        "syllabus.transferLead",
        { programId: syllabus.program },
      ),
      review: reviewContext(
        auth.user.id,
        roles.isAdmin,
        syllabus,
        holders,
        standIns,
      ),
    });
  } catch (error) {
    return handlePbError(error);
  }
}

// PATCH /api/syllabus/:id  { "co_authors": ["<userId>", ...] }
// Lead only, while a draft or returned. Replaces the list; each co-author
// must be active faculty of the target program. On a returned syllabus,
// nobody who is a stand-in on it or has decided on it may be added.
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseSyllabusUpdateInput(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const pb = await createAdminPb();
    const [syllabus, roles] = await Promise.all([
      pb.collection("syllabi").getOne<Syllabus>(id),
      getUserRoles(auth.user.id),
    ]);
    const access = getSyllabusAccess(auth.user.id, roles, syllabus);
    if (!access) return notFound();
    if (access !== "lead") return leadOnly();
    if (syllabus.status !== "draft" && syllabus.status !== "returned") {
      return notEditable();
    }

    const { co_authors } = parsed.data;
    if (co_authors.includes(syllabus.lead)) {
      return NextResponse.json(
        { error: "The lead can't also be a co-author." },
        { status: 400 },
      );
    }
    const eligible = await activeFacultyAmong(pb, syllabus.program, co_authors);
    if (co_authors.some((userId) => !eligible.has(userId))) {
      return NextResponse.json(
        { error: "Every co-author must be active faculty of this program." },
        { status: 409 },
      );
    }

    const added = co_authors.filter((u) => !syllabus.co_authors.includes(u));
    if (syllabus.status === "returned" && added.length > 0) {
      const [standIns, reviewerIds] = await Promise.all([
        loadStandIns(pb, id),
        loadReviewerIds(pb, id),
      ]);
      if (added.some((u) => isPersonalReviewer(u, standIns, reviewerIds))) {
        return NextResponse.json(
          {
            error:
              "Someone who has reviewed this syllabus or stands in on it can't be added as a co-author.",
          },
          { status: 409 },
        );
      }
    }

    const updated = await pb
      .collection("syllabi")
      .update<Syllabus>(id, { co_authors }, { expand: SYLLABUS_EXPAND });
    return NextResponse.json(toSyllabusResponse(updated, "lead"));
  } catch (error) {
    return handlePbError(error);
  }
}

// DELETE /api/syllabus/:id
// Lead only, for a draft that was never submitted and no program is
// referencing. Versions and ended references cascade.
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const pb = await createAdminPb();
    const [syllabus, roles] = await Promise.all([
      pb.collection("syllabi").getOne<Syllabus>(id),
      getUserRoles(auth.user.id),
    ]);
    const access = getSyllabusAccess(auth.user.id, roles, syllabus);
    if (!access) return notFound();
    if (access !== "lead") return leadOnly();
    if (syllabus.status !== "draft" || syllabus.submitted_at) {
      return NextResponse.json(
        { error: "Only a draft that was never submitted can be deleted." },
        { status: 409 },
      );
    }
    if (await hasLiveReferenceTo(pb, id)) {
      return NextResponse.json(
        {
          error:
            "Another program references this syllabus. Reject or revoke its reference first.",
        },
        { status: 409 },
      );
    }

    await pb.collection("syllabi").delete(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handlePbError(error);
  }
}
