import { USER_KINDS, type UserInput, type UserKind } from "@/types/user";

type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD = 8; // matches the `min` on the users.password field
export const MAX_PASSWORD = 71; // PocketBase's bcrypt limit
export const MAX_NAME = 255; // matches the `max` on the users.name field

export function isUserKind(value: unknown): value is UserKind {
  return (
    typeof value === "string" &&
    (USER_KINDS as readonly string[]).includes(value)
  );
}

export function parseUserInput(
  body: unknown,
  { partial = false }: { partial?: boolean } = {},
): ParseResult<Partial<UserInput>> {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Body must be a JSON object" };
  }

  const { email, password, name, isAdmin } = body as Record<
    string,
    unknown
  >;
  const data: Partial<UserInput> = {};

  if (email !== undefined) {
    if (typeof email !== "string" || !EMAIL.test(email.trim())) {
      return { ok: false, error: "`email` must be a valid email address" };
    }
    data.email = email.trim().toLowerCase();
  } else if (!partial) {
    return { ok: false, error: "`email` is required" };
  }

  if (password !== undefined) {
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
    data.password = password;
  } else if (!partial) {
    return { ok: false, error: "`password` is required" };
  }

  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length > MAX_NAME) {
      return {
        ok: false,
        error: `\`name\` must be a string up to ${MAX_NAME} characters`,
      };
    }
    data.name = name.trim();
  }

  if (isAdmin !== undefined) {
    if (typeof isAdmin !== "boolean") {
      return { ok: false, error: "`isAdmin` must be a boolean" };
    }
    data.isAdmin = isAdmin;
  }

  return { ok: true, data };
}
