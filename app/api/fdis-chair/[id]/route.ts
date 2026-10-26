import { requireUser } from "@/lib/auth";
import { hasActiveFdisChair, toFdisChairResponse } from "@/lib/fdis-chair";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { parseFdisChairUpdate } from "@/lib/validators/fdis-chair";
import type { FdisChair } from "@/types/fdis-chair";
import { NextResponse, type NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

// PATCH /api/fdis-chair/:id { "active": boolean }
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireUser("fdisChair.write");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseFdisChairUpdate(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    if (parsed.data.active && (await hasActiveFdisChair(id))) {
      return NextResponse.json(
        {
          error:
            "There is already an active FDIS chair. Deactivate them first.",
        },
        { status: 409 },
      );
    }

    const pb = await createAdminPb();
    const updated = await pb
      .collection("fdis_chairs")
      .update<FdisChair>(id, parsed.data, { expand: "user" });

    return NextResponse.json(toFdisChairResponse(updated));
  } catch (error) {
    return handlePbError(error);
  }
}

// DELETE /api/fdis-chair/:id
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const auth = await requireUser("fdisChair.write");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const pb = await createAdminPb();
    await pb.collection("fdis_chairs").delete(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handlePbError(error);
  }
}
