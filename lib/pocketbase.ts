import { NextResponse } from "next/server";
import PocketBase, { ClientResponseError } from "pocketbase";
import "server-only";

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing environment variable: ${key}`);
  return value;
}

/** Unauthenticated client. Fine for public list/view rules. */
export function createPb(): PocketBase {
  const pb = new PocketBase(requireEnv("POCKETBASE_URL"));
  // Prevents the SDK from cancelling concurrent requests on the server
  pb.autoCancellation(false);
  return pb;
}

/** Superuser client, needed for create/update/delete (rules are null). */
export async function createAdminPb(): Promise<PocketBase> {
  const pb = createPb();
  await pb
    .collection("_superusers")
    .authWithPassword(
      requireEnv("POCKETBASE_SUPERUSER_EMAIL"),
      requireEnv("POCKETBASE_SUPERUSER_PASSWORD"),
    );
  return pb;
}

/** Maps PocketBase / unknown errors to JSON responses. */
export function handlePbError(error: unknown): NextResponse {
  if (error instanceof ClientResponseError) {
    const status =
      error.status >= 400 && error.status < 600 ? error.status : 500;
    return NextResponse.json(
      { error: error.message, details: error.data },
      { status },
    );
  }
  console.error(error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
