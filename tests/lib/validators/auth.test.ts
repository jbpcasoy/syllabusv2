import {
  DEFAULT_EMAIL_DOMAINS,
  parseDomainList,
  parseRegisterInput,
} from "@/lib/validators/auth";
import { describe, expect, it } from "vitest";

describe("parseDomainList", () => {
  it("falls back to the institutional domain when unset or blank", () => {
    expect(parseDomainList(undefined)).toEqual(DEFAULT_EMAIL_DOMAINS);
    expect(parseDomainList(" , ")).toEqual(DEFAULT_EMAIL_DOMAINS);
    expect(DEFAULT_EMAIL_DOMAINS).toEqual(["buksu.edu.ph"]);
  });

  it("trims, lowercases and drops a leading @", () => {
    expect(parseDomainList(" @BukSU.edu.ph, example.EDU ")).toEqual([
      "buksu.edu.ph",
      "example.edu",
    ]);
  });
});

describe("parseRegisterInput domain check", () => {
  const body = {
    name: "Juan",
    password: "supersecret",
    passwordConfirm: "supersecret",
  };
  const domains = ["buksu.edu.ph"];

  it("accepts the allowed domain case-insensitively", () => {
    const result = parseRegisterInput(
      { ...body, email: "Juan@BUKSU.edu.ph" },
      domains,
    );
    expect(result).toEqual({
      ok: true,
      data: { name: "Juan", email: "juan@buksu.edu.ph", password: "supersecret" },
    });
  });

  it.each([
    "juan@gmail.com",
    "juan@student.buksu.edu.ph", // subdomains are not implied
    "juan@buksu.edu.ph.evil.com",
  ])("rejects %s", (email) => {
    const result = parseRegisterInput({ ...body, email }, domains);
    expect(result).toEqual({
      ok: false,
      error: "Use your institutional email (@buksu.edu.ph)",
    });
  });
});
