import { requireUser } from "@/lib/auth";
import {
  departmentHasActiveHead,
  toDepartmentHeadResponse,
} from "@/lib/department-head";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { parseDepartmentHeadUpdate } from "@/lib/validators/department-head";
import type { DepartmentHead } from "@/types/department-head";
import { NextResponse, type NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

// PATCH /api/department-head/:id { "active": boolean }
// Scoped by the record's department.
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const auth = await requireUser("departmentHead.write", {
    departmentHead: id,
  });
  if (!auth.ok) return auth.response;

  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseDepartmentHeadUpdate(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const pb = await createAdminPb();

    if (parsed.data.active) {
      const current = await pb
        .collection("department_heads")
        .getOne<DepartmentHead>(id);
      if (await departmentHasActiveHead(current.department, id)) {
        return NextResponse.json(
          {
            error:
              "That department already has an active head. Deactivate them first.",
          },
          { status: 409 },
        );
      }
    }

    const updated = await pb
      .collection("department_heads")
      .update<DepartmentHead>(id, parsed.data, { expand: "user,department" });

    return NextResponse.json(toDepartmentHeadResponse(updated));
  } catch (error) {
    return handlePbError(error);
  }
}

// DELETE /api/department-head/:id
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const auth = await requireUser("departmentHead.write", {
    departmentHead: id,
  });
  if (!auth.ok) return auth.response;

  try {
    const pb = await createAdminPb();
    await pb.collection("department_heads").delete(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handlePbError(error);
  }
}
