import { csvCell, fileSlug, toCsv } from "@/lib/csv";
import { describe, expect, it } from "vitest";

describe("csvCell", () => {
  it.each([
    ["plain text", "IT 101", "IT 101"],
    ["empty", "", ""],
    ["null", null, ""],
    ["undefined", undefined, ""],
    ["a number", 42, "42"],
    ["a decimal", 0.5, "0.5"],
    ["zero", 0, "0"],
    ["NaN", Number.NaN, ""],
    ["a comma", "Smith, Ana", '"Smith, Ana"'],
    ["a quote", 'The "best" course', '"The ""best"" course"'],
    ["a newline", "line 1\nline 2", '"line 1\nline 2"'],
    ["a CR", "line 1\rline 2", '"line 1\rline 2"'],
    ["non-ASCII", "Peñaranda", "Peñaranda"],
  ])("writes %s", (_label, value, expected) => {
    expect(csvCell(value)).toBe(expected);
  });

  it.each([
    ["=", "=HYPERLINK(\"http://evil\")", `"'=HYPERLINK(""http://evil"")"`],
    ["+", "+1+1", "'+1+1"],
    ["-", "-2+3", "'-2+3"],
    ["@", "@SUM(A1)", "'@SUM(A1)"],
    ["tab", "\t=1", "'\t=1"],
    ["CR", "\r=1", `"'\r=1"`],
  ])("neutralizes a formula starting with %s", (_label, value, expected) => {
    expect(csvCell(value)).toBe(expected);
  });

  it("leaves formula characters alone mid-text and in numbers", () => {
    expect(csvCell("a=b")).toBe("a=b");
    expect(csvCell(-3)).toBe("-3");
  });
});

describe("toCsv", () => {
  it("starts with a BOM and ends every line with CRLF", () => {
    expect(toCsv(["Code", "Title"], [["IT 101", "Intro, part 1"], ["GE 1", null]])).toBe(
      '﻿Code,Title\r\nIT 101,"Intro, part 1"\r\nGE 1,\r\n',
    );
  });

  it("writes only the header for no rows", () => {
    expect(toCsv(["A"], [])).toBe("﻿A\r\n");
  });
});

describe("fileSlug", () => {
  it.each([
    ["2026-2027 First Semester", "2026-2027-first-semester"],
    ['../evil"name\r\n', "evil-name"],
    ["", "export"],
    ["***", "export"],
  ])("slugs %o", (text, expected) => {
    expect(fileSlug(text)).toBe(expected);
  });
});
