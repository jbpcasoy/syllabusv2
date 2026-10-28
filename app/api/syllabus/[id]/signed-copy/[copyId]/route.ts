import { authorize, requireUser } from "@/lib/auth";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { getUserRoles } from "@/lib/roles";
import { SIGNED_COPY_EXPAND, toSignedCopyResponse } from "@/lib/signed-copy";
import { resolveSyllabusAccess } from "@/lib/syllabus";
import { addSyllabusEvent } from "@/lib/syllabus-events";
import { transition } from "@/lib/syllabus-workflow";
import { parseSignedCopyReturn } from "@/lib/validators/signed-copy";
import type { SignedCopy } from "@/types/signed-copy";
import type { Syllabus } from "@/types/syllabus";
import { NextResponse, type NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string; copyId: string }> };

// PATCH /api/syllabus/:id/signed-copy/:copyId  { "reason": "" }
// signedCopy.return in the syllabus's program: its program reviewer, the
// dean of its college, the FDIS chair, CITL director, VPAA, or admin.
// Returns the valid copy as invalid and the syllabus to approved, in one
// batch, so the lead can upload a new scan.
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id, copyId } = await params;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseSignedCopyReturn(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const pb = await createAdminPb();
    const [syllabus, copy, roles] = await Promise.all([
      pb.collection("syllabi").getOne<Syllabus>(id),
      pb.collection("syllabus_signed_copies").getOne<SignedCopy>(copyId),
      getUserRoles(auth.user.id),
    ]);
    if (
      copy.syllabus !== id ||
      !(await resolveSyllabusAccess(pb, auth.user.id, roles, syllabus))
    ) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const denied = await authorize(auth.user, "signedCopy.return", {
      program: syllabus.program,
    });
    if (denied) return denied;

    if (copy.status !== "valid") {
      return NextResponse.json(
        { error: "This signed copy was already returned." },
        { status: 409 },
      );
    }
    const result = transition(syllabus, { type: "rejectScan" });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    const now = new Date().toISOString();
    const batch = pb.createBatch();
    batch.collection("syllabus_signed_copies").update(copyId, {
      status: "returned",
      reason: parsed.data.reason,
      returned_by: auth.user.id,
      returned_at: now,
    });
    batch
      .collection("syllabi")
      .update(id, { ...result.next, status_changed_at: now });
    addSyllabusEvent(batch, id, {
      type: "scan_returned",
      actor: auth.user.id,
      reason: parsed.data.reason,
    });
    await batch.send();

    const updated = await pb
      .collection("syllabus_signed_copies")
      .getOne<SignedCopy>(copyId, { expand: SIGNED_COPY_EXPAND });
    return NextResponse.json(toSignedCopyResponse(updated));
  } catch (error) {
    return handlePbError(error);
  }
}
