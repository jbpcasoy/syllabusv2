import type { Faculty } from "@/types/faculty";
import type {
  ProgramJoinRequest,
  ProgramJoinRequestDecision,
  ProgramJoinRequestResponse,
} from "@/types/program-join-request";
import type PocketBase from "pocketbase";
import "server-only";

export const JOIN_REQUEST_EXPAND = "user,program,reviewed_by";

export function toProgramJoinRequestResponse(
  record: ProgramJoinRequest,
): ProgramJoinRequestResponse {
  const user = record.expand?.user;
  const program = record.expand?.program;
  const reviewer = record.expand?.reviewed_by;
  return {
    id: record.id,
    user: record.user,
    program: record.program,
    note: record.note,
    status: record.status,
    reason: record.reason,
    reviewed_by: record.reviewed_by,
    reviewed_at: record.reviewed_at,
    created: record.created,
    updated: record.updated,
    expand: {
      ...(user && {
        user: { id: user.id, name: user.name, email: user.email },
      }),
      ...(program && {
        program: { id: program.id, name: program.name, code: program.code },
      }),
      ...(reviewer && {
        reviewed_by: { id: reviewer.id, name: reviewer.name },
      }),
    },
  };
}

/**
 * Records the decision on a pending request. Approving also creates the
 * faculty membership (or reactivates an inactive one) in the same atomic
 * batch, so a request is never "approved" without a membership. On a race
 * the faculties unique index rejects the whole batch.
 */
export async function applyJoinRequestDecision(
  pb: PocketBase,
  request: Pick<ProgramJoinRequest, "id" | "user" | "program">,
  decision: ProgramJoinRequestDecision,
  reviewerId: string,
): Promise<void> {
  const reviewed = {
    reviewed_by: reviewerId,
    reviewed_at: new Date().toISOString(),
  };

  if (decision.decision === "reject") {
    await pb.collection("program_join_requests").update(request.id, {
      status: "rejected",
      reason: decision.reason,
      ...reviewed,
    });
    return;
  }

  const existing = await pb.collection("faculties").getList<Faculty>(1, 1, {
    skipTotal: true,
    filter: pb.filter("user = {:user} && program = {:program}", {
      user: request.user,
      program: request.program,
    }),
  });
  const membership = existing.items[0];

  const batch = pb.createBatch();
  if (!membership) {
    batch.collection("faculties").create({
      user: request.user,
      program: request.program,
      active: true,
    });
  } else if (!membership.active) {
    batch.collection("faculties").update(membership.id, { active: true });
  }
  batch.collection("program_join_requests").update(request.id, {
    status: "approved",
    ...reviewed,
  });
  await batch.send();
}
