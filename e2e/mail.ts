import { expect } from "@playwright/test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { MAIL_DIR } from "./env";
import type { CaughtMail } from "./mail-catcher";

export type { CaughtMail };

/** Every email caught for `email`, oldest first. */
export function inbox(email: string): CaughtMail[] {
  if (!existsSync(MAIL_DIR)) return [];
  return readdirSync(MAIL_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => JSON.parse(readFileSync(path.join(MAIL_DIR, f), "utf8")) as CaughtMail)
    .filter((m) => m.to.includes(email.toLowerCase()));
}

/**
 * Waits for the `nth` email (1-based) to `email` whose subject matches,
 * and returns it. Pass the count seen before an action to wait for the
 * next one.
 */
export async function waitForMail(
  email: string,
  options: { subject?: RegExp; nth?: number; timeout?: number } = {},
): Promise<CaughtMail> {
  const { subject = /./, nth = 1, timeout = 15_000 } = options;
  const matching = () => inbox(email).filter((m) => subject.test(m.subject));
  await expect
    .poll(() => matching().length, {
      message: `email ${nth} to ${email} matching ${subject}`,
      timeout,
    })
    .toBeGreaterThanOrEqual(nth);
  return matching()[nth - 1];
}

/** The first link in the email (HTML first, then text) matching `pattern`. */
export function linkIn(mail: CaughtMail, pattern: RegExp): string {
  const hrefs = [...mail.html.matchAll(/href="([^"]+)"/g)].map((m) =>
    m[1].replaceAll("&amp;", "&"),
  );
  const bare = mail.text.match(/https?:\/\/\S+/g) ?? [];
  const link = [...hrefs, ...bare].find((l) => pattern.test(l));
  expect(link, `link matching ${pattern} in "${mail.subject}"`).toBeTruthy();
  return link!;
}
