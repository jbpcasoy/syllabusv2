import { createAdminPb, createPb, handlePbError } from "@/lib/pocketbase";
import { parseCollegeInput } from "@/lib/validators/college";
import type { College } from "@/types/college";
import { NextResponse, type NextRequest } from "next/server";

// GET /api/college?page=1&perPage=30&search=foo&campus=<campusId>
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const perPage = Math.min(
      100,
      Math.max(1, Number(searchParams.get("perPage")) || 30),
    );
    const search = searchParams.get("search")?.trim();
    const campus = searchParams.get("campus")?.trim();

    const pb = createPb();

    // pb.filter() safely binds params to prevent filter injection
    const filters: string[] = [];
    if (search) {
      filters.push(
        pb.filter("(name ~ {:search} || code ~ {:search})", { search }),
      );
    }
    if (campus) {
      filters.push(pb.filter("campus = {:campus}", { campus }));
    }

    const result = await pb
      .collection("colleges")
      .getList<College>(page, perPage, {
        sort: "name",
        expand: "campus",
        ...(filters.length > 0 && { filter: filters.join(" && ") }),
      });

    return NextResponse.json(result);
  } catch (error) {
    return handlePbError(error);
  }
}

// POST /api/college  { "name": "College of Science", "code": "COS", "campus": "<campusId>" }
export async function POST(request: NextRequest) {
  // TODO: verify the caller is allowed to write (session, API key, etc.)
  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseCollegeInput(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const pb = await createAdminPb();
    const created = await pb
      .collection("colleges")
      .create<College>(parsed.data, { expand: "campus" });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handlePbError(error);
  }
}
