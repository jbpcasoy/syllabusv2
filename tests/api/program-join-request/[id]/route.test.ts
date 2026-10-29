import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getOne: vi.fn(),
  delete: vi.fn(),
  parseProgramJoinRequestDecision: vi.fn(),
  applyJoinRequestDecision: vi.fn(),
  toProgramJoinRequestResponse: vi.fn((record: Record<string, unknown>) => ({
    ...record,
    mapped: true,
  })),
}));

vi.mock("@/lib/pocketbase", async () => {
  const { NextResponse } = await import("next/server");
  const collection = () => ({ getOne: mocks.getOne, delete: mocks.delete });
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

vi.mock("@/lib/validators/program-join-request", () => ({
  parseProgramJoinRequestDecision: mocks.parseProgramJoinRequestDecision,
}));

vi.mock("@/lib/program-join-request", () => ({
  JOIN_REQUEST_EXPAND: "user,program,reviewed_by",
  applyJoinRequestDecision: mocks.applyJoinRequestDecision,
  toProgramJoinRequestResponse: mocks.toProgramJoinRequestResponse,
}));

vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);

vi.mock("@/lib/capabilities", async () =>
  (await import("@/tests/helpers/mock-auth")).capabilitiesModuleMock(),
);

import { DELETE, PATCH } from "@/app/api/program-join-request/[id]/route";
import { createAdminPb } from "@/lib/pocketbase";
import { canMock, mockAuth, requireUserMock } from "@/tests/helpers/mock-auth";

const ID = "abc123abc123abc";
const ME = "me1me1me1me1me1";
const REQUESTER = "usr123usr123usr";
const PROGRAM_ID = "prg123prg123prg";
const SCOPE = { programId: PROGRAM_ID };
const ctx = { params: Promise.resolve({ id: ID }) };

const pending = {
  id: ID,
  user: REQUESTER,
  program: PROGRAM_ID,
  status: "pending",
};
const approve = { decision: "approve" as const };

function req(method: string, body?: unknown) {
  return new NextRequest(`http://localhost/api/program-join-request/${ID}`, {
    method,
    ...(body !== undefined && {
      headers: { "Content-Type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ id: ME, roles: { chairOfPrograms: [PROGRAM_ID] }, scope: SCOPE });
});

describe("PATCH /api/program-join-request/:id", () => {
  beforeEach(() => {
    mocks.parseProgramJoinRequestDecision.mockReturnValue({
      ok: true,
      data: approve,
    });
    mocks.getOne.mockResolvedValue(pending);
  });

  it("applies the decision and returns the refreshed, mapped request", async () => {
    const updated = { ...pending, status: "approved" };
    mocks.getOne
      .mockResolvedValueOnce(pending)
      .mockResolvedValueOnce(updated);

    const res = await PATCH(req("PATCH", approve), ctx);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ...updated, mapped: true });
    expect(mocks.applyJoinRequestDecision).toHaveBeenCalledWith(
      expect.anything(),
      pending,
      approve,
      ME,
    );
    expect(mocks.getOne).toHaveBeenLastCalledWith(ID, {
      expand: "user,program,reviewed_by",
    });
  });

  it("passes a rejection with its reason through", async () => {
    const reject = { decision: "reject", reason: "Not in our roster" };
    mocks.parseProgramJoinRequestDecision.mockReturnValue({
      ok: true,
      data: reject,
    });

    await PATCH(req("PATCH", reject), ctx);

    expect(mocks.applyJoinRequestDecision).toHaveBeenCalledWith(
      expect.anything(),
      pending,
      reject,
      ME,
    );
  });

  it("checks the review capability against the request", async () => {
    await PATCH(req("PATCH", approve), ctx);
    expect(requireUserMock).toHaveBeenCalledWith("programJoinRequest.review", {
      programJoinRequest: ID,
    });
  });

  it("returns 403 for a chair of another program and never touches PocketBase", async () => {
    mockAuth({
      id: ME,
      roles: { chairOfPrograms: ["otherprogram123"] },
      scope: SCOPE,
    });

    const res = await PATCH(req("PATCH", approve), ctx);

    expect(res.status).toBe(403);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("returns 403 for a dean or department head of the program", async () => {
    mockAuth({
      id: ME,
      roles: { deanOfColleges: ["col"], headOfDepartments: ["dep"] },
      scope: { ...SCOPE, collegeId: "col", departmentId: "dep" },
    });

    expect((await PATCH(req("PATCH", approve), ctx)).status).toBe(403);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("lets an admin decide any request", async () => {
    mockAuth({ id: ME, isAdmin: true });

    expect((await PATCH(req("PATCH", approve), ctx)).status).toBe(200);
  });

  it("refuses to let a chair decide their own request", async () => {
    mockAuth({
      id: REQUESTER,
      roles: { chairOfPrograms: [PROGRAM_ID] },
      scope: SCOPE,
    });

    const res = await PATCH(req("PATCH", approve), ctx);

    expect(res.status).toBe(403);
    expect((await res.json()).error).toContain("your own request");
    expect(mocks.applyJoinRequestDecision).not.toHaveBeenCalled();
  });

  describe("a department head who chairs the program", () => {
    const headScope = { ...SCOPE, departmentId: "dep123dep123dep" };
    beforeEach(() => {
      mockAuth({
        id: REQUESTER,
        roles: {
          chairOfPrograms: [PROGRAM_ID],
          headOfDepartments: [headScope.departmentId],
        },
        scope: headScope,
      });
    });

    it("may approve their own request", async () => {
      const res = await PATCH(req("PATCH", approve), ctx);

      expect(res.status).toBe(200);
      expect(canMock).toHaveBeenCalledWith(
        expect.anything(),
        "programJoinRequest.approveOwn",
        { programJoinRequest: ID },
      );
      expect(mocks.applyJoinRequestDecision).toHaveBeenCalledWith(
        expect.anything(),
        pending,
        approve,
        REQUESTER,
      );
    });

    it("may not reject their own request (they withdraw instead)", async () => {
      mocks.parseProgramJoinRequestDecision.mockReturnValue({
        ok: true,
        data: { decision: "reject", reason: "Changed my mind" },
      });

      const res = await PATCH(req("PATCH", approve), ctx);

      expect(res.status).toBe(403);
      expect(mocks.applyJoinRequestDecision).not.toHaveBeenCalled();
    });

    it("may not approve their own request in another department", async () => {
      mockAuth({
        id: REQUESTER,
        roles: {
          chairOfPrograms: [PROGRAM_ID],
          headOfDepartments: ["otherdept123456"],
        },
        scope: headScope,
      });

      const res = await PATCH(req("PATCH", approve), ctx);

      expect(res.status).toBe(403);
      expect(mocks.applyJoinRequestDecision).not.toHaveBeenCalled();
    });
  });

  it("lets an admin approve their own request (admin always passes)", async () => {
    mockAuth({ id: REQUESTER, isAdmin: true });

    expect((await PATCH(req("PATCH", approve), ctx)).status).toBe(200);
  });

  it.each(["approved", "rejected"])(
    "returns 409 when the request was already %s",
    async (status) => {
      mocks.getOne.mockResolvedValue({ ...pending, status });

      const res = await PATCH(req("PATCH", approve), ctx);

      expect(res.status).toBe(409);
      expect(await res.json()).toEqual({
        error: `This request was already ${status}`,
      });
      expect(mocks.applyJoinRequestDecision).not.toHaveBeenCalled();
    },
  );

  it("returns 400 on validation failure and never touches PocketBase", async () => {
    mocks.parseProgramJoinRequestDecision.mockReturnValue({
      ok: false,
      error: "A rejection needs a `reason`",
    });

    const res = await PATCH(req("PATCH", { decision: "reject" }), ctx);

    expect(res.status).toBe(400);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("passes null to the validator when the body is not valid JSON", async () => {
    mocks.parseProgramJoinRequestDecision.mockReturnValue({
      ok: false,
      error: "invalid",
    });

    await PATCH(req("PATCH", "{not json"), ctx);

    expect(mocks.parseProgramJoinRequestDecision).toHaveBeenCalledWith(null);
  });

  it("propagates a 404 for an unknown request", async () => {
    mocks.getOne.mockRejectedValue({ status: 404 });

    expect((await PATCH(req("PATCH", approve), ctx)).status).toBe(404);
  });

  it("delegates a failed batch (e.g. race) to handlePbError", async () => {
    mocks.applyJoinRequestDecision.mockRejectedValue({ status: 400 });

    expect((await PATCH(req("PATCH", approve), ctx)).status).toBe(400);
  });

  it("returns 401 when not signed in", async () => {
    mockAuth({ signedIn: false });

    expect((await PATCH(req("PATCH", approve), ctx)).status).toBe(401);
    expect(createAdminPb).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/program-join-request/:id", () => {
  beforeEach(() => {
    mockAuth({ id: REQUESTER });
    mocks.getOne.mockResolvedValue(pending);
  });

  it("lets the requester withdraw a pending request (204, no body)", async () => {
    const res = await DELETE(req("DELETE"), ctx);

    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
    expect(mocks.delete).toHaveBeenCalledWith(ID);
  });

  it("returns 403 for anyone else, including the program chair", async () => {
    mockAuth({ id: ME, roles: { chairOfPrograms: [PROGRAM_ID] } });

    const res = await DELETE(req("DELETE"), ctx);

    expect(res.status).toBe(403);
    expect(mocks.delete).not.toHaveBeenCalled();
  });

  it("returns 409 once the request has been decided", async () => {
    mocks.getOne.mockResolvedValue({ ...pending, status: "approved" });

    const res = await DELETE(req("DELETE"), ctx);

    expect(res.status).toBe(409);
    expect(mocks.delete).not.toHaveBeenCalled();
  });

  it("propagates a 404 for an unknown request", async () => {
    mocks.getOne.mockRejectedValue({ status: 404 });

    expect((await DELETE(req("DELETE"), ctx)).status).toBe(404);
  });

  it("delegates a delete failure to handlePbError", async () => {
    mocks.delete.mockRejectedValue({ status: 500 });

    expect((await DELETE(req("DELETE"), ctx)).status).toBe(500);
  });

  it("returns 401 when not signed in", async () => {
    mockAuth({ signedIn: false });

    expect((await DELETE(req("DELETE"), ctx)).status).toBe(401);
    expect(createAdminPb).not.toHaveBeenCalled();
  });
});
