import { parseLeadTransfer } from "@/lib/validators/lead-transfer";
import { describe, expect, it } from "vitest";

const USER = "useruseruseruse";

describe("parseLeadTransfer", () => {
  it("keeps the previous lead by default", () => {
    expect(parseLeadTransfer({ lead: USER })).toEqual({
      ok: true,
      data: { lead: USER, keep_previous: true },
    });
  });

  it("can drop the previous lead", () => {
    expect(parseLeadTransfer({ lead: USER, keep_previous: false })).toEqual({
      ok: true,
      data: { lead: USER, keep_previous: false },
    });
  });

  it("trims and keeps a reason", () => {
    expect(
      parseLeadTransfer({ lead: USER, reason: "  The chair is on leave.  " }),
    ).toEqual({
      ok: true,
      data: { lead: USER, keep_previous: true, reason: "The chair is on leave." },
    });
  });

  it("treats a blank reason as none", () => {
    expect(parseLeadTransfer({ lead: USER, reason: "   " })).toEqual({
      ok: true,
      data: { lead: USER, keep_previous: true },
    });
  });

  it.each([10, 500])("accepts a %i-character reason", (length) => {
    expect(parseLeadTransfer({ lead: USER, reason: "x".repeat(length) }).ok).toBe(
      true,
    );
  });

  it.each([
    [{}, "`lead` must be a valid user id"],
    [{ lead: "short" }, "`lead` must be a valid user id"],
    [{ lead: USER, keep_previous: "no" }, "`keep_previous` must be true or false"],
    [{ lead: USER, reason: 42 }, "`reason` must be text"],
    [{ lead: USER, reason: "x".repeat(9) }, "The reason must be 10 to 500 characters"],
    [{ lead: USER, reason: "x".repeat(501) }, "The reason must be 10 to 500 characters"],
    [null, "Body must be a JSON object"],
  ])("rejects %j", (body, error) => {
    expect(parseLeadTransfer(body)).toEqual({ ok: false, error });
  });
});
