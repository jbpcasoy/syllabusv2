import {
  evaluateCapability,
  type Capability,
  type ScopeChain,
} from "@/lib/capability-rules";
import { NO_ROLES, type UserRoles } from "@/types/roles";
import { NextResponse } from "next/server";
import { vi } from "vitest";

export type MockAuthOptions = {
  id?: string;
  /** Default false. */
  isAdmin?: boolean;
  /** Assignment-derived roles. Anything omitted is "none". */
  roles?: Partial<UserRoles>;
  /**
   * The scope any `target` resolves to. Omit to simulate "target outside
   * the user's scope" for scoped capabilities.
   */
  scope?: ScopeChain;
  /** Default true. False makes the guard return 401. */
  signedIn?: boolean;
};

const DEFAULT_ID = "me1me1me1me1me1";

const state = {
  signedIn: true,
  user: { id: DEFAULT_ID, isAdmin: false },
  roles: { ...NO_ROLES } as UserRoles,
  scope: undefined as ScopeChain | undefined,
};

function allowed(capability: Capability, target: unknown): boolean {
  return evaluateCapability(
    state.roles,
    capability,
    target ? state.scope : undefined,
  );
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export const requireUserMock = vi.fn(
  async (arg?: unknown, target?: unknown) => {
    if (!state.signedIn)
      return { ok: false as const, response: unauthorized() };
    const ok = { ok: true as const, user: state.user as never };
    if (arg === undefined) return ok;
    if (!allowed(arg as Capability, target)) {
      return { ok: false as const, response: forbidden() };
    }
    return ok;
  },
);

export const authorizeMock = vi.fn(
  async (_user: unknown, capability: Capability, target?: unknown) =>
    allowed(capability, target) ? null : forbidden(),
);

/**
 * Sets who is "signed in" for the mocked `@/lib/auth`. Call it in beforeEach.
 *
 *   vi.mock("@/lib/auth", async () =>
 *     (await import("@/tests/helpers/mock-auth")).authModuleMock(),
 *   );
 *   import { mockAuth, requireUserMock } from "@/tests/helpers/mock-auth";
 *
 *   beforeEach(() => { vi.clearAllMocks(); mockAuth({ isAdmin: true }); });
 */
export function mockAuth(options: MockAuthOptions = {}) {
  const isAdmin = options.isAdmin ?? false;
  state.signedIn = options.signedIn ?? true;
  state.roles = { ...NO_ROLES, ...options.roles, isAdmin };
  state.scope = options.scope;
  state.user = { id: options.id ?? DEFAULT_ID, isAdmin };
  return { user: state.user, roles: state.roles };
}

/** The module shape that replaces `@/lib/auth` in route tests. */
export function authModuleMock() {
  return {
    requireUser: requireUserMock,
    authorize: authorizeMock,
    getCurrentUser: vi.fn(async () => (state.signedIn ? state.user : null)),
  };
}

mockAuth(); // sane default: signed in, no roles

export const getUserRolesMock = vi.fn(async (_userId: string) => state.roles);

/** The module shape that replaces `@/lib/roles` in route tests. */
export function rolesModuleMock() {
  return { getUserRoles: getUserRolesMock };
}

export const canMock = vi.fn(
  async (_user: unknown, capability: Capability, target?: unknown) =>
    allowed(capability, target),
);

/** The module shape that replaces `@/lib/capabilities` in route tests. */
export function capabilitiesModuleMock() {
  return { can: canMock };
}
