import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  syllabiGetOne: vi.fn(),
  copiesGetOne: vi.fn(),
  resolveSyllabusAccess: vi.fn(),
  parseSignedCopyReturn: vi.fn(),
  batchOps: [] as unknown[][],
  batchSend: vi.fn(),
}));

vi.mock("@/lib/pocketbase", async () => {
  const { NextResponse } = await import("next/server");
  const collection = (name: string) =>
    name === "syllabi"
      ? { getOne: mocks.syllabiGetOne }
      : { getOne: mocks.copiesGetOne };
  const batch = {
    collection: (name: string) => ({
      update: (id: string, body: unknown) =>
        mocks.batchOps.push(["update", name, id, body]),
    }),
    send: mocks.batchSend,
  };
  return {
    createAdminPb: vi.fn(async () => ({ collection, createBatch: () => batch })),
    handlePbError: vi.fn((error: unknown) => {
      const status =
        typeof error === "object" && error && "status" in error
          ? Number((error as { status: unknown }).status)
          : 500;
      return NextResponse.json({ error: "pb error" }, { status });
    }),
  };
});

vi.mock("@/lib/syllabus", () => ({
  resolveSyllabusAccess: mocks.resolveSyllabusAccess,
}));
vi.mock("@/lib/signed-copy", () => ({
  SIGNED_COPY_EXPAND: "uploaded_by,returned_by",
  toSignedCopyResponse: (record: object) => ({ ...record, mapped: true }),
}));
vi.mock("@/lib/validators/signed-copy", () => ({
  parseSignedCopyReturn: mocks.parseSignedCopyReturn,
}));
vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);
vi.mock("@/lib/roles", async () =>
  (await import("@/tests/helpers/mock-auth")).rolesModuleMock(),
);

import { PATCH } from "@/app/api/syllabus/[id]/signed-copy/[copyId]/route";
import { createAdminPb } from "@/lib/pocketbase";
import { authorizeMock, mockAuth } from "@/tests/helpers/mock-auth";

const ID = "sylsylsylsylsyl";
const COPY = "cpycpycpycpycpy";
const PROGRAM = "prg123prg123prg";
const ME = "revwrevwrevwrev";
const NOW = "2026-10-28T08:00:00.000Z";
const ctx = { params: Promise.resolve({ id: ID, copyId: COPY }) };
const SCOPE = {
  programId: PROGRAM,
  departmentId: "dep123dep123dep",
  collegeId: "col123col123col",
};
const syllabus = (status = "filed") => ({
  id: ID,
  program: PROGRAM,
  lead: "leadleadleadlea",
  co_authors: [],
  status,
  stage: 5,
});
const copy = (extra: object = {}) => ({ id: COPY, syllabus: ID, status: "valid", ...extra });

const patch = () =>
  PATCH(
    new NextRequest(`http://localhost/api/syllabus/${ID}/signed-copy/${COPY}`, {
      method: "PATCH",
      body: JSON.stringify({ reason: "Missing signature." }),
    }),
    ctx,
  );

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date(NOW));
  mocks.batchOps.length = 0;
  mockAuth({ id: ME, roles: { reviewerOfPrograms: [PROGRAM] }, scope: SCOPE });
  mocks.syllabiGetOne.mockResolvedValue(syllabus());
  mocks.copiesGetOne.mockResolvedValue(copy());
  mocks.resolveSyllabusAccess.mockResolvedValue("reviewer");
  mocks.parseSignedCopyReturn.mockReturnValue({
    ok: true,
    data: { reason: "Missing signature." },
  });
  mocks.batchSend.mockResolvedValue([]);
});

describe("PATCH /api/syllabus/:id/signed-copy/:copyId", () => {
  it("returns the copy and the syllabus to approved in one batch", async () => {
    const res = await patch();

    expect(res.status).toBe(200);
    expect(mocks.batchOps).toEqual([
      [
        "update",
        "syllabus_signed_copies",
        COPY,
        {
          status: "returned",
          reason: "Missing signature.",
          returned_by: ME,
          returned_at: NOW,
        },
      ],
      ["update", "syllabi", ID, { status: "approved", stage: 5 }],
    ]);
    expect(mocks.batchSend).toHaveBeenCalledTimes(1);
    expect(authorizeMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: ME }),
      "signedCopy.return",
      { program: PROGRAM },
    );
  });

  it.each([
    ["the dean of its college", { deanOfColleges: [SCOPE.collegeId] }],
    ["the FDIS chair", { isFdisChair: true }],
    ["the CITL director", { isCitlDirector: true }],
    ["the VPAA", { isVpaa: true }],
  ])("lets %s return it", async (_label, roles) => {
    mockAuth({ id: ME, roles, scope: SCOPE });
    expect((await patch()).status).toBe(200);
  });

  it("lets an admin return it", async () => {
    mockAuth({ id: ME, isAdmin: true });
    expect((await patch()).status).toBe(200);
  });

  it.each([
    ["the department head", { headOfDepartments: [SCOPE.departmentId] }],
    ["the program chair", { chairOfPrograms: [PROGRAM] }],
    ["the lead", { facultyOfPrograms: [PROGRAM] }],
  ])("returns 403 to %s with nothing written", async (_label, roles) => {
    mockAuth({ id: ME, roles, scope: SCOPE });
    expect((await patch()).status).toBe(403);
    expect(mocks.batchSend).not.toHaveBeenCalled();
  });

  it("returns 403 to the program reviewer of another program", async () => {
    mockAuth({ id: ME, roles: { reviewerOfPrograms: ["otherotherother"] } });
    expect((await patch()).status).toBe(403);
  });

  it("returns 409 for a copy already returned", async () => {
    mocks.copiesGetOne.mockResolvedValue(copy({ status: "returned" }));
    const res = await patch();
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "This signed copy was already returned." });
  });

  it("returns 409 when the syllabus isn't filed", async () => {
    mocks.syllabiGetOne.mockResolvedValue(syllabus("approved"));
    expect((await patch()).status).toBe(409);
    expect(mocks.batchSend).not.toHaveBeenCalled();
  });

  it("answers 404 for another syllabus's copy", async () => {
    mocks.copiesGetOne.mockResolvedValue(copy({ syllabus: "otherotherother" }));
    expect((await patch()).status).toBe(404);
  });

  it("answers 404 without access", async () => {
    mocks.resolveSyllabusAccess.mockResolvedValue(null);
    expect((await patch()).status).toBe(404);
  });

  it("returns 400 before touching PocketBase", async () => {
    mocks.parseSignedCopyReturn.mockReturnValue({ ok: false, error: "Give a reason" });
    const res = await PATCH(
      new NextRequest(`http://localhost/api/syllabus/${ID}/signed-copy/${COPY}`, {
        method: "PATCH",
        body: "{nope",
      }),
      ctx,
    );
    expect(res.status).toBe(400);
    expect(mocks.parseSignedCopyReturn).toHaveBeenCalledWith(null);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("returns 401 when signed out", async () => {
    mockAuth({ signedIn: false });
    expect((await patch()).status).toBe(401);
  });

  it("delegates batch errors", async () => {
    mocks.batchSend.mockRejectedValue({ status: 400 });
    expect((await patch()).status).toBe(400);
  });
});
