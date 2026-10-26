import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  syllabiGetOne: vi.fn(),
  syllabiUpdate: vi.fn(),
  termsGetOne: vi.fn(),
  activeFacultyAmong: vi.fn(),
  getSyllabusAccess: vi.fn(),
  findMissingChainRoles: vi.fn(),
  latestVersionNo: vi.fn(),
  transition: vi.fn(),
  toSyllabusResponse: vi.fn((record: Record<string, unknown>, access?: string) => ({
    ...record,
    access,
    mapped: true,
  })),
}));

vi.mock("@/lib/pocketbase", async () => {
  const { NextResponse } = await import("next/server");
  const collections: Record<string, unknown> = {
    syllabi: { getOne: mocks.syllabiGetOne, update: mocks.syllabiUpdate },
    terms: { getOne: mocks.termsGetOne },
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
  SYLLABUS_EXPAND: "course,term.school_year,program,lead,co_authors",
  activeFacultyAmong: mocks.activeFacultyAmong,
  getSyllabusAccess: mocks.getSyllabusAccess,
  toSyllabusResponse: mocks.toSyllabusResponse,
}));
vi.mock("@/lib/syllabus-chain", () => ({
  findMissingChainRoles: mocks.findMissingChainRoles,
}));
vi.mock("@/lib/syllabus-version", () => ({
  latestVersionNo: mocks.latestVersionNo,
}));
vi.mock("@/lib/syllabus-workflow", () => ({ transition: mocks.transition }));

vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);
vi.mock("@/lib/roles", async () =>
  (await import("@/tests/helpers/mock-auth")).rolesModuleMock(),
);

import { POST } from "@/app/api/syllabus/[id]/submit/route";
import { createAdminPb } from "@/lib/pocketbase";
import { mockAuth } from "@/tests/helpers/mock-auth";

const ID = "sylsylsylsylsyl";
const ME = "me1me1me1me1me1";
const PROGRAM = "prg123prg123prg";
const TERM = "trm123trm123trm";
const ctx = { params: Promise.resolve({ id: ID }) };

const draft = {
  id: ID,
  program: PROGRAM,
  term: TERM,
  lead: ME,
  co_authors: [],
  status: "draft",
  stage: 0,
};

function post() {
  return new NextRequest(`http://localhost/api/syllabus/${ID}/submit`, {
    method: "POST",
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-26T08:00:00.000Z"));
  mockAuth({ id: ME, roles: { facultyOfPrograms: [PROGRAM] } });
  mocks.syllabiGetOne.mockResolvedValue(draft);
  mocks.getSyllabusAccess.mockReturnValue("lead");
  mocks.termsGetOne.mockResolvedValue({ id: TERM, open: true });
  mocks.latestVersionNo.mockResolvedValue(2);
  mocks.findMissingChainRoles.mockResolvedValue([]);
  mocks.activeFacultyAmong.mockResolvedValue(new Set([ME]));
  mocks.transition.mockReturnValue({
    ok: true,
    next: { status: "submitted", stage: 1 },
  });
  mocks.syllabiUpdate.mockImplementation(async (_id: string, data: object) => ({
    ...draft,
    ...data,
  }));
});

describe("POST /api/syllabus/:id/submit", () => {
  it("asks the workflow and stores its next state", async () => {
    const res = await POST(post(), ctx);

    expect(res.status).toBe(200);
    expect(mocks.transition).toHaveBeenCalledWith(draft, {
      type: "submit",
      hasVersion: true,
      termOpen: true,
      missingRoles: [],
    });
    expect(mocks.syllabiUpdate).toHaveBeenCalledWith(
      ID,
      {
        status: "submitted",
        stage: 1,
        submitted_at: "2026-10-26T08:00:00.000Z",
      },
      { expand: "course,term.school_year,program,lead,co_authors" },
    );
    expect(await res.json()).toMatchObject({
      status: "submitted",
      stage: 1,
      access: "lead",
      mapped: true,
    });
    expect(mocks.findMissingChainRoles).toHaveBeenCalledWith(
      expect.anything(),
      PROGRAM,
    );
  });

  it("passes the gathered facts to the workflow", async () => {
    mocks.termsGetOne.mockResolvedValue({ id: TERM, open: false });
    mocks.latestVersionNo.mockResolvedValue(0);
    mocks.findMissingChainRoles.mockResolvedValue(["dean", "vpaa"]);
    mocks.transition.mockReturnValue({ ok: false, error: "nope" });

    await POST(post(), ctx);

    expect(mocks.transition).toHaveBeenCalledWith(draft, {
      type: "submit",
      hasVersion: false,
      termOpen: false,
      missingRoles: ["dean", "vpaa"],
    });
  });

  it.each([
    "Only a draft syllabus can be submitted.",
    "This term is closed for submissions.",
    "Upload a PDF version before submitting.",
    "The review chain is incomplete. No active Dean, VPAA.",
  ])("returns 409 with the workflow's message: %s", async (error) => {
    mocks.transition.mockReturnValue({ ok: false, error });

    const res = await POST(post(), ctx);

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error });
    expect(mocks.syllabiUpdate).not.toHaveBeenCalled();
  });

  it("returns 401 when signed out", async () => {
    mockAuth({ signedIn: false });
    const res = await POST(post(), ctx);
    expect(res.status).toBe(401);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("answers 404 when the caller has no access", async () => {
    mocks.getSyllabusAccess.mockReturnValue(null);
    const res = await POST(post(), ctx);
    expect(res.status).toBe(404);
    expect(mocks.transition).not.toHaveBeenCalled();
    expect(mocks.syllabiUpdate).not.toHaveBeenCalled();
  });

  it.each(["coAuthor", "admin"])("returns 403 for %s access", async (access) => {
    mocks.getSyllabusAccess.mockReturnValue(access);
    const res = await POST(post(), ctx);
    expect(res.status).toBe(403);
    expect(mocks.transition).not.toHaveBeenCalled();
    expect(mocks.syllabiUpdate).not.toHaveBeenCalled();
  });

  it("returns 403 when the lead is no longer faculty of the program", async () => {
    mocks.activeFacultyAmong.mockResolvedValue(new Set());
    const res = await POST(post(), ctx);
    expect(res.status).toBe(403);
    expect(mocks.syllabiUpdate).not.toHaveBeenCalled();
  });

  it("propagates 404 from PocketBase", async () => {
    mocks.syllabiGetOne.mockRejectedValue({ status: 404 });
    const res = await POST(post(), ctx);
    expect(res.status).toBe(404);
  });

  it("delegates update errors", async () => {
    mocks.syllabiUpdate.mockRejectedValue({ status: 400 });
    const res = await POST(post(), ctx);
    expect(res.status).toBe(400);
  });
});
