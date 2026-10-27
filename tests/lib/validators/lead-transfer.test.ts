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

  it.each([
    [{}, "`lead` must be a valid user id"],
    [{ lead: "short" }, "`lead` must be a valid user id"],
    [{ lead: USER, keep_previous: "no" }, "`keep_previous` must be true or false"],
    [null, "Body must be a JSON object"],
  ])("rejects %j", (body, error) => {
    expect(parseLeadTransfer(body)).toEqual({ ok: false, error });
  });
});
