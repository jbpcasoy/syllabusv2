import { requireUser } from "@/lib/auth";
import { assignmentScopeFilter } from "@/lib/org-visibility";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { getUserRoles } from "@/lib/roles";
import { parseVpaaInput } from "@/lib/validators/vpaa";
import { hasActiveVpaa, toVpaaResponse } from "@/lib/vpaa";
import type { Vpaa } from "@/types/vpaa";
import { NextResponse, type NextRequest } from "next/server";

// GET /api/vpaa?page=1&perPage=30&search=foo&user=<id|me>&active=true|false
// University-wide roles see all; everyone else only their own records.
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
    const userParam = searchParams.get("user")?.trim();
    const activeParam = searchParams.get("active")?.trim();

    const userId = userParam === "me" ? auth.user.id : userParam;
    const roles = await getUserRoles(auth.user.id);

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
    if (userId) {
      filters.push(pb.filter("user = {:userId}", { userId }));
    }
    if (activeParam === "true" || activeParam === "false") {
      filters.push(
        pb.filter("active = {:active}", { active: activeParam === "true" }),
      );
    }
    const scope = assignmentScopeFilter(
      (expr, params) => pb.filter(expr, params),
      roles,
      auth.user.id,
      {},
    );
    if (scope) filters.push(scope);

    const result = await pb.collection("vpaas").getList<Vpaa>(page, perPage, {
      sort: "-created",
      expand: "user",
      ...(filters.length > 0 && { filter: filters.join(" && ") }),
    });

    return NextResponse.json({
      ...result,
      items: result.items.map(toVpaaResponse),
    });
  } catch (error) {
    return handlePbError(error);
  }
}

// POST /api/vpaa { "user": "<userId>", "active"?: boolean }
export async function POST(request: NextRequest) {
  const auth = await requireUser("vpaa.write");
  if (!auth.ok) return auth.response;

  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseVpaaInput(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const pb = await createAdminPb();

    const existing = await pb.collection("vpaas").getList<Vpaa>(1, 1, {
      skipTotal: true,
      filter: pb.filter("user = {:user}", { user: parsed.data.user }),
    });
    if (existing.items.length > 0) {
      return NextResponse.json(
        {
          error: existing.items[0].active
            ? "This user is already the VPAA"
            : "This user already has an inactive VPAA record. Reactivate it instead.",
        },
        { status: 409 },
      );
    }

    if (parsed.data.active !== false && (await hasActiveVpaa())) {
      return NextResponse.json(
        {
          error: "There is already an active VPAA. Deactivate them first.",
        },
        { status: 409 },
      );
    }

    // The unique indexes still guard against a race between two requests.
    const created = await pb
      .collection("vpaas")
      .create<Vpaa>(parsed.data, { expand: "user" });

    return NextResponse.json(toVpaaResponse(created), { status: 201 });
  } catch (error) {
    return handlePbError(error);
  }
}
