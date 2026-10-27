import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  syllabiGetOne: vi.fn(),
  getSyllabusAccess: vi.fn(),
  findJustification: vi.fn(),
  userNames: vi.fn(),
  activeHolderName: vi.fn(),
}));

vi.mock("@/lib/pocketbase", async () => {
  const { NextResponse } = await import("next/server");
  return {
    createAdminPb: vi.fn(async () => ({
      collection: () => ({ getOne: mocks.syllabiGetOne }),
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

vi.mock("@/lib/syllabus", () => ({ getSyllabusAccess: mocks.getSyllabusAccess }));
vi.mock("@/lib/justification", () => ({
  findJustification: mocks.findJustification,
  userNames: mocks.userNames,
  activeHolderName: mocks.activeHolderName,
}));
vi.mock("@/lib/auth", async () =>
  (await import("@/tests/helpers/mock-auth")).authModuleMock(),
);
vi.mock("@/lib/roles", async () =>
  (await import("@/tests/helpers/mock-auth")).rolesModuleMock(),
);

// The letter builder stays real.
import { GET } from "@/app/api/syllabus/[id]/export/justification/route";
import { createAdminPb } from "@/lib/pocketbase";
import { mockAuth } from "@/tests/helpers/mock-auth";

const ID = "sylsylsylsylsyl";
const PROGRAM = "prg123prg123prg";
const ctx = { params: Promise.resolve({ id: ID }) };

const get = () =>
  GET(new NextRequest(`http://localhost/api/syllabus/${ID}/export/justification`), ctx);

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-27T02:00:00Z"));
  mockAuth({ id: "leadleadleadlea" });
  mocks.syllabiGetOne.mockResolvedValue({
    id: ID,
    program: PROGRAM,
    lead: "leadleadleadlea",
    co_authors: [],
    expand: {
      course: { code: "Prof Ed 1", title: "The Child and Adolescent Learners" },
      term: { semester: "First Semester", expand: { school_year: { label: "2026-2027" } } },
      lead: { name: "Lea Santos" },
    },
  });
  mocks.getSyllabusAccess.mockReturnValue("lead");
  mocks.findJustification.mockResolvedValue({
    entries: [{ author: "anaanaanaanaana", reason: "On official leave." }],
  });
  mocks.userNames.mockResolvedValue(new Map([["anaanaanaanaana", "Maria Angelica C. Mugot"]]));
  mocks.activeHolderName.mockImplementation(async (_pb: unknown, collection: string) =>
    collection === "citl_directors" ? "Dr. Cecille Marie T. Improgo" : "Paolo Reyes",
  );
});

describe("GET /api/syllabus/:id/export/justification", () => {
  it("serves the letter data for the lead", async () => {
    const res = await get();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toMatchObject({
      date: "October 27, 2026",
      semester: "1st Semester",
      schoolYear: "SY 2026-2027",
      recipientName: "Dr. Cecille Marie T. Improgo",
      rows: [
        {
          courseCode: "Prof Ed 1",
          courseTitle: "The Child and Adolescent Learners",
          leadAuthor: "Maria Angelica C. Mugot",
          justification: "On official leave.",
        },
      ],
      facultyName: "Lea Santos",
      programChairName: "Paolo Reyes",
    });
    expect(data.template.salutation).toBe("Dear Madam:");
    expect(mocks.activeHolderName).toHaveBeenCalledWith(expect.anything(), "program_chairs", PROGRAM);
  });

  it("returns 409 without entries", async () => {
    mocks.findJustification.mockResolvedValue(null);
    expect((await get()).status).toBe(409);
  });

  it.each(["coAuthor", "admin"])("returns 403 to %s", async (access) => {
    mocks.getSyllabusAccess.mockReturnValue(access);
    expect((await get()).status).toBe(403);
    expect(mocks.findJustification).not.toHaveBeenCalled();
  });

  it("answers 404 without access", async () => {
    mocks.getSyllabusAccess.mockReturnValue(null);
    expect((await get()).status).toBe(404);
  });

  it("returns 401 when signed out", async () => {
    mockAuth({ signedIn: false });
    expect((await get()).status).toBe(401);
    expect(createAdminPb).not.toHaveBeenCalled();
  });
});
