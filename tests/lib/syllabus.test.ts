import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const chain = vi.hoisted(() => ({
  loadChainHolders: vi.fn(),
  loadStandIns: vi.fn(),
}));
vi.mock("@/lib/syllabus-chain", () => chain);

import { NO_ROLES } from "@/types/roles";
import {
  activeFacultyAmong,
  getSyllabusAccess,
  isListedForProgram,
  isNotUniqueError,
  listAvailable,
  listCoAuthorCandidates,
  listReferencedSyllabusIds,
  resolveSyllabusAccess,
  toSyllabusResponse,
} from "@/lib/syllabus";
import type { Syllabus } from "@/types/syllabus";
import type PocketBase from "pocketbase";

const LEAD = "leadleadleadlea";
const CO = "cocococococococ";
const OTHER = "othrothrothroth";

/** Substitutes params like the real SDK so assertions read naturally. */
const filter = (expr: string, params: Record<string, unknown> = {}) =>
  expr.replace(/\{:(\w+)\}/g, (_, key) => JSON.stringify(params[key]));

type Handlers = Record<string, Record<string, ReturnType<typeof vi.fn>>>;

function fakePb(handlers: Handlers) {
  const pb = {
    filter: vi.fn(filter),
    collection: vi.fn((name: string) => {
      const h = handlers[name];
      if (!h) throw new Error(`unexpected collection ${name}`);
      return h;
    }),
  };
  return pb as unknown as PocketBase;
}

const record = {
  id: "sylsylsylsylsyl",
  collectionId: "pbc_1800000005",
  collectionName: "syllabi",
  course: "crs123crs123crs",
  term: "trm123trm123trm",
  program: "prg123prg123prg",
  lead: LEAD,
  co_authors: [CO],
  status: "draft",
  stage: 0,
  submitted_at: "",
  ref_seq: 0,
  returned_at: "",
  based_on: "",
  created: "2026-10-26 08:00:00.000Z",
  updated: "2026-10-26 08:00:00.000Z",
} as Syllabus;

describe("toSyllabusResponse", () => {
  it("maps expanded relations to safe shapes", () => {
    const response = toSyllabusResponse(
      {
        ...record,
        expand: {
          course: { id: "crs123crs123crs", code: "IT 101", title: "Intro" },
          term: {
            id: "trm123trm123trm",
            semester: "First Semester",
            submission_deadline: "2026-12-01 00:00:00.000Z",
            review_days: 3,
            expand: { school_year: { label: "2026-2027" } },
          },
          program: { id: "prg123prg123prg", name: "BSIT", code: "IT" },
          lead: {
            id: LEAD,
            name: "Ana",
            email: "ana@buksu.edu.ph",
            isAdmin: true,
            tokenKey: "secret",
          },
          co_authors: [{ id: CO, name: "Ben", email: "ben@buksu.edu.ph" }],
        },
      } as unknown as Syllabus,
      "lead",
    );

    expect(response.access).toBe("lead");
    expect(response.expand).toEqual({
      course: { id: "crs123crs123crs", code: "IT 101", title: "Intro" },
      term: {
        id: "trm123trm123trm",
        semester: "First Semester",
        school_year_label: "2026-2027",
        // Only the day of the deadline, plus the review limit, for the badges.
        submission_deadline: "2026-12-01",
        review_days: 3,
      },
      program: { id: "prg123prg123prg", name: "BSIT", code: "IT" },
      lead: { id: LEAD, name: "Ana", email: "ana@buksu.edu.ph" },
      co_authors: [{ id: CO, name: "Ben", email: "ben@buksu.edu.ph" }],
    });
    expect(JSON.stringify(response)).not.toContain("secret");
  });

  it("omits access and expand entries that are missing", () => {
    const response = toSyllabusResponse(record);
    expect(response).not.toHaveProperty("access");
    expect(response.expand).toEqual({});
  });
});

describe("isNotUniqueError", () => {
  it("matches PocketBase's unique-index rejection of the field", () => {
    const error = {
      status: 400,
      response: { data: { course: { code: "validation_not_unique" } } },
    };
    expect(isNotUniqueError(error, "course")).toBe(true);
    expect(isNotUniqueError(error, "term")).toBe(false);
  });

  it.each([
    ["other validation code", { response: { data: { course: { code: "validation_required" } } } }],
    ["no data", { status: 500 }],
    ["null", null],
  ])("is false for %s", (_label, error) => {
    expect(isNotUniqueError(error, "course")).toBe(false);
  });
});

