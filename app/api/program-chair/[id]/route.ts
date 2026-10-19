import { requireUser } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import {
  programHasActiveChair,
  toProgramChairResponse,
} from "@/lib/program-chair";
import { parseProgramChairUpdate } from "@/lib/validators/program-chair";
import type { ProgramChair } from "@/types/program-chair";
import { NextResponse, type NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

// PATCH /api/program-chair/:id  { "active": boolean }
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireUser(PERMISSIONS.programChair.write);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseProgramChairUpdate(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const pb = await createAdminPb();

    if (parsed.data.active) {
      const current = await pb
        .collection("program_chairs")
        .getOne<ProgramChair>(id);
      if (await programHasActiveChair(current.program, id)) {
        return NextResponse.json(
          {
            error:
              "That program already has an active chair. Deactivate them first.",
          },
          { status: 409 },
        );
      }
    }

    const updated = await pb
      .collection("program_chairs")
      .update<ProgramChair>(id, parsed.data, { expand: "user,program" });

    return NextResponse.json(toProgramChairResponse(updated));
  } catch (error) {
    return handlePbError(error);
  }
}

// DELETE /api/program-chair/:id
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const auth = await requireUser(PERMISSIONS.programChair.write);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const pb = await createAdminPb();
    await pb.collection("program_chairs").delete(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handlePbError(error);
  }
}
