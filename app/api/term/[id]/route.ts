import { requireUser } from "@/lib/auth";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { toTermRecord, toTermResponse } from "@/lib/term";
import { parseTermUpdate } from "@/lib/validators/term";
import type { Term } from "@/types/term";
import { NextResponse, type NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/term/:id
export async function GET(_request: NextRequest, { params }: RouteContext) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const pb = await createAdminPb();
    const record = await pb
      .collection("terms")
      .getOne<Term>(id, { expand: "school_year" });
    return NextResponse.json(toTermResponse(record));
  } catch (error) {
    return handlePbError(error);
  }
}

// PATCH /api/term/:id  { "semester"?, "open"?: boolean, "submission_deadline"?: "2026-12-01" | null }
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireUser("term.write");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseTermUpdate(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const pb = await createAdminPb();

    // Changing the semester must not collide with another term of the same year.
    if (parsed.data.semester !== undefined) {
      const current = await pb.collection("terms").getOne<Term>(id);
      if (current.semester !== parsed.data.semester) {
        const duplicate = await pb.collection("terms").getList<Term>(1, 1, {
          skipTotal: true,
          filter: pb.filter(
            "school_year = {:schoolYear} && semester = {:semester} && id != {:id}",
            {
              schoolYear: current.school_year,
              semester: parsed.data.semester,
              id,
            },
          ),
        });
        if (duplicate.items.length > 0) {
          return NextResponse.json(
            { error: "That school year already has this semester" },
            { status: 409 },
          );
        }
      }
    }

    const updated = await pb
      .collection("terms")
      .update<Term>(id, toTermRecord(parsed.data), { expand: "school_year" });

    return NextResponse.json(toTermResponse(updated));
  } catch (error) {
    return handlePbError(error);
  }
}

// DELETE /api/term/:id
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const auth = await requireUser("term.write");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const pb = await createAdminPb();
    await pb.collection("terms").delete(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handlePbError(error);
  }
}
