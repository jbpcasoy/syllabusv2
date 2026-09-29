import { requireUser } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { toUserResponse } from "@/lib/users";
import { parseUserInput } from "@/lib/validators/user";
import type { AppUser } from "@/types/user";
import { NextResponse, type NextRequest } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/user/:id  (admins can read anyone; everyone else only themselves)
export async function GET(_request: NextRequest, { params }: RouteContext) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    if (auth.user.role !== "admin" && auth.user.id !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const pb = await createAdminPb();
    const user = await pb.collection("users").getOne<AppUser>(id);
    return NextResponse.json(toUserResponse(user));
  } catch (error) {
    return handlePbError(error);
  }
}

// PATCH /api/user/:id  { "email"?, "password"?, "name"?, "role"? }
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await requireUser(PERMISSIONS.user.write);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseUserInput(body, { partial: true });
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    // Guard against an admin locking themselves out by changing their own role.
    if (
      id === auth.user.id &&
      parsed.data.role !== undefined &&
      parsed.data.role !== "admin"
    ) {
      return NextResponse.json(
        { error: "You can't remove your own admin role" },
        { status: 400 },
      );
    }

    const pb = await createAdminPb();
    const updated = await pb.collection("users").update<AppUser>(id, {
      ...parsed.data,
      // Superusers don't need oldPassword, but PocketBase still needs the confirmation.
      ...(parsed.data.password && { passwordConfirm: parsed.data.password }),
    });

    return NextResponse.json(toUserResponse(updated));
  } catch (error) {
    return handlePbError(error);
  }
}

// DELETE /api/user/:id
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const auth = await requireUser(PERMISSIONS.user.write);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    if (id === auth.user.id) {
      return NextResponse.json(
        { error: "You can't delete your own account" },
        { status: 400 },
      );
    }

    const pb = await createAdminPb();
    await pb.collection("users").delete(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handlePbError(error);
  }
}
