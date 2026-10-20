import { requireUser } from "@/lib/auth";
import {
  hasActiveCitlDirector,
  toCitlDirectorResponse,
} from "@/lib/citl-director";
import { PERMISSIONS } from "@/lib/permissions";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { parseCitlDirectorUpdate } from "@/lib/validators/citl-director";
import type { CitlDirector } from "@/types/citl-director";
import { NextResponse, type NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

// PATCH /api/citl-director/:id { "active": boolean }
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireUser(PERMISSIONS.citlDirector.write);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseCitlDirectorUpdate(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    if (parsed.data.active && (await hasActiveCitlDirector(id))) {
      return NextResponse.json(
        {
          error:
            "There is already an active CITL director. Deactivate them first.",
        },
        { status: 409 },
      );
    }

    const pb = await createAdminPb();
    const updated = await pb
      .collection("citl_directors")
      .update<CitlDirector>(id, parsed.data, { expand: "user" });

    return NextResponse.json(toCitlDirectorResponse(updated));
  } catch (error) {
    return handlePbError(error);
  }
}

// DELETE /api/citl-director/:id
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const auth = await requireUser(PERMISSIONS.citlDirector.write);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const pb = await createAdminPb();
    await pb.collection("citl_directors").delete(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handlePbError(error);
  }
}
