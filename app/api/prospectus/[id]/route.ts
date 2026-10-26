import { requireUser } from "@/lib/auth";
import { can } from "@/lib/capabilities";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { PROSPECTUS_EXPAND, toProspectusResponse } from "@/lib/prospectus";
import { parseProspectusUpdate } from "@/lib/validators/prospectus";
import { Prospectus } from "@/types/prospectus";
import { NextResponse, type NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/prospectus/:id  (non-managers can only read published ones)
export async function GET(_request: NextRequest, { params }: RouteContext) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const pb = await createAdminPb();
    const record = await pb
      .collection("prospectuses")
      .getOne<Prospectus>(id, { expand: PROSPECTUS_EXPAND });

    if (!record.published && !(await can(auth.user, "prospectus.write"))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(toProspectusResponse(record));
  } catch (error) {
    return handlePbError(error);
  }
}

// PATCH /api/prospectus/:id  { "school_year"?: "<schoolYearId>", "published"?: boolean }
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireUser("prospectus.write");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseProspectusUpdate(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const pb = await createAdminPb();

    // Changing the year must not collide with another prospectus of the same program.
    if (parsed.data.school_year !== undefined) {
      const current = await pb
        .collection("prospectuses")
        .getOne<Prospectus>(id);
      if (current.school_year !== parsed.data.school_year) {
        const duplicate = await pb
          .collection("prospectuses")
          .getList<Prospectus>(1, 1, {
            skipTotal: true,
            filter: pb.filter(
              "program = {:program} && school_year = {:schoolYear} && id != {:id}",
              {
                program: current.program,
                schoolYear: parsed.data.school_year,
                id,
              },
            ),
          });
        if (duplicate.items.length > 0) {
          return NextResponse.json(
            {
              error:
                "That program already has a prospectus for this school year",
            },
            { status: 409 },
          );
        }
      }
    }

    const updated = await pb
      .collection("prospectuses")
      .update<Prospectus>(id, parsed.data, { expand: PROSPECTUS_EXPAND });

    return NextResponse.json(toProspectusResponse(updated));
  } catch (error) {
    return handlePbError(error);
  }
}

// DELETE /api/prospectus/:id
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const auth = await requireUser("prospectus.write");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const pb = await createAdminPb();
    await pb.collection("prospectuses").delete(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handlePbError(error);
  }
}
