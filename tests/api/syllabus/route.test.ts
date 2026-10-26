import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  syllabiGetList: vi.fn(),
  syllabiCreate: vi.fn(),
  termsGetOne: vi.fn(),
  coursesGetOne: vi.fn(),
  programsGetOne: vi.fn(),
  parseSyllabusInput: vi.fn(),
  isSyllabusStatus: vi.fn(
    (value: unknown) => value === "draft" || value === "submitted",
  ),
  activeFacultyAmong: vi.fn(),
  isListedForProgram: vi.fn(),
  isNotUniqueError: vi.fn(),
  listReferencedSyllabusIds: vi.fn(),
  findLiveReference: vi.fn(),
  getSyllabusAccess: vi.fn(),
  toSyllabusResponse: vi.fn((record: Record<string, unknown>, access?: string) => ({
    ...record,
    access,
    mapped: true,
  })),
}));

vi.mock("@/lib/pocketbase", async () => {
  const { NextResponse } = await import("next/server");
  const collections: Record<string, unknown> = {
    syllabi: { getList: mocks.syllabiGetList, create: mocks.syllabiCreate },
    terms: { getOne: mocks.termsGetOne },
    courses: { getOne: mocks.coursesGetOne },
    programs: { getOne: mocks.programsGetOne },
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
  parseSyllabusInput: mocks.parseSyllabusInput,
  isSyllabusStatus: mocks.isSyllabusStatus,
}));

vi.mock("@/lib/syllabus", () => ({
  SYLLABUS_EXPAND: "course,term.school_year,program,lead,co_authors",
  activeFacultyAmong: mocks.activeFacultyAmong,
  isListedForProgram: mocks.isListedForProgram,
  isNotUniqueError: mocks.isNotUniqueError,
  listReferencedSyllabusIds: mocks.listReferencedSyllabusIds,
  anyOf: (_pb: unknown, field: string, values: string[]) =>
    `(${values.map((v) => `${field} = "${v}"`).join(" || ")})`,
  getSyllabusAccess: mocks.getSyllabusAccess,
  toSyllabusResponse: mocks.toSyllabusResponse,
}));

vi.mock("@/lib/syllabus-reference", () => ({
  findLiveReference: mocks.findLiveReference,
}));

vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);
vi.mock("@/lib/roles", async () =>
  (await import("@/tests/helpers/mock-auth")).rolesModuleMock(),
);

import { GET, POST } from "@/app/api/syllabus/route";
import { createAdminPb } from "@/lib/pocketbase";
import { mockAuth } from "@/tests/helpers/mock-auth";

const ME = "me1me1me1me1me1";
const COURSE = "crs123crs123crs";
const TERM = "trm123trm123trm";
const PROGRAM = "prg123prg123prg";
const input = { course: COURSE, term: TERM, program: PROGRAM };
const openTerm = {
  id: TERM,
  school_year: "sy0123sy0123sy0",
  semester: "First Semester",
  open: true,
};

function get(query = "") {
  return new NextRequest(`http://localhost/api/syllabus${query}`);
}

function post(body: unknown) {
  return new NextRequest("http://localhost/api/syllabus", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ id: ME, roles: { facultyOfPrograms: [PROGRAM] } });
});

