import {
  isSyllabusStatus,
  parseSyllabusInput,
  parseSyllabusUpdateInput,
  parseSyllabusVersionInput,
} from "@/lib/validators/syllabus";
import { describe, expect, it } from "vitest";

const COURSE = "crs123crs123crs";
const TERM = "trm123trm123trm";
const PROGRAM = "prg123prg123prg";
const USER_A = "usraaausraaausr";
const USER_B = "usrbbbusrbbbusr";

describe("parseSyllabusInput", () => {
  it("accepts course, term and program and ignores other fields", () => {
    expect(
      parseSyllabusInput({
        course: COURSE,
        term: TERM,
        program: PROGRAM,
        lead: USER_A,
        status: "submitted",
      }),
    ).toEqual({
      ok: true,
      data: { course: COURSE, term: TERM, program: PROGRAM },
    });
  });

  it.each([
    ["null body", null],
    ["array body", [COURSE]],
    ["missing course", { term: TERM, program: PROGRAM }],
    ["bad term id", { course: COURSE, term: "nope", program: PROGRAM }],
    ["missing program", { course: COURSE, term: TERM }],
  ])("rejects %s", (_label, body) => {
    expect(parseSyllabusInput(body).ok).toBe(false);
  });
});

describe("parseSyllabusUpdateInput", () => {
  it("accepts co-authors and removes duplicates in order", () => {
    expect(
      parseSyllabusUpdateInput({ co_authors: [USER_B, USER_A, USER_B] }),
    ).toEqual({ ok: true, data: { co_authors: [USER_B, USER_A] } });
  });

  it("accepts an empty list", () => {
    expect(parseSyllabusUpdateInput({ co_authors: [] })).toEqual({
      ok: true,
      data: { co_authors: [] },
    });
  });

  it("accepts exactly 50 co-authors", () => {
    const ids = Array.from({ length: 50 }, (_, i) =>
      `u${String(i).padStart(14, "0")}`,
    );
    expect(parseSyllabusUpdateInput({ co_authors: ids }).ok).toBe(true);
  });

  it.each([
    ["null body", null],
    ["missing co_authors", {}],
    ["non-array co_authors", { co_authors: USER_A }],
    ["bad id in list", { co_authors: [USER_A, "nope"] }],
    ["non-string in list", { co_authors: [5] }],
    [
      "more than 50",
      {
        co_authors: Array.from({ length: 51 }, (_, i) =>
          `u${String(i).padStart(14, "0")}`,
        ),
      },
    ],
  ])("rejects %s", (_label, body) => {
    expect(parseSyllabusUpdateInput(body).ok).toBe(false);
  });
});

describe("parseSyllabusVersionInput", () => {
  it("trims notes", () => {
    expect(parseSyllabusVersionInput({ notes: "  fixed CLOs  " })).toEqual({
      ok: true,
      data: { notes: "fixed CLOs" },
    });
  });

  it("defaults missing or null notes to empty", () => {
    expect(parseSyllabusVersionInput({})).toEqual({
      ok: true,
      data: { notes: "" },
    });
    // FormData.get returns null for a missing field.
    expect(parseSyllabusVersionInput({ notes: null })).toEqual({
      ok: true,
      data: { notes: "" },
    });
  });

  it.each([
    ["null body", null],
    ["non-string notes", { notes: 5 }],
    ["notes too long", { notes: "x".repeat(1001) }],
  ])("rejects %s", (_label, body) => {
    expect(parseSyllabusVersionInput(body).ok).toBe(false);
  });
});

describe("isSyllabusStatus", () => {
  it("knows the Phase 3 statuses", () => {
    expect(
      ["draft", "submitted", "returned", "approved", "filed"].every(
        isSyllabusStatus,
      ),
    ).toBe(true);
    expect(isSyllabusStatus("rejected")).toBe(false);
    expect(isSyllabusStatus(undefined)).toBe(false);
  });
});
