import { parseUndoApprovalInput } from "@/lib/validators/undo-approval";
import { describe, expect, it } from "vitest";

describe("parseUndoApprovalInput", () => {
  it("trims and keeps the reason", () => {
    expect(
      parseUndoApprovalInput({ reason: "  Approved by mistake.  " }),
    ).toEqual({ ok: true, data: { reason: "Approved by mistake." } });
  });

  it.each([null, [], "text", 5])(
    "rejects a body that isn't an object (%o)",
    (body) => {
      expect(parseUndoApprovalInput(body)).toEqual({
        ok: false,
        error: "Body must be a JSON object",
      });
    },
  );

  it.each([{}, { reason: "" }, { reason: "   " }, { reason: 5 }])(
    "requires a reason (%o)",
    (body) => {
      expect(parseUndoApprovalInput(body)).toEqual({
        ok: false,
        error: "Give a reason for undoing the approval",
      });
    },
  );

  it.each(["too short", "x".repeat(501)])(
    "bounds the reason's length",
    (reason) => {
      expect(parseUndoApprovalInput({ reason })).toEqual({
        ok: false,
        error: "The reason must be 10 to 500 characters",
      });
    },
  );

  it("accepts the bounds exactly", () => {
    for (const reason of ["x".repeat(10), "x".repeat(500)]) {
      expect(parseUndoApprovalInput({ reason }).ok).toBe(true);
    }
  });
});
