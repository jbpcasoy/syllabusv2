import { isStage, parseStandInInput } from "@/lib/validators/syllabus-stand-in";
import { describe, expect, it } from "vitest";

const USER = "useruseruseruse";

describe("isStage", () => {
  it.each([1, 2, 3, 4, 5])("accepts %i", (stage) => {
    expect(isStage(stage)).toBe(true);
  });

  it.each([0, 6, 1.5, "1", null, undefined])("rejects %j", (stage) => {
    expect(isStage(stage)).toBe(false);
  });
});

describe("parseStandInInput", () => {
  it("accepts a stage and a user", () => {
    expect(parseStandInInput({ stage: 1, user: USER })).toEqual({
      ok: true,
      data: { stage: 1, user: USER },
    });
  });

  it("accepts null to clear the stage", () => {
    expect(parseStandInInput({ stage: 4, user: null })).toEqual({
      ok: true,
      data: { stage: 4, user: null },
    });
  });

  it.each([0, 6, 2.5, "2", undefined])("rejects stage %j", (stage) => {
    expect(parseStandInInput({ stage, user: USER })).toEqual({
      ok: false,
      error: "`stage` must be a whole number from 1 to 5",
    });
  });

  it.each(["short", "UPPERCASEUPPERC", 1, undefined, ""])(
    "rejects user %j",
    (user) => {
      expect(parseStandInInput({ stage: 1, user })).toEqual({
        ok: false,
        error: "`user` must be a valid user id or null",
      });
    },
  );

  it.each([null, [], "x"])("rejects body %j", (body) => {
    expect(parseStandInInput(body)).toEqual({
      ok: false,
      error: "Body must be a JSON object",
    });
  });
});
