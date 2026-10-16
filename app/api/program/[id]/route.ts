import { requireUser } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { createAdminPb, createPb, handlePbError } from "@/lib/pocketbase";
import { parseProgramInput } from "@/lib/validators/program";
import type { Program } from "@/types/program";
import { NextResponse, type NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/program/:id
export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const pb = createPb();
    const program = await pb
      .collection("programs")
      .getOne<Program>(id, { expand: "department" });
    return NextResponse.json(program);
  } catch (error) {
    return handlePbError(error);
  }
}

// PATCH /api/program/:id  { "name"?: string, "code"?: string, "department"?: string }
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireUser(PERMISSIONS.program.write);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseProgramInput(body, { partial: true });
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const pb = await createAdminPb();
    const updated = await pb
      .collection("programs")
      .update<Program>(id, parsed.data, { expand: "department" });
    return NextResponse.json(updated);
  } catch (error) {
    return handlePbError(error);
  }
}

// DELETE /api/program/:id
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const auth = await requireUser(PERMISSIONS.program.write);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const pb = await createAdminPb();
    await pb.collection("programs").delete(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handlePbError(error);
  }
}
