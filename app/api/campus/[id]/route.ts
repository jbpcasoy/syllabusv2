import { requireUser } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { parseCampusInput } from "@/lib/validators/campus";
import type { Campus } from "@/types/campus";
import { NextResponse, type NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/campuses/:id
export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const pb = await createAdminPb();
    const campus = await pb.collection("campuses").getOne<Campus>(id);
    return NextResponse.json(campus);
  } catch (error) {
    return handlePbError(error);
  }
}

// PATCH /api/campuses/:id  { "name": "New Name" }
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireUser(PERMISSIONS.campus.write);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseCampusInput(body, { partial: true });
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const pb = await createAdminPb();
    const updated = await pb
      .collection("campuses")
      .update<Campus>(id, parsed.data);
    return NextResponse.json(updated);
  } catch (error) {
    return handlePbError(error);
  }
}

// DELETE /api/campuses/:id
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const auth = await requireUser(PERMISSIONS.campus.write);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const pb = await createAdminPb();
    await pb.collection("campuses").delete(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handlePbError(error);
  }
}