describe("getSyllabusAccess", () => {
  const syllabus = { lead: LEAD, co_authors: [CO] };

  it.each([
    ["lead", LEAD, false, "lead"],
    ["lead who is also admin", LEAD, true, "lead"],
    ["co-author", CO, false, "coAuthor"],
    ["admin", OTHER, true, "admin"],
    ["stranger", OTHER, false, null],
  ])("%s", (_label, userId, isAdmin, expected) => {
    expect(getSyllabusAccess(userId, { isAdmin }, syllabus)).toBe(expected);
  });
});

describe("resolveSyllabusAccess", () => {
  const syllabus = {
    id: "sylsylsylsylsyl",
    lead: LEAD,
    co_authors: [CO],
    status: "submitted" as const,
    program: "prg123prg123prg",
  };
  const faculty = { ...NO_ROLES, facultyOfPrograms: ["prgAprgAprgAprg"] };
  const HOLDERS = [[OTHER], [], [], [], []];

  beforeEach(() => {
    chain.loadChainHolders.mockReset().mockResolvedValue([[], [], [], [], []]);
    chain.loadStandIns.mockReset().mockResolvedValue([]);
  });

  it("returns direct access without any query", async () => {
    const getList = vi.fn();
    const pb = fakePb({ syllabus_references: { getList } });
    expect(await resolveSyllabusAccess(pb, CO, faculty, syllabus)).toBe(
      "coAuthor",
    );
    expect(getList).not.toHaveBeenCalled();
    expect(chain.loadStandIns).not.toHaveBeenCalled();
    expect(chain.loadChainHolders).not.toHaveBeenCalled();
  });

  it("skips the reference query for a user with no faculty programs", async () => {
    const getList = vi.fn();
    const pb = fakePb({ syllabus_references: { getList } });
    expect(await resolveSyllabusAccess(pb, OTHER, NO_ROLES, syllabus)).toBeNull();
    expect(getList).not.toHaveBeenCalled();
  });

  it("grants reviewer to a chain holder once out of draft", async () => {
    chain.loadChainHolders.mockResolvedValue(HOLDERS);
    const pb = fakePb({});
    const reviewer = { ...NO_ROLES, reviewerOfPrograms: ["prg123prg123prg"] };

    expect(await resolveSyllabusAccess(pb, OTHER, reviewer, syllabus)).toBe(
      "reviewer",
    );
    expect(chain.loadChainHolders).toHaveBeenCalledWith(pb, "prg123prg123prg");
    expect(chain.loadStandIns).toHaveBeenCalledWith(pb, "sylsylsylsylsyl");
  });

  it("grants reviewer to a stand-in with no chain role", async () => {
    chain.loadStandIns.mockResolvedValue([{ stage: 1, user: OTHER }]);
    const pb = fakePb({});

    expect(await resolveSyllabusAccess(pb, OTHER, NO_ROLES, syllabus)).toBe(
      "reviewer",
    );
    expect(chain.loadChainHolders).not.toHaveBeenCalled();
  });

  it("checks nothing reviewer-related while a draft", async () => {
    chain.loadChainHolders.mockResolvedValue(HOLDERS);
    const pb = fakePb({});
    const vpaa = { ...NO_ROLES, isVpaa: true };

    expect(
      await resolveSyllabusAccess(pb, OTHER, vpaa, {
        ...syllabus,
        status: "draft",
      }),
    ).toBeNull();
    expect(chain.loadChainHolders).not.toHaveBeenCalled();
    expect(chain.loadStandIns).not.toHaveBeenCalled();
  });

  it("skips the chain query for a program chair or department head", async () => {
    const getList = vi.fn(async () => ({ items: [] }));
    const pb = fakePb({ syllabus_references: { getList } });
    const chairAndHead = {
      ...NO_ROLES,
      chairOfPrograms: ["prgBprgBprgBprg"],
      headOfDepartments: ["dep123dep123dep"],
    };

    expect(
      await resolveSyllabusAccess(pb, OTHER, chairAndHead, syllabus),
    ).toBeNull();
    expect(chain.loadChainHolders).not.toHaveBeenCalled();
  });

  it.each(["draft", "submitted", "filed"] as const)(
    "grants chair to a chair of the syllabus's program (%s) without a query",
    async (status) => {
      const getList = vi.fn();
      const pb = fakePb({ syllabus_references: { getList } });
      const chair = { ...NO_ROLES, chairOfPrograms: ["prg123prg123prg"] };

      expect(
        await resolveSyllabusAccess(pb, OTHER, chair, { ...syllabus, status }),
      ).toBe("chair");
      expect(getList).not.toHaveBeenCalled();
      expect(chain.loadChainHolders).not.toHaveBeenCalled();
    },
  );

  it("prefers reviewer over chair", async () => {
    chain.loadChainHolders.mockResolvedValue(HOLDERS);
    const pb = fakePb({});
    const both = {
      ...NO_ROLES,
      chairOfPrograms: ["prg123prg123prg"],
      reviewerOfPrograms: ["prg123prg123prg"],
    };

    expect(await resolveSyllabusAccess(pb, OTHER, both, syllabus)).toBe(
      "reviewer",
    );
  });

  it("prefers reviewer over referencer", async () => {
    chain.loadChainHolders.mockResolvedValue(HOLDERS);
    const getList = vi.fn(async () => ({ items: [{ id: "x" }] }));
    const pb = fakePb({ syllabus_references: { getList } });
    const both = { ...faculty, isFdisChair: true };

    expect(await resolveSyllabusAccess(pb, OTHER, both, syllabus)).toBe(
      "reviewer",
    );
    expect(getList).not.toHaveBeenCalled();
  });

  it.each([
    [[{ id: "x" }], "referencer"],
    [[], null],
  ])(
    "checks for an approved reference from the user's programs",
    async (items, expected) => {
      const getList = vi.fn(async () => ({ items }));
      const pb = fakePb({ syllabus_references: { getList } });

      expect(await resolveSyllabusAccess(pb, OTHER, faculty, syllabus)).toBe(
        expected,
      );
      expect(getList).toHaveBeenCalledWith(1, 1, {
        skipTotal: true,
        fields: "id",
        filter:
          'syllabus = "sylsylsylsylsyl" && status = \'approved\' && (program = "prgAprgAprgAprg")',
      });
    },
  );

  it("grants referencer to the chair of a referencing program", async () => {
    const getList = vi.fn(async () => ({ items: [{ id: "x" }] }));
    const pb = fakePb({ syllabus_references: { getList } });
    const chair = {
      ...faculty,
      chairOfPrograms: ["prgBprgBprgBprg", "prgAprgAprgAprg"],
    };

    expect(await resolveSyllabusAccess(pb, OTHER, chair, syllabus)).toBe(
      "referencer",
    );
    expect(getList).toHaveBeenCalledWith(
      1,
      1,
      expect.objectContaining({
        filter: expect.stringContaining(
          '(program = "prgAprgAprgAprg" || program = "prgBprgBprgBprg")',
        ),
      }),
    );
  });
});

