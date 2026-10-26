import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  referencesGetList: vi.fn(),
  referencesCreate: vi.fn(),
  syllabiGetOne: vi.fn(),
  syllabiGetList: vi.fn(),
  termsGetOne: vi.fn(),
  parseSyllabusReferenceInput: vi.fn(),
  isReferenceStatus: vi.fn((value: unknown) => value === "pending"),
  isListedForProgram: vi.fn(),
  isNotUniqueError: vi.fn(),
  findLiveReference: vi.fn(),
  toSyllabusReferenceResponse: vi.fn((record: Record<string, unknown>) => ({
    ...record,
    mapped: true,
  })),
}));

vi.mock("@/lib/pocketbase", async () => {
  const { NextResponse } = await import("next/server");
  const collections: Record<string, unknown> = {
    syllabus_references: {
      getList: mocks.referencesGetList,
      create: mocks.referencesCreate,
    },
    syllabi: { getOne: mocks.syllabiGetOne, getList: mocks.syllabiGetList },
    terms: { getOne: mocks.termsGetOne },
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

vi.mock("@/lib/validators/syllabus-reference", () => ({
  parseSyllabusReferenceInput: mocks.parseSyllabusReferenceInput,
  isReferenceStatus: mocks.isReferenceStatus,
}));
vi.mock("@/lib/syllabus", () => ({
  anyOf: (_pb: unknown, field: string, values: string[]) =>
    `(${values.map((v) => `${field} = "${v}"`).join(" || ")})`,
  isListedForProgram: mocks.isListedForProgram,
  isNotUniqueError: mocks.isNotUniqueError,
}));
vi.mock("@/lib/syllabus-reference", () => ({
  REFERENCE_EXPAND: "expand-all",
  findLiveReference: mocks.findLiveReference,
  toSyllabusReferenceResponse: mocks.toSyllabusReferenceResponse,
}));

vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);
vi.mock("@/lib/roles", async () =>
  (await import("@/tests/helpers/mock-auth")).rolesModuleMock(),
);

import { GET, POST } from "@/app/api/syllabus-reference/route";
import { createAdminPb } from "@/lib/pocketbase";
import { mockAuth } from "@/tests/helpers/mock-auth";

const ME = "me1me1me1me1me1";
const PROGRAM = "prgBprgBprgBprg";
const SOURCE_PROGRAM = "prgAprgAprgAprg";
const SOURCE = "sylsylsylsylsyl";
const COURSE = "crscrscrscrscrs";
const TERM = "trmtrmtrmtrmtrm";
const SCOPE = { programId: PROGRAM };
const input = { syllabus: SOURCE, program: PROGRAM, note: "same" };
const source = { id: SOURCE, course: COURSE, term: TERM, program: SOURCE_PROGRAM };
const term = { id: TERM, school_year: "sy0sy0sy0sy0sy0", semester: "Summer" };

function get(query = "") {
  return new NextRequest(`http://localhost/api/syllabus-reference${query}`);
}

function post(body: unknown) {
  return new NextRequest("http://localhost/api/syllabus-reference", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth({ id: ME, roles: { chairOfPrograms: [PROGRAM] }, scope: SCOPE });
});

describe("GET /api/syllabus-reference", () => {
  beforeEach(() => {
    mocks.referencesGetList.mockResolvedValue({
      page: 1,
      perPage: 30,
      totalItems: 1,
      totalPages: 1,
      items: [{ id: "refrefrefrefref" }],
    });
  });

  it("shows a chair their programs' references and ones to syllabi they lead", async () => {
    const res = await GET(get());

    expect(res.status).toBe(200);
    expect(mocks.referencesGetList).toHaveBeenCalledWith(1, 30, {
      sort: "-created",
      expand: "expand-all",
      filter: `(syllabus.lead = "${ME}" || (program = "${PROGRAM}"))`,
    });
    expect((await res.json()).items).toEqual([
      { id: "refrefrefrefref", mapped: true },
    ]);
  });

  it("shows a non-chair only references to syllabi they lead", async () => {
    mockAuth({ id: ME });
    await GET(get());
    expect(mocks.referencesGetList.mock.calls[0][2].filter).toBe(
      `syllabus.lead = "${ME}"`,
    );
  });

  it("shows an admin everything", async () => {
    mockAuth({ id: ME, isAdmin: true });
    await GET(get());
    expect(mocks.referencesGetList.mock.calls[0][2]).not.toHaveProperty(
      "filter",
    );
  });

  it("applies filters and clamps paging", async () => {
    await GET(
      get(`?page=3&perPage=0&search=GE&program=${PROGRAM}&syllabus=${SOURCE}&status=pending`),
    );
    expect(mocks.referencesGetList).toHaveBeenCalledWith(3, 30, {
      sort: "-created",
      expand: "expand-all",
      filter: [
        `(syllabus.lead = "${ME}" || (program = "${PROGRAM}"))`,
        '(course.code ~ "GE" || course.title ~ "GE" || program.code ~ "GE" || syllabus.program.code ~ "GE")',
        `program = "${PROGRAM}"`,
        `syllabus = "${SOURCE}"`,
        'status = "pending"',
      ].join(" && "),
    });
  });

  it("returns 401 when signed out", async () => {
    mockAuth({ signedIn: false });
    const res = await GET(get());
    expect(res.status).toBe(401);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("delegates PocketBase errors", async () => {
    mocks.referencesGetList.mockRejectedValue({ status: 400 });
    const res = await GET(get());
    expect(res.status).toBe(400);
  });
});

describe("POST /api/syllabus-reference", () => {
  beforeEach(() => {
    mocks.parseSyllabusReferenceInput.mockReturnValue({ ok: true, data: input });
    mocks.syllabiGetOne.mockResolvedValue(source);
    mocks.termsGetOne.mockResolvedValue(term);
    mocks.isListedForProgram.mockResolvedValue(true);
    mocks.syllabiGetList.mockResolvedValue({ items: [] });
    mocks.findLiveReference.mockResolvedValue(null);
    mocks.referencesCreate.mockImplementation(async (data: object) => ({
      id: "newnewnewnewnew",
      ...data,
    }));
  });

  it("creates a pending reference with course and term copied from the source", async () => {
    const res = await POST(post(input));

    expect(res.status).toBe(201);
    expect(mocks.referencesCreate).toHaveBeenCalledWith(
      {
        syllabus: SOURCE,
        program: PROGRAM,
        course: COURSE,
        term: TERM,
        requested_by: ME,
        note: "same",
        status: "pending",
      },
      { expand: "expand-all" },
    );
    expect(await res.json()).toMatchObject({ id: "newnewnewnewnew", mapped: true });
    expect(mocks.isListedForProgram).toHaveBeenCalledWith(
      expect.anything(),
      COURSE,
      term,
      PROGRAM,
    );
    expect(mocks.findLiveReference).toHaveBeenCalledWith(expect.anything(), {
      program: PROGRAM,
      course: COURSE,
      term: TERM,
    });
  });

  it("returns 400 with the validator's error", async () => {
    mocks.parseSyllabusReferenceInput.mockReturnValue({ ok: false, error: "bad" });
    const res = await POST(post({}));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "bad" });
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("passes malformed JSON to the validator as null", async () => {
    mocks.parseSyllabusReferenceInput.mockReturnValue({ ok: false, error: "bad" });
    await POST(post("{oops"));
    expect(mocks.parseSyllabusReferenceInput).toHaveBeenCalledWith(null);
  });

  it("returns 401 when signed out", async () => {
    mockAuth({ signedIn: false });
    const res = await POST(post(input));
    expect(res.status).toBe(401);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("returns 403 for a chair of another program, touching nothing", async () => {
    mockAuth({ id: ME, roles: { chairOfPrograms: ["otherotherother"] }, scope: SCOPE });
    const res = await POST(post(input));
    expect(res.status).toBe(403);
    expect(createAdminPb).not.toHaveBeenCalled();
  });

  it("lets an admin request for any program", async () => {
    mockAuth({ id: ME, isAdmin: true, scope: SCOPE });
    const res = await POST(post(input));
    expect(res.status).toBe(201);
  });

  it("propagates 404 for a missing source", async () => {
    mocks.syllabiGetOne.mockRejectedValue({ status: 404 });
    const res = await POST(post(input));
    expect(res.status).toBe(404);
  });

  it("returns 409 when the source belongs to the same program", async () => {
    mocks.syllabiGetOne.mockResolvedValue({ ...source, program: PROGRAM });
    const res = await POST(post(input));
    expect(res.status).toBe(409);
    expect(mocks.referencesCreate).not.toHaveBeenCalled();
  });

  it("returns 409 when the course isn't in the program's prospectus for the term", async () => {
    mocks.isListedForProgram.mockResolvedValue(false);
    const res = await POST(post(input));
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/published prospectus/);
    expect(mocks.referencesCreate).not.toHaveBeenCalled();
  });

  it("returns 409 when the program already has its own syllabus", async () => {
    mocks.syllabiGetList.mockResolvedValue({ items: [{ id: "ownownownownown" }] });
    const res = await POST(post(input));
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/its own syllabus/);
    expect(mocks.syllabiGetList).toHaveBeenCalledWith(1, 1, {
      skipTotal: true,
      fields: "id",
      filter: `course = "${COURSE}" && term = "${TERM}" && program = "${PROGRAM}"`,
    });
    expect(mocks.referencesCreate).not.toHaveBeenCalled();
  });

  it("returns 409 when a live reference already exists", async () => {
    mocks.findLiveReference.mockResolvedValue({ status: "pending" });
    const res = await POST(post(input));
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/pending reference/);
    expect(mocks.referencesCreate).not.toHaveBeenCalled();
  });

  it("returns 409 when the unique index catches a race", async () => {
    const race = { status: 400 };
    mocks.referencesCreate.mockRejectedValue(race);
    mocks.isNotUniqueError.mockReturnValue(true);
    const res = await POST(post(input));
    expect(res.status).toBe(409);
    expect(mocks.isNotUniqueError).toHaveBeenCalledWith(race, "program");
  });

  it("delegates other create errors", async () => {
    mocks.referencesCreate.mockRejectedValue({ status: 400 });
    mocks.isNotUniqueError.mockReturnValue(false);
    const res = await POST(post(input));
    expect(res.status).toBe(400);
  });
});
