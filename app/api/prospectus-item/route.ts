import { requireUser } from "@/lib/auth";
import { can } from "@/lib/capabilities";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import {
  PROSPECTUS_ITEM_EXPAND,
  toProspectusItemResponse,
} from "@/lib/prospectus-item";
import {
  isSemester,
  isYearLevel,
  parseProspectusItemInput,
} from "@/lib/validators/prospectus-item";
import type { ProspectusItem } from "@/types/prospectus-item";
import { NextResponse, type NextRequest } from "next/server";

// GET /api/prospectus-item?page=1&perPage=30&search=foo&prospectus=<id>&semester=First Semester&year_level=First Year
// Non-managers only ever see items of published prospectuses.
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
    const prospectus = searchParams.get("prospectus")?.trim();
    const semester = searchParams.get("semester")?.trim();
    const yearLevel = searchParams.get("year_level")?.trim();

    const canManage = await can(auth.user, "prospectusItem.write");

    // Collection rules are null, so reads go through the superuser client.
    const pb = await createAdminPb();

    // pb.filter() safely binds params to prevent filter injection
    const filters: string[] = [];
    if (search) {
      filters.push(
        pb.filter("(subject_code ~ {:search} || title ~ {:search})", {
          search,
        }),
      );
    }
    if (prospectus) {
      filters.push(pb.filter("prospectus = {:prospectus}", { prospectus }));
    }
    if (isSemester(semester)) {
      filters.push(pb.filter("semester = {:semester}", { semester }));
    }
    if (isYearLevel(yearLevel)) {
      filters.push(pb.filter("year_level = {:yearLevel}", { yearLevel }));
    }
    if (!canManage) {
      filters.push("prospectus.published = true");
    }

    const result = await pb
      .collection("prospectus_items")
      .getList<ProspectusItem>(page, perPage, {
        sort: "subject_code",
        expand: PROSPECTUS_ITEM_EXPAND,
        ...(filters.length > 0 && { filter: filters.join(" && ") }),
      });

    return NextResponse.json({
      ...result,
      items: result.items.map(toProspectusItemResponse),
    });
  } catch (error) {
    return handlePbError(error);
  }
}

// POST /api/prospectus-item
// { "prospectus": "<id>", "semester": "First Semester", "year_level": "First Year", "subject_code": "CS101", "title": "Intro to Computing" }
export async function POST(request: NextRequest) {
  const auth = await requireUser("prospectusItem.write");
  if (!auth.ok) return auth.response;

  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseProspectusItemInput(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const pb = await createAdminPb();

    const existing = await pb
      .collection("prospectus_items")
      .getList<ProspectusItem>(1, 1, {
        skipTotal: true,
        filter: pb.filter(
          "prospectus = {:prospectus} && subject_code = {:subjectCode} && year_level = {:yearLevel} && semester = {:semester}",
          {
            prospectus: parsed.data.prospectus,
            subjectCode: parsed.data.subject_code,
            yearLevel: parsed.data.year_level,
            semester: parsed.data.semester,
          },
        ),
      });
    if (existing.items.length > 0) {
      return NextResponse.json(
        {
          error:
            "That subject is already listed for this year level and semester of the prospectus",
        },
        { status: 409 },
      );
    }

    // The unique index still guards against a race between two requests.
    const created = await pb
      .collection("prospectus_items")
      .create<ProspectusItem>(parsed.data, { expand: PROSPECTUS_ITEM_EXPAND });

    return NextResponse.json(toProspectusItemResponse(created), {
      status: 201,
    });
  } catch (error) {
    return handlePbError(error);
  }
}
