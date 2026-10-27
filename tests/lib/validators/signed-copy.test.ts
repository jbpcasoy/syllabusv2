import { parseSignedCopyReturn } from "@/lib/validators/signed-copy";
import { describe, expect, it } from "vitest";

describe("parseSignedCopyReturn", () => {
  it("trims the reason", () => {
    expect(parseSignedCopyReturn({ reason: "  Missing VPAA signature. " })).toEqual({
      ok: true,
      data: { reason: "Missing VPAA signature." },
    });
  });

  it.each([
    [{}, "Give a reason for returning the signed copy"],
    [{ reason: "   " }, "Give a reason for returning the signed copy"],
    [{ reason: 5 }, "Give a reason for returning the signed copy"],
    [{ reason: "x".repeat(501) }, "`reason` must be at most 500 characters"],
    [null, "Body must be a JSON object"],
  ])("rejects %j", (body, error) => {
    expect(parseSignedCopyReturn(body)).toEqual({ ok: false, error });
  });
});
