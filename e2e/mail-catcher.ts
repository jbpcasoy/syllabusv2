import { simpleParser, type AddressObject } from "mailparser";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { SMTPServer } from "smtp-server";

/** What a test sees of a caught email. */
export interface CaughtMail {
  /** Lower-case recipient addresses. */
  to: string[];
  from: string;
  subject: string;
  text: string;
  html: string;
  /** ISO time the catcher received it. */
  receivedAt: string;
}

let server: SMTPServer | undefined;
let count = 0;

const addresses = (field: AddressObject | AddressObject[] | undefined) =>
  (Array.isArray(field) ? field : field ? [field] : [])
    .flatMap((group) => group.value)
    .map((a) => (a.address ?? "").toLowerCase());

/**
 * Accepts every message on 127.0.0.1:`port` and writes it, parsed, as one
 * JSON file in `dir`. Global setup and the test workers are separate
 * processes, so files are how tests read the mail. No TLS and no auth:
 * PocketBase's SMTP settings use neither.
 */
export async function startMailCatcher(dir: string, port: number) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  server = new SMTPServer({
    disabledCommands: ["STARTTLS", "AUTH"],
    authOptional: true,
    logger: false,
    async onData(stream, _session, callback) {
      try {
        const mail = await simpleParser(stream);
        const caught: CaughtMail = {
          to: addresses(mail.to),
          from: addresses(mail.from)[0] ?? "",
          subject: mail.subject ?? "",
          text: mail.text ?? "",
          html: typeof mail.html === "string" ? mail.html : "",
          receivedAt: new Date().toISOString(),
        };
        count += 1;
        const name = `${Date.now()}-${String(count).padStart(4, "0")}.json`;
        writeFileSync(path.join(dir, name), JSON.stringify(caught, null, 2));
        callback();
      } catch (error) {
        callback(error as Error);
      }
    },
  });
  await new Promise<void>((resolve, reject) => {
    server!.once("error", reject);
    server!.listen(port, "127.0.0.1", () => resolve());
  });
}

export async function stopMailCatcher() {
  if (!server) return;
  await new Promise<void>((resolve) => server!.close(() => resolve()));
  server = undefined;
}