describe("listReferencedSyllabusIds", () => {
  it("lists unique syllabi with approved references from the programs", async () => {
    const getFullList = vi.fn(async () => [
      { syllabus: "s1s1s1s1s1s1s1s" },
      { syllabus: "s1s1s1s1s1s1s1s" },
      { syllabus: "s2s2s2s2s2s2s2s" },
    ]);
    const pb = fakePb({ syllabus_references: { getFullList } });

    expect(
      await listReferencedSyllabusIds(pb, ["pApApApApApApAp", "pBpBpBpBpBpBpBp"]),
    ).toEqual(["s1s1s1s1s1s1s1s", "s2s2s2s2s2s2s2s"]);
    expect(getFullList).toHaveBeenCalledWith({
      fields: "syllabus",
      filter:
        'status = \'approved\' && (program = "pApApApApApApAp" || program = "pBpBpBpBpBpBpBp")',
    });
  });

  it("skips the query without programs", async () => {
    const getFullList = vi.fn();
    const pb = fakePb({ syllabus_references: { getFullList } });
    expect(await listReferencedSyllabusIds(pb, [])).toEqual([]);
    expect(getFullList).not.toHaveBeenCalled();
  });
});

describe("isListedForProgram", () => {
  it("looks for a matching item in a published prospectus", async () => {
    const getList = vi.fn(async () => ({ items: [{ id: "x" }] }));
    const pb = fakePb({ prospectus_items: { getList } });

    const listed = await isListedForProgram(
      pb,
      "crs123crs123crs",
      { school_year: "sy0123sy0123sy0", semester: "First Semester" },
      "prg123prg123prg",
    );

    expect(listed).toBe(true);
    expect(getList).toHaveBeenCalledWith(1, 1, {
      skipTotal: true,
      fields: "id",
      filter:
        'course = "crs123crs123crs" && semester = "First Semester" && prospectus.program = "prg123prg123prg" && prospectus.school_year = "sy0123sy0123sy0" && prospectus.published = true',
    });
  });

  it("is false with no match", async () => {
    const pb = fakePb({
      prospectus_items: { getList: vi.fn(async () => ({ items: [] })) },
    });
    expect(
      await isListedForProgram(
        pb,
        "crs123crs123crs",
        { school_year: "sy0123sy0123sy0", semester: "Summer" },
        "prg123prg123prg",
      ),
    ).toBe(false);
  });
});

