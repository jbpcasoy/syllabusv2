import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getOne: vi.fn(),
  update: vi.fn(),
  activeFacultyAmong: vi.fn(),
  resolveSyllabusAccess: vi.fn(),
  parseLeadTransfer: vi.fn(),
}));

vi.mock("@/lib/pocketbase", async () => {
  const { NextResponse } = await import("next/server");
  const collection = () => ({ getOne: mocks.getOne, update: mocks.update });
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
  SYLLABUS_EXPAND: "course,term.school_year,program,lead,co_authors",
  activeFacultyAmong: mocks.activeFacultyAmong,
  resolveSyllabusAccess: mocks.resolveSyllabusAccess,
  toSyllabusResponse: (record: object) => ({ ...record, mapped: true }),
}));
vi.mock("@/lib/validators/lead-transfer", () => ({
  parseLeadTransfer: mocks.parseLeadTransfer,
}));
vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);
vi.mock("@/lib/roles", async () =>
  (await import("@/tests/helpers/mock-auth")).rolesModuleMock(),
);
vi.mock("@/lib/capabilities", async () =>
  (await import("@/tests/helpers/mock-auth")).capabilitiesModuleMock(),
);

import { PUT } from "@/app/api/syllabus/[id]/lead/route";
import { createAdminPb } from "@/lib/pocketbase";
import { canMock, mockAuth } from "@/tests/helpers/mock-auth";

const ID = "sylsylsylsylsyl";
const PROGRAM = "prg123prg123prg";
const OLD = "oldleadoldleado";
const NEW = "newleadnewleadn";
const CO = "cocococococococ";
const SCOPE = { programId: PROGRAM };
const ctx = { params: Promise.resolve({ id: ID }) };

const syllabus = (extra: object = {}) => ({
  id: ID,
  program: PROGRAM,
  lead: OLD,
  co_authors: [CO],
  status: "draft",
  ...extra,
});

function put(lead = NEW, keep_previous = true) {
  mocks.parseLeadTransfer.mockReturnValue({ ok: true, data: { lead, keep_previous } });
  return PUT(
    new NextRequest(`http://localhost/api/syllabus/${ID}/lead`, {
      method: "PUT",
      body: JSON.stringify({ lead }),
    }),
    ctx,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ id: "chairchairchair", roles: { chairOfPrograms: [PROGRAM] }, scope: SCOPE });
  mocks.getOne.mockResolvedValue(syllabus());
  mocks.activeFacultyAmong.mockResolvedValue(new Set([NEW]));
  mocks.resolveSyllabusAccess.mockResolvedValue(null);
  mocks.update.mockImplementation(async (_id: string, data: object) => ({
    ...syllabus(),
    ...data,
  }));
});

describe("PUT /api/syllabus/:id/lead", () => {
  it("hands the syllabus over and keeps the previous lead as a co-author", async () => {
    const res = await put();

    expect(res.status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith(
      ID,
      { lead: NEW, co_authors: [CO, OLD] },
      { expand: "course,term.school_year,program,lead,co_authors" },
    );
    expect(canMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: "chairchairchair" }),
      "syllabus.transferLead",
      { program: PROGRAM },
    );
  });

  it("drops the previous lead when asked", async () => {
    await put(NEW, false);
    expect(mocks.update).toHaveBeenCalledWith(
      ID,
      { lead: NEW, co_authors: [CO] },
      expect.anything(),
    );
  });

  it("takes a co-author off the list when they become lead", async () => {
    mocks.activeFacultyAmong.mockResolvedValue(new Set([CO]));
    await put(CO);
    expect(mocks.update).toHaveBeenCalledWith(
      ID,
      { lead: CO, co_authors: [OLD] },
      expect.anything(),
    );
  });

  it("lets an admin transfer", async () => {
    mockAuth({ id: "adminadminadmin", isAdmin: true });
    expect((await put()).status).toBe(200);
  });

  it.each(["submitted", "returned", "approved"])("works while %s", async (status) => {
    mocks.getOne.mockResolvedValue(syllabus({ status }));
    expect((await put()).status).toBe(200);
  });

  it.each([
    ["the syllabus is filed", () => mocks.getOne.mockResolvedValue(syllabus({ status: "filed" })), "A filed syllabus can't change its lead."],
    ["the user is already the lead", () => mocks.activeFacultyAmong.mockResolvedValue(new Set([OLD])), "That user is already the lead."],
    ["the new lead isn't active faculty", () => mocks.activeFacultyAmong.mockResolvedValue(new Set()), "The new lead must be active faculty of the program."],
  ])("returns 409 when %s", async (label, arrange, error) => {
    arrange();
    const res = await put(label.includes("already") ? OLD : NEW);
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("returns 403 to a chair of another program who can see it", async () => {
    mockAuth({ id: "chairchairchair", roles: { chairOfPrograms: ["otherotherother"] } });
    mocks.resolveSyllabusAccess.mockResolvedValue("referencer");
    expect((await put()).status).toBe(403);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("returns 403 to the lead", async () => {
    mockAuth({ id: OLD });
    mocks.resolveSyllabusAccess.mockResolvedValue("lead");
    expect((await put()).status).toBe(403);
  });

  it("answers 404 to an outsider", async () => {
    mockAuth({ id: "strangerstrange" });
    expect((await put()).status).toBe(404);
  });

  it("returns 400 before touching PocketBase", async () => {
    mocks.parseLeadTransfer.mockReturnValue({ ok: false, error: "bad" });
    const res = await PUT(
      new NextRequest(`http://localhost/api/syllabus/${ID}/lead`, {
        method: "PUT",
        body: "{nope",
      }),
      ctx,
    );
    expect(res.status).toBe(400);
    expect(mocks.parseLeadTransfer).toHaveBeenCalledWith(null);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("returns 401 when signed out", async () => {
    mockAuth({ signedIn: false });
    expect((await put()).status).toBe(401);
  });

  it("propagates 404 from PocketBase", async () => {
    mocks.getOne.mockRejectedValue({ status: 404 });
    expect((await put()).status).toBe(404);
  });
});
