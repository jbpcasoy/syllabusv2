import { requireUser } from "@/lib/auth";
import { can } from "@/lib/capabilities";
import { addNotifications, notificationFacts } from "@/lib/notifications";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { getUserRoles } from "@/lib/roles";
import {
  REFERENCE_EXPAND,
  referenceTransition,
  toSyllabusReferenceResponse,
} from "@/lib/syllabus-reference";
import { parseReferenceActionInput } from "@/lib/validators/syllabus-reference";
import type { SyllabusReference } from "@/types/syllabus-reference";
import { NextResponse, type NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

/** The source lead for the transition, plus the names a notice needs. */
const NOTICE_EXPAND = "syllabus.course,syllabus.program,program";

// PATCH /api/syllabus-reference/:id  { "action": "approve" | "withdraw" } | { "action": "reject" | "revoke", "reason": "..." }
// approve, reject, revoke: the source syllabus's lead or admin.
// withdraw: the referencing program's chair (or admin).
// approve and revoke notify the referencing program's active chairs;
// withdraw notifies the source lead.
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseReferenceActionInput(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const me = auth.user.id;
    const pb = await createAdminPb();
    const reference = await pb
      .collection("syllabus_references")
      .getOne<SyllabusReference>(id, { expand: NOTICE_EXPAND });

    const [roles, canRequest] = await Promise.all([
      getUserRoles(me),
      can(auth.user, "syllabusReference.request", {
        program: reference.program,
      }),
    ]);
    const result = referenceTransition(reference.status, parsed.data.action, {
      isSourceLead: reference.expand?.syllabus?.lead === me,
      canRequest,
      isAdmin: roles.isAdmin,
    });
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status },
      );
    }

    const batch = pb.createBatch();
    batch.collection("syllabus_references").update(id, {
      status: result.next,
      ...("reason" in parsed.data && { reason: parsed.data.reason }),
      [`${result.stamp}_by`]: me,
      [`${result.stamp}_at`]: new Date().toISOString(),
    });
    // Approve and revoke change the referencing program's access, so its
    // active chairs hear about it. A withdraw tells the source lead, whether
    // it cancels a pending request or stops an approved reference. All in
    // the same batch.
    const action = parsed.data.action;
    const kind =
      action === "approve"
        ? "reference_approved"
        : action === "revoke"
          ? "reference_revoked"
          : action === "withdraw"
            ? reference.status === "approved"
              ? "reference_stopped"
              : "reference_withdrawn"
            : null;
    const source = reference.expand?.syllabus;
    if (kind && source) {
      let users: string[];
      if (action === "withdraw") {
        users = [source.lead];
      } else {
        const chairs = await pb
          .collection("program_chairs")
          .getFullList<{ user: string }>({
            fields: "user",
            filter: pb.filter("program = {:program} && active = true", {
              program: reference.program,
            }),
          });
        users = chairs.map((c) => c.user);
      }
      const recipients = [...new Set(users)].filter(
        (user) => user && user !== me,
      );
      addNotifications(
        batch,
        reference.syllabus,
        me,
        recipients.map((user) => ({ user, kind, stage: 0 })),
        {
          ...notificationFacts(source, auth.user.name),
          referencingProgramCode: reference.expand?.program?.code,
          ...("reason" in parsed.data && { reason: parsed.data.reason }),
        },
      );
    }
    await batch.send();

    const updated = await pb
      .collection("syllabus_references")
      .getOne<SyllabusReference>(id, { expand: REFERENCE_EXPAND });
    return NextResponse.json(toSyllabusReferenceResponse(updated));
  } catch (error) {
    return handlePbError(error);
  }
}
