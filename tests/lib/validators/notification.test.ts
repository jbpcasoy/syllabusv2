import { parseNotificationUpdateInput } from "@/lib/validators/notification";
import { describe, expect, it } from "vitest";

describe("parseNotificationUpdateInput", () => {
  it.each([true, false])("accepts read: %s and ignores other fields", (read) => {
    expect(
      parseNotificationUpdateInput({ read, user: "x", email_status: "sent" }),
    ).toEqual({ ok: true, data: { read } });
  });

  it.each([
    ["null body", null],
    ["missing read", {}],
    ["string read", { read: "true" }],
    ["number read", { read: 1 }],
    ["array body", [true]],
  ])("rejects %s", (_label, body) => {
    expect(parseNotificationUpdateInput(body)).toEqual({
      ok: false,
      error: expect.any(String),
    });
  });
});
