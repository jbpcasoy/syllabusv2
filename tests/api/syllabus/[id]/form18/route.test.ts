import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  syllabiGetOne: vi.fn(),
  pointsCreate: vi.fn(),
  resolveSyllabusAccess: vi.fn(),
  loadChainHolders: vi.fn(),
  loadStandIns: vi.fn(),
  latestVersion: vi.fn(),
  loadForm18: vi.fn(),
  parsePointInput: vi.fn(),
}));

vi.mock("@/lib/pocketbase", async () => {
  const { NextResponse } = await import("next/server");
  const collection = (name: string) =>
    name === "syllabi"
      ? { getOne: mocks.syllabiGetOne }
      : { create: mocks.pointsCreate };
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

vi.mock("@/lib/syllabus", () => ({
  resolveSyllabusAccess: mocks.resolveSyllabusAccess,
}));
vi.mock("@/lib/syllabus-chain", () => ({
  loadChainHolders: mocks.loadChainHolders,
  loadStandIns: mocks.loadStandIns,
}));
vi.mock("@/lib/syllabus-version", () => ({
  latestVersion: mocks.latestVersion,
}));
vi.mock("@/lib/form18", () => ({
  POINT_EXPAND: "raised_by,responded_by,judged_by",
  loadForm18: mocks.loadForm18,
  toPointResponse: (record: object) => ({ ...record, mapped: true }),
}));
vi.mock("@/lib/validators/form18", () => ({
  parsePointInput: mocks.parsePointInput,
}));
vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);
vi.mock("@/lib/roles", async () =>
  (await import("@/tests/helpers/mock-auth")).rolesModuleMock(),
);

import { GET, POST } from "@/app/api/syllabus/[id]/form18/route";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { mockAuth } from "@/tests/helpers/mock-auth";

const ID = "sylsylsylsylsyl";
const LEAD = "leadleadleadlea";
const REVIEWER = "revwrevwrevwrev";
const DEAN = "deandeandeandea";
const FDIS = "fdisfdisfdisfdi";
const OTHER = "othrothrothroth";
const HOLDERS = [[REVIEWER], [DEAN], [FDIS], ["c"], ["v"]];
const LATEST = { id: "v2v2v2v2v2v2v2v", version_no: 2, created: "x" };
const ctx = { params: Promise.resolve({ id: ID }) };

const syllabus = (stage = 1, status = "submitted", extra: object = {}) => ({
  id: ID,
  program: "prg123prg123prg",
  lead: LEAD,
  co_authors: [],
  status,
  stage,
  ...extra,
});

function input(code = "", review_point = "Fix CO 2.") {
  mocks.parsePointInput.mockReturnValue({
    ok: true,
    data: { review_point, code, remarks: "" },
  });
}

const post = () =>
  POST(
    new NextRequest(`http://localhost/api/syllabus/${ID}/form18`, {
      method: "POST",
      body: JSON.stringify({}),
    }),
    ctx,
  );

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ id: REVIEWER });
  mocks.syllabiGetOne.mockResolvedValue(syllabus());
  mocks.resolveSyllabusAccess.mockResolvedValue("reviewer");
  mocks.loadChainHolders.mockResolvedValue(HOLDERS);
  mocks.loadStandIns.mockResolvedValue([]);
  mocks.latestVersion.mockResolvedValue(LATEST);
  mocks.pointsCreate.mockImplementation(async (data: object) => ({ id: "new", ...data }));
  mocks.loadForm18.mockResolvedValue({ form_revision: "01", points: [] });
  input();
});

describe("GET /api/syllabus/:id/form18", () => {
  const get = () =>
    GET(new NextRequest(`http://localhost/api/syllabus/${ID}/form18`), ctx);

  it("returns every point for a caller with access", async () => {
    const res = await get();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ form_revision: "01", points: [] });
    expect(mocks.loadForm18).toHaveBeenCalledWith(expect.anything(), ID);
  });

  it("answers 404 without access", async () => {
    mocks.resolveSyllabusAccess.mockResolvedValue(null);
    expect((await get()).status).toBe(404);
    expect(mocks.loadForm18).not.toHaveBeenCalled();
  });

  it("returns 401 when signed out", async () => {
    mockAuth({ signedIn: false });
    expect((await get()).status).toBe(401);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("propagates 404 from PocketBase", async () => {
    mocks.syllabiGetOne.mockRejectedValue({ status: 404 });
    expect((await get()).status).toBe(404);
  });
});

