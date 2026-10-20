import { requireUser } from "@/lib/auth";
import {
  canManageDeans,
  collegeHasActiveDean,
  toDeanResponse,
} from "@/lib/dean";
import { PERMISSIONS } from "@/lib/permissions";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { parseDeanInput } from "@/lib/validators/dean";
import type { Dean } from "@/types/dean";
import { NextResponse, type NextRequest } from "next/server";

// GET /api/dean?page=1&perPage=30&search=foo&college=<id>&user=<id|me>&active=true|false
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
    const college = searchParams.get("college")?.trim();
    const userParam = searchParams.get("user")?.trim();
    const activeParam = searchParams.get("active")?.trim();

    const userId = canManageDeans(auth.user)
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
    if (college) {
      filters.push(pb.filter("college = {:college}", { college }));
    }
    if (userId) {
      filters.push(pb.filter("user = {:userId}", { userId }));
    }
    if (activeParam === "true" || activeParam === "false") {
      filters.push(
        pb.filter("active = {:active}", { active: activeParam === "true" }),
      );
    }

    const result = await pb.collection("deans").getList<Dean>(page, perPage, {
      sort: "-created",
      expand: "user,college",
      ...(filters.length > 0 && { filter: filters.join(" && ") }),
    });

    return NextResponse.json({
      ...result,
      items: result.items.map(toDeanResponse),
    });
  } catch (error) {
    return handlePbError(error);
  }
}

// POST /api/dean  { "user": "<userId>", "college": "<collegeId>", "active"?: boolean }
export async function POST(request: NextRequest) {
  const auth = await requireUser(PERMISSIONS.dean.write);
  if (!auth.ok) return auth.response;

  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseDeanInput(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const pb = await createAdminPb();

    const existing = await pb.collection("deans").getList<Dean>(1, 1, {
      skipTotal: true,
      filter: pb.filter("user = {:user} && college = {:college}", {
        user: parsed.data.user,
        college: parsed.data.college,
      }),
    });
    if (existing.items.length > 0) {
      return NextResponse.json(
        {
          error: existing.items[0].active
            ? "This user is already dean of that college"
            : "This user already has an inactive dean record for that college. Reactivate it instead.",
        },
        { status: 409 },
      );
    }

    if (
      parsed.data.active !== false &&
      (await collegeHasActiveDean(parsed.data.college))
    ) {
      return NextResponse.json(
        {
          error:
            "That college already has an active dean. Deactivate them first.",
        },
        { status: 409 },
      );
    }

    // The unique indexes still guard against a race between two requests.
    const created = await pb
      .collection("deans")
      .create<Dean>(parsed.data, { expand: "user,college" });

    return NextResponse.json(toDeanResponse(created), { status: 201 });
  } catch (error) {
    return handlePbError(error);
  }
}