describe("GET /api/syllabus", () => {
  beforeEach(() => {
    mocks.syllabiGetList.mockResolvedValue({
      page: 1,
      perPage: 30,
      totalItems: 1,
      totalPages: 1,
      items: [{ id: "sylsylsylsylsyl", lead: ME, co_authors: [] }],
    });
    mocks.getSyllabusAccess.mockReturnValue("lead");
    mocks.listReferencedSyllabusIds.mockResolvedValue([]);
  });

  it("also lists syllabi the caller's programs reference, marked referencer", async () => {
    mocks.listReferencedSyllabusIds.mockResolvedValue(["refrefrefrefref"]);
    mocks.syllabiGetList.mockResolvedValue({
      page: 1,
      perPage: 30,
      totalItems: 1,
      totalPages: 1,
      items: [{ id: "refrefrefrefref", lead: "other", co_authors: [] }],
    });
    mocks.getSyllabusAccess.mockReturnValue(null);

    const res = await GET(get());

    expect(mocks.listReferencedSyllabusIds).toHaveBeenCalledWith(
      expect.anything(),
      [PROGRAM],
    );
    expect(mocks.syllabiGetList.mock.calls[0][2].filter).toBe(
      `(lead = "${ME}" || co_authors ?= "${ME}" || (id = "refrefrefrefref"))`,
    );
    expect((await res.json()).items[0].access).toBe("referencer");
  });

  it("limits a non-admin to syllabi they lead or co-author", async () => {
    const res = await GET(get());

    expect(res.status).toBe(200);
    expect(mocks.syllabiGetList).toHaveBeenCalledWith(1, 30, {
      sort: "-updated",
      expand: "course,term.school_year,program,lead,co_authors",
      filter: `(lead = "${ME}" || co_authors ?= "${ME}")`,
    });
    const body = await res.json();
    expect(body.items).toEqual([
      {
        id: "sylsylsylsylsyl",
        lead: ME,
        co_authors: [],
        access: "lead",
        mapped: true,
      },
    ]);
  });

  it("lets an admin see all syllabi", async () => {
    mockAuth({ id: ME, isAdmin: true });
    mocks.getSyllabusAccess.mockReturnValue("admin");

    await GET(get());

    expect(mocks.syllabiGetList).toHaveBeenCalledWith(1, 30, {
      sort: "-updated",
      expand: "course,term.school_year,program,lead,co_authors",
    });
    expect(mocks.listReferencedSyllabusIds).not.toHaveBeenCalled();
  });

  it("applies search, term, program and status filters and clamps paging", async () => {
    await GET(
      get(
        `?page=2&perPage=500&search=IT&term=${TERM}&program=${PROGRAM}&status=draft`,
      ),
    );

    expect(mocks.syllabiGetList).toHaveBeenCalledWith(2, 100, {
      sort: "-updated",
      expand: "course,term.school_year,program,lead,co_authors",
      filter: [
        `(lead = "${ME}" || co_authors ?= "${ME}")`,
        '(course.code ~ "IT" || course.title ~ "IT" || program.code ~ "IT")',
        `term = "${TERM}"`,
        `program = "${PROGRAM}"`,
        'status = "draft"',
      ].join(" && "),
    });
  });

  it("ignores an unknown status", async () => {
    await GET(get("?status=approved"));
    expect(mocks.syllabiGetList.mock.calls[0][2].filter).not.toContain(
      "status",
    );
  });

  it("returns 401 when signed out", async () => {
    mockAuth({ signedIn: false });
    const res = await GET(get());
    expect(res.status).toBe(401);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("delegates PocketBase errors", async () => {
    mocks.syllabiGetList.mockRejectedValue({ status: 400 });
    const res = await GET(get());
    expect(res.status).toBe(400);
  });
});

describe("POST /api/syllabus", () => {
  beforeEach(() => {
    mocks.parseSyllabusInput.mockReturnValue({ ok: true, data: input });
    mocks.termsGetOne.mockResolvedValue(openTerm);
    mocks.coursesGetOne.mockResolvedValue({ id: COURSE });
    mocks.programsGetOne.mockResolvedValue({ id: PROGRAM });
    mocks.activeFacultyAmong.mockResolvedValue(new Set([ME]));
    mocks.isListedForProgram.mockResolvedValue(true);
    mocks.syllabiGetList.mockResolvedValue({ items: [] });
    mocks.findLiveReference.mockResolvedValue(null);
    mocks.syllabiCreate.mockImplementation(async (data: object) => ({
      id: "newnewnewnewnew",
      ...data,
    }));
  });

  it("creates a draft led by the caller", async () => {
    const res = await POST(post(input));

    expect(res.status).toBe(201);
    expect(mocks.syllabiCreate).toHaveBeenCalledWith(
      {
        course: COURSE,
        term: TERM,
        program: PROGRAM,
        lead: ME,
        co_authors: [],
        status: "draft",
        stage: 0,
      },
      { expand: "course,term.school_year,program,lead,co_authors" },
    );
    expect(await res.json()).toMatchObject({
      id: "newnewnewnewnew",
      access: "lead",
      mapped: true,
    });
    expect(mocks.activeFacultyAmong).toHaveBeenCalledWith(
      expect.anything(),
      PROGRAM,
      [ME],
    );
    expect(mocks.isListedForProgram).toHaveBeenCalledWith(
      expect.anything(),
      COURSE,
      openTerm,
      PROGRAM,
    );
  });

  it("returns 400 with the validator's error", async () => {
    mocks.parseSyllabusInput.mockReturnValue({ ok: false, error: "bad" });
    const res = await POST(post({}));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "bad" });
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("passes malformed JSON to the validator as null", async () => {
    mocks.parseSyllabusInput.mockReturnValue({ ok: false, error: "bad" });
    await POST(post("{not json"));
    expect(mocks.parseSyllabusInput).toHaveBeenCalledWith(null);
  });

  it("returns 401 when signed out", async () => {
    mockAuth({ signedIn: false });
    const res = await POST(post(input));
    expect(res.status).toBe(401);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("propagates 404 for a missing term, course or program", async () => {
    mocks.coursesGetOne.mockRejectedValue({ status: 404 });
    const res = await POST(post(input));
    expect(res.status).toBe(404);
    expect(mocks.syllabiCreate).not.toHaveBeenCalled();
  });

  it("returns 409 when the term is closed", async () => {
    mocks.termsGetOne.mockResolvedValue({ ...openTerm, open: false });
    const res = await POST(post(input));
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      error: "This term is closed for submissions.",
    });
    expect(mocks.syllabiCreate).not.toHaveBeenCalled();
  });

  it("returns 403 when the caller is not active faculty of the program", async () => {
    mocks.activeFacultyAmong.mockResolvedValue(new Set());
    const res = await POST(post(input));
    expect(res.status).toBe(403);
    expect(mocks.syllabiCreate).not.toHaveBeenCalled();
  });

  it("returns 403 for an admin who is not faculty of the program", async () => {
    mockAuth({ id: ME, isAdmin: true });
    mocks.activeFacultyAmong.mockResolvedValue(new Set());
    const res = await POST(post(input));
    expect(res.status).toBe(403);
  });

  it("returns 409 when the course isn't listed for the program and term", async () => {
    mocks.isListedForProgram.mockResolvedValue(false);
    const res = await POST(post(input));
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/published prospectus/);
    expect(mocks.syllabiCreate).not.toHaveBeenCalled();
  });

  it("returns 409 naming the lead when the program already has one", async () => {
    mocks.syllabiGetList.mockResolvedValue({
      items: [{ id: "oldoldoldoldold", expand: { lead: { name: "Ana" } } }],
    });
    const res = await POST(post(input));
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe(
      "This program already has a syllabus for this course and term, led by Ana. Ask them to add you as a co-author.",
    );
    expect(mocks.syllabiGetList).toHaveBeenCalledWith(1, 1, {
      skipTotal: true,
      expand: "lead",
      filter: `course = "${COURSE}" && term = "${TERM}" && program = "${PROGRAM}"`,
    });
    expect(mocks.syllabiCreate).not.toHaveBeenCalled();
  });

  it.each([
    ["pending", "has a pending request to reference BSIT's"],
    ["approved", "references BSIT's"],
  ])(
    "returns 409 while the program has a %s reference for the slot",
    async (status, phrase) => {
      mocks.findLiveReference.mockResolvedValue({
        status,
        expand: { syllabus: { expand: { program: { code: "BSIT" } } } },
      });
      const res = await POST(post(input));
      expect(res.status).toBe(409);
      expect((await res.json()).error).toContain(phrase);
      expect(mocks.findLiveReference).toHaveBeenCalledWith(expect.anything(), {
        program: PROGRAM,
        course: COURSE,
        term: TERM,
      });
      expect(mocks.syllabiCreate).not.toHaveBeenCalled();
    },
  );

  it("returns 409 when the unique index catches a race", async () => {
    const race = { status: 400, response: { data: { course: { code: "validation_not_unique" } } } };
    mocks.syllabiCreate.mockRejectedValue(race);
    mocks.isNotUniqueError.mockReturnValue(true);
    const res = await POST(post(input));
    expect(res.status).toBe(409);
    expect(mocks.isNotUniqueError).toHaveBeenCalledWith(race, "course");
  });

  it("delegates other create errors", async () => {
    mocks.syllabiCreate.mockRejectedValue({ status: 400 });
    mocks.isNotUniqueError.mockReturnValue(false);
    const res = await POST(post(input));
    expect(res.status).toBe(400);
  });
});
