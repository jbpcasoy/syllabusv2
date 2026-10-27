import { parseReviewInput } from "@/lib/validators/syllabus-review";
import { describe, expect, it } from "vitest";

describe("parseReviewInput", () => {
  it.each(["approve", "return"])("accepts %s", (decision) => {
    expect(parseReviewInput({ decision })).toEqual({
      ok: true,
      data: { decision },
    });
  });

  it.each(["reject", "", "APPROVE", undefined, 1])("rejects decision %j", (decision) => {
    expect(parseReviewInput({ decision })).toEqual({
      ok: false,
      error: "`decision` must be `approve` or `return`",
    });
  });

  it.each([null, [], "approve"])("rejects body %j", (body) => {
    expect(parseReviewInput(body)).toEqual({
      ok: false,
      error: "Body must be a JSON object",
    });
  });
});
