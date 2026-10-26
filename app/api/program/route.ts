import { authorize, requireUser } from "@/lib/auth";
import { orgVisibility, programScopeFilter } from "@/lib/org-visibility";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { getUserRoles } from "@/lib/roles";
import { parseProgramInput } from "@/lib/validators/program";
import type { Program } from "@/types/program";
import { NextResponse, type NextRequest } from "next/server";

// GET /api/program?page=1&perPage=30&search=foo&department=<departmentId>
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
    const department = searchParams.get("department")?.trim();

    const visibility = orgVisibility(await getUserRoles(auth.user.id));
    const pb = await createAdminPb();

    // pb.filter() safely binds params to prevent filter injection
    const filters: string[] = [];
    if (search) {
      filters.push(
        pb.filter("(name ~ {:search} || code ~ {:search})", { search }),
      );
    }
    if (department) {
      filters.push(pb.filter("department = {:department}", { department }));
    }
    const scope = programScopeFilter(
      (expr, params) => pb.filter(expr, params),
      visibility,
    );
    if (scope) filters.push(scope);

    const result = await pb
      .collection("programs")
      .getList<Program>(page, perPage, {
        sort: "name",
        expand: "department",
        ...(filters.length > 0 && { filter: filters.join(" && ") }),
      });

    return NextResponse.json(result);
  } catch (error) {
    return handlePbError(error);
  }
}

// POST /api/program  { "name": "BS Computer Science", "code": "BSCS", "department": "<departmentId>" }
export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseProgramInput(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { department } = parsed.data;
    if (!department) {
      return NextResponse.json(
        { error: "`department` is required" },
        { status: 400 },
      );
    }

    const denied = await authorize(auth.user, "program.create", { department });
    if (denied) return denied;

    const pb = await createAdminPb();
    const created = await pb
      .collection("programs")
      .create<Program>(parsed.data, { expand: "department" });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handlePbError(error);
  }
}
