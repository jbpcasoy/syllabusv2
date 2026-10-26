import {
  canAnywhere,
  evaluateCapability,
  type Capability,
} from "@/lib/capability-rules";
import { getUserRoles } from "@/lib/roles";
import { resolveScope, type ScopeTarget } from "@/lib/scope";
import type { AppUser } from "@/types/user";
import "server-only";

export type { Capability, ScopeTarget };

/**
 * Replaces PERMISSIONS and canManage*.
 * Admin short-circuits before any scope lookup.
 */
export async function can(
  user: Pick<AppUser, "id">,
  capability: Capability,
  target?: ScopeTarget,
): Promise<boolean> {
  const roles = await getUserRoles(user.id);
  if (roles.isAdmin) return true;
  const scope = target ? await resolveScope(target) : undefined;
  return evaluateCapability(roles, capability, scope);
}

/** For pages: whether to show management controls at all. */
export async function canSomewhere(
  user: Pick<AppUser, "id">,
  capability: Capability,
): Promise<boolean> {
  return canAnywhere(await getUserRoles(user.id), capability);
}
