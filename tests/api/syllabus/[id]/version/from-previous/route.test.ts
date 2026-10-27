import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  syllabiGetOne: vi.fn(),
  termsGetOne: vi.fn(),
  versionsGetOne: vi.fn(),
  versionsCreate: vi.fn(),
  getSyllabusAccess: vi.fn(),
  activeFacultyAmong: vi.fn(),
  latestVersion: vi.fn(),
  latestVersionNo: vi.fn(),
  fetchVersionFile: vi.fn(),
}));

vi.mock("@/lib/pocketbase", async () => {
  const { NextResponse } = await import("next/server");
  const collections: Record<string, unknown> = {
    syllabi: { getOne: mocks.syllabiGetOne },
    terms: { getOne: mocks.termsGetOne },
    syllabus_versions: { getOne: mocks.versionsGetOne, create: mocks.versionsCreate },
  };
  return {
    createAdminPb: vi.fn(async () => ({
      collection: (name: string) => collections[name],
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

vi.mock("@/lib/syllabus", () => ({
  getSyllabusAccess: mocks.getSyllabusAccess,
  activeFacultyAmong: mocks.activeFacultyAmong,
  isNotUniqueError: (error: { response?: { data?: Record<string, { code?: string }> } }, field: string) =>
    error?.response?.data?.[field]?.code === "validation_not_unique",
}));
vi.mock("@/lib/syllabus-version", () => ({
  SYLLABUS_VERSION_EXPAND: "uploaded_by",
  latestVersion: mocks.latestVersion,
  latestVersionNo: mocks.latestVersionNo,
  fetchVersionFile: mocks.fetchVersionFile,
  toSyllabusVersionResponse: (record: object) => ({ ...record, mapped: true }),
}));
vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);
vi.mock("@/lib/roles", async () =>
  (await import("@/tests/helpers/mock-auth")).rolesModuleMock(),
);

import { POST } from "@/app/api/syllabus/[id]/version/from-previous/route";
import { createAdminPb } from "@/lib/pocketbase";
import { mockAuth } from "@/tests/helpers/mock-auth";

const ID = "sylsylsylsylsyl";
const ME = "leadleadleadlea";
const OLD = "oldoldoldoldold";
const OLD_VERSION = { id: "oldveroldverold", version_no: 4, created: "x" };
const ctx = { params: Promise.resolve({ id: ID }) };

const syllabus = (extra: object = {}) => ({
  id: ID,
  program: "prg123prg123prg",
  term: "trm123trm123trm",
  lead: ME,
  co_authors: [],
  status: "draft",
  based_on: OLD,
  ...extra,
});

const post = () =>
  POST(
    new NextRequest(`http://localhost/api/syllabus/${ID}/version/from-previous`, {
      method: "POST",
    }),
    ctx,
  );

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ id: ME });
  mocks.syllabiGetOne.mockResolvedValue(syllabus());
  mocks.getSyllabusAccess.mockReturnValue("lead");
  mocks.termsGetOne.mockResolvedValue({ id: "t", open: true });
  mocks.activeFacultyAmong.mockResolvedValue(new Set([ME]));
  mocks.latestVersionNo.mockResolvedValue(0);
  mocks.latestVersion.mockResolvedValue(OLD_VERSION);
  mocks.versionsGetOne.mockResolvedValue({ ...OLD_VERSION, file: "old.pdf" });
  mocks.fetchVersionFile.mockImplementation(
    async () => new Response("%PDF-1.7 old", { status: 200 }),
  );
  mocks.versionsCreate.mockImplementation(async (data: object) => ({ id: "v1", ...data }));
});

describe("POST /api/syllabus/:id/version/from-previous", () => {
  it("copies last year's latest PDF in as version 1", async () => {
    const res = await post();

    expect(res.status).toBe(201);
    expect(mocks.latestVersion).toHaveBeenCalledWith(expect.anything(), OLD);
    const [data, options] = mocks.versionsCreate.mock.calls[0];
    expect(data).toMatchObject({
      syllabus: ID,
      version_no: 1,
      uploaded_by: ME,
      notes: "Started from last school year's syllabus (version 4).",
    });
    expect(data.file).toBeInstanceOf(File);
    expect(data.file.type).toBe("application/pdf");
    expect(await data.file.text()).toBe("%PDF-1.7 old");
    expect(options).toEqual({ expand: "uploaded_by" });
  });

  it.each([
    ["not a draft", () => mocks.syllabiGetOne.mockResolvedValue(syllabus({ status: "returned" }))],
    ["without a previous syllabus", () => mocks.syllabiGetOne.mockResolvedValue(syllabus({ based_on: "" }))],
    ["the term is closed", () => mocks.termsGetOne.mockResolvedValue({ id: "t", open: false })],
    ["it already has a version", () => mocks.latestVersionNo.mockResolvedValue(1)],
    ["last year's syllabus has no PDF", () => mocks.latestVersion.mockResolvedValue(null)],
    ["a concurrent upload won", () =>
      mocks.versionsCreate.mockRejectedValue({
        response: { data: { version_no: { code: "validation_not_unique" } } },
      })],
  ])("returns 409 when %s", async (_label, arrange) => {
    arrange();
    expect((await post()).status).toBe(409);
  });

  it("returns 502 when last year's PDF can't be loaded", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.fetchVersionFile.mockResolvedValue(new Response(null, { status: 500 }));
    expect((await post()).status).toBe(502);
    expect(mocks.versionsCreate).not.toHaveBeenCalled();
  });

  it.each(["coAuthor", "admin", "referencer"])("returns 403 for %s access", async (access) => {
    mocks.getSyllabusAccess.mockReturnValue(access);
    expect((await post()).status).toBe(403);
    expect(mocks.versionsCreate).not.toHaveBeenCalled();
  });

  it("returns 403 when the lead is no longer faculty", async () => {
    mocks.activeFacultyAmong.mockResolvedValue(new Set());
    expect((await post()).status).toBe(403);
  });

  it("answers 404 without access", async () => {
    mocks.getSyllabusAccess.mockReturnValue(null);
    expect((await post()).status).toBe(404);
  });

  it("returns 401 when signed out", async () => {
    mockAuth({ signedIn: false });
    expect((await post()).status).toBe(401);
    expect(createAdminPb).not.toHaveBeenCalled();
  });
});
