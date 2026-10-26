import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getOne: vi.fn(),
  update: vi.fn(),
  parseReferenceActionInput: vi.fn(),
  referenceTransition: vi.fn(),
  toSyllabusReferenceResponse: vi.fn((record: Record<string, unknown>) => ({
    ...record,
    mapped: true,
  })),
}));

vi.mock("@/lib/pocketbase", async () => {
  const { NextResponse } = await import("next/server");
  const collection = () => ({ getOne: mocks.getOne, update: mocks.update });
  return {
    createAdminPb: vi.fn(async () => ({ collection })),
    handlePbError: vi.fn((error: unknown) => {
      const status =
        typeof error === "object" && error && "status" in error
          ? Number((error as { status: unknown }).status)
          : 500;
      return NextResponse.json({ error: "pb error" }, { status });
    }),
  };
});

vi.mock("@/lib/validators/syllabus-reference", () => ({
  parseReferenceActionInput: mocks.parseReferenceActionInput,
}));
vi.mock("@/lib/syllabus-reference", () => ({
  REFERENCE_EXPAND: "expand-all",
  referenceTransition: mocks.referenceTransition,
  toSyllabusReferenceResponse: mocks.toSyllabusReferenceResponse,
}));

vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);
vi.mock("@/lib/roles", async () =>
  (await import("@/tests/helpers/mock-auth")).rolesModuleMock(),
);
vi.mock("@/lib/capabilities", async () =>
  (await import("@/tests/helpers/mock-auth")).capabilitiesModuleMock(),
);

import { PATCH } from "@/app/api/syllabus-reference/[id]/route";
import { createAdminPb } from "@/lib/pocketbase";
import { canMock, mockAuth } from "@/tests/helpers/mock-auth";

const ID = "refrefrefrefref";
const ME = "me1me1me1me1me1";
const PROGRAM = "prgBprgBprgBprg";
const SCOPE = { programId: PROGRAM };
const ctx = { params: Promise.resolve({ id: ID }) };

const pending = {
  id: ID,
  program: PROGRAM,
  status: "pending",
  expand: { syllabus: { lead: ME } },
};

function patch(body: unknown) {
  return new NextRequest(`http://localhost/api/syllabus-reference/${ID}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-26T08:00:00.000Z"));
  mockAuth({ id: ME });
  mocks.getOne.mockResolvedValue(pending);
  mocks.parseReferenceActionInput.mockReturnValue({
    ok: true,
    data: { action: "approve" },
  });
  mocks.referenceTransition.mockReturnValue({
    ok: true,
    next: "approved",
    stamp: "decided",
  });
  mocks.update.mockImplementation(async (_id: string, data: object) => ({
    ...pending,
    ...data,
  }));
});

describe("PATCH /api/syllabus-reference/:id", () => {
  it("applies an approval by the source lead", async () => {
    const res = await PATCH(patch({ action: "approve" }), ctx);

    expect(res.status).toBe(200);
    expect(mocks.getOne).toHaveBeenCalledWith(ID, { expand: "syllabus" });
    expect(mocks.referenceTransition).toHaveBeenCalledWith(
      "pending",
      "approve",
      { isSourceLead: true, canRequest: false, isAdmin: false },
    );
    expect(mocks.update).toHaveBeenCalledWith(
      ID,
      {
        status: "approved",
        decided_by: ME,
        decided_at: "2026-10-26T08:00:00.000Z",
      },
      { expand: "expand-all" },
    );
    expect(await res.json()).toMatchObject({ status: "approved", mapped: true });
  });

  it("stores the reason and ended stamps on a revoke", async () => {
    mocks.parseReferenceActionInput.mockReturnValue({
      ok: true,
      data: { action: "revoke", reason: "Outdated" },
    });
    mocks.referenceTransition.mockReturnValue({
      ok: true,
      next: "revoked",
      stamp: "ended",
    });

    await PATCH(patch({ action: "revoke", reason: "Outdated" }), ctx);

    expect(mocks.update).toHaveBeenCalledWith(
      ID,
      {
        status: "revoked",
        reason: "Outdated",
        ended_by: ME,
        ended_at: "2026-10-26T08:00:00.000Z",
      },
      { expand: "expand-all" },
    );
  });

  it("checks the request capability against the referencing program", async () => {
    mockAuth({ id: ME, roles: { chairOfPrograms: [PROGRAM] }, scope: SCOPE });
    mocks.getOne.mockResolvedValue({
      ...pending,
      expand: { syllabus: { lead: "someoneelse1234" } },
    });

    await PATCH(patch({ action: "withdraw" }), ctx);

    expect(canMock).toHaveBeenCalledWith(
      expect.anything(),
      "syllabusReference.request",
      { program: PROGRAM },
    );
    expect(mocks.referenceTransition).toHaveBeenCalledWith(
      "pending",
      "approve",
      { isSourceLead: false, canRequest: true, isAdmin: false },
    );
  });

  it("reports chairs of other programs as unable to request", async () => {
    mockAuth({ id: ME, roles: { chairOfPrograms: ["otherotherother"] }, scope: SCOPE });
    await PATCH(patch({ action: "withdraw" }), ctx);
    expect(mocks.referenceTransition.mock.calls[0][2].canRequest).toBe(false);
  });

  it("passes admin through to the transition", async () => {
    mockAuth({ id: ME, isAdmin: true, scope: SCOPE });
    await PATCH(patch({ action: "approve" }), ctx);
    expect(mocks.referenceTransition.mock.calls[0][2]).toMatchObject({
      isAdmin: true,
      canRequest: true,
    });
  });

  it.each([403, 409] as const)(
    "returns the transition's %s without writing",
    async (status) => {
      mocks.referenceTransition.mockReturnValue({
        ok: false,
        status,
        error: "nope",
      });
      const res = await PATCH(patch({ action: "approve" }), ctx);
      expect(res.status).toBe(status);
      expect(await res.json()).toEqual({ error: "nope" });
      expect(mocks.update).not.toHaveBeenCalled();
    },
  );

  it("returns 400 with the validator's error", async () => {
    mocks.parseReferenceActionInput.mockReturnValue({ ok: false, error: "bad" });
    const res = await PATCH(patch({}), ctx);
    expect(res.status).toBe(400);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("passes malformed JSON to the validator as null", async () => {
    mocks.parseReferenceActionInput.mockReturnValue({ ok: false, error: "bad" });
    await PATCH(patch("{oops"), ctx);
    expect(mocks.parseReferenceActionInput).toHaveBeenCalledWith(null);
  });

  it("returns 401 when signed out", async () => {
    mockAuth({ signedIn: false });
    const res = await PATCH(patch({ action: "approve" }), ctx);
    expect(res.status).toBe(401);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("propagates 404 from PocketBase", async () => {
    mocks.getOne.mockRejectedValue({ status: 404 });
    const res = await PATCH(patch({ action: "approve" }), ctx);
    expect(res.status).toBe(404);
    expect(mocks.referenceTransition).not.toHaveBeenCalled();
  });

  it("delegates update errors", async () => {
    mocks.update.mockRejectedValue({ status: 400 });
    const res = await PATCH(patch({ action: "approve" }), ctx);
    expect(res.status).toBe(400);
  });
});
