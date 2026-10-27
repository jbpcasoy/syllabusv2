import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  syllabiGetOne: vi.fn(),
  versionsGetOne: vi.fn(),
  resolveSyllabusAccess: vi.fn(),
  loadChainHolders: vi.fn(),
  loadStandIns: vi.fn(),
  latestVersion: vi.fn(),
  loadForm17: vi.fn(),
  saveForm17: vi.fn(),
  parseForm17Input: vi.fn(),
}));

vi.mock("@/lib/pocketbase", async () => {
  const { NextResponse } = await import("next/server");
  const collection = (name: string) =>
    name === "syllabi"
      ? { getOne: mocks.syllabiGetOne }
      : { getOne: mocks.versionsGetOne };
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
vi.mock("@/lib/form17", () => ({
  loadForm17: mocks.loadForm17,
  saveForm17: mocks.saveForm17,
}));
vi.mock("@/lib/validators/form17", () => ({
  parseForm17Input: mocks.parseForm17Input,
}));
vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);
vi.mock("@/lib/roles", async () =>
  (await import("@/tests/helpers/mock-auth")).rolesModuleMock(),
);

import { GET, PUT } from "@/app/api/syllabus/[id]/form17/route";
import { createAdminPb, handlePbError } from "@/lib/pocketbase";
import { mockAuth } from "@/tests/helpers/mock-auth";

const ID = "sylsylsylsylsyl";
const LEAD = "leadleadleadlea";
const REVIEWER = "revwrevwrevwrev";
const DEAN = "deandeandeandea";
const PROXY = "proxyproxyproxy";
const OTHER = "othrothrothroth";
const HOLDERS = [[REVIEWER], [DEAN], ["f"], ["c"], ["v"]];
const LATEST = { id: "v2v2v2v2v2v2v2v", version_no: 2, created: "x" };
const VERSION = { id: LATEST.id, syllabus: ID, version_no: 2, form17_suggestions: "" };
const FORM = { version: { id: LATEST.id }, answers: [], complete: false };
const INPUT = { answers: [{ criterion: "A1", answer: "yes", remarks: "" }] };
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

const get = (query = "") =>
  GET(new NextRequest(`http://localhost/api/syllabus/${ID}/form17${query}`), ctx);

const put = (body: unknown = INPUT) =>
  PUT(
    new NextRequest(`http://localhost/api/syllabus/${ID}/form17`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
    ctx,
  );

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ id: REVIEWER });
  mocks.syllabiGetOne.mockResolvedValue(syllabus());
  mocks.versionsGetOne.mockResolvedValue(VERSION);
  mocks.resolveSyllabusAccess.mockResolvedValue("reviewer");
  mocks.loadChainHolders.mockResolvedValue(HOLDERS);
  mocks.loadStandIns.mockResolvedValue([]);
  mocks.latestVersion.mockResolvedValue(LATEST);
  mocks.loadForm17.mockResolvedValue(FORM);
  mocks.saveForm17.mockResolvedValue(undefined);
  mocks.parseForm17Input.mockReturnValue({ ok: true, data: INPUT });
});

