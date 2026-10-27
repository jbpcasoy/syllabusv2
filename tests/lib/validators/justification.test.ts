import {
  parseJustificationInput,
  parseJustificationReturn,
} from "@/lib/validators/justification";
import { describe, expect, it } from "vitest";

const ANA = "anaanaanaanaana";
const BEN = "benbenbenbenben";

describe("parseJustificationInput", () => {
  it("trims reasons", () => {
    expect(
      parseJustificationInput({
        entries: [
          { author: ANA, reason: "  On official leave. " },
          { author: BEN, reason: "Retired." },
        ],
      }),
    ).toEqual({
      ok: true,
      data: {
        entries: [
          { author: ANA, reason: "On official leave." },
          { author: BEN, reason: "Retired." },
        ],
      },
    });
  });

  it("accepts an empty list (which deletes a draft)", () => {
    expect(parseJustificationInput({ entries: [] })).toEqual({
      ok: true,
      data: { entries: [] },
    });
  });

  it.each([
    [{}, "`entries` must be a list of authors and reasons"],
    [{ entries: [null] }, "Each entry must be an object"],
    [{ entries: [{ author: "x", reason: "r" }] }, "Each entry needs a valid `author` id"],
    [{ entries: [{ author: ANA, reason: " " }] }, "Each author needs a reason"],
    [{ entries: [{ author: ANA }] }, "Each author needs a reason"],
    [
      { entries: [{ author: ANA, reason: "a" }, { author: ANA, reason: "b" }] },
      "Each author can be listed once",
    ],
    [{ entries: [{ author: ANA, reason: "x".repeat(2001) }] }, "Reasons must be at most 2000 characters"],
    [null, "Body must be a JSON object"],
  ])("rejects %j", (body, error) => {
    expect(parseJustificationInput(body)).toEqual({ ok: false, error });
  });
});

describe("parseJustificationReturn", () => {
  it("parses a return with a trimmed reason", () => {
    expect(parseJustificationReturn({ action: "return", reason: " Wrong term. " })).toEqual({
      ok: true,
      data: { reason: "Wrong term." },
    });
  });

  it.each([
    [{ reason: "x" }, "`action` must be `return`"],
    [{ action: "return" }, "Give a reason for returning the justification"],
    [{ action: "return", reason: "x".repeat(501) }, "`reason` must be at most 500 characters"],
    [[], "Body must be a JSON object"],
  ])("rejects %j", (body, error) => {
    expect(parseJustificationReturn(body)).toEqual({ ok: false, error });
  });
});
