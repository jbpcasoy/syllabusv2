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
  findJustification: vi.fn(),
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
vi.mock("@/lib/justification", () => ({
  canViewJustification: (access: string) => access !== "referencer",
  findJustification: mocks.findJustification,
}));
vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);
vi.mock("@/lib/roles", async () =>
  (await import("@/tests/helpers/mock-auth")).rolesModuleMock(),
);

// The builders and form definitions stay real: the routes serve their output.
import { GET as getForm18 } from "@/app/api/syllabus/[id]/export/form18/route";
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

const form18 = () =>
  getForm18(new NextRequest(`http://localhost/api/syllabus/${ID}/export/form18`), ctx);

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

describe("GET /api/syllabus/:id/export/form18", () => {
  it("serves both parts with legend text", async () => {
    const res = await form18();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.form.code).toBe("CITL-F-018");
    expect(data.partA.points).toEqual([]);
    expect(data.partB.points[0]).toMatchObject({ code: "B.3", codeText: "CO and IAS" });
  });

  it("answers 404 without access", async () => {
    mocks.resolveSyllabusAccess.mockResolvedValue(null);
    expect((await form18()).status).toBe(404);
    expect(mocks.listPoints).not.toHaveBeenCalled();
  });

  it.each([
    ["no previous syllabus", { based_on: "" }, null, "not_applicable"],
    ["a previous syllabus without a justification", { based_on: "old" }, null, "missing"],
    ["a submitted justification", { based_on: "old" }, { status: "submitted" }, "submitted"],
  ])("reports F.3 for %s", async (_label, extra, record, expected) => {
    mocks.syllabiGetOne.mockResolvedValue({ id: ID, lead: "x", co_authors: [], ...extra });
    mocks.findJustification.mockResolvedValue(record);
    expect((await (await form18()).json()).justification).toBe(expected);
  });

  it("hides the justification state from referencers", async () => {
    mocks.syllabiGetOne.mockResolvedValue({ id: ID, lead: "x", co_authors: [], based_on: "old" });
    mocks.resolveSyllabusAccess.mockResolvedValue("referencer");
    expect((await (await form18()).json()).justification).toBeNull();
    expect(mocks.findJustification).not.toHaveBeenCalled();
  });

  it("returns 401 when signed out", async () => {
    mockAuth({ signedIn: false });
    expect((await form18()).status).toBe(401);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("propagates 404 from PocketBase", async () => {
    mocks.syllabiGetOne.mockRejectedValue({ status: 404 });
    expect((await form18()).status).toBe(404);
  });
});
