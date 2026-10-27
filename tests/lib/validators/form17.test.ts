import { parseForm17Input } from "@/lib/validators/form17";
import { describe, expect, it } from "vitest";

describe("parseForm17Input", () => {
  it("accepts answers and trims remarks and suggestions", () => {
    expect(
      parseForm17Input({
        answers: [
          { criterion: "A1", answer: "yes" },
          { criterion: "F6", answer: "no", remarks: "  Only 3 references. " },
        ],
        suggestions: "  Add references. ",
      }),
    ).toEqual({
      ok: true,
      data: {
        answers: [
          { criterion: "A1", answer: "yes", remarks: "" },
          { criterion: "F6", answer: "no", remarks: "Only 3 references." },
        ],
        suggestions: "Add references.",
      },
    });
  });

  it("accepts suggestions alone and leaves them out when omitted", () => {
    expect(parseForm17Input({ answers: [], suggestions: "" })).toEqual({
      ok: true,
      data: { answers: [], suggestions: "" },
    });
    const result = parseForm17Input({
      answers: [{ criterion: "A1", answer: "yes" }],
    });
    expect(result.ok && "suggestions" in result.data).toBe(false);
  });

  it.each([
    [{ answers: [] }, "Nothing to save"],
    [{ answers: "A1" }, "`answers` must be a list of criterion answers"],
    [{ answers: [null] }, "Each answer must be an object"],
    [{ answers: [{ criterion: "Z9", answer: "yes" }] }, "Unknown criterion: Z9"],
    [{ answers: [{ criterion: "a1", answer: "yes" }] }, "Unknown criterion: a1"],
    [
      { answers: [{ criterion: "A1", answer: "yes" }, { criterion: "A1", answer: "no", remarks: "x" }] },
      "Criterion A1 is listed twice",
    ],
    [{ answers: [{ criterion: "A1", answer: "maybe" }] }, "Criterion A1 must be answered `yes` or `no`"],
    [{ answers: [{ criterion: "A1", answer: "no" }] }, 'A "No" on A1 needs remarks'],
    [{ answers: [{ criterion: "A1", answer: "no", remarks: "   " }] }, 'A "No" on A1 needs remarks'],
    [{ answers: [{ criterion: "A1", answer: "yes", remarks: 5 }] }, "Remarks for A1 must be text"],
    [
      { answers: [{ criterion: "A1", answer: "yes", remarks: "x".repeat(2001) }] },
      "Remarks for A1 must be at most 2000 characters",
    ],
    [{ answers: [], suggestions: 1 }, "`suggestions` must be text"],
    [{ answers: [], suggestions: "x".repeat(5001) }, "`suggestions` must be at most 5000 characters"],
    [null, "Body must be a JSON object"],
  ])("rejects %j", (body, error) => {
    expect(parseForm17Input(body)).toEqual({ ok: false, error });
  });

  it("rejects more answers than the form has criteria", () => {
    const answers = Array.from({ length: 44 }, () => ({
      criterion: "A1",
      answer: "yes",
    }));
    expect(parseForm17Input({ answers }).ok).toBe(false);
  });
});
