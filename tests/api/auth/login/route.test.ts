import { NextRequest } from "next/server";
import { ClientResponseError } from "pocketbase";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authWithPassword: vi.fn(),
  requestEmailVerification: vi.fn(),
  setSessionCookie: vi.fn(),
  getUserRoles: vi.fn(),
  toSessionUser: vi.fn((u: Record<string, unknown>) => ({
    ...u,
    mapped: true,
  })),
}));

vi.mock("@/lib/pocketbase", async () => {
  const { NextResponse } = await import("next/server");
  return {
    createPb: vi.fn(() => ({
      collection: () => ({ authWithPassword: mocks.authWithPassword }),
    })),
    handlePbError: vi.fn((error: unknown) =>
      NextResponse.json(
        { error: error instanceof Error ? error.message : "unknown" },
        { status: 500 },
      ),
    ),
  };
});

vi.mock("@/lib/auth", () => ({
  requestEmailVerification: mocks.requestEmailVerification,
  setSessionCookie: mocks.setSessionCookie,
  toSessionUser: mocks.toSessionUser,
}));

vi.mock("@/lib/roles", () => ({ getUserRoles: mocks.getUserRoles }));

import { POST } from "@/app/api/auth/login/route";
import { NO_ROLES } from "@/types/roles";

const ID = "abc123abc123abc";
const EMAIL = "juan@buksu.edu.ph";

function post(body: unknown, raw = false) {
  return new NextRequest("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: raw ? (body as string) : JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUserRoles.mockResolvedValue(NO_ROLES);
  mocks.requestEmailVerification.mockResolvedValue(true);
});

describe("POST /api/auth/login", () => {
  it("signs a verified user in", async () => {
    const record = { id: ID, email: EMAIL, verified: true };
    mocks.authWithPassword.mockResolvedValue({ token: "jwt", record });

    const res = await POST(post({ email: ` ${EMAIL} `, password: "pw" }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ...record, mapped: true });
    expect(mocks.authWithPassword).toHaveBeenCalledWith(EMAIL, "pw");
    expect(mocks.setSessionCookie).toHaveBeenCalledWith("jwt");
    expect(mocks.getUserRoles).toHaveBeenCalledWith(ID);
  });

  it("refuses an unverified user with 403 and resends the link", async () => {
    mocks.authWithPassword.mockResolvedValue({
      token: "jwt",
      record: { id: ID, email: EMAIL, verified: false },
    });

    const res = await POST(post({ email: EMAIL, password: "pw" }));

    expect(res.status).toBe(403);
    expect((await res.json()).error).toContain(`new link to ${EMAIL}`);
    expect(mocks.requestEmailVerification).toHaveBeenCalledWith(EMAIL);
    expect(mocks.setSessionCookie).not.toHaveBeenCalled();
  });

  it("says so when the new link could not be sent", async () => {
    mocks.authWithPassword.mockResolvedValue({
      token: "jwt",
      record: { id: ID, email: EMAIL, verified: false },
    });
    mocks.requestEmailVerification.mockResolvedValue(false);

    const res = await POST(post({ email: EMAIL, password: "pw" }));

    expect(res.status).toBe(403);
    expect((await res.json()).error).toContain("couldn't send");
  });

  it.each([
    ["missing email", { password: "pw" }],
    ["blank email", { email: " ", password: "pw" }],
    ["missing password", { email: EMAIL }],
  ])("returns 400 for %s", async (_label, body) => {
    const res = await POST(post(body));

    expect(res.status).toBe(400);
    expect(mocks.authWithPassword).not.toHaveBeenCalled();
  });

  it("returns 400 when the body is not valid JSON", async () => {
    expect((await POST(post("{not json", true))).status).toBe(400);
  });

  it("maps PocketBase's 400 to 401 without revealing which part was wrong", async () => {
    mocks.authWithPassword.mockRejectedValue(
      new ClientResponseError({ status: 400 }),
    );

    const res = await POST(post({ email: EMAIL, password: "bad" }));

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Invalid email or password" });
  });

  it("delegates other errors to handlePbError", async () => {
    mocks.authWithPassword.mockRejectedValue(new Error("pb down"));

    const res = await POST(post({ email: EMAIL, password: "pw" }));

    expect(res.status).toBe(500);
  });
});
