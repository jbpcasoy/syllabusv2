import { requireUser } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { createAdminPb, createPb, handlePbError } from "@/lib/pocketbase";
import { parseDepartmentInput } from "@/lib/validators/department";
import type { Department } from "@/types/department";
import { NextResponse, type NextRequest } from "next/server";

// GET /api/department?page=1&perPage=30&search=foo&college=<collegeId>
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const perPage = Math.min(
      100,
      Math.max(1, Number(searchParams.get("perPage")) || 30),
    );
    const search = searchParams.get("search")?.trim();
    const college = searchParams.get("college")?.trim();

    const pb = createPb();

    // pb.filter() safely binds params to prevent filter injection
    const filters: string[] = [];
    if (search) {
      filters.push(pb.filter("name ~ {:search}", { search }));
    }
    if (college) {
      filters.push(pb.filter("college = {:college}", { college }));
    }

    const result = await pb
      .collection("departments")
      .getList<Department>(page, perPage, {
        sort: "name",
        expand: "college",
        ...(filters.length > 0 && { filter: filters.join(" && ") }),
      });

    return NextResponse.json(result);
  } catch (error) {
    return handlePbError(error);
  }
}

// POST /api/department  { "name": "Computer Science", "college": "<collegeId>" }
export async function POST(request: NextRequest) {
  const auth = await requireUser(PERMISSIONS.department.write);
  if (!auth.ok) return auth.response;

  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseDepartmentInput(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const pb = await createAdminPb();
    const created = await pb
      .collection("departments")
      .create<Department>(parsed.data, { expand: "college" });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handlePbError(error);
  }
}
