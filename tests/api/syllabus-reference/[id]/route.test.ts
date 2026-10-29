import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getOne: vi.fn(),
  update: vi.fn(),
  chairsGetFullList: vi.fn(),
  notifications: [] as Record<string, unknown>[],
  parseReferenceActionInput: vi.fn(),
  referenceTransition: vi.fn(),
  toSyllabusReferenceResponse: vi.fn((record: Record<string, unknown>) => ({
    ...record,
    mapped: true,
  })),
}));

vi.mock("@/lib/pocketbase", async () => {
  const { NextResponse } = await import("next/server");
  const collection = (name: string) =>
    name === "program_chairs"
      ? { getFullList: mocks.chairsGetFullList }
      : { getOne: mocks.getOne };
  // Queued writes run on send(), so a rejected update fails the batch.
  const createBatch = () => {
    const queued: (() => unknown)[] = [];
    return {
      collection: (name: string) => ({
        update: (id: string, body: Record<string, unknown>) =>
          queued.push(() => mocks.update(id, body)),
        create: (body: Record<string, unknown>) =>
          queued.push(() => {
            if (name === "notifications") mocks.notifications.push(body);
          }),
      }),
      send: async () => {
        for (const op of queued) await op();
      },
    };
  };
  return {
    createAdminPb: vi.fn(async () => ({
      filter: (expr: string, params: Record<string, unknown>) =>
        expr.replace(/\{:(\w+)\}/g, (_, key) => JSON.stringify(params[key])),
      collection,
      createBatch,
    })),
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

const SOURCE = "srcsrcsrcsrcsrc";
const CHAIR = "chairchairchair";

const pending = {
  id: ID,
  syllabus: SOURCE,
  program: PROGRAM,
  status: "pending",
  expand: {
    syllabus: {
      lead: ME,
      expand: {
        course: { code: "GE101", title: "Purposive Communication" },
        program: { code: "BSED" },
      },
    },
    program: { code: "BSIT" },
  },
};

function asRevoke() {
  mocks.parseReferenceActionInput.mockReturnValue({
    ok: true,
    data: { action: "revoke", reason: "Outdated" },
  });
  mocks.referenceTransition.mockReturnValue({
    ok: true,
    next: "revoked",
    stamp: "ended",
  });
}

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
  mocks.notifications.length = 0;
  // getOne serves the record as the batch left it.
  let stored: Record<string, unknown> = pending;
  mocks.getOne.mockImplementation(async () => stored);
  mocks.update.mockImplementation(async (_id: string, data: object) => {
    stored = { ...stored, ...data };
  });
  mocks.chairsGetFullList.mockResolvedValue([{ user: CHAIR }]);
  mocks.parseReferenceActionInput.mockReturnValue({
    ok: true,
    data: { action: "approve" },
  });
  mocks.referenceTransition.mockReturnValue({
    ok: true,
    next: "approved",
    stamp: "decided",
  });
});

describe("PATCH /api/syllabus-reference/:id", () => {
  it("applies an approval by the source lead", async () => {
    const res = await PATCH(patch({ action: "approve" }), ctx);

    expect(res.status).toBe(200);
    expect(mocks.getOne).toHaveBeenCalledWith(ID, {
      expand: "syllabus.course,syllabus.program,program",
    });
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
    );
    expect(mocks.getOne).toHaveBeenLastCalledWith(ID, { expand: "expand-all" });
    expect(await res.json()).toMatchObject({ status: "approved", mapped: true });
  });

  it("notifies the referencing program's active chairs on an approval", async () => {
    const res = await PATCH(patch({ action: "approve" }), ctx);

    expect(res.status).toBe(200);
    expect(mocks.chairsGetFullList).toHaveBeenCalledWith({
      fields: "user",
      filter: `program = "${PROGRAM}" && active = true`,
    });
    expect(mocks.notifications).toEqual([
      expect.objectContaining({
        user: CHAIR,
        syllabus: SOURCE,
        kind: "reference_approved",
        stage: 0,
        actor: ME,
        title: "BSIT's reference to GE101 (BSED) was approved",
        link: `/syllabus/${SOURCE}`,
        email_status: "pending",
      }),
    ]);
  });

  it("doesn't write the approval when the notice can't be queued", async () => {
    mocks.chairsGetFullList.mockRejectedValue({ status: 500 });

    const res = await PATCH(patch({ action: "approve" }), ctx);

    expect(res.status).toBe(500);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("doesn't notify on a reject", async () => {
    const data = { action: "reject", reason: "No" };
    mocks.parseReferenceActionInput.mockReturnValue({ ok: true, data });
    mocks.referenceTransition.mockReturnValue({
      ok: true,
      next: "rejected",
      stamp: "decided",
    });

    const res = await PATCH(patch(data), ctx);

    expect(res.status).toBe(200);
    expect(mocks.chairsGetFullList).not.toHaveBeenCalled();
    expect(mocks.notifications).toEqual([]);
  });

  describe("withdraw", () => {
    const LEAD = "leadleadleadlea";
    const withSourceLead = (status: string, lead = LEAD) => {
      mocks.getOne.mockResolvedValue({
        ...pending,
        status,
        expand: {
          ...pending.expand,
          syllabus: { ...pending.expand.syllabus, lead },
        },
      });
    };

    beforeEach(() => {
      mockAuth({ id: ME, roles: { chairOfPrograms: [PROGRAM] }, scope: SCOPE });
      mocks.parseReferenceActionInput.mockReturnValue({
        ok: true,
        data: { action: "withdraw" },
      });
      mocks.referenceTransition.mockReturnValue({
        ok: true,
        next: "withdrawn",
        stamp: "ended",
      });
    });

    it.each([
      ["pending", "reference_withdrawn", "BSIT withdrew its request to reference GE101 (BSED)"],
      ["approved", "reference_stopped", "BSIT stopped referencing GE101 (BSED)"],
    ])(
      "notifies the source lead when a %s reference is withdrawn",
      async (status, kind, title) => {
        withSourceLead(status);

        const res = await PATCH(patch({ action: "withdraw" }), ctx);

        expect(res.status).toBe(200);
        expect(mocks.chairsGetFullList).not.toHaveBeenCalled();
        expect(mocks.notifications).toEqual([
          expect.objectContaining({
            user: LEAD,
            syllabus: SOURCE,
            kind,
            stage: 0,
            actor: ME,
            title,
            link: `/syllabus/${SOURCE}`,
            email_status: "pending",
          }),
        ]);
      },
    );

    it("doesn't notify a chair who also leads the source", async () => {
      withSourceLead("approved", ME);

      const res = await PATCH(patch({ action: "withdraw" }), ctx);

      expect(res.status).toBe(200);
      expect(mocks.notifications).toEqual([]);
    });
  });

  it("stores the reason and ended stamps on a revoke", async () => {
    asRevoke();

    await PATCH(patch({ action: "revoke", reason: "Outdated" }), ctx);

    expect(mocks.update).toHaveBeenCalledWith(
      ID,
      {
        status: "revoked",
        reason: "Outdated",
        ended_by: ME,
        ended_at: "2026-10-26T08:00:00.000Z",
      },
    );
  });

  it("notifies the referencing program's active chairs on a revoke", async () => {
    asRevoke();

    const res = await PATCH(patch({ action: "revoke", reason: "Outdated" }), ctx);

    expect(res.status).toBe(200);
    expect(mocks.chairsGetFullList).toHaveBeenCalledWith({
      fields: "user",
      filter: `program = "${PROGRAM}" && active = true`,
    });
    expect(mocks.notifications).toEqual([
      expect.objectContaining({
        user: CHAIR,
        syllabus: SOURCE,
        kind: "reference_revoked",
        stage: 0,
        actor: ME,
        title: "BSIT's reference to GE101 (BSED) was revoked",
        link: "/syllabus-reference",
        email_status: "pending",
      }),
    ]);
    expect(mocks.notifications[0].body).toContain('Reason: "Outdated".');
  });

  it("doesn't notify the revoker and notifies each chair once", async () => {
    asRevoke();
    mocks.chairsGetFullList.mockResolvedValue([
      { user: ME },
      { user: CHAIR },
      { user: CHAIR },
    ]);

    await PATCH(patch({ action: "revoke", reason: "Outdated" }), ctx);

    expect(mocks.notifications.map((n) => n.user)).toEqual([CHAIR]);
  });

  it("revokes without a notice when the program has no active chair", async () => {
    asRevoke();
    mocks.chairsGetFullList.mockResolvedValue([]);

    const res = await PATCH(patch({ action: "revoke", reason: "Outdated" }), ctx);

    expect(res.status).toBe(200);
    expect(mocks.update).toHaveBeenCalled();
    expect(mocks.notifications).toEqual([]);
  });

  it("doesn't write the revoke when the notice can't be queued", async () => {
    asRevoke();
    mocks.chairsGetFullList.mockRejectedValue({ status: 500 });

    const res = await PATCH(patch({ action: "revoke", reason: "Outdated" }), ctx);

    expect(res.status).toBe(500);
    expect(mocks.update).not.toHaveBeenCalled();
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
