import { requireUser } from "@/lib/auth";
import {
  canManageDepartmentHeads,
  departmentHasActiveHead,
  toDepartmentHeadResponse,
} from "@/lib/department-head";
import { PERMISSIONS } from "@/lib/permissions";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { parseDepartmentHeadInput } from "@/lib/validators/department-head";
import type { DepartmentHead } from "@/types/department-head";
import { NextResponse, type NextRequest } from "next/server";

// GET /api/department-head?page=1&perPage=30&search=foo&department=<id>&user=<id|me>&active=true|false
// Non-managers are always scoped to their own assignments.
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

    const userId = canManageDepartmentHeads(auth.user)
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
      .collection("department_heads")
      .getList<DepartmentHead>(page, perPage, {
        sort: "-created",
        expand: "user,department",
        ...(filters.length > 0 && { filter: filters.join(" && ") }),
      });

    return NextResponse.json({
      ...result,
      items: result.items.map(toDepartmentHeadResponse),
    });
  } catch (error) {
    return handlePbError(error);
  }
}

// POST /api/department-head { "user": "<userId>", "department": "<departmentId>", "active"?: boolean }
export async function POST(request: NextRequest) {
  const auth = await requireUser(PERMISSIONS.departmentHead.write);
  if (!auth.ok) return auth.response;

  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseDepartmentHeadInput(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const pb = await createAdminPb();

    const existing = await pb
      .collection("department_heads")
      .getList<DepartmentHead>(1, 1, {
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
            ? "This user is already head of that department"
            : "This user already has an inactive head record for that department. Reactivate it instead.",
        },
        { status: 409 },
      );
    }

    if (
      parsed.data.active !== false &&
      (await departmentHasActiveHead(parsed.data.department))
    ) {
      return NextResponse.json(
        {
          error:
            "That department already has an active head. Deactivate them first.",
        },
        { status: 409 },
      );
    }

    // The unique index still guards against a race between two requests.
    const created = await pb
      .collection("department_heads")
      .create<DepartmentHead>(parsed.data, { expand: "user,department" });

    return NextResponse.json(toDepartmentHeadResponse(created), {
      status: 201,
    });
  } catch (error) {
    return handlePbError(error);
  }
}
