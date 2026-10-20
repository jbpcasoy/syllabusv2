import { requireUser } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { parseCollegeInput } from "@/lib/validators/college";
import type { College } from "@/types/college";
import { NextResponse, type NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/college/:id
export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const pb = await createAdminPb();
    const college = await pb
      .collection("colleges")
      .getOne<College>(id, { expand: "campus" });
    return NextResponse.json(college);
  } catch (error) {
    return handlePbError(error);
  }
}

// PATCH /api/college/:id  { "name"?: string, "code"?: string, "campus"?: string }
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireUser(PERMISSIONS.college.write);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseCollegeInput(body, { partial: true });
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const pb = await createAdminPb();
    const updated = await pb
      .collection("colleges")
      .update<College>(id, parsed.data, { expand: "campus" });
    return NextResponse.json(updated);
  } catch (error) {
    return handlePbError(error);
  }
}

// DELETE /api/college/:id
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const auth = await requireUser(PERMISSIONS.college.write);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const pb = await createAdminPb();
    await pb.collection("colleges").delete(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handlePbError(error);
  }
}
