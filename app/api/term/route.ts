import { requireUser } from "@/lib/auth";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { toTermRecord, toTermResponse } from "@/lib/term";
import { isSemester, parseTermInput } from "@/lib/validators/term";
import type { Term } from "@/types/term";
import { NextResponse, type NextRequest } from "next/server";

// GET /api/term?page=1&perPage=30&search=2026&school_year=<id>&semester=First Semester&open=true|false
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
    const schoolYear = searchParams.get("school_year")?.trim();
    const semester = searchParams.get("semester")?.trim();
    const openParam = searchParams.get("open")?.trim();

    // Collection rules are null, so reads go through the superuser client.
    const pb = await createAdminPb();

    // pb.filter() safely binds params to prevent filter injection
    const filters: string[] = [];
    if (search) {
      filters.push(
        pb.filter("(school_year.label ~ {:search} || semester ~ {:search})", {
          search,
        }),
      );
    }
    if (schoolYear) {
      filters.push(pb.filter("school_year = {:schoolYear}", { schoolYear }));
    }
    if (isSemester(semester)) {
      filters.push(pb.filter("semester = {:semester}", { semester }));
    }
    if (openParam === "true" || openParam === "false") {
      filters.push(pb.filter("open = {:open}", { open: openParam === "true" }));
    }

    const result = await pb.collection("terms").getList<Term>(page, perPage, {
      // Alphabetical semester order happens to be First, Second, Summer.
      sort: "-school_year.label,semester",
      expand: "school_year",
      ...(filters.length > 0 && { filter: filters.join(" && ") }),
    });

    return NextResponse.json({
      ...result,
      items: result.items.map(toTermResponse),
    });
  } catch (error) {
    return handlePbError(error);
  }
}

// POST /api/term
// { "school_year": "<id>", "semester": "First Semester", "open"?: boolean, "submission_deadline"?: "2026-12-01" | null, "review_days"?: 0-90 }
export async function POST(request: NextRequest) {
  const auth = await requireUser("term.write");
  if (!auth.ok) return auth.response;

  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseTermInput(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const pb = await createAdminPb();

    const existing = await pb.collection("terms").getList<Term>(1, 1, {
      skipTotal: true,
      filter: pb.filter(
        "school_year = {:schoolYear} && semester = {:semester}",
        {
          schoolYear: parsed.data.school_year,
          semester: parsed.data.semester,
        },
      ),
    });
    if (existing.items.length > 0) {
      return NextResponse.json(
        { error: "That school year already has this semester" },
        { status: 409 },
      );
    }

    // The unique index still guards against a race between two requests.
    const created = await pb
      .collection("terms")
      .create<Term>(toTermRecord(parsed.data), { expand: "school_year" });

    return NextResponse.json(toTermResponse(created), { status: 201 });
  } catch (error) {
    return handlePbError(error);
  }
}
