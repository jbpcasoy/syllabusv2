import { parseDepartmentInput } from "@/lib/validators/department";
import { parseProgramInput } from "@/lib/validators/program";
import { describe, expect, it } from "vitest";

// PocketBase ids are lowercase: /^[a-z0-9]{15}$/
const COLLEGE = "colgacolgacolga";
const DEPARTMENT = "deptadeptadepta";

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
