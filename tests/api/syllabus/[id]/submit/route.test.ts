import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  syllabiGetOne: vi.fn(),
  batchOps: [] as unknown[][],
  batchSend: vi.fn(),
  termsGetOne: vi.fn(),
  activeFacultyAmong: vi.fn(),
  getSyllabusAccess: vi.fn(),
  loadChainHolders: vi.fn(),
  loadStandIns: vi.fn(),
  missingChainRoles: vi.fn(),
  ensureRefSeq: vi.fn(),
  latestVersion: vi.fn(),
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
    syllabi: { getOne: mocks.syllabiGetOne },
    terms: { getOne: mocks.termsGetOne },
  };
  const batch = {
    collection: (name: string) => ({
      create: (body: unknown) => mocks.batchOps.push(["create", name, body]),
      update: (id: string, body: unknown) =>
        mocks.batchOps.push(["update", name, id, body]),
    }),
    send: mocks.batchSend,
  };
  return {
    createAdminPb: vi.fn(async () => ({
      collection: (name: string) => collections[name],
      createBatch: () => batch,
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
  loadChainHolders: mocks.loadChainHolders,
  loadStandIns: mocks.loadStandIns,
  missingChainRoles: mocks.missingChainRoles,
}));
vi.mock("@/lib/syllabus-decision", () => ({ ensureRefSeq: mocks.ensureRefSeq }));
vi.mock("@/lib/syllabus-version", () => ({
  latestVersion: mocks.latestVersion,
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
const REVIEWER = "revwrevwrevwrev";
const VERSION = "ververververver";
const NOW = "2026-10-26T08:00:00.000Z";
const EXPAND = "course,term.school_year,program,lead,co_authors";
const HOLDERS = [[REVIEWER], ["dean"], ["fdis"], ["citl"], ["vpaa"]];
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
  vi.setSystemTime(new Date(NOW));
  mockAuth({ id: ME, roles: { facultyOfPrograms: [PROGRAM] } });
  mocks.batchOps.length = 0;
  mocks.batchSend.mockResolvedValue([]);
  // The first load is the draft; the reload after the batch sees it submitted.
  mocks.syllabiGetOne.mockImplementation(
    async (_id: string, options?: { expand?: string }) =>
      options?.expand ? { ...draft, status: "submitted", stage: 1 } : draft,
  );
  mocks.getSyllabusAccess.mockReturnValue("lead");
  mocks.termsGetOne.mockResolvedValue({ id: TERM, open: true });
  mocks.latestVersion.mockResolvedValue({ id: VERSION, version_no: 2 });
  mocks.loadChainHolders.mockResolvedValue(HOLDERS);
  mocks.loadStandIns.mockResolvedValue([]);
  mocks.missingChainRoles.mockReturnValue([]);
  mocks.ensureRefSeq.mockResolvedValue(7);
  mocks.activeFacultyAmong.mockResolvedValue(new Set([ME]));
  mocks.transition.mockReturnValue({
    ok: true,
    next: { status: "submitted", stage: 1 },
  });
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
      proxyNeeded: false,
    });
    expect(mocks.batchOps).toEqual([
      [
        "update",
        "syllabi",
        ID,
        {
          status: "submitted",
          stage: 1,
          submitted_at: NOW,
          status_changed_at: NOW,
        },
      ],
      [
        "create",
        "syllabus_events",
        {
          syllabus: ID,
          type: "submitted",
          actor: ME,
          stage: 1,
          version: VERSION,
          approval_code: "",
          reason: "",
        },
      ],
    ]);
    expect(mocks.batchSend).toHaveBeenCalledTimes(1);
    expect(mocks.syllabiGetOne).toHaveBeenLastCalledWith(ID, { expand: EXPAND });
    expect(await res.json()).toMatchObject({
      status: "submitted",
      stage: 1,
      access: "lead",
      mapped: true,
    });
    expect(mocks.loadChainHolders).toHaveBeenCalledWith(
      expect.anything(),
      PROGRAM,
    );
    expect(mocks.loadStandIns).toHaveBeenCalledWith(expect.anything(), ID);
    expect(mocks.missingChainRoles).toHaveBeenCalledWith(HOLDERS);
  });

  it("assigns the approval-code sequence before storing the new state", async () => {
    await POST(post(), ctx);

    expect(mocks.ensureRefSeq).toHaveBeenCalledWith(expect.anything(), draft);
    expect(mocks.ensureRefSeq.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.batchSend.mock.invocationCallOrder[0],
    );
  });

  it("doesn't assign a sequence when the workflow refuses", async () => {
    mocks.transition.mockReturnValue({ ok: false, error: "nope" });
    await POST(post(), ctx);
    expect(mocks.ensureRefSeq).not.toHaveBeenCalled();
  });

  it.each([
    ["leads", { lead: REVIEWER }],
    ["co-authors", { co_authors: [REVIEWER] }],
  ])("needs a proxy when the program reviewer %s", async (_label, authors) => {
    mockAuth({ id: REVIEWER, roles: { facultyOfPrograms: [PROGRAM] } });
    const own = { ...draft, ...authors };
    mocks.syllabiGetOne.mockResolvedValue(own);
    mocks.activeFacultyAmong.mockResolvedValue(new Set([REVIEWER]));

    await POST(post(), ctx);

    expect(mocks.transition).toHaveBeenCalledWith(
      own,
      expect.objectContaining({ proxyNeeded: true }),
    );
  });

  it("needs no proxy once one is designated", async () => {
    mocks.syllabiGetOne.mockResolvedValue({ ...draft, co_authors: [REVIEWER] });
    mocks.loadStandIns.mockResolvedValue([{ stage: 1, user: "proxyproxyproxy" }]);

    await POST(post(), ctx);

    expect(mocks.transition).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ proxyNeeded: false }),
    );
  });

  it("passes the gathered facts to the workflow", async () => {
    mocks.termsGetOne.mockResolvedValue({ id: TERM, open: false });
    mocks.latestVersion.mockResolvedValue(null);
    mocks.missingChainRoles.mockReturnValue(["dean", "vpaa"]);
    mocks.transition.mockReturnValue({ ok: false, error: "nope" });

    await POST(post(), ctx);

    expect(mocks.transition).toHaveBeenCalledWith(draft, {
      type: "submit",
      hasVersion: false,
      termOpen: false,
      missingRoles: ["dean", "vpaa"],
      proxyNeeded: false,
    });
  });

  it.each([
    "Only a draft syllabus can be submitted.",
    "This term is closed for submissions.",
    "Upload a PDF version before submitting.",
    "The review chain is incomplete. No active Dean, VPAA.",
    "The program reviewer is an author of this syllabus. A proxy must be designated first.",
  ])("returns 409 with the workflow's message: %s", async (error) => {
    mocks.transition.mockReturnValue({ ok: false, error });

    const res = await POST(post(), ctx);

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error });
    expect(mocks.batchSend).not.toHaveBeenCalled();
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
    expect(mocks.batchSend).not.toHaveBeenCalled();
  });

  it.each(["coAuthor", "admin"])("returns 403 for %s access", async (access) => {
    mocks.getSyllabusAccess.mockReturnValue(access);
    const res = await POST(post(), ctx);
    expect(res.status).toBe(403);
    expect(mocks.transition).not.toHaveBeenCalled();
    expect(mocks.batchSend).not.toHaveBeenCalled();
  });

  it("returns 403 when the lead is no longer faculty of the program", async () => {
    mocks.activeFacultyAmong.mockResolvedValue(new Set());
    const res = await POST(post(), ctx);
    expect(res.status).toBe(403);
    expect(mocks.batchSend).not.toHaveBeenCalled();
  });

  it("propagates 404 from PocketBase", async () => {
    mocks.syllabiGetOne.mockRejectedValue({ status: 404 });
    const res = await POST(post(), ctx);
    expect(res.status).toBe(404);
  });

  it("delegates batch errors", async () => {
    mocks.batchSend.mockRejectedValue({ status: 400 });
    const res = await POST(post(), ctx);
    expect(res.status).toBe(400);
  });
});
