import { authorize, requireUser } from "@/lib/auth";
import { describeChildren } from "@/lib/org-children";
import { departmentVisible, orgVisibility } from "@/lib/org-visibility";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { getUserRoles } from "@/lib/roles";
import { parseDepartmentInput } from "@/lib/validators/department";
import type { Department } from "@/types/department";
import { NextResponse, type NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/department/:id  (404 when outside the caller's scope)
export async function GET(_request: NextRequest, { params }: RouteContext) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const pb = await createAdminPb();
    const department = await pb
      .collection("departments")
      .getOne<Department>(id, { expand: "college" });

    const visibility = orgVisibility(await getUserRoles(auth.user.id));
    if (!departmentVisible(visibility, department)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(department);
  } catch (error) {
    return handlePbError(error);
  }
}

// PATCH /api/department/:id  { "name"?: string, "college"?: string }
// Moving to another college also needs department.create there.
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const auth = await requireUser("department.update", { department: id });
  if (!auth.ok) return auth.response;

  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseDepartmentInput(body, { partial: true });
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const pb = await createAdminPb();

    const newCollege = parsed.data.college;
    if (newCollege !== undefined) {
      const current = await pb.collection("departments").getOne<Department>(id);
      if (current.college !== newCollege) {
        const denied = await authorize(auth.user, "department.create", {
          college: newCollege,
        });
        if (denied) return denied;
      }
    }

    const updated = await pb
      .collection("departments")
      .update<Department>(id, parsed.data, { expand: "college" });
    return NextResponse.json(updated);
  } catch (error) {
    return handlePbError(error);
  }
}

// DELETE /api/department/:id  (409 while it still has programs or department heads)
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const auth = await requireUser("department.delete", { department: id });
  if (!auth.ok) return auth.response;

  try {
    const blocked = await describeChildren("department", id);
    if (blocked) {
      return NextResponse.json({ error: blocked }, { status: 409 });
    }

    const pb = await createAdminPb();
    await pb.collection("departments").delete(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handlePbError(error);
  }
}
