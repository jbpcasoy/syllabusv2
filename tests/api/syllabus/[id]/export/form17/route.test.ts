import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  syllabiGetOne: vi.fn(),
  versionsGetOne: vi.fn(),
  resolveSyllabusAccess: vi.fn(),
  latestVersion: vi.fn(),
  listForm17Answers: vi.fn(),
  listPoints: vi.fn(),
  loadExportSyllabus: vi.fn(),
  listApprovals: vi.fn(),
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
vi.mock("@/lib/syllabus-version", () => ({ latestVersion: mocks.latestVersion }));
vi.mock("@/lib/form17", () => ({ listForm17Answers: mocks.listForm17Answers }));
vi.mock("@/lib/form18", () => ({ listPoints: mocks.listPoints }));
vi.mock("@/lib/forms-export", () => ({
  loadExportSyllabus: mocks.loadExportSyllabus,
  listApprovals: mocks.listApprovals,
}));
vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);
vi.mock("@/lib/roles", async () =>
  (await import("@/tests/helpers/mock-auth")).rolesModuleMock(),
);

// The builders and form definitions stay real: the routes serve their output.
import { GET as getForm17 } from "@/app/api/syllabus/[id]/export/form17/route";
import { createAdminPb } from "@/lib/pocketbase";
import { mockAuth } from "@/tests/helpers/mock-auth";

const ID = "sylsylsylsylsyl";
const VERSION = { id: "v2v2v2v2v2v2v2v", syllabus: ID, version_no: 2, form17_suggestions: "More refs." };
const ctx = { params: Promise.resolve({ id: ID }) };
const SYLLABUS = {
  courseCode: "IT 101",
  courseTitle: "Intro",
  programCode: "BSIT",
  programName: "BS IT",
  schoolYearLabel: "2026-2027",
  semester: "First Semester",
  leadName: "Lea",
  coAuthorNames: [],
};

const form17 = (query = "") =>
  getForm17(new NextRequest(`http://localhost/api/syllabus/${ID}/export/form17${query}`), ctx);

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ id: "me1me1me1me1me1" });
  mocks.syllabiGetOne.mockResolvedValue({ id: ID, lead: "x", co_authors: [] });
  mocks.resolveSyllabusAccess.mockResolvedValue("reviewer");
  mocks.latestVersion.mockResolvedValue({ id: VERSION.id, version_no: 2, created: "x" });
  mocks.versionsGetOne.mockResolvedValue(VERSION);
  mocks.listForm17Answers.mockResolvedValue([
    { criterion: "A1", answer: "yes", remarks: "", form_revision: "04" },
  ]);
  mocks.listPoints.mockResolvedValue([
    {
      part: "B",
      stage: 3,
      code: "B.3",
      review_point: "Align",
      action_taken: "",
      page_number: "",
      remarks: "",
      status: "open",
      form_revision: "01",
    },
  ]);
  mocks.loadExportSyllabus.mockResolvedValue(SYLLABUS);
  mocks.listApprovals.mockResolvedValue([]);
});

describe("GET /api/syllabus/:id/export/form17", () => {
  it("serves the latest version's export data", async () => {
    const res = await form17();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.form.code).toBe("OVPAA-F-INS-017");
    expect(data.syllabus.versionNo).toBe(2);
    expect(data.suggestions).toBe("More refs.");
    expect(data.sections[0].criteria[0]).toMatchObject({ key: "A1", answer: "yes" });
    expect(mocks.listForm17Answers).toHaveBeenCalledWith(expect.anything(), VERSION.id);
  });

  it("serves an older version on request", async () => {
    await form17("?version=v1v1v1v1v1v1v1v");
    expect(mocks.latestVersion).not.toHaveBeenCalled();
    expect(mocks.versionsGetOne).toHaveBeenCalledWith("v1v1v1v1v1v1v1v", expect.anything());
  });

  it("answers 404 for another syllabus's version", async () => {
    mocks.versionsGetOne.mockResolvedValue({ ...VERSION, syllabus: "otherotherother" });
    expect((await form17("?version=v9v9v9v9v9v9v9v")).status).toBe(404);
    expect(mocks.listForm17Answers).not.toHaveBeenCalled();
  });

  it("returns 409 without a version", async () => {
    mocks.latestVersion.mockResolvedValue(null);
    expect((await form17()).status).toBe(409);
  });

  it("answers 404 without access", async () => {
    mocks.resolveSyllabusAccess.mockResolvedValue(null);
    expect((await form17()).status).toBe(404);
    expect(mocks.loadExportSyllabus).not.toHaveBeenCalled();
  });

  it("returns 401 when signed out", async () => {
    mockAuth({ signedIn: false });
    expect((await form17()).status).toBe(401);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("propagates 404 from PocketBase", async () => {
    mocks.syllabiGetOne.mockRejectedValue({ status: 404 });
    expect((await form17()).status).toBe(404);
  });
});

