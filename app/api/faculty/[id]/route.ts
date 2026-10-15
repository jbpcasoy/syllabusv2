import { requireUser } from "@/lib/auth";
import { toFacultyResponse } from "@/lib/faculty";
import { PERMISSIONS } from "@/lib/permissions";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { parseFacultyUpdate } from "@/lib/validators/faculty";
import type { Faculty } from "@/types/faculty";
import { NextResponse, type NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

// PATCH /api/faculty/:id  { "active": boolean }
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireUser(PERMISSIONS.faculty.write);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseFacultyUpdate(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const pb = await createAdminPb();
    const updated = await pb
      .collection("faculties")
      .update<Faculty>(id, parsed.data, { expand: "user,department" });

    return NextResponse.json(toFacultyResponse(updated));
  } catch (error) {
    return handlePbError(error);
  }
}

// DELETE /api/faculty/:id
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const auth = await requireUser(PERMISSIONS.faculty.write);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const pb = await createAdminPb();
    await pb.collection("faculties").delete(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handlePbError(error);
  }
}
