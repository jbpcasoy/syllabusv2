import { requireUser } from "@/lib/auth";
import { can } from "@/lib/capabilities";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import {
  applyJoinRequestDecision,
  JOIN_REQUEST_EXPAND,
  toProgramJoinRequestResponse,
} from "@/lib/program-join-request";
import { parseProgramJoinRequestDecision } from "@/lib/validators/program-join-request";
import type { ProgramJoinRequest } from "@/types/program-join-request";
import { NextResponse, type NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

function notPending(status: string) {
  return NextResponse.json(
    { error: `This request was already ${status}` },
    { status: 409 },
  );
}

// PATCH /api/program-join-request/:id  { "decision": "approve" } | { "decision": "reject", "reason": "..." }
// Scoped by the request's program. Approving creates the faculty membership.
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const auth = await requireUser("programJoinRequest.review", {
    programJoinRequest: id,
  });
  if (!auth.ok) return auth.response;

  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseProgramJoinRequestDecision(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const pb = await createAdminPb();
    const joinRequest = await pb
      .collection("program_join_requests")
      .getOne<ProgramJoinRequest>(id);

    // Someone else must vouch for you, unless you head the program's
    // department (and chair it). Rejecting your own request is withdrawing.
    if (joinRequest.user === auth.user.id) {
      const allowed =
        parsed.data.decision === "approve" &&
        (await can(auth.user, "programJoinRequest.approveOwn", {
          programJoinRequest: id,
        }));
      if (!allowed) {
        return NextResponse.json(
          { error: "You can't decide your own request" },
          { status: 403 },
        );
      }
    }
    if (joinRequest.status !== "pending") return notPending(joinRequest.status);

    await applyJoinRequestDecision(pb, joinRequest, parsed.data, auth.user.id);

    const updated = await pb
      .collection("program_join_requests")
      .getOne<ProgramJoinRequest>(id, { expand: JOIN_REQUEST_EXPAND });
    return NextResponse.json(toProgramJoinRequestResponse(updated));
  } catch (error) {
    return handlePbError(error);
  }
}

// DELETE /api/program-join-request/:id
// The requester withdraws their own pending request.
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const pb = await createAdminPb();
    const joinRequest = await pb
      .collection("program_join_requests")
      .getOne<ProgramJoinRequest>(id, { fields: "id,user,status" });

    if (joinRequest.user !== auth.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (joinRequest.status !== "pending") return notPending(joinRequest.status);

    await pb.collection("program_join_requests").delete(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handlePbError(error);
  }
}
