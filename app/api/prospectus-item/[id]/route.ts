import { requireUser } from "@/lib/auth";
import { can } from "@/lib/capabilities";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import {
  PROSPECTUS_ITEM_EXPAND,
  toProspectusItemResponse,
} from "@/lib/prospectus-item";
import { parseProspectusItemUpdate } from "@/lib/validators/prospectus-item";
import type { ProspectusItem } from "@/types/prospectus-item";
import { NextResponse, type NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/prospectus-item/:id  (non-managers can only read items of published prospectuses)
export async function GET(_request: NextRequest, { params }: RouteContext) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const pb = await createAdminPb();
    const record = await pb
      .collection("prospectus_items")
      .getOne<ProspectusItem>(id, { expand: PROSPECTUS_ITEM_EXPAND });

    if (
      !record.expand?.prospectus?.published &&
      !(await can(auth.user, "prospectusItem.write"))
    ) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(toProspectusItemResponse(record));
  } catch (error) {
    return handlePbError(error);
  }
}

// PATCH /api/prospectus-item/:id  { "semester"?, "year_level"?, "subject_code"?, "title"? }
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireUser("prospectusItem.write");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseProspectusItemUpdate(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const pb = await createAdminPb();

    // Changing any part of the unique key must not collide with another item
    // of the same prospectus.
    const { subject_code, year_level, semester } = parsed.data;
    if (
      subject_code !== undefined ||
      year_level !== undefined ||
      semester !== undefined
    ) {
      const current = await pb
        .collection("prospectus_items")
        .getOne<ProspectusItem>(id);
      const duplicate = await pb
        .collection("prospectus_items")
        .getList<ProspectusItem>(1, 1, {
          skipTotal: true,
          filter: pb.filter(
            "prospectus = {:prospectus} && subject_code = {:subjectCode} && year_level = {:yearLevel} && semester = {:semester} && id != {:id}",
            {
              prospectus: current.prospectus,
              subjectCode: subject_code ?? current.subject_code,
              yearLevel: year_level ?? current.year_level,
              semester: semester ?? current.semester,
              id,
            },
          ),
        });
      if (duplicate.items.length > 0) {
        return NextResponse.json(
          {
            error:
              "That subject is already listed for this year level and semester of the prospectus",
          },
          { status: 409 },
        );
      }
    }

    const updated = await pb
      .collection("prospectus_items")
      .update<ProspectusItem>(id, parsed.data, {
        expand: PROSPECTUS_ITEM_EXPAND,
      });

    return NextResponse.json(toProspectusItemResponse(updated));
  } catch (error) {
    return handlePbError(error);
  }
}

// DELETE /api/prospectus-item/:id
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const auth = await requireUser("prospectusItem.write");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const pb = await createAdminPb();
    await pb.collection("prospectus_items").delete(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handlePbError(error);
  }
}
