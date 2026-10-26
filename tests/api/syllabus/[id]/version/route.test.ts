import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  syllabiGetOne: vi.fn(),
  termsGetOne: vi.fn(),
  versionsGetList: vi.fn(),
  versionsCreate: vi.fn(),
  parseSyllabusVersionInput: vi.fn(),
  checkPdfUpload: vi.fn(),
  activeFacultyAmong: vi.fn(),
  getSyllabusAccess: vi.fn(),
  isNotUniqueError: vi.fn(),
  latestVersionNo: vi.fn(),
  toSyllabusVersionResponse: vi.fn((record: Record<string, unknown>) => ({
    ...record,
    mapped: true,
  })),
}));

vi.mock("@/lib/pocketbase", async () => {
  const { NextResponse } = await import("next/server");
  const collections: Record<string, unknown> = {
    syllabi: { getOne: mocks.syllabiGetOne },
    terms: { getOne: mocks.termsGetOne },
    syllabus_versions: {
      getList: mocks.versionsGetList,
      create: mocks.versionsCreate,
    },
  };
  return {
    createAdminPb: vi.fn(async () => ({
      filter: (expr: string, params: Record<string, unknown>) =>
        expr.replace(/\{:(\w+)\}/g, (_, key) => JSON.stringify(params[key])),
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

vi.mock("@/lib/validators/syllabus", () => ({
  parseSyllabusVersionInput: mocks.parseSyllabusVersionInput,
}));
vi.mock("@/lib/pdf", () => ({ checkPdfUpload: mocks.checkPdfUpload }));
vi.mock("@/lib/syllabus", () => ({
  activeFacultyAmong: mocks.activeFacultyAmong,
  getSyllabusAccess: mocks.getSyllabusAccess,
  isNotUniqueError: mocks.isNotUniqueError,
  // Reads also admit referencers; the stub answers with the same value.
  resolveSyllabusAccess: vi.fn(async () => mocks.getSyllabusAccess()),
}));
vi.mock("@/lib/syllabus-version", () => ({
  SYLLABUS_VERSION_EXPAND: "uploaded_by",
  latestVersionNo: mocks.latestVersionNo,
  toSyllabusVersionResponse: mocks.toSyllabusVersionResponse,
}));

vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);
vi.mock("@/lib/roles", async () =>
  (await import("@/tests/helpers/mock-auth")).rolesModuleMock(),
);

import { GET, POST } from "@/app/api/syllabus/[id]/version/route";
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
};
const file = new File(["%PDF-1.7"], "s.pdf", { type: "application/pdf" });

function upload(fields: Record<string, string | File> = { file, notes: "v" }) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.append(key, value);
  return new NextRequest(`http://localhost/api/syllabus/${ID}/version`, {
    method: "POST",
    body: form,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ id: ME, roles: { facultyOfPrograms: [PROGRAM] } });
  mocks.syllabiGetOne.mockResolvedValue(draft);
  mocks.getSyllabusAccess.mockReturnValue("lead");
});

describe("GET /api/syllabus/:id/version", () => {
  beforeEach(() => {
    mocks.versionsGetList.mockResolvedValue({
      page: 1,
      perPage: 30,
      totalItems: 1,
      totalPages: 1,
      items: [{ id: "ververververver", version_no: 1 }],
    });
  });

  it.each(["lead", "coAuthor", "admin", "referencer"])(
    "lists versions newest first for %s access",
    async (access) => {
      mocks.getSyllabusAccess.mockReturnValue(access);

      const res = await GET(
        new NextRequest(`http://localhost/api/syllabus/${ID}/version`),
        ctx,
      );

      expect(res.status).toBe(200);
      expect(mocks.versionsGetList).toHaveBeenCalledWith(1, 30, {
        sort: "-version_no",
        expand: "uploaded_by",
        filter: `syllabus = "${ID}"`,
      });
      expect((await res.json()).items).toEqual([
        { id: "ververververver", version_no: 1, mapped: true },
      ]);
    },
  );

  it("clamps paging", async () => {
    await GET(
      new NextRequest(
        `http://localhost/api/syllabus/${ID}/version?page=-1&perPage=1000`,
      ),
      ctx,
    );
    expect(mocks.versionsGetList.mock.calls[0].slice(0, 2)).toEqual([1, 100]);
  });

  it("answers 404 when the caller has no access", async () => {
    mocks.getSyllabusAccess.mockReturnValue(null);
    const res = await GET(
      new NextRequest(`http://localhost/api/syllabus/${ID}/version`),
      ctx,
    );
    expect(res.status).toBe(404);
    expect(mocks.versionsGetList).not.toHaveBeenCalled();
  });

  it("returns 401 when signed out", async () => {
    mockAuth({ signedIn: false });
    const res = await GET(
      new NextRequest(`http://localhost/api/syllabus/${ID}/version`),
      ctx,
    );
    expect(res.status).toBe(401);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("propagates 404 from PocketBase", async () => {
    mocks.syllabiGetOne.mockRejectedValue({ status: 404 });
    const res = await GET(
      new NextRequest(`http://localhost/api/syllabus/${ID}/version`),
      ctx,
    );
    expect(res.status).toBe(404);
  });
});

describe("POST /api/syllabus/:id/version", () => {
  beforeEach(() => {
    mocks.parseSyllabusVersionInput.mockReturnValue({
      ok: true,
      data: { notes: "v" },
    });
    mocks.checkPdfUpload.mockImplementation(async (value: unknown) => ({
      ok: true,
      file: value,
    }));
    mocks.termsGetOne.mockResolvedValue({ id: TERM, open: true });
    mocks.activeFacultyAmong.mockResolvedValue(new Set([ME]));
    mocks.latestVersionNo.mockResolvedValue(2);
    mocks.versionsCreate.mockImplementation(async (data: object) => ({
      id: "newnewnewnewnew",
      ...data,
    }));
  });

  it("stores the next version number", async () => {
    const res = await POST(upload(), ctx);

    expect(res.status).toBe(201);
    expect(mocks.versionsCreate).toHaveBeenCalledWith(
      {
        syllabus: ID,
        version_no: 3,
        file: expect.any(File),
        uploaded_by: ME,
        notes: "v",
      },
      { expand: "uploaded_by" },
    );
    expect(await res.json()).toMatchObject({ version_no: 3, mapped: true });
    expect(mocks.parseSyllabusVersionInput).toHaveBeenCalledWith({ notes: "v" });
    expect(mocks.activeFacultyAmong).toHaveBeenCalledWith(
      expect.anything(),
      PROGRAM,
      [ME],
    );
  });

  it("passes a missing notes field as null", async () => {
    await POST(upload({ file }), ctx);
    expect(mocks.parseSyllabusVersionInput).toHaveBeenCalledWith({
      notes: null,
    });
  });

  it("returns 400 for a body that isn't multipart", async () => {
    const res = await POST(
      new NextRequest(`http://localhost/api/syllabus/${ID}/version`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      }),
      ctx,
    );
    expect(res.status).toBe(400);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("returns 400 with the notes validator's error", async () => {
    mocks.parseSyllabusVersionInput.mockReturnValue({ ok: false, error: "bad" });
    const res = await POST(upload(), ctx);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "bad" });
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("returns 400 with the PDF check's error before touching PocketBase", async () => {
    mocks.checkPdfUpload.mockResolvedValue({
      ok: false,
      error: "The file is not a valid PDF",
    });
    const res = await POST(upload(), ctx);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "The file is not a valid PDF" });
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("returns 401 when signed out", async () => {
    mockAuth({ signedIn: false });
    const res = await POST(upload(), ctx);
    expect(res.status).toBe(401);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("answers 404 when the caller has no access", async () => {
    mocks.getSyllabusAccess.mockReturnValue(null);
    const res = await POST(upload(), ctx);
    expect(res.status).toBe(404);
    expect(mocks.versionsCreate).not.toHaveBeenCalled();
  });

  it.each(["coAuthor", "admin", "referencer"])("returns 403 for %s access", async (access) => {
    mocks.getSyllabusAccess.mockReturnValue(access);
    const res = await POST(upload(), ctx);
    expect(res.status).toBe(403);
    expect(mocks.versionsCreate).not.toHaveBeenCalled();
  });

  it("returns 409 once submitted", async () => {
    mocks.syllabiGetOne.mockResolvedValue({ ...draft, status: "submitted" });
    const res = await POST(upload(), ctx);
    expect(res.status).toBe(409);
    expect(mocks.versionsCreate).not.toHaveBeenCalled();
  });

  it("returns 409 when the term is closed", async () => {
    mocks.termsGetOne.mockResolvedValue({ id: TERM, open: false });
    const res = await POST(upload(), ctx);
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      error: "This term is closed for submissions.",
    });
    expect(mocks.versionsCreate).not.toHaveBeenCalled();
  });

  it("returns 403 when the lead is no longer faculty of the program", async () => {
    mocks.activeFacultyAmong.mockResolvedValue(new Set());
    const res = await POST(upload(), ctx);
    expect(res.status).toBe(403);
    expect(mocks.versionsCreate).not.toHaveBeenCalled();
  });

  it("returns 409 when a concurrent upload took the number", async () => {
    const race = { status: 400 };
    mocks.versionsCreate.mockRejectedValue(race);
    mocks.isNotUniqueError.mockReturnValue(true);
    const res = await POST(upload(), ctx);
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      error: "Another upload finished first. Please try again.",
    });
    expect(mocks.isNotUniqueError).toHaveBeenCalledWith(race, "version_no");
  });

  it("delegates other create errors", async () => {
    mocks.versionsCreate.mockRejectedValue({ status: 400 });
    mocks.isNotUniqueError.mockReturnValue(false);
    const res = await POST(upload(), ctx);
    expect(res.status).toBe(400);
  });

  it("propagates 404 from PocketBase", async () => {
    mocks.syllabiGetOne.mockRejectedValue({ status: 404 });
    const res = await POST(upload(), ctx);
    expect(res.status).toBe(404);
  });
});
