import { requireUser } from "@/lib/auth";
import { can } from "@/lib/capabilities";
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

// PATCH /api/syllabus-reference/:id  { "action": "approve" | "withdraw" } | { "action": "reject" | "revoke", "reason": "..." }
// approve, reject, revoke: the source syllabus's lead or admin.
// withdraw: the referencing program's chair (or admin).
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
      .getOne<SyllabusReference>(id, { expand: "syllabus" });

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

    const updated = await pb
      .collection("syllabus_references")
      .update<SyllabusReference>(
        id,
        {
          status: result.next,
          ...("reason" in parsed.data && { reason: parsed.data.reason }),
          [`${result.stamp}_by`]: me,
          [`${result.stamp}_at`]: new Date().toISOString(),
        },
        { expand: REFERENCE_EXPAND },
      );
    return NextResponse.json(toSyllabusReferenceResponse(updated));
  } catch (error) {
    return handlePbError(error);
  }
}
