import { parseUserInput } from "@/lib/validators/user";
import { describe, expect, it } from "vitest";

const base = { email: "a@example.com", password: "supersecret" };

describe("parseUserInput isAdmin", () => {
  it("accepts true and false", () => {
    for (const isAdmin of [true, false]) {
      const result = parseUserInput({ ...base, isAdmin });
      expect(result).toEqual({
        ok: true,
        data: expect.objectContaining({ isAdmin }),
      });
    }
  });

  it("leaves isAdmin out when not provided", () => {
    const result = parseUserInput(base);
    expect(result.ok && "isAdmin" in result.data).toBe(false);
  });

  it.each(["true", 1, null, {}])("rejects non-boolean %s", (isAdmin) => {
    expect(parseUserInput({ ...base, isAdmin })).toEqual({
      ok: false,
      error: "`isAdmin` must be a boolean",
    });
  });

  it("works with partial updates", () => {
    expect(parseUserInput({ isAdmin: true }, { partial: true })).toEqual({
      ok: true,
      data: { isAdmin: true },
    });
  });
});
