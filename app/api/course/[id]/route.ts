import { requireUser } from "@/lib/auth";
import {
  COURSE_EXPAND,
  describeCourseDependents,
  toCourseResponse,
} from "@/lib/course";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { parseCourseUpdate } from "@/lib/validators/course";
import type { Course } from "@/types/course";
import { NextResponse, type NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/course/:id
export async function GET(_request: NextRequest, { params }: RouteContext) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const pb = await createAdminPb();
    const record = await pb
      .collection("courses")
      .getOne<Course>(id, { expand: COURSE_EXPAND });
    return NextResponse.json(toCourseResponse(record));
  } catch (error) {
    return handlePbError(error);
  }
}

// PATCH /api/course/:id  { any subset of the POST fields }
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireUser("course.write");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseCourseUpdate(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    if (parsed.data.prerequisites?.includes(id)) {
      return NextResponse.json(
        { error: "A course can't be its own prerequisite" },
        { status: 400 },
      );
    }

    const pb = await createAdminPb();

    if (parsed.data.code !== undefined) {
      const duplicate = await pb.collection("courses").getList<Course>(1, 1, {
        skipTotal: true,
        filter: pb.filter("code = {:code} && id != {:id}", {
          code: parsed.data.code,
          id,
        }),
      });
      if (duplicate.items.length > 0) {
        return NextResponse.json(
          { error: "A course with that code already exists" },
          { status: 409 },
        );
      }
    }

    const updated = await pb
      .collection("courses")
      .update<Course>(id, parsed.data, { expand: COURSE_EXPAND });

    return NextResponse.json(toCourseResponse(updated));
  } catch (error) {
    return handlePbError(error);
  }
}

// DELETE /api/course/:id  (409 while a prospectus item or another course references it)
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const auth = await requireUser("course.write");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;

    const blocked = await describeCourseDependents(id);
    if (blocked) {
      return NextResponse.json({ error: blocked }, { status: 409 });
    }

    const pb = await createAdminPb();
    await pb.collection("courses").delete(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handlePbError(error);
  }
}
