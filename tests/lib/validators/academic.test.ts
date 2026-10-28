import { parseCourseInput, parseCourseUpdate } from "@/lib/validators/course";
import { parseProspectusInput } from "@/lib/validators/prospectus";
import { parseProspectusDuplicateInput } from "@/lib/validators/prospectus-duplicate";
import {
  parseProspectusItemInput,
  parseProspectusItemUpdate,
} from "@/lib/validators/prospectus-item";
import {
  isValidSchoolYear,
  parseSchoolYearInput,
} from "@/lib/validators/school-year";
import {
  isValidDate,
  parseTermInput,
  parseTermUpdate,
} from "@/lib/validators/term";
import { describe, expect, it } from "vitest";

// PocketBase ids are lowercase: /^[a-z0-9]{15}$/
const SY = "sy2026sy2026sy2";
const SY2 = "sy2027sy2027sy2";
const PROGRAM = "prog1prog1prog1";
const COURSE = "coursecoursecou";
const PROSPECTUS = "prosaprosaprosa";

describe("school year", () => {
  it.each(["2026-2027", "1999-2000"])("accepts %s", (label) => {
    expect(isValidSchoolYear(label)).toBe(true);
  });

  it.each(["2026-2028", "2027-2026", "26-27", "2026/2027", ""])(
    "rejects %s",
    (label) => {
      expect(isValidSchoolYear(label)).toBe(false);
    },
  );

  it("trims the label", () => {
    expect(parseSchoolYearInput({ label: " 2026-2027 " })).toEqual({
      ok: true,
      data: { label: "2026-2027" },
    });
  });

  it.each([null, "x", {}, { label: 2026 }])("rejects body %s", (body) => {
    expect(parseSchoolYearInput(body).ok).toBe(false);
  });
});

describe("term", () => {
  it("defaults open to false, the deadline to null and the review limit to 0", () => {
    expect(
      parseTermInput({ school_year: SY, semester: "First Semester" }),
    ).toEqual({
      ok: true,
      data: {
        school_year: SY,
        semester: "First Semester",
        open: false,
        submission_deadline: null,
        review_days: 0,
      },
    });
  });

  it.each([0, 1, 90])("accepts a review limit of %i days", (days) => {
    expect(
      parseTermInput({ school_year: SY, semester: "Summer", review_days: days }),
    ).toMatchObject({ ok: true, data: { review_days: days } });
    expect(parseTermUpdate({ review_days: days })).toEqual({
      ok: true,
      data: { review_days: days },
    });
  });

  it.each([-1, 91, 1.5, "3", null, Number.NaN])(
    "rejects a review limit of %o",
    (days) => {
      const error = "`review_days` must be a whole number from 0 to 90";
      expect(
        parseTermInput({ school_year: SY, semester: "Summer", review_days: days }),
      ).toEqual({ ok: false, error });
      expect(parseTermUpdate({ review_days: days })).toEqual({ ok: false, error });
    },
  );

  it("accepts a real date and rejects an impossible one", () => {
    expect(isValidDate("2026-12-01")).toBe(true);
    expect(isValidDate("2026-02-30")).toBe(false);
    expect(isValidDate("12/01/2026")).toBe(false);
    expect(
      parseTermInput({
        school_year: SY,
        semester: "Summer",
        submission_deadline: "2026-02-30",
      }).ok,
    ).toBe(false);
  });

  it("rejects an unknown semester and a bad school year id", () => {
    expect(parseTermInput({ school_year: SY, semester: "Winter" }).ok).toBe(
      false,
    );
    expect(
      parseTermInput({ school_year: "2026-2027", semester: "Summer" }),
    ).toEqual({
      ok: false,
      error: "`school_year` must be a valid school year id",
    });
  });

  it("lets an update clear the deadline with null or an empty string", () => {
    expect(parseTermUpdate({ submission_deadline: null })).toEqual({
      ok: true,
      data: { submission_deadline: null },
    });
    expect(parseTermUpdate({ submission_deadline: "" })).toEqual({
      ok: true,
      data: { submission_deadline: null },
    });
  });

  it("ignores the school year on update and requires some field", () => {
    expect(parseTermUpdate({ school_year: SY }).ok).toBe(false);
    expect(parseTermUpdate({ open: "yes" }).ok).toBe(false);
  });
});