describe("POST /api/syllabus/:id/form18", () => {
  it("raises a Part A point at stage 1 on the latest version", async () => {
    const res = await post();

    expect(res.status).toBe(201);
    expect(mocks.pointsCreate).toHaveBeenCalledWith(
      {
        syllabus: ID,
        version: LATEST.id,
        part: "A",
        stage: 1,
        review_point: "Fix CO 2.",
        code: "",
        remarks: "",
        status: "open",
        form_revision: "01",
        raised_by: REVIEWER,
      },
      { expand: "raised_by,responded_by,judged_by" },
    );
    expect(await res.json()).toMatchObject({ mapped: true, status: "open" });
  });

  it("raises a Part B point with a legend code at stage 3", async () => {
    mockAuth({ id: FDIS });
    mocks.syllabiGetOne.mockResolvedValue(syllabus(3));
    input("B.3");

    expect((await post()).status).toBe(201);
    expect(mocks.pointsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ part: "B", stage: 3, code: "B.3" }),
      expect.anything(),
    );
  });

  it.each([
    [1, REVIEWER, "B.1", "Part A review points don't take a code."],
    [3, FDIS, "", "Part B review points need a code from the legend."],
    [3, FDIS, "Z.9", "Unknown legend code: Z.9"],
  ])("returns 400 at stage %i for code %j", async (stage, user, code, error) => {
    mockAuth({ id: user });
    mocks.syllabiGetOne.mockResolvedValue(syllabus(stage));
    input(code);

    const res = await post();
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error });
    expect(mocks.pointsCreate).not.toHaveBeenCalled();
  });

  it("returns 400 with the validator's error before touching PocketBase", async () => {
    mocks.parsePointInput.mockReturnValue({ ok: false, error: "`review_point` is required" });
    const res = await post();
    expect(res.status).toBe(400);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("passes malformed JSON to the validator as null", async () => {
    mocks.parsePointInput.mockReturnValue({ ok: false, error: "x" });
    await POST(
      new NextRequest(`http://localhost/api/syllabus/${ID}/form18`, {
        method: "POST",
        body: "{nope",
      }),
      ctx,
    );
    expect(mocks.parsePointInput).toHaveBeenCalledWith(null);
  });

  it("returns 401 when signed out", async () => {
    mockAuth({ signedIn: false });
    expect((await post()).status).toBe(401);
  });

  it("answers 404 to an outsider", async () => {
    mockAuth({ id: OTHER });
    mocks.resolveSyllabusAccess.mockResolvedValue(null);
    expect((await post()).status).toBe(404);
    expect(mocks.pointsCreate).not.toHaveBeenCalled();
  });

  it.each([
    ["another stage's holder", DEAN, "reviewer"],
    ["the lead", LEAD, "lead"],
    ["an admin", OTHER, "admin"],
  ])("returns 403 to %s", async (_label, user, access) => {
    mockAuth({ id: user, isAdmin: access === "admin" });
    mocks.resolveSyllabusAccess.mockResolvedValue(access);

    expect((await post()).status).toBe(403);
    expect(mocks.pointsCreate).not.toHaveBeenCalled();
  });

  it("blocks a program reviewer who co-authors it", async () => {
    mocks.syllabiGetOne.mockResolvedValue(syllabus(1, "submitted", { co_authors: [REVIEWER] }));
    mocks.resolveSyllabusAccess.mockResolvedValue("coAuthor");

    const res = await post();
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({
      error: "You can't review a syllabus you lead or co-author.",
    });
  });

  it.each(["draft", "returned", "approved", "filed"])("returns 409 while %s", async (status) => {
    mocks.syllabiGetOne.mockResolvedValue(syllabus(1, status));
    expect((await post()).status).toBe(409);
    expect(mocks.pointsCreate).not.toHaveBeenCalled();
  });

  it("delegates create errors", async () => {
    mocks.pointsCreate.mockRejectedValue({ status: 400 });
    expect((await post()).status).toBe(400);
    expect(handlePbError).toHaveBeenCalled();
  });
});