describe("activeFacultyAmong", () => {
  it("returns the users with an active membership in the program", async () => {
    const getFullList = vi.fn(async () => [{ user: CO }]);
    const pb = fakePb({ faculties: { getFullList } });

    const result = await activeFacultyAmong(pb, "prg123prg123prg", [CO, OTHER]);

    expect(result).toEqual(new Set([CO]));
    expect(getFullList).toHaveBeenCalledWith({
      fields: "user",
      filter: `program = "prg123prg123prg" && active = true && (user = "${CO}" || user = "${OTHER}")`,
    });
  });

  it("skips the query for an empty list", async () => {
    const getFullList = vi.fn();
    const pb = fakePb({ faculties: { getFullList } });
    expect(await activeFacultyAmong(pb, "prg123prg123prg", [])).toEqual(
      new Set(),
    );
    expect(getFullList).not.toHaveBeenCalled();
  });
});

describe("listCoAuthorCandidates", () => {
  it("searches active faculty of the program, excluding the lead", async () => {
    const getList = vi.fn(async () => ({
      items: [
        { user: CO, expand: { user: { id: CO, name: "Ben", email: "b@x", tokenKey: "s" } } },
        { user: OTHER },
      ],
    }));
    const pb = fakePb({ faculties: { getList } });

    const result = await listCoAuthorCandidates(
      pb,
      { program: "prg123prg123prg", lead: LEAD },
      "be",
    );

    expect(result).toEqual([{ id: CO, name: "Ben", email: "b@x" }]);
    expect(getList).toHaveBeenCalledWith(1, 20, {
      skipTotal: true,
      expand: "user",
      sort: "user.name",
      filter: `program = "prg123prg123prg" && active = true && user != "${LEAD}" && (user.name ~ "be" || user.email ~ "be")`,
    });
  });
});

