import { requireUser } from "@/lib/auth";
import { canManageFaculty, toFacultyResponse } from "@/lib/faculty";
import { PERMISSIONS } from "@/lib/permissions";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { parseFacultyInput } from "@/lib/validators/faculty";
import type { Faculty } from "@/types/faculty";
import { NextResponse, type NextRequest } from "next/server";

// GET /api/faculty?page=1&perPage=30&search=foo&department=<id>&user=<id|me>&active=true|false
// Non-managers are always scoped to their own memberships.
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
    const userParam = searchParams.get("user")?.trim();
    const activeParam = searchParams.get("active")?.trim();

    const userId = canManageFaculty(auth.user)
      ? userParam === "me"
        ? auth.user.id
        : userParam
      : auth.user.id;

    // Superuser client: the users collection's rules hide other users from `expand`.
    const pb = await createAdminPb();

    // pb.filter() safely binds params to prevent filter injection
    const filters: string[] = [];
    if (search) {
      filters.push(
        pb.filter("(user.name ~ {:search} || user.email ~ {:search})", {
          search,
        }),
      );
    }
    if (department) {
      filters.push(pb.filter("department = {:department}", { department }));
    }
    if (userId) {
      filters.push(pb.filter("user = {:userId}", { userId }));
    }
    if (activeParam === "true" || activeParam === "false") {
      filters.push(
        pb.filter("active = {:active}", { active: activeParam === "true" }),
      );
    }

    const result = await pb
      .collection("faculties")
      .getList<Faculty>(page, perPage, {
        sort: "-created",
        expand: "user,department",
        ...(filters.length > 0 && { filter: filters.join(" && ") }),
      });

    return NextResponse.json({
      ...result,
      items: result.items.map(toFacultyResponse),
    });
  } catch (error) {
    return handlePbError(error);
  }
}

// POST /api/faculty  { "user": "<userId>", "department": "<departmentId>", "active"?: boolean }
export async function POST(request: NextRequest) {
  const auth = await requireUser(PERMISSIONS.faculty.write);
  if (!auth.ok) return auth.response;

  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseFacultyInput(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const pb = await createAdminPb();

    const existing = await pb.collection("faculties").getList<Faculty>(1, 1, {
      skipTotal: true,
      filter: pb.filter("user = {:user} && department = {:department}", {
        user: parsed.data.user,
        department: parsed.data.department,
      }),
    });
    if (existing.items.length > 0) {
      return NextResponse.json(
        {
          error: existing.items[0].active
            ? "This user is already faculty of that department"
            : "This user already has an inactive membership in that department. Reactivate it instead.",
        },
        { status: 409 },
      );
    }

    // The unique index still guards against a race between two requests.
    const created = await pb
      .collection("faculties")
      .create<Faculty>(parsed.data, { expand: "user,department" });

    return NextResponse.json(toFacultyResponse(created), { status: 201 });
  } catch (error) {
    return handlePbError(error);
  }
}
