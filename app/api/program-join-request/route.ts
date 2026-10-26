import { requireUser } from "@/lib/auth";
import { assignmentScopeFilter } from "@/lib/org-visibility";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import {
  JOIN_REQUEST_EXPAND,
  toProgramJoinRequestResponse,
} from "@/lib/program-join-request";
import { getUserRoles } from "@/lib/roles";
import {
  isJoinRequestStatus,
  parseProgramJoinRequestInput,
} from "@/lib/validators/program-join-request";
import type { ProgramJoinRequest } from "@/types/program-join-request";
import { NextResponse, type NextRequest } from "next/server";

// GET /api/program-join-request?page=1&perPage=30&search=foo&program=<id>&status=pending|approved|rejected&user=<id|me>
// Scoped: deans see their college, department heads their department,
// program chairs their program, everyone else only their own requests.
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
    const status = searchParams.get("status")?.trim();
    const userParam = searchParams.get("user")?.trim();

    const userId = userParam === "me" ? auth.user.id : userParam;
    const roles = await getUserRoles(auth.user.id);

    // Superuser client: the users collection's rules hide other users from `expand`.
    const pb = await createAdminPb();

    // pb.filter() safely binds params to prevent filter injection
    const filters: string[] = [];
    if (search) {
      filters.push(
        pb.filter(
          "(user.name ~ {:search} || user.email ~ {:search} || program.name ~ {:search} || program.code ~ {:search})",
          { search },
        ),
      );
    }
    if (program) {
      filters.push(pb.filter("program = {:program}", { program }));
    }
    if (isJoinRequestStatus(status)) {
      filters.push(pb.filter("status = {:status}", { status }));
    }
    if (userId) {
      filters.push(pb.filter("user = {:userId}", { userId }));
    }
    const scope = assignmentScopeFilter(
      (expr, params) => pb.filter(expr, params),
      roles,
      auth.user.id,
      {
        college: "program.department.college",
        department: "program.department",
        program: "program",
      },
    );
    if (scope) filters.push(scope);

    const result = await pb
      .collection("program_join_requests")
      .getList<ProgramJoinRequest>(page, perPage, {
        sort: "-created",
        expand: JOIN_REQUEST_EXPAND,
        ...(filters.length > 0 && { filter: filters.join(" && ") }),
      });

    return NextResponse.json({
      ...result,
      items: result.items.map(toProgramJoinRequestResponse),
    });
  } catch (error) {
    return handlePbError(error);
  }
}

// POST /api/program-join-request  { "program": "<programId>", "note"?: "..." }
// Any signed-in user may ask to join a program; the request is always theirs.
export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseProgramJoinRequestInput(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const pb = await createAdminPb();
    const user = auth.user.id;
    const { program, note } = parsed.data;

    // 404 if the program doesn't exist.
    await pb.collection("programs").getOne(program, { fields: "id" });

    const [membership, pending] = await Promise.all([
      pb.collection("faculties").getList(1, 1, {
        skipTotal: true,
        filter: pb.filter(
          "user = {:user} && program = {:program} && active = true",
          { user, program },
        ),
      }),
      pb.collection("program_join_requests").getList(1, 1, {
        skipTotal: true,
        filter: pb.filter(
          "user = {:user} && program = {:program} && status = 'pending'",
          { user, program },
        ),
      }),
    ]);
    if (membership.items.length > 0) {
      return NextResponse.json(
        { error: "You are already faculty of this program" },
        { status: 409 },
      );
    }
    if (pending.items.length > 0) {
      return NextResponse.json(
        { error: "You already have a pending request for this program" },
        { status: 409 },
      );
    }

    // The partial unique index (user, program WHERE pending) still guards races.
    const created = await pb
      .collection("program_join_requests")
      .create<ProgramJoinRequest>(
        { user, program, note, status: "pending" },
        { expand: JOIN_REQUEST_EXPAND },
      );

    return NextResponse.json(toProgramJoinRequestResponse(created), {
      status: 201,
    });
  } catch (error) {
    return handlePbError(error);
  }
}