describe("listAvailable", () => {
  const term = {
    id: "trm123trm123trm",
    school_year: "sy0123sy0123sy0",
    semester: "First Semester",
    expand: { school_year: { label: "2026-2027" } },
  };
  const item = (course: string, program: string) => ({
    course,
    semester: "First Semester",
    year_level: "First Year",
    expand: {
      course: { id: course, code: course.slice(0, 3), title: "T" },
      prospectus: {
        school_year: "sy0123sy0123sy0",
        expand: { program: { id: program, name: "N", code: "C" } },
      },
    },
  });
  const query = { page: 1, perPage: 30 };

  it("returns nothing without memberships, before listing items", async () => {
    const getList = vi.fn();
    const pb = fakePb({
      faculties: { getFullList: vi.fn(async () => []) },
      terms: { getFullList: vi.fn(async () => [term]) },
      prospectus_items: { getList },
    });

    const result = await listAvailable(pb, LEAD, query);

    expect(result.items).toEqual([]);
    expect(result.totalItems).toBe(0);
    expect(getList).not.toHaveBeenCalled();
  });

  it("returns nothing when no term is open", async () => {
    const getList = vi.fn();
    const pb = fakePb({
      faculties: { getFullList: vi.fn(async () => [{ program: "prgAprgAprgAprgA" }]) },
      terms: { getFullList: vi.fn(async () => []) },
      prospectus_items: { getList },
    });

    expect((await listAvailable(pb, LEAD, query)).items).toEqual([]);
    expect(getList).not.toHaveBeenCalled();
  });

  it("lists matching items and marks ones that already have a syllabus", async () => {
    const PROG = "prgAprgAprgAprg";
    const itemsGetList = vi.fn(async () => ({
      page: 1,
      perPage: 30,
      totalItems: 2,
      totalPages: 1,
      items: [item("crsAcrsAcrsAcrs", PROG), item("crsBcrsBcrsBcrs", PROG)],
    }));
    const syllabiGetFullList = vi.fn(async () => [
      {
        id: "sylsylsylsylsyl",
        course: "crsBcrsBcrsBcrs",
        term: term.id,
        program: PROG,
        status: "draft",
        expand: { lead: { name: "Ana" } },
      },
    ]);
    const termsGetFullList = vi.fn(async () => [term]);
    const facultiesGetFullList = vi.fn(async () => [{ program: PROG }]);
    const referencesGetFullList = vi.fn(async () => [
      {
        id: "refrefrefrefref",
        course: "crsAcrsAcrsAcrs",
        term: term.id,
        program: PROG,
        status: "pending",
        expand: { syllabus: { status: "draft", expand: { program: { code: "NURS" } } } },
      },
    ]);
    const pb = fakePb({
      faculties: { getFullList: facultiesGetFullList },
      terms: { getFullList: termsGetFullList },
      prospectus_items: { getList: itemsGetList },
      syllabi: { getFullList: syllabiGetFullList },
      syllabus_references: { getFullList: referencesGetFullList },
    });

    const result = await listAvailable(pb, LEAD, {
      ...query,
      term: term.id,
      program: PROG,
      search: "IT",
    });

    expect(facultiesGetFullList).toHaveBeenCalledWith({
      fields: "program",
      filter: `user = "${LEAD}" && active = true && program = "${PROG}"`,
    });
    expect(termsGetFullList).toHaveBeenCalledWith({
      expand: "school_year",
      filter: `open = true && id = "${term.id}"`,
    });
    expect(itemsGetList).toHaveBeenCalledWith(1, 30, {
      expand: "course,prospectus.program",
      sort: "course.code,prospectus.program.code",
      filter: `prospectus.published = true && (prospectus.program = "${PROG}") && ((prospectus.school_year = "sy0123sy0123sy0" && semester = "First Semester")) && (course.code ~ "IT" || course.title ~ "IT")`,
    });
    expect(referencesGetFullList).toHaveBeenCalledWith({
      expand: "syllabus.program",
      fields:
        "id,course,term,program,status,expand.syllabus.status,expand.syllabus.expand.program.code",
      filter: `(course = "crsAcrsAcrsAcrs" || course = "crsBcrsBcrsBcrs") && (term = "${term.id}") && (program = "${PROG}") && (status = 'pending' || status = 'approved')`,
    });
    expect(result.totalItems).toBe(2);
    expect(result.items).toEqual([
      {
        course: { id: "crsAcrsAcrsAcrs", code: "crs", title: "T" },
        term: {
          id: term.id,
          semester: "First Semester",
          school_year_label: "2026-2027",
          // A term with neither set reads as no deadline and no limit.
          submission_deadline: "",
          review_days: 0,
        },
        program: { id: PROG, name: "N", code: "C" },
        year_level: "First Year",
        reference: {
          id: "refrefrefrefref",
          status: "pending",
          source_program_code: "NURS",
          source_status: "draft",
        },
      },
      {
        course: { id: "crsBcrsBcrsBcrs", code: "crs", title: "T" },
        term: {
          id: term.id,
          semester: "First Semester",
          school_year_label: "2026-2027",
          submission_deadline: "",
          review_days: 0,
        },
        program: { id: PROG, name: "N", code: "C" },
        year_level: "First Year",
        syllabus: { id: "sylsylsylsylsyl", status: "draft", lead_name: "Ana" },
      },
    ]);
  });
});
