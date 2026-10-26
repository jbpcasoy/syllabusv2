import { requireUser } from "@/lib/auth";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { toSchoolYearResponse } from "@/lib/school-year";
import { parseSchoolYearInput } from "@/lib/validators/school-year";
import type { SchoolYear } from "@/types/school-year";
import { NextResponse, type NextRequest } from "next/server";

// GET /api/school-year?page=1&perPage=30&search=2026
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

    // Collection rules are null, so reads go through the superuser client.
    const pb = await createAdminPb();
    const result = await pb
      .collection("school_years")
      .getList<SchoolYear>(page, perPage, {
        sort: "-label",
        // pb.filter() safely binds params to prevent filter injection
        ...(search && { filter: pb.filter("label ~ {:search}", { search }) }),
      });

    return NextResponse.json({
      ...result,
      items: result.items.map(toSchoolYearResponse),
    });
  } catch (error) {
    return handlePbError(error);
  }
}

// POST /api/school-year  { "label": "2026-2027" }
export async function POST(request: NextRequest) {
  const auth = await requireUser("schoolYear.write");
  if (!auth.ok) return auth.response;

  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseSchoolYearInput(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const pb = await createAdminPb();

    const existing = await pb
      .collection("school_years")
      .getList<SchoolYear>(1, 1, {
        skipTotal: true,
        filter: pb.filter("label = {:label}", { label: parsed.data.label }),
      });
    if (existing.items.length > 0) {
      return NextResponse.json(
        { error: "That school year already exists" },
        { status: 409 },
      );
    }

    // The unique index still guards against a race between two requests.
    const created = await pb
      .collection("school_years")
      .create<SchoolYear>(parsed.data);

    return NextResponse.json(toSchoolYearResponse(created), { status: 201 });
  } catch (error) {
    return handlePbError(error);
  }
}
