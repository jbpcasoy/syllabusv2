import { parsePointInput, parsePointUpdate } from "@/lib/validators/form18";
import { describe, expect, it } from "vitest";

describe("parsePointInput", () => {
  it("trims and defaults the optional fields", () => {
    expect(parsePointInput({ review_point: "  Fix CO 2 verb. " })).toEqual({
      ok: true,
      data: { review_point: "Fix CO 2 verb.", code: "", remarks: "" },
    });
    expect(
      parsePointInput({ review_point: "x", code: " B.3 ", remarks: " see p.4 " }),
    ).toEqual({
      ok: true,
      data: { review_point: "x", code: "B.3", remarks: "see p.4" },
    });
  });

  it.each([
    [{}, "`review_point` is required"],
    [{ review_point: "   " }, "`review_point` is required"],
    [{ review_point: 1 }, "`review_point` must be text"],
    [{ review_point: "x".repeat(2001) }, "`review_point` must be at most 2000 characters"],
    [{ review_point: "x", code: "B.3.1.1.1.1" }, "`code` must be at most 10 characters"],
    [{ review_point: "x", remarks: [] }, "`remarks` must be text"],
    [null, "Body must be a JSON object"],
  ])("rejects %j", (body, error) => {
    expect(parsePointInput(body)).toEqual({ ok: false, error });
  });
});

describe("parsePointUpdate", () => {
  it("parses an edit", () => {
    expect(parsePointUpdate({ action: "edit", review_point: "New" })).toEqual({
      ok: true,
      data: { action: "edit", review_point: "New", code: "", remarks: "" },
    });
  });

  it("parses a response", () => {
    expect(
      parsePointUpdate({ action: "respond", action_taken: " Rewrote CO 2. ", page_number: " 4 " }),
    ).toEqual({
      ok: true,
      data: { action: "respond", action_taken: "Rewrote CO 2.", page_number: "4" },
    });
  });

  it("parses a judgement, with or without remarks", () => {
    expect(parsePointUpdate({ action: "judge", status: "resolved" })).toEqual({
      ok: true,
      data: { action: "judge", status: "resolved" },
    });
    expect(
      parsePointUpdate({ action: "judge", status: "unresolved", remarks: " Still vague. " }),
    ).toEqual({
      ok: true,
      data: { action: "judge", status: "unresolved", remarks: "Still vague." },
    });
  });

  it.each([
    [{ action: "respond" }, "`action_taken` is required"],
    [{ action: "respond", action_taken: "x", page_number: "x".repeat(51) }, "`page_number` must be at most 50 characters"],
    [{ action: "judge", status: "open" }, "`status` must be `resolved` or `unresolved`"],
    [{ action: "edit" }, "`review_point` is required"],
    [{ action: "delete" }, "`action` must be `edit`, `respond` or `judge`"],
    [{}, "`action` must be `edit`, `respond` or `judge`"],
    [[], "Body must be a JSON object"],
  ])("rejects %j", (body, error) => {
    expect(parsePointUpdate(body)).toEqual({ ok: false, error });
  });
});
