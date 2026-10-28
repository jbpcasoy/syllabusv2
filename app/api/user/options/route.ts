import { requireUser } from "@/lib/auth";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { toUserOption } from "@/lib/users";
import type { AppUser } from "@/types/user";
import { NextResponse, type NextRequest } from "next/server";

// GET /api/user/options?search=foo&perPage=100
// Users to pick from when assigning a role. Only id, name and email.
export async function GET(request: NextRequest) {
  const auth = await requireUser("user.pick");
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = request.nextUrl;
    const perPage = Math.min(
      100,
      Math.max(1, Number(searchParams.get("perPage")) || 30),
    );
    const search = searchParams.get("search")?.trim();

    // The collection's listRule only lets users see themselves,
    // so listing goes through the superuser client.
    const pb = await createAdminPb();
    const result = await pb.collection("users").getList<AppUser>(1, perPage, {
      sort: "name",
      fields: "id,email,name",
      // pb.filter() safely binds params to prevent filter injection
      ...(search && {
        filter: pb.filter("(name ~ {:search} || email ~ {:search})", {
          search,
        }),
      }),
    });

    return NextResponse.json({
      items: result.items.map(toUserOption),
      totalItems: result.totalItems,
    });
  } catch (error) {
    return handlePbError(error);
  }
}
