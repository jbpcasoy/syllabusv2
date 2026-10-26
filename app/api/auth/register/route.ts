import { requestEmailVerification } from "@/lib/auth";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { parseDomainList, parseRegisterInput } from "@/lib/validators/auth";
import type { AppUser, RegisterResponse } from "@/types/user";
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
// Only institutional emails (ALLOWED_EMAIL_DOMAINS). The account stays signed
// out until the emailed verification link is opened.
export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = parseRegisterInput(
      body,
      parseDomainList(process.env.ALLOWED_EMAIL_DOMAINS),
    );
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { name, email, password } = parsed.data;

    // The users collection's createRule should be null, so creation needs the superuser.
    // New accounts get no admin flag and no assignments: they start "unassigned".
    const adminPb = await createAdminPb();
    await adminPb.collection("users").create<AppUser>({
      name,
      email,
      password,
      passwordConfirm: password, // required by PocketBase auth collections
      emailVisibility: false,
      verified: false,
    });

    const result: RegisterResponse = {
      email,
      verificationSent: await requestEmailVerification(email),
    };
    return NextResponse.json(result, { status: 201 });
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
