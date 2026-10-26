import { NextRequest } from "next/server";
import { ClientResponseError } from "pocketbase";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  requestEmailVerification: vi.fn(),
  setSessionCookie: vi.fn(),
}));

vi.mock("@/lib/pocketbase", async () => {
  const { NextResponse } = await import("next/server");
  return {
    createAdminPb: vi.fn(async () => ({
      collection: () => ({ create: mocks.create }),
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
}));

import { POST } from "@/app/api/auth/register/route";
import { createAdminPb } from "@/lib/pocketbase";

const valid = {
  name: " Juan ",
  email: " Juan@BukSU.edu.ph ",
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
  vi.unstubAllEnvs();
  mocks.requestEmailVerification.mockResolvedValue(true);
});

describe("POST /api/auth/register", () => {
  it("creates an unverified user, emails a link and returns 201 without signing in", async () => {
    mocks.create.mockResolvedValue({ id: "abc123abc123abc" });

    const res = await POST(post(valid));

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({
      email: "juan@buksu.edu.ph",
      verificationSent: true,
    });
    expect(mocks.create).toHaveBeenCalledWith({
      name: "Juan",
      email: "juan@buksu.edu.ph",
      password: "supersecret",
      passwordConfirm: "supersecret",
      emailVisibility: false,
      verified: false,
    });
    expect(mocks.requestEmailVerification).toHaveBeenCalledWith(
      "juan@buksu.edu.ph",
    );
    expect(mocks.setSessionCookie).not.toHaveBeenCalled();
  });

  it("still returns 201 when the email could not be sent", async () => {
    mocks.create.mockResolvedValue({});
    mocks.requestEmailVerification.mockResolvedValue(false);

    const res = await POST(post(valid));

    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ verificationSent: false });
  });

  it("ignores isAdmin, verified or a role supplied by the client", async () => {
    mocks.create.mockResolvedValue({});

    await POST(post({ ...valid, isAdmin: true, role: "admin", verified: true }));

    const payload = mocks.create.mock.calls[0][0] as Record<string, unknown>;
    expect(payload).not.toHaveProperty("isAdmin");
    expect(payload).not.toHaveProperty("role");
    expect(payload.verified).toBe(false);
  });

  it("rejects an email outside the default institutional domain", async () => {
    const res = await POST(post({ ...valid, email: "juan@gmail.com" }));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("@buksu.edu.ph");
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("reads the allowed domains from ALLOWED_EMAIL_DOMAINS", async () => {
    vi.stubEnv("ALLOWED_EMAIL_DOMAINS", "example.edu");
    mocks.create.mockResolvedValue({});

    expect((await POST(post(valid))).status).toBe(400);
    expect(
      (await POST(post({ ...valid, email: "juan@example.edu" }))).status,
    ).toBe(201);
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
    expect(mocks.requestEmailVerification).not.toHaveBeenCalled();
  });

  it("delegates other errors to handlePbError", async () => {
    mocks.create.mockRejectedValue(new Error("pb down"));

    const res = await POST(post(valid));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "pb down" });
  });
});
