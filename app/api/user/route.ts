import { requireUser } from "@/lib/auth";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import {
  listActiveAssignments,
  toUserResponse,
  userKindFilter,
} from "@/lib/users";
import { isUserKind, parseUserInput } from "@/lib/validators/user";
import type { AppUser } from "@/types/user";
import { NextResponse, type NextRequest } from "next/server";

// GET /api/user?page=1&perPage=30&search=foo&kind=admin|assigned|unassigned
// Each item includes its active assignments.
export async function GET(request: NextRequest) {
  const auth = await requireUser("user.read");
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const perPage = Math.min(
      100,
      Math.max(1, Number(searchParams.get("perPage")) || 30),
    );
    const search = searchParams.get("search")?.trim();
    const kind = searchParams.get("kind")?.trim();

    if (kind && !isUserKind(kind)) {
      return NextResponse.json({ error: "Invalid `kind`" }, { status: 400 });
    }

    // The collection's listRule only lets users see themselves,
    // so listing goes through the superuser client.
    const pb = await createAdminPb();

    // pb.filter() safely binds params to prevent filter injection
    const filters: string[] = [];
    if (search) {
      filters.push(
        pb.filter("(name ~ {:search} || email ~ {:search})", { search }),
      );
    }
    if (kind && isUserKind(kind)) {
      filters.push(userKindFilter(kind));
    }

    const result = await pb
      .collection("users")
      .getList<AppUser>(page, perPage, {
        sort: "name",
        ...(filters.length > 0 && { filter: filters.join(" && ") }),
      });

    const assignments = await listActiveAssignments(
      result.items.map((u) => u.id),
    );

    return NextResponse.json({
      ...result,
      items: result.items.map((u) =>
        toUserResponse(u, assignments.get(u.id) ?? []),
      ),
    });
  } catch (error) {
    return handlePbError(error);
  }
}

// POST /api/user  { "email": "...", "password": "...", "name"?: "...", "isAdmin"?: boolean }
export async function POST(request: NextRequest) {
  const auth = await requireUser("user.write");
  if (!auth.ok) return auth.response;

  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseUserInput(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const pb = await createAdminPb();
    const created = await pb.collection("users").create<AppUser>({
      ...parsed.data,
      passwordConfirm: parsed.data.password, // required by PocketBase auth collections
    });

    return NextResponse.json(toUserResponse(created), { status: 201 });
  } catch (error) {
    return handlePbError(error);
  }
}
