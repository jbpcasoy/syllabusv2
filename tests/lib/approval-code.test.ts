import { approvalCode, parseApprovalCode } from "@/lib/approval-code";
import { describe, expect, it } from "vitest";

describe("approvalCode", () => {
  it.each([
    ["First Semester", 42, 3, "SYL-2627-1-0042-S3"],
    ["Second Semester", 7, 1, "SYL-2627-2-0007-S1"],
    ["Summer", 1234, 5, "SYL-2627-M-1234-S5"],
    ["First Semester", 12345, 2, "SYL-2627-1-12345-S2"],
  ] as const)("%s, seq %i, stage %i → %s", (semester, refSeq, stage, expected) => {
    expect(
      approvalCode({ schoolYearLabel: "2026-2027", semester, refSeq, stage }),
    ).toBe(expected);
  });

  it.each([
    [{ refSeq: 0, stage: 1 }],
    [{ refSeq: 1, stage: 0 }],
    [{ refSeq: 1, stage: 6 }],
    [{ refSeq: 1.5, stage: 1 }],
  ])("throws on an invalid sequence or stage %o", (bad) => {
    expect(() =>
      approvalCode({
        schoolYearLabel: "2026-2027",
        semester: "First Semester",
        ...bad,
      }),
    ).toThrow();
  });

  it("throws on a malformed school year label", () => {
    expect(() =>
      approvalCode({
        schoolYearLabel: "2026",
        semester: "First Semester",
        refSeq: 1,
        stage: 1,
      }),
    ).toThrow();
  });
});

describe("parseApprovalCode", () => {
  it("reads every part back", () => {
    expect(parseApprovalCode("SYL-2627-M-0042-S3")).toEqual({
      schoolYearLabel: "2026-2027",
      semester: "Summer",
      refSeq: 42,
      stage: 3,
    });
  });

  it("accepts lowercase and surrounding spaces", () => {
    expect(parseApprovalCode("  syl-2627-1-0042-s3 ")).toMatchObject({
      refSeq: 42,
      stage: 3,
    });
  });

  it.each([
    "",
    "SYL-2627-1-0042",
    "SYL-2627-3-0042-S3",
    "SYL-2627-1-0042-S6",
    "SYL-2627-1-0000-S1",
    "SYL-26-1-0042-S1",
    "XYZ-2627-1-0042-S1",
    "SYL-2627-1-0042-S1-extra",
  ])("rejects %j", (code) => {
    expect(parseApprovalCode(code)).toBeNull();
  });

  it("round-trips", () => {
    const parts = {
      schoolYearLabel: "2030-2031",
      semester: "Second Semester" as const,
      refSeq: 9,
      stage: 5,
    };
    expect(parseApprovalCode(approvalCode(parts))).toEqual(parts);
  });
});
