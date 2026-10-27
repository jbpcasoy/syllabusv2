import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  syllabiGetOne: vi.fn(),
  update: vi.fn(),
  resolveSyllabusAccess: vi.fn(),
  findJustification: vi.fn(),
  loadJustificationResponse: vi.fn(),
  checkPdfUpload: vi.fn(),
  fetchVersionFile: vi.fn(),
}));

vi.mock("@/lib/pocketbase", async () => {
  const { NextResponse } = await import("next/server");
  const collection = (name: string) =>
    name === "syllabi" ? { getOne: mocks.syllabiGetOne } : { update: mocks.update };
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
vi.mock("@/lib/justification", () => ({
  canViewJustification: (access: string | null) =>
    !!access && access !== "referencer",
  findJustification: mocks.findJustification,
  loadJustificationResponse: mocks.loadJustificationResponse,
}));
vi.mock("@/lib/pdf", () => ({ checkPdfUpload: mocks.checkPdfUpload }));
vi.mock("@/lib/syllabus-version", () => ({ fetchVersionFile: mocks.fetchVersionFile }));
vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);
vi.mock("@/lib/roles", async () =>
  (await import("@/tests/helpers/mock-auth")).rolesModuleMock(),
);

import { GET, POST } from "@/app/api/syllabus/[id]/justification/scan/route";
import { createAdminPb } from "@/lib/pocketbase";
import { mockAuth } from "@/tests/helpers/mock-auth";

const ID = "sylsylsylsylsyl";
const ctx = { params: Promise.resolve({ id: ID }) };
const pdf = new File(["%PDF-1.7"], "letter.pdf", { type: "application/pdf" });
const syllabus = (status = "approved") => ({ id: ID, lead: "l", co_authors: [], status });

function upload() {
  const form = new FormData();
  form.set("file", pdf);
  return POST(
    new NextRequest(`http://localhost/api/syllabus/${ID}/justification/scan`, {
      method: "POST",
      body: form,
    }),
    ctx,
  );
}

const download = () =>
  GET(new NextRequest(`http://localhost/api/syllabus/${ID}/justification/scan`), ctx);

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ id: "l" });
  mocks.syllabiGetOne.mockResolvedValue(syllabus());
  mocks.resolveSyllabusAccess.mockResolvedValue("lead");
  mocks.findJustification.mockResolvedValue({
    id: "jst",
    status: "draft",
    entries: [{ author: "a", reason: "r" }],
    scan: "letter.pdf",
  });
  mocks.loadJustificationResponse.mockResolvedValue({ applies: true });
  mocks.checkPdfUpload.mockResolvedValue({ ok: true, file: pdf });
  mocks.fetchVersionFile.mockResolvedValue(new Response("%PDF-1.7", { status: 200 }));
});

describe("POST /api/syllabus/:id/justification/scan", () => {
  it("stores the signed letter and submits the justification", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-28T08:00:00.000Z"));
    const res = await upload();
    vi.useRealTimers();

    expect(res.status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith("jst", {
      scan: pdf,
      status: "submitted",
      submitted_at: "2026-10-28T08:00:00.000Z",
    });
  });

  it("accepts a new scan after a return", async () => {
    mocks.findJustification.mockResolvedValue({ id: "jst", status: "returned", entries: [{ author: "a", reason: "r" }] });
    expect((await upload()).status).toBe(200);
  });

  it.each([
    ["no justification", null],
    ["no entries", { id: "jst", status: "draft", entries: [] }],
    ["already submitted", { id: "jst", status: "submitted", entries: [{ author: "a", reason: "r" }] }],
  ])("returns 409 with %s", async (_label, record) => {
    mocks.findJustification.mockResolvedValue(record);
    expect((await upload()).status).toBe(409);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("returns 409 before approval", async () => {
    mocks.syllabiGetOne.mockResolvedValue(syllabus("submitted"));
    expect((await upload()).status).toBe(409);
  });

  it("returns 400 for a bad file before touching PocketBase", async () => {
    mocks.checkPdfUpload.mockResolvedValue({ ok: false, error: "The file is not a valid PDF" });
    expect((await upload()).status).toBe(400);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it.each(["coAuthor", "reviewer", "admin"])("returns 403 to %s", async (access) => {
    mocks.resolveSyllabusAccess.mockResolvedValue(access);
    expect((await upload()).status).toBe(403);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("answers 404 to a referencer", async () => {
    mocks.resolveSyllabusAccess.mockResolvedValue("referencer");
    expect((await upload()).status).toBe(404);
  });

  it("returns 401 when signed out", async () => {
    mockAuth({ signedIn: false });
    expect((await upload()).status).toBe(401);
  });
});

describe("GET /api/syllabus/:id/justification/scan", () => {
  it("streams the signed letter privately", async () => {
    mocks.resolveSyllabusAccess.mockResolvedValue("reviewer");
    const res = await download();
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    expect(mocks.fetchVersionFile).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ file: "letter.pdf" }),
    );
  });

  it("answers 404 when there is no scan", async () => {
    mocks.findJustification.mockResolvedValue({ id: "jst", status: "draft", scan: "" });
    expect((await download()).status).toBe(404);
  });

  it("answers 404 to a referencer", async () => {
    mocks.resolveSyllabusAccess.mockResolvedValue("referencer");
    expect((await download()).status).toBe(404);
    expect(mocks.findJustification).not.toHaveBeenCalled();
  });

  it("returns 502 when storage fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.fetchVersionFile.mockResolvedValue(new Response(null, { status: 500 }));
    expect((await download()).status).toBe(502);
  });
});
