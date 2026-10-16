import { requireUser } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { createAdminPb, createPb, handlePbError } from "@/lib/pocketbase";
import { parseProgramInput } from "@/lib/validators/program";
import type { Program } from "@/types/program";
import { NextResponse, type NextRequest } from "next/server";

// GET /api/program?page=1&perPage=30&search=foo&department=<departmentId>
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const perPage = Math.min(
      100,
      Math.max(1, Number(searchParams.get("perPage")) || 30),
    );
    const search = searchParams.get("search")?.trim();
    const department = searchParams.get("department")?.trim();

    const pb = createPb();

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
  const auth = await requireUser(PERMISSIONS.program.write);
  if (!auth.ok) return auth.response;

  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseProgramInput(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const pb = await createAdminPb();
    const created = await pb
      .collection("programs")
      .create<Program>(parsed.data, { expand: "department" });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handlePbError(error);
  }
}
