import { requireUser } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { parseVpaaUpdate } from "@/lib/validators/vpaa";
import { hasActiveVpaa, toVpaaResponse } from "@/lib/vpaa";
import type { Vpaa } from "@/types/vpaa";
import { NextResponse, type NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

// PATCH /api/vpaa/:id { "active": boolean }
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireUser(PERMISSIONS.vpaa.write);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseVpaaUpdate(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    if (parsed.data.active && (await hasActiveVpaa(id))) {
      return NextResponse.json(
        {
          error: "There is already an active VPAA. Deactivate them first.",
        },
        { status: 409 },
      );
    }

    const pb = await createAdminPb();
    const updated = await pb
      .collection("vpaas")
      .update<Vpaa>(id, parsed.data, { expand: "user" });

    return NextResponse.json(toVpaaResponse(updated));
  } catch (error) {
    return handlePbError(error);
  }
}

// DELETE /api/vpaa/:id
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const auth = await requireUser(PERMISSIONS.vpaa.write);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const pb = await createAdminPb();
    await pb.collection("vpaas").delete(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handlePbError(error);
  }
}
