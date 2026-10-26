import {
  isReferenceStatus,
  parseReferenceActionInput,
  parseSyllabusReferenceInput,
} from "@/lib/validators/syllabus-reference";
import { describe, expect, it } from "vitest";

const SYLLABUS = "sylsylsylsylsyl";
const PROGRAM = "prg123prg123prg";

describe("parseSyllabusReferenceInput", () => {
  it("accepts a syllabus and program with a trimmed note", () => {
    expect(
      parseSyllabusReferenceInput({
        syllabus: SYLLABUS,
        program: PROGRAM,
        note: "  same content  ",
        status: "approved",
      }),
    ).toEqual({
      ok: true,
      data: { syllabus: SYLLABUS, program: PROGRAM, note: "same content" },
    });
  });

  it("defaults a missing note to empty", () => {
    expect(
      parseSyllabusReferenceInput({ syllabus: SYLLABUS, program: PROGRAM }),
    ).toEqual({
      ok: true,
      data: { syllabus: SYLLABUS, program: PROGRAM, note: "" },
    });
  });

  it.each([
    ["null body", null],
    ["array body", []],
    ["bad syllabus id", { syllabus: "nope", program: PROGRAM }],
    ["missing program", { syllabus: SYLLABUS }],
    ["non-string note", { syllabus: SYLLABUS, program: PROGRAM, note: 1 }],
    [
      "note too long",
      { syllabus: SYLLABUS, program: PROGRAM, note: "x".repeat(501) },
    ],
  ])("rejects %s", (_label, body) => {
    expect(parseSyllabusReferenceInput(body).ok).toBe(false);
  });
});

describe("parseReferenceActionInput", () => {
  it.each(["approve", "withdraw"] as const)(
    "accepts %s and drops any reason",
    (action) => {
      expect(parseReferenceActionInput({ action, reason: "x" })).toEqual({
        ok: true,
        data: { action },
      });
    },
  );

  it.each(["reject", "revoke"] as const)(
    "accepts %s with a trimmed reason",
    (action) => {
      expect(parseReferenceActionInput({ action, reason: "  outdated " })).toEqual({
        ok: true,
        data: { action, reason: "outdated" },
      });
    },
  );

  it.each([
    ["null body", null],
    ["unknown action", { action: "delete" }],
    ["reject without reason", { action: "reject" }],
    ["revoke with blank reason", { action: "revoke", reason: "   " }],
    ["reason too long", { action: "reject", reason: "x".repeat(501) }],
  ])("rejects %s", (_label, body) => {
    expect(parseReferenceActionInput(body).ok).toBe(false);
  });
});

describe("isReferenceStatus", () => {
  it("knows the five statuses", () => {
    expect(
      ["pending", "approved", "rejected", "withdrawn", "revoked"].every(
        isReferenceStatus,
      ),
    ).toBe(true);
    expect(isReferenceStatus("cancelled")).toBe(false);
  });
});
