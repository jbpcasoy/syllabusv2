import { requireUser } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import {
  canManageProgramChairs,
  programHasActiveChair,
  toProgramChairResponse,
} from "@/lib/program-chair";
import { parseProgramChairInput } from "@/lib/validators/program-chair";
import type { ProgramChair } from "@/types/program-chair";
import { NextResponse, type NextRequest } from "next/server";

// GET /api/program-chair?page=1&perPage=30&search=foo&program=<id>&user=<id|me>&active=true|false
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
    const program = searchParams.get("program")?.trim();
    const userParam = searchParams.get("user")?.trim();
    const activeParam = searchParams.get("active")?.trim();

    const userId = canManageProgramChairs(auth.user)
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
    if (program) {
      filters.push(pb.filter("program = {:program}", { program }));
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
      .collection("program_chairs")
      .getList<ProgramChair>(page, perPage, {
        sort: "-created",
        expand: "user,program",
        ...(filters.length > 0 && { filter: filters.join(" && ") }),
      });

    return NextResponse.json({
      ...result,
      items: result.items.map(toProgramChairResponse),
    });
  } catch (error) {
    return handlePbError(error);
  }
}

// POST /api/program-chair  { "user": "<userId>", "program": "<programId>", "active"?: boolean }
export async function POST(request: NextRequest) {
  const auth = await requireUser(PERMISSIONS.programChair.write);
  if (!auth.ok) return auth.response;

  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseProgramChairInput(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const pb = await createAdminPb();

    const existing = await pb
      .collection("program_chairs")
      .getList<ProgramChair>(1, 1, {
        skipTotal: true,
        filter: pb.filter("user = {:user} && program = {:program}", {
          user: parsed.data.user,
          program: parsed.data.program,
        }),
      });
    if (existing.items.length > 0) {
      return NextResponse.json(
        {
          error: existing.items[0].active
            ? "This user is already chair of that program"
            : "This user already has an inactive chair record for that program. Reactivate it instead.",
        },
        { status: 409 },
      );
    }

    if (
      parsed.data.active !== false &&
      (await programHasActiveChair(parsed.data.program))
    ) {
      return NextResponse.json(
        {
          error:
            "That program already has an active chair. Deactivate them first.",
        },
        { status: 409 },
      );
    }

    // The unique index still guards against a race between two requests.
    const created = await pb
      .collection("program_chairs")
      .create<ProgramChair>(parsed.data, { expand: "user,program" });

    return NextResponse.json(toProgramChairResponse(created), { status: 201 });
  } catch (error) {
    return handlePbError(error);
  }
}
