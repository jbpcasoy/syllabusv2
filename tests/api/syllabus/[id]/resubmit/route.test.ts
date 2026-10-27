import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  syllabiGetOne: vi.fn(),
  termsGetOne: vi.fn(),
  activeFacultyAmong: vi.fn(),
  getSyllabusAccess: vi.fn(),
  loadChainHolders: vi.fn(),
  loadStandIns: vi.fn(),
  loadFormFacts: vi.fn(),
  lastReturnedVersionId: vi.fn(),
  listForm17Answers: vi.fn(),
  copyForm17: vi.fn(),
  versionsGetOne: vi.fn(),
  batchOps: [] as unknown[][],
  batchSend: vi.fn(),
  latestVersion: vi.fn(),
}));

vi.mock("@/lib/pocketbase", async () => {
  const { NextResponse } = await import("next/server");
  const collections: Record<string, unknown> = {
    syllabi: { getOne: mocks.syllabiGetOne },
    terms: { getOne: mocks.termsGetOne },
    syllabus_versions: { getOne: mocks.versionsGetOne },
  };
  const batch = {
    collection: (name: string) => ({
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
  toSyllabusResponse: (record: object, access?: string) => ({
    ...record,
    access,
    mapped: true,
  }),
}));
vi.mock("@/lib/syllabus-chain", async () => ({
  loadChainHolders: mocks.loadChainHolders,
  loadStandIns: mocks.loadStandIns,
  missingChainRoles: (holders: string[][]) =>
    ["programReviewer", "dean", "fdisChair", "citlDirector", "vpaa"].filter(
      (_, i) => holders[i].length === 0,
    ),
}));
vi.mock("@/lib/syllabus-decision", () => ({
  loadFormFacts: mocks.loadFormFacts,
  lastReturnedVersionId: mocks.lastReturnedVersionId,
}));
vi.mock("@/lib/form17", () => ({
  listForm17Answers: mocks.listForm17Answers,
  copyForm17: mocks.copyForm17,
}));
vi.mock("@/lib/syllabus-version", () => ({
  latestVersion: mocks.latestVersion,
}));
vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);
vi.mock("@/lib/roles", async () =>
  (await import("@/tests/helpers/mock-auth")).rolesModuleMock(),
);

import { POST } from "@/app/api/syllabus/[id]/resubmit/route";
import { createAdminPb } from "@/lib/pocketbase";
import { mockAuth } from "@/tests/helpers/mock-auth";

const ID = "sylsylsylsylsyl";
const ME = "leadleadleadlea";
const PROGRAM = "prg123prg123prg";
const TERM = "trm123trm123trm";
const REVIEWER = "revwrevwrevwrev";
const RETURNED_AT = "2026-10-27 08:00:00.000Z";
const HOLDERS = [[REVIEWER], ["dean"], ["fdis"], ["citl"], ["vpaa"]];
const ctx = { params: Promise.resolve({ id: ID }) };

const returned = {
  id: ID,
  program: PROGRAM,
  term: TERM,
  lead: ME,
  co_authors: [],
  status: "returned",
  stage: 3,
  returned_at: RETURNED_AT,
};

const resubmit = () =>
  POST(
    new NextRequest(`http://localhost/api/syllabus/${ID}/resubmit`, {
      method: "POST",
    }),
    ctx,
  );

const NEW_VERSION = "v3v3v3v3v3v3v3v";
const RETURNED_VERSION = "v2v2v2v2v2v2v2v";

/** The syllabus as loaded first; the reload after the batch returns `after`. */
function loads(before: object, after: object = { ...before, reloaded: true }) {
  mocks.syllabiGetOne.mockImplementation(
    async (_id: string, options?: { expand?: string }) =>
      options?.expand ? after : before,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.batchOps.length = 0;
  mockAuth({ id: ME, roles: { facultyOfPrograms: [PROGRAM] } });
  loads(returned, { ...returned, status: "submitted", stage: 3 });
  mocks.batchSend.mockResolvedValue([]);
  mocks.lastReturnedVersionId.mockResolvedValue(RETURNED_VERSION);
  mocks.listForm17Answers.mockResolvedValue([{ criterion: "A1" }]);
  mocks.versionsGetOne.mockResolvedValue({ form17_suggestions: "More refs." });
  mocks.getSyllabusAccess.mockReturnValue("lead");
  mocks.termsGetOne.mockResolvedValue({ id: TERM, open: true });
  mocks.latestVersion.mockResolvedValue({
    id: NEW_VERSION,
    version_no: 3,
    created: "2026-10-27 09:30:00.000Z",
  });
  mocks.loadChainHolders.mockResolvedValue(HOLDERS);
  mocks.loadStandIns.mockResolvedValue([]);
  mocks.loadFormFacts.mockResolvedValue({ unansweredPoints: 0 });
  mocks.activeFacultyAmong.mockResolvedValue(new Set([ME]));
});

describe("POST /api/syllabus/:id/resubmit", () => {
  it("resumes at the stage that returned it", async () => {
    const res = await resubmit();

    expect(res.status).toBe(200);
    expect(mocks.batchOps).toContainEqual([
      "update",
      "syllabi",
      ID,
      { status: "submitted", stage: 3 },
    ]);
    expect(mocks.batchSend).toHaveBeenCalledTimes(1);
    expect(mocks.syllabiGetOne).toHaveBeenLastCalledWith(ID, {
      expand: "course,term.school_year,program,lead,co_authors",
    });
    expect(await res.json()).toMatchObject({
      status: "submitted",
      stage: 3,
      access: "lead",
    });
  });

  it("checks the forms of the new version", async () => {
    await resubmit();
    expect(mocks.loadFormFacts).toHaveBeenCalledWith(expect.anything(), {
      syllabusId: ID,
      versionId: NEW_VERSION,
      stage: 3,
    });
  });

  it("copies Form 17 from the returned version in the same batch", async () => {
    await resubmit();

    expect(mocks.listForm17Answers).toHaveBeenCalledWith(
      expect.anything(),
      RETURNED_VERSION,
    );
    expect(mocks.copyForm17).toHaveBeenCalledWith(
      expect.anything(),
      { answers: [{ criterion: "A1" }], suggestions: "More refs." },
      NEW_VERSION,
    );
    expect(mocks.copyForm17.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.batchSend.mock.invocationCallOrder[0],
    );
  });

  it("copies nothing when the syllabus was never returned through review", async () => {
    mocks.lastReturnedVersionId.mockResolvedValue(null);
    expect((await resubmit()).status).toBe(200);
    expect(mocks.copyForm17).not.toHaveBeenCalled();
  });

  it("doesn't touch Form 17 when the workflow refuses", async () => {
    mocks.loadFormFacts.mockResolvedValue({ unansweredPoints: 1 });
    await resubmit();
    expect(mocks.lastReturnedVersionId).not.toHaveBeenCalled();
    expect(mocks.batchSend).not.toHaveBeenCalled();
  });

  it.each([
    [
      "no version since the return",
      () =>
        mocks.latestVersion.mockResolvedValue({
          id: "v2",
          version_no: 2,
          created: "2026-10-27 07:00:00.000Z",
        }),
      "Upload a new version before resubmitting.",
    ],
    [
      "no version at all",
      () => mocks.latestVersion.mockResolvedValue(null),
      "Upload a new version before resubmitting.",
    ],
    [
      "unanswered review points",
      () => mocks.loadFormFacts.mockResolvedValue({ unansweredPoints: 2 }),
      "Respond to every open review point before resubmitting.",
    ],
    [
      "a closed term",
      () => mocks.termsGetOne.mockResolvedValue({ id: TERM, open: false }),
      "This term is closed for submissions.",
    ],
    [
      "an incomplete chain",
      () => mocks.loadChainHolders.mockResolvedValue([[REVIEWER], [], ["f"], ["c"], ["v"]]),
      "The review chain is incomplete. No active Dean.",
    ],
    [
      "a conflicted program reviewer without a proxy",
      () =>
        loads({ ...returned, co_authors: [REVIEWER] }),
      "The program reviewer is an author of this syllabus. A proxy must be designated first.",
    ],
  ])("returns 409 with %s", async (_label, arrange, error) => {
    arrange();
    const res = await resubmit();

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error });
    expect(mocks.batchSend).not.toHaveBeenCalled();
  });

  it("returns 409 for a syllabus that isn't returned", async () => {
    loads({ ...returned, status: "submitted" });
    const res = await resubmit();
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      error: "Only a returned syllabus can be resubmitted.",
    });
  });

  it("returns 401 when signed out", async () => {
    mockAuth({ signedIn: false });
    const res = await resubmit();
    expect(res.status).toBe(401);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("answers 404 when the caller has no access", async () => {
    mocks.getSyllabusAccess.mockReturnValue(null);
    const res = await resubmit();
    expect(res.status).toBe(404);
    expect(mocks.batchSend).not.toHaveBeenCalled();
  });

  it.each(["coAuthor", "admin"])("returns 403 for %s access", async (access) => {
    mocks.getSyllabusAccess.mockReturnValue(access);
    const res = await resubmit();
    expect(res.status).toBe(403);
    expect(mocks.loadChainHolders).not.toHaveBeenCalled();
    expect(mocks.batchSend).not.toHaveBeenCalled();
  });

  it("returns 403 when the lead is no longer faculty of the program", async () => {
    mocks.activeFacultyAmong.mockResolvedValue(new Set());
    const res = await resubmit();
    expect(res.status).toBe(403);
    expect(mocks.batchSend).not.toHaveBeenCalled();
  });

  it("propagates 404 from PocketBase", async () => {
    mocks.syllabiGetOne.mockRejectedValue({ status: 404 });
    const res = await resubmit();
    expect(res.status).toBe(404);
  });

  it("delegates batch errors", async () => {
    mocks.batchSend.mockRejectedValue({ status: 400 });
    const res = await resubmit();
    expect(res.status).toBe(400);
  });
});
