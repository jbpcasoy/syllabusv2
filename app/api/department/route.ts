import { authorize, requireUser } from "@/lib/auth";
import { departmentScopeFilter, orgVisibility } from "@/lib/org-visibility";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { getUserRoles } from "@/lib/roles";
import { parseDepartmentInput } from "@/lib/validators/department";
import type { Department } from "@/types/department";
import { NextResponse, type NextRequest } from "next/server";

// GET /api/department?page=1&perPage=30&search=foo&college=<collegeId>
// Deans and department heads only see their own scope.
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
    const college = searchParams.get("college")?.trim();

    const visibility = orgVisibility(await getUserRoles(auth.user.id));
    const pb = await createAdminPb();

    // pb.filter() safely binds params to prevent filter injection
    const filters: string[] = [];
    if (search) {
      filters.push(pb.filter("name ~ {:search}", { search }));
    }
    if (college) {
      filters.push(pb.filter("college = {:college}", { college }));
    }
    const scope = departmentScopeFilter(
      (expr, params) => pb.filter(expr, params),
      visibility,
    );
    if (scope) filters.push(scope);

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
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseDepartmentInput(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { college } = parsed.data;
    if (!college) {
      return NextResponse.json(
        { error: "`college` is required" },
        { status: 400 },
      );
    }

    const denied = await authorize(auth.user, "department.create", { college });
    if (denied) return denied;

    const pb = await createAdminPb();
    const created = await pb
      .collection("departments")
      .create<Department>(parsed.data, { expand: "college" });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handlePbError(error);
  }
}
