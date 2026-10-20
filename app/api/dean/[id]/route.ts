import { requireUser } from "@/lib/auth";
import { collegeHasActiveDean, toDeanResponse } from "@/lib/dean";
import { PERMISSIONS } from "@/lib/permissions";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { parseDeanUpdate } from "@/lib/validators/dean";
import type { Dean } from "@/types/dean";
import { NextResponse, type NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

// PATCH /api/dean/:id { "active": boolean }
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireUser(PERMISSIONS.dean.write);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseDeanUpdate(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const pb = await createAdminPb();

    if (parsed.data.active) {
      const current = await pb.collection("deans").getOne<Dean>(id);
      if (await collegeHasActiveDean(current.college, id)) {
        return NextResponse.json(
          {
            error:
              "That college already has an active dean. Deactivate them first.",
          },
          { status: 409 },
        );
      }
    }

    const updated = await pb
      .collection("deans")
      .update<Dean>(id, parsed.data, { expand: "user,college" });

    return NextResponse.json(toDeanResponse(updated));
  } catch (error) {
    return handlePbError(error);
  }
}

// DELETE /api/dean/:id
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const auth = await requireUser(PERMISSIONS.dean.write);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const pb = await createAdminPb();
    await pb.collection("deans").delete(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handlePbError(error);
  }
}
