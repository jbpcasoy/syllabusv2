import {
  isJoinRequestStatus,
  parseProgramJoinRequestDecision,
  parseProgramJoinRequestInput,
} from "@/lib/validators/program-join-request";
import { describe, expect, it } from "vitest";

const PROGRAM = "prg123prg123prg";

describe("parseProgramJoinRequestInput", () => {
  it("accepts a program with a trimmed note", () => {
    expect(
      parseProgramJoinRequestInput({ program: PROGRAM, note: "  hi  " }),
    ).toEqual({ ok: true, data: { program: PROGRAM, note: "hi" } });
  });

  it("defaults a missing note to empty and ignores other fields", () => {
    expect(
      parseProgramJoinRequestInput({ program: PROGRAM, user: "x", status: "approved" }),
    ).toEqual({ ok: true, data: { program: PROGRAM, note: "" } });
  });

  it.each([
    ["null body", null],
    ["bad program id", { program: "nope" }],
    ["non-string note", { program: PROGRAM, note: 5 }],
    ["note too long", { program: PROGRAM, note: "x".repeat(501) }],
  ])("rejects %s", (_label, body) => {
    expect(parseProgramJoinRequestInput(body).ok).toBe(false);
  });
});

describe("parseProgramJoinRequestDecision", () => {
  it("accepts approve and drops any reason", () => {
    expect(
      parseProgramJoinRequestDecision({ decision: "approve", reason: "x" }),
    ).toEqual({ ok: true, data: { decision: "approve" } });
  });

  it("accepts reject with a trimmed reason", () => {
    expect(
      parseProgramJoinRequestDecision({ decision: "reject", reason: " no " }),
    ).toEqual({ ok: true, data: { decision: "reject", reason: "no" } });
  });

  it.each([
    ["null body", null],
    ["unknown decision", { decision: "maybe" }],
    ["reject without reason", { decision: "reject" }],
    ["reject with blank reason", { decision: "reject", reason: "  " }],
    ["reason too long", { decision: "reject", reason: "x".repeat(501) }],
  ])("rejects %s", (_label, body) => {
    expect(parseProgramJoinRequestDecision(body).ok).toBe(false);
  });
});

describe("isJoinRequestStatus", () => {
  it("knows the three statuses", () => {
    expect(["pending", "approved", "rejected"].every(isJoinRequestStatus)).toBe(
      true,
    );
    expect(isJoinRequestStatus("cancelled")).toBe(false);
  });
});
