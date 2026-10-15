import { setSessionCookie, toSessionUser } from "@/lib/auth";
import { DEFAULT_REGISTRATION_ROLE } from "@/lib/constants";
import { createAdminPb, createPb, handlePbError } from "@/lib/pocketbase";
import { parseRegisterInput } from "@/lib/validators/auth";
import type { AppUser } from "@/types/user";
import { NextResponse, type NextRequest } from "next/server";
import { ClientResponseError } from "pocketbase";

function isDuplicateEmail(error: unknown): boolean {
  if (!(error instanceof ClientResponseError) || error.status !== 400) {
    return false;
  }
  const data = error.data as { data?: { email?: { code?: string } } };
  return data?.data?.email?.code === "validation_not_unique";
}

// POST /api/auth/register  { "name": "...", "email": "...", "password": "...", "passwordConfirm": "..." }
export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseRegisterInput(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { name, email, password } = parsed.data;

    // The users collection's createRule should be null, so creation needs the superuser.
    const adminPb = await createAdminPb();
    await adminPb.collection("users").create<AppUser>({
      name,
      email,
      password,
      passwordConfirm: password, // required by PocketBase auth collections
      role: DEFAULT_REGISTRATION_ROLE,
      emailVisibility: false,
    });

    // Sign the new user in with a plain client, same as the login route.
    const pb = createPb();
    const { token, record } = await pb
      .collection("users")
      .authWithPassword(email, password);

    await setSessionCookie(token);
    return NextResponse.json(toSessionUser(record as AppUser), {
      status: 201,
    });
  } catch (error) {
    if (isDuplicateEmail(error)) {
      return NextResponse.json(
        { error: "An account with that email already exists" },
        { status: 409 },
      );
    }
    return handlePbError(error);
  }
}
