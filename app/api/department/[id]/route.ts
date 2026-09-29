import { createAdminPb, createPb, handlePbError } from "@/lib/pocketbase";
import { parseDepartmentInput } from "@/lib/validators/department";
import type { Department } from "@/types/department";
import { NextResponse, type NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/department/:id
export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const pb = createPb();
    const department = await pb
      .collection("departments")
      .getOne<Department>(id, { expand: "college" });
    return NextResponse.json(department);
  } catch (error) {
    return handlePbError(error);
  }
}

// PATCH /api/department/:id  { "name"?: string, "college"?: string }
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  // TODO: verify the caller is allowed to write
  try {
    const { id } = await params;
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseDepartmentInput(body, { partial: true });
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const pb = await createAdminPb();
    const updated = await pb
      .collection("departments")
      .update<Department>(id, parsed.data, { expand: "college" });
    return NextResponse.json(updated);
  } catch (error) {
    return handlePbError(error);
  }
}

// DELETE /api/department/:id
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  // TODO: verify the caller is allowed to write
  try {
    const { id } = await params;
    const pb = await createAdminPb();
    await pb.collection("departments").delete(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handlePbError(error);
  }
}
