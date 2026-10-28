import { parseCollegeInput } from "@/lib/validators/college";
import { parseDepartmentInput } from "@/lib/validators/department";
import { parseProgramInput } from "@/lib/validators/program";
import { describe, expect, it } from "vitest";

// PocketBase ids are lowercase: /^[a-z0-9]{15}$/
const CAMPUS = "campacampacampa";
const COLLEGE = "colgacolgacolga";
const DEPARTMENT = "deptadeptadepta";

describe("parseCollegeInput campus", () => {
  const base = { name: "Science", code: "COS" };

  it("is required on create", () => {
    expect(parseCollegeInput(base)).toEqual({
      ok: false,
      error: "`campus` is required",
    });
  });

  it.each(["", null, "short", 123])("rejects %s", (campus) => {
    expect(parseCollegeInput({ ...base, campus })).toEqual({
      ok: false,
      error: "`campus` must be a valid campus id",
    });
  });

  it("accepts a valid id", () => {
    expect(parseCollegeInput({ ...base, campus: CAMPUS })).toEqual({
      ok: true,
      data: { ...base, campus: CAMPUS },
    });
  });

  it("may be omitted in a partial update, but not cleared", () => {
    expect(parseCollegeInput({ name: "X" }, { partial: true })).toEqual({
      ok: true,
      data: { name: "X" },
    });
    expect(parseCollegeInput({ campus: "" }, { partial: true }).ok).toBe(false);
  });
});

describe("parseDepartmentInput college", () => {
  it("is required on create", () => {
    expect(parseDepartmentInput({ name: "CS" })).toEqual({
      ok: false,
      error: "`college` is required",
    });
  });

  it.each(["", null, "short", 123])("rejects %s", (college) => {
    expect(parseDepartmentInput({ name: "CS", college })).toEqual({
      ok: false,
      error: "`college` must be a valid college id",
    });
  });

  it("accepts a valid id", () => {
    expect(parseDepartmentInput({ name: "CS", college: COLLEGE })).toEqual({
      ok: true,
      data: { name: "CS", college: COLLEGE },
    });
  });

  it("may be omitted in a partial update, but not cleared", () => {
    expect(parseDepartmentInput({ name: "X" }, { partial: true })).toEqual({
      ok: true,
      data: { name: "X" },
    });
    expect(parseDepartmentInput({ college: "" }, { partial: true }).ok).toBe(
      false,
    );
  });
});

describe("parseProgramInput department", () => {
  const base = { name: "BS CS", code: "BSCS" };

  it("is required on create", () => {
    expect(parseProgramInput(base)).toEqual({
      ok: false,
      error: "`department` is required",
    });
  });

  it.each(["", null, "short", 123])("rejects %s", (department) => {
    expect(parseProgramInput({ ...base, department })).toEqual({
      ok: false,
      error: "`department` must be a valid department id",
    });
  });

  it("accepts a valid id", () => {
    expect(parseProgramInput({ ...base, department: DEPARTMENT })).toEqual({
      ok: true,
      data: { ...base, department: DEPARTMENT },
    });
  });

  it("may be omitted in a partial update, but not cleared", () => {
    expect(parseProgramInput({ name: "X" }, { partial: true })).toEqual({
      ok: true,
      data: { name: "X" },
    });
    expect(parseProgramInput({ department: null }, { partial: true }).ok).toBe(
      false,
    );
  });
});
