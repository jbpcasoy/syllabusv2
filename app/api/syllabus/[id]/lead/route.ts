import { requireUser } from "@/lib/auth";
import { can } from "@/lib/capabilities";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { getUserRoles } from "@/lib/roles";
import {
  activeFacultyAmong,
  resolveSyllabusAccess,
  SYLLABUS_EXPAND,
  toSyllabusResponse,
} from "@/lib/syllabus";
import { parseLeadTransfer } from "@/lib/validators/lead-transfer";
import { MAX_CO_AUTHORS, type Syllabus } from "@/types/syllabus";
import { NextResponse, type NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

const conflict = (error: string) =>
  NextResponse.json({ error }, { status: 409 });

// PUT /api/syllabus/:id/lead  { "lead": "<userId>", "keep_previous"?: true }
// syllabus.transferLead: the program's chair, or admin. The new lead must be
// active faculty of the program and leaves the co-author list; the previous
// lead stays on as a co-author unless keep_previous is false. Any status but
// filed.
export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseLeadTransfer(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { lead, keep_previous } = parsed.data;

    const me = auth.user.id;
    const pb = await createAdminPb();
    const [syllabus, roles] = await Promise.all([
      pb.collection("syllabi").getOne<Syllabus>(id),
      getUserRoles(me),
    ]);
    if (!(await can(auth.user, "syllabus.transferLead", { program: syllabus.program }))) {
      if (!(await resolveSyllabusAccess(pb, me, roles, syllabus))) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json(
        { error: "Only the program chair or an admin can transfer the lead." },
        { status: 403 },
      );
    }

    if (syllabus.status === "filed") {
      return conflict("A filed syllabus can't change its lead.");
    }
    if (lead === syllabus.lead) return conflict("That user is already the lead.");
    if (!(await activeFacultyAmong(pb, syllabus.program, [lead])).has(lead)) {
      return conflict("The new lead must be active faculty of the program.");
    }

    const coAuthors = syllabus.co_authors.filter((user) => user !== lead);
    if (keep_previous && !coAuthors.includes(syllabus.lead)) {
      coAuthors.push(syllabus.lead);
    }
    if (coAuthors.length > MAX_CO_AUTHORS) {
      return conflict(`A syllabus can have at most ${MAX_CO_AUTHORS} co-authors.`);
    }

    const updated = await pb
      .collection("syllabi")
      .update<Syllabus>(id, { lead, co_authors: coAuthors }, {
        expand: SYLLABUS_EXPAND,
      });
    return NextResponse.json(toSyllabusResponse(updated));
  } catch (error) {
    return handlePbError(error);
  }
}
