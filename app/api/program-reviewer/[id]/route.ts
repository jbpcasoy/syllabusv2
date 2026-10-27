import { requireUser } from "@/lib/auth";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import {
  programHasActiveReviewer,
  toProgramReviewerResponse,
} from "@/lib/program-reviewer";
import { parseProgramReviewerUpdate } from "@/lib/validators/program-reviewer";
import type { ProgramReviewer } from "@/types/program-reviewer";
import { NextResponse, type NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

// PATCH /api/program-reviewer/:id  { "active": boolean }
// Scoped by the record's program.
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const auth = await requireUser("programReviewer.write", { programReviewer: id });
  if (!auth.ok) return auth.response;

  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseProgramReviewerUpdate(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const pb = await createAdminPb();

    if (parsed.data.active) {
      const current = await pb
        .collection("program_reviewers")
        .getOne<ProgramReviewer>(id);
      if (await programHasActiveReviewer(current.program, id)) {
        return NextResponse.json(
          {
            error:
              "That program already has an active reviewer. Deactivate them first.",
          },
          { status: 409 },
        );
      }
    }

    const updated = await pb
      .collection("program_reviewers")
      .update<ProgramReviewer>(id, parsed.data, { expand: "user,program" });

    return NextResponse.json(toProgramReviewerResponse(updated));
  } catch (error) {
    return handlePbError(error);
  }
}

// DELETE /api/program-reviewer/:id
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const auth = await requireUser("programReviewer.write", { programReviewer: id });
  if (!auth.ok) return auth.response;

  try {
    const pb = await createAdminPb();
    await pb.collection("program_reviewers").delete(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handlePbError(error);
  }
}
