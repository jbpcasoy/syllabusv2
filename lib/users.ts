import { toSessionUser } from "@/lib/auth";
import type { AppUser, UserResponse } from "@/types/user";
import "server-only";

/** Maps a PocketBase user record to the shape returned by the user API. */
export function toUserResponse(user: AppUser): UserResponse {
  return {
    ...toSessionUser(user),
    verified: Boolean(user.verified),
    created: user.created,
    updated: user.updated,
  };
}