describe("GET /api/syllabus/:id/form17", () => {
  it("returns the latest version's checklist", async () => {
    const res = await get();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(FORM);
    expect(mocks.versionsGetOne).toHaveBeenCalledWith(LATEST.id, {
      fields: "id,syllabus,version_no,form17_suggestions",
    });
    expect(mocks.loadForm17).toHaveBeenCalledWith(expect.anything(), VERSION);
  });

  it("returns an older version on request", async () => {
    await get("?version=v1v1v1v1v1v1v1v");
    expect(mocks.latestVersion).not.toHaveBeenCalled();
    expect(mocks.versionsGetOne).toHaveBeenCalledWith(
      "v1v1v1v1v1v1v1v",
      expect.anything(),
    );
  });

  it("answers 404 for another syllabus's version", async () => {
    mocks.versionsGetOne.mockResolvedValue({ ...VERSION, syllabus: "otherotherother" });
    const res = await get("?version=v9v9v9v9v9v9v9v");
    expect(res.status).toBe(404);
    expect(mocks.loadForm17).not.toHaveBeenCalled();
  });

  it("returns 409 for a syllabus without versions", async () => {
    mocks.latestVersion.mockResolvedValue(null);
    expect((await get()).status).toBe(409);
  });

  it("answers 404 without access", async () => {
    mocks.resolveSyllabusAccess.mockResolvedValue(null);
    expect((await get()).status).toBe(404);
    expect(mocks.loadForm17).not.toHaveBeenCalled();
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

describe("PUT /api/syllabus/:id/form17", () => {
  it("saves as the stage-1 reviewer on the latest version", async () => {
    const res = await put();

    expect(res.status).toBe(200);
    expect(mocks.saveForm17).toHaveBeenCalledWith(expect.anything(), {
      versionId: LATEST.id,
      stage: 1,
      by: REVIEWER,
      input: INPUT,
    });
    expect(await res.json()).toEqual(FORM);
  });

  it("records a later stage so the edit is logged", async () => {
    mockAuth({ id: DEAN });
    mocks.syllabiGetOne.mockResolvedValue(syllabus(2));

    await put();
    expect(mocks.saveForm17).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ stage: 2, by: DEAN }),
    );
  });

  it("lets the proxy save and shuts out the program reviewer", async () => {
    mocks.loadStandIns.mockResolvedValue([{ stage: 1, user: PROXY }]);

    mockAuth({ id: PROXY });
    expect((await put()).status).toBe(200);

    vi.clearAllMocks();
    mockAuth({ id: REVIEWER });
    expect((await put()).status).toBe(403);
    expect(mocks.saveForm17).not.toHaveBeenCalled();
  });

  it("returns 400 before touching PocketBase", async () => {
    mocks.parseForm17Input.mockReturnValue({ ok: false, error: 'A "No" on A1 needs remarks' });
    const res = await put({ answers: [{ criterion: "A1", answer: "no" }] });

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'A "No" on A1 needs remarks' });
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("passes malformed JSON to the validator as null", async () => {
    mocks.parseForm17Input.mockReturnValue({ ok: false, error: "x" });
    await PUT(
      new NextRequest(`http://localhost/api/syllabus/${ID}/form17`, {
        method: "PUT",
        body: "{nope",
      }),
      ctx,
    );
    expect(mocks.parseForm17Input).toHaveBeenCalledWith(null);
  });

  it("returns 401 when signed out", async () => {
    mockAuth({ signedIn: false });
    expect((await put()).status).toBe(401);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("answers 404 to an outsider", async () => {
    mockAuth({ id: OTHER });
    mocks.resolveSyllabusAccess.mockResolvedValue(null);
    expect((await put()).status).toBe(404);
    expect(mocks.saveForm17).not.toHaveBeenCalled();
  });

  it.each([
    ["another stage's holder", DEAN, "reviewer", "Only the reviewer at the current stage can change Form 17."],
    ["the lead", LEAD, "lead", "You can't review a syllabus you lead or co-author."],
    ["an admin", OTHER, "admin", "Only the reviewer at the current stage can change Form 17."],
  ])("returns 403 to %s", async (_label, user, access, error) => {
    mockAuth({ id: user, isAdmin: access === "admin" });
    mocks.resolveSyllabusAccess.mockResolvedValue(access);

    const res = await put();
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error });
    expect(mocks.saveForm17).not.toHaveBeenCalled();
  });

  it("returns 403 to a program reviewer who co-authors it", async () => {
    mocks.syllabiGetOne.mockResolvedValue(syllabus(1, "submitted", { co_authors: [REVIEWER] }));
    mocks.resolveSyllabusAccess.mockResolvedValue("coAuthor");

    const res = await put();
    expect(res.status).toBe(403);
    expect(mocks.saveForm17).not.toHaveBeenCalled();
  });

  it.each(["draft", "returned", "approved", "filed"])(
    "returns 409 while %s",
    async (status) => {
      mocks.syllabiGetOne.mockResolvedValue(syllabus(1, status));
      const res = await put();
      expect(res.status).toBe(409);
      expect(mocks.saveForm17).not.toHaveBeenCalled();
    },
  );

  it("delegates save errors to handlePbError", async () => {
    mocks.saveForm17.mockRejectedValue({ status: 400 });
    expect((await put()).status).toBe(400);
    expect(handlePbError).toHaveBeenCalled();
  });
});
