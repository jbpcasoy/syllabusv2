import { requireUser } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { canManageProspectuses, toProspectusResponse } from "@/lib/prospectus";
import { parseProspectusInput } from "@/lib/validators/prospectus";
import { Prospectus } from "@/types/prospectus";
import { NextResponse, type NextRequest } from "next/server";

// GET /api/prospectus?page=1&perPage=30&search=foo&program=<id>&school_year=2026-2027&published=true|false
// Non-managers only ever see published prospectuses.
export async function GET(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const perPage = Math.min(
      100,
      Math.max(1, Number(searchParams.get("perPage")) || 30),
    );
    const search = searchParams.get("search")?.trim();
    const program = searchParams.get("program")?.trim();
    const schoolYear = searchParams.get("school_year")?.trim();
    const publishedParam = searchParams.get("published")?.trim();

    const canManage = canManageProspectuses(auth.user);

    // Collection rules are null, so reads go through the superuser client.
    const pb = await createAdminPb();

    // pb.filter() safely binds params to prevent filter injection
    const filters: string[] = [];
    if (search) {
      filters.push(
        pb.filter(
          "(school_year ~ {:search} || program.name ~ {:search} || program.code ~ {:search})",
          { search },
        ),
      );
    }
    if (program) {
      filters.push(pb.filter("program = {:program}", { program }));
    }
    if (schoolYear) {
      filters.push(pb.filter("school_year = {:schoolYear}", { schoolYear }));
    }
    if (!canManage) {
      filters.push("published = true");
    } else if (publishedParam === "true" || publishedParam === "false") {
      filters.push(
        pb.filter("published = {:published}", {
          published: publishedParam === "true",
        }),
      );
    }

    const result = await pb
      .collection("prospectuses")
      .getList<Prospectus>(page, perPage, {
        sort: "-school_year,-created",
        expand: "program",
        ...(filters.length > 0 && { filter: filters.join(" && ") }),
      });

    return NextResponse.json({
      ...result,
      items: result.items.map(toProspectusResponse),
    });
  } catch (error) {
    return handlePbError(error);
  }
}

// POST /api/prospectus  { "program": "<programId>", "school_year": "2026-2027", "published"?: boolean }
export async function POST(request: NextRequest) {
  const auth = await requireUser(PERMISSIONS.prospectus.write);
  if (!auth.ok) return auth.response;

  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseProspectusInput(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const pb = await createAdminPb();

    const existing = await pb
      .collection("prospectuses")
      .getList<Prospectus>(1, 1, {
        skipTotal: true,
        filter: pb.filter(
          "program = {:program} && school_year = {:schoolYear}",
          {
            program: parsed.data.program,
            schoolYear: parsed.data.school_year,
          },
        ),
      });
    if (existing.items.length > 0) {
      return NextResponse.json(
        { error: "That program already has a prospectus for this school year" },
        { status: 409 },
      );
    }

    // The unique index still guards against a race between two requests.
    const created = await pb
      .collection("prospectuses")
      .create<Prospectus>(parsed.data, { expand: "program" });

    return NextResponse.json(toProspectusResponse(created), { status: 201 });
  } catch (error) {
    return handlePbError(error);
  }
}
