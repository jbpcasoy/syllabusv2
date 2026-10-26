import { requireUser } from "@/lib/auth";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import {
  describeSchoolYearDependents,
  toSchoolYearResponse,
} from "@/lib/school-year";
import { parseSchoolYearInput } from "@/lib/validators/school-year";
import type { SchoolYear } from "@/types/school-year";
import { NextResponse, type NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/school-year/:id
export async function GET(_request: NextRequest, { params }: RouteContext) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const pb = await createAdminPb();
    const record = await pb.collection("school_years").getOne<SchoolYear>(id);
    return NextResponse.json(toSchoolYearResponse(record));
  } catch (error) {
    return handlePbError(error);
  }
}

// PATCH /api/school-year/:id  { "label": "2027-2028" }
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireUser("schoolYear.write");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseSchoolYearInput(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const pb = await createAdminPb();

    const duplicate = await pb
      .collection("school_years")
      .getList<SchoolYear>(1, 1, {
        skipTotal: true,
        filter: pb.filter("label = {:label} && id != {:id}", {
          label: parsed.data.label,
          id,
        }),
      });
    if (duplicate.items.length > 0) {
      return NextResponse.json(
        { error: "That school year already exists" },
        { status: 409 },
      );
    }

    const updated = await pb
      .collection("school_years")
      .update<SchoolYear>(id, parsed.data);
    return NextResponse.json(toSchoolYearResponse(updated));
  } catch (error) {
    return handlePbError(error);
  }
}

// DELETE /api/school-year/:id  (409 while terms or prospectuses use it)
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const auth = await requireUser("schoolYear.write");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;

    const blocked = await describeSchoolYearDependents(id);
    if (blocked) {
      return NextResponse.json({ error: blocked }, { status: 409 });
    }

    const pb = await createAdminPb();
    await pb.collection("school_years").delete(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handlePbError(error);
  }
}