describe("course", () => {
  const base = { code: "CS  101 ", title: " Intro ", program: PROGRAM };

  it("normalizes the code and trims the title", () => {
    expect(parseCourseInput(base)).toEqual({
      ok: true,
      data: { code: "CS 101", title: "Intro", program: PROGRAM },
    });
  });

  it("requires code, title and program on create", () => {
    expect(parseCourseInput({ ...base, code: "" }).ok).toBe(false);
    expect(parseCourseInput({ ...base, title: undefined }).ok).toBe(false);
    expect(parseCourseInput({ ...base, program: undefined })).toEqual({
      ok: false,
      error: "`program` must be a valid program id",
    });
  });

  it("enforces the code length", () => {
    expect(parseCourseInput({ ...base, code: "X".repeat(21) }).ok).toBe(false);
  });

  it.each([-1, 31, Number.NaN, "3"])("rejects %s credit units", (value) => {
    expect(parseCourseInput({ ...base, credit_units: value }).ok).toBe(false);
  });

  it("accepts decimal units and hours up to the limits", () => {
    const result = parseCourseInput({
      ...base,
      credit_units: 1.5,
      lec_units: 0,
      lab_units: 30,
      nominal_duration_hours: 54,
    });
    expect(result.ok).toBe(true);
  });

  it("de-duplicates prerequisites and rejects bad ids", () => {
    expect(
      parseCourseInput({ ...base, prerequisites: [COURSE, COURSE] }),
    ).toMatchObject({ ok: true, data: { prerequisites: [COURSE] } });
    expect(parseCourseInput({ ...base, prerequisites: ["CS 100"] }).ok).toBe(
      false,
    );
    expect(parseCourseInput({ ...base, prerequisites: COURSE }).ok).toBe(false);
  });

  it("caps prerequisites at 20", () => {
    const ids = Array.from({ length: 21 }, (_, i) =>
      `course${String(i).padStart(9, "0")}`,
    );
    expect(parseCourseInput({ ...base, prerequisites: ids }).ok).toBe(false);
  });

  it("allows an empty prerequisite note", () => {
    expect(
      parseCourseInput({ ...base, prerequisite_note: "  " }),
    ).toMatchObject({ ok: true, data: { prerequisite_note: "" } });
  });

  it("allows a partial update but not an empty one", () => {
    expect(parseCourseUpdate({ title: "New" })).toEqual({
      ok: true,
      data: { title: "New" },
    });
    expect(parseCourseUpdate({})).toEqual({
      ok: false,
      error: "Provide at least one field to update",
    });
  });
});

describe("prospectus", () => {
  it("takes a school year id, not a label", () => {
    expect(parseProspectusInput({ program: PROGRAM, school_year: SY })).toEqual(
      {
        ok: true,
        data: { program: PROGRAM, school_year: SY, published: false },
      },
    );
    expect(
      parseProspectusInput({ program: PROGRAM, school_year: "2026-2027" }).ok,
    ).toBe(false);
  });
});

describe("prospectus item", () => {
  const base = {
    prospectus: PROSPECTUS,
    course: COURSE,
    semester: "First Semester",
    year_level: "First Year",
  };

  it("takes a course id instead of free-text code and title", () => {
    expect(
      parseProspectusItemInput({ ...base, subject_code: "CS101" }),
    ).toEqual({ ok: true, data: base });
    expect(parseProspectusItemInput({ ...base, course: "CS101" })).toEqual({
      ok: false,
      error: "`course` must be a valid course id",
    });
  });

  it("can change the course, semester or year level on update", () => {
    expect(parseProspectusItemUpdate({ course: COURSE })).toEqual({
      ok: true,
      data: { course: COURSE },
    });
    expect(parseProspectusItemUpdate({ title: "x" }).ok).toBe(false);
  });
});

describe("prospectus duplicate", () => {
  const body = {
    program: PROGRAM,
    source_school_year: SY,
    target_school_year: SY2,
  };

  it("accepts three valid ids", () => {
    expect(parseProspectusDuplicateInput(body)).toEqual({
      ok: true,
      data: body,
    });
  });

  it("rejects the same source and target year", () => {
    expect(
      parseProspectusDuplicateInput({ ...body, target_school_year: SY }),
    ).toEqual({
      ok: false,
      error: "Choose a target school year different from the source",
    });
  });

  it.each(["program", "source_school_year", "target_school_year"])(
    "rejects a missing %s",
    (field) => {
      expect(
        parseProspectusDuplicateInput({ ...body, [field]: undefined }).ok,
      ).toBe(false);
    },
  );
});
