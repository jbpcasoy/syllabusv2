import { requireUser } from "@/lib/auth";
import { COURSE_EXPAND, toCourseResponse } from "@/lib/course";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { parseCourseInput } from "@/lib/validators/course";
import type { Course } from "@/types/course";
import { NextResponse, type NextRequest } from "next/server";

// GET /api/course?page=1&perPage=30&search=cs&program=<id>
// The course picker calls this with a small perPage and the typed search.
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

    // Collection rules are null, so reads go through the superuser client.
    const pb = await createAdminPb();

    // pb.filter() safely binds params to prevent filter injection
    const filters: string[] = [];
    if (search) {
      filters.push(
        pb.filter("(code ~ {:search} || title ~ {:search})", { search }),
      );
    }
    if (program) {
      filters.push(pb.filter("program = {:program}", { program }));
    }

    const result = await pb
      .collection("courses")
      .getList<Course>(page, perPage, {
        sort: "code",
        expand: COURSE_EXPAND,
        ...(filters.length > 0 && { filter: filters.join(" && ") }),
      });

    return NextResponse.json({
      ...result,
      items: result.items.map(toCourseResponse),
    });
  } catch (error) {
    return handlePbError(error);
  }
}

// POST /api/course
// { "code": "CS 101", "title": "Intro to Computing", "program": "<id>", "credit_units"?, "lec_units"?,
//   "lab_units"?, "nominal_duration_hours"?, "prerequisites"?: ["<courseId>"], "prerequisite_note"? }
export async function POST(request: NextRequest) {
  const auth = await requireUser("course.write");
  if (!auth.ok) return auth.response;

  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseCourseInput(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const pb = await createAdminPb();

    const existing = await pb.collection("courses").getList<Course>(1, 1, {
      skipTotal: true,
      filter: pb.filter("code = {:code}", { code: parsed.data.code }),
    });
    if (existing.items.length > 0) {
      return NextResponse.json(
        { error: "A course with that code already exists" },
        { status: 409 },
      );
    }

    // The unique index still guards against a race between two requests.
    const created = await pb
      .collection("courses")
      .create<Course>(parsed.data, { expand: COURSE_EXPAND });

    return NextResponse.json(toCourseResponse(created), { status: 201 });
  } catch (error) {
    return handlePbError(error);
  }
}
