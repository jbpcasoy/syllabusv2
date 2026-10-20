import { requireUser } from "@/lib/auth";
import {
  canManageCitlDirectors,
  hasActiveCitlDirector,
  toCitlDirectorResponse,
} from "@/lib/citl-director";
import { PERMISSIONS } from "@/lib/permissions";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { parseCitlDirectorInput } from "@/lib/validators/citl-director";
import type { CitlDirector } from "@/types/citl-director";
import { NextResponse, type NextRequest } from "next/server";

// GET /api/citl-director?page=1&perPage=30&search=foo&user=<id|me>&active=true|false
// Non-managers are always scoped to their own records.
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

    const userId = canManageCitlDirectors(auth.user)
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
    if (userId) {
      filters.push(pb.filter("user = {:userId}", { userId }));
    }
    if (activeParam === "true" || activeParam === "false") {
      filters.push(
        pb.filter("active = {:active}", { active: activeParam === "true" }),
      );
    }

    const result = await pb
      .collection("citl_directors")
      .getList<CitlDirector>(page, perPage, {
        sort: "-created",
        expand: "user",
        ...(filters.length > 0 && { filter: filters.join(" && ") }),
      });

    return NextResponse.json({
      ...result,
      items: result.items.map(toCitlDirectorResponse),
    });
  } catch (error) {
    return handlePbError(error);
  }
}

// POST /api/citl-director { "user": "<userId>", "active"?: boolean }
export async function POST(request: NextRequest) {
  const auth = await requireUser(PERMISSIONS.citlDirector.write);
  if (!auth.ok) return auth.response;

  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseCitlDirectorInput(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const pb = await createAdminPb();

    const existing = await pb
      .collection("citl_directors")
      .getList<CitlDirector>(1, 1, {
        skipTotal: true,
        filter: pb.filter("user = {:user}", { user: parsed.data.user }),
      });
    if (existing.items.length > 0) {
      return NextResponse.json(
        {
          error: existing.items[0].active
            ? "This user is already the CITL director"
            : "This user already has an inactive CITL director record. Reactivate it instead.",
        },
        { status: 409 },
      );
    }

    if (parsed.data.active !== false && (await hasActiveCitlDirector())) {
      return NextResponse.json(
        {
          error:
            "There is already an active CITL director. Deactivate them first.",
        },
        { status: 409 },
      );
    }

    // The unique indexes still guard against a race between two requests.
    const created = await pb
      .collection("citl_directors")
      .create<CitlDirector>(parsed.data, { expand: "user" });

    return NextResponse.json(toCitlDirectorResponse(created), { status: 201 });
  } catch (error) {
    return handlePbError(error);
  }
}
