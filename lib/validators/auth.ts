import {
  EMAIL,
  MAX_NAME,
  MAX_PASSWORD,
  MIN_PASSWORD,
} from "@/lib/validators/user";
import type { RegisterInput } from "@/types/user";

type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

export type ParsedRegistration = Pick<
  RegisterInput,
  "name" | "email" | "password"
>;

/** Used when ALLOWED_EMAIL_DOMAINS is unset, so registration is never wide open by accident. */
export const DEFAULT_EMAIL_DOMAINS = ["buksu.edu.ph"];

/** Parses a comma-separated domain list such as "buksu.edu.ph, example.edu". */
export function parseDomainList(value: string | undefined): string[] {
  const domains = (value ?? "")
    .split(",")
    .map((d) => d.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);
  return domains.length > 0 ? domains : DEFAULT_EMAIL_DOMAINS;
}

/**
 * Deliberately ignores `isAdmin` and any other field: self-registration can't grant access.
 * The email must belong to one of `allowedDomains` (exact match, no subdomains).
 */
export function parseRegisterInput(
  body: unknown,
  allowedDomains: readonly string[],
): ParseResult<ParsedRegistration> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Body must be a JSON object" };
  }

  const { name, email, password, passwordConfirm } = body as Record<
    string,
    unknown
  >;

  if (
    typeof name !== "string" ||
    name.trim() === "" ||
    name.trim().length > MAX_NAME
  ) {
    return {
      ok: false,
      error: `\`name\` must be a non-empty string up to ${MAX_NAME} characters`,
    };
  }

  if (typeof email !== "string" || !EMAIL.test(email.trim())) {
    return { ok: false, error: "`email` must be a valid email address" };
  }

  if (
    typeof password !== "string" ||
    password.length < MIN_PASSWORD ||
    password.length > MAX_PASSWORD
  ) {
    return {
      ok: false,
      error: `\`password\` must be between ${MIN_PASSWORD} and ${MAX_PASSWORD} characters`,
    };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const domain = normalizedEmail.slice(normalizedEmail.lastIndexOf("@") + 1);
  if (!allowedDomains.includes(domain)) {
    return {
      ok: false,
      error: `Use your institutional email (${allowedDomains.map((d) => `@${d}`).join(", ")})`,
    };
  }

  if (password !== passwordConfirm) {
    return { ok: false, error: "Passwords do not match" };
  }

  return {
    ok: true,
    data: {
      name: name.trim(),
      email: normalizedEmail,
      password,
    },
  };
}
