import { NextRequest } from "next/server";
import { ClientResponseError } from "pocketbase";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  authWithPassword: vi.fn(),
  setSessionCookie: vi.fn(),
  toSessionUser: vi.fn((u: Record<string, unknown>) => ({
    ...u,
    mapped: true,
  })),
}));

vi.mock("@/lib/pocketbase", async () => {
  const { NextResponse } = await import("next/server");
  return {
    createAdminPb: vi.fn(async () => ({
      collection: () => ({ create: mocks.create }),
    })),
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
  setSessionCookie: mocks.setSessionCookie,
  toSessionUser: mocks.toSessionUser,
}));

import { POST } from "@/app/api/auth/register/route";
import { createAdminPb } from "@/lib/pocketbase";

const valid = {
  name: " Juan ",
  email: " Juan@Example.com ",
  password: "supersecret",
  passwordConfirm: "supersecret",
};

function post(body: unknown, raw = false) {
  return new NextRequest("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: raw ? (body as string) : JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/auth/register", () => {
  it("creates a faculty user, signs them in and returns 201", async () => {
    mocks.create.mockResolvedValue({ id: "abc123abc123abc" });
    mocks.authWithPassword.mockResolvedValue({
      token: "jwt",
      record: { id: "abc123abc123abc", email: "juan@example.com" },
    });

    const res = await POST(post(valid));

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({
      id: "abc123abc123abc",
      email: "juan@example.com",
      mapped: true,
    });
    expect(mocks.create).toHaveBeenCalledWith({
      name: "Juan",
      email: "juan@example.com",
      password: "supersecret",
      passwordConfirm: "supersecret",
      role: "faculty",
      emailVisibility: false,
    });
    expect(mocks.authWithPassword).toHaveBeenCalledWith(
      "juan@example.com",
      "supersecret",
    );
    expect(mocks.setSessionCookie).toHaveBeenCalledWith("jwt");
  });

  it("ignores a role supplied by the client", async () => {
    mocks.create.mockResolvedValue({});
    mocks.authWithPassword.mockResolvedValue({ token: "jwt", record: {} });

    await POST(post({ ...valid, role: "admin" }));

    const payload = mocks.create.mock.calls[0][0] as { role: string };
    expect(payload.role).toBe("faculty");
  });

  it.each([
    ["missing name", { ...valid, name: " " }],
    ["invalid email", { ...valid, email: "nope" }],
    [
      "short password",
      { ...valid, password: "short", passwordConfirm: "short" },
    ],
    ["mismatched passwords", { ...valid, passwordConfirm: "different1" }],
  ])(
    "returns 400 for %s and never touches PocketBase",
    async (_label, body) => {
      const res = await POST(post(body));

      expect(res.status).toBe(400);
      expect(createAdminPb).not.toHaveBeenCalled();
      expect(mocks.create).not.toHaveBeenCalled();
    },
  );

  it("returns 400 when the body is not valid JSON", async () => {
    const res = await POST(post("{not json", true));
    expect(res.status).toBe(400);
  });

  it("returns 409 when the email is already registered", async () => {
    mocks.create.mockRejectedValue(
      new ClientResponseError({
        status: 400,
        response: { data: { email: { code: "validation_not_unique" } } },
      }),
    );

    const res = await POST(post(valid));

    expect(res.status).toBe(409);
    expect(mocks.setSessionCookie).not.toHaveBeenCalled();
  });

  it("delegates other errors to handlePbError", async () => {
    mocks.create.mockRejectedValue(new Error("pb down"));

    const res = await POST(post(valid));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "pb down" });
  });
});
