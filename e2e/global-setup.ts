import { mkdtempSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  APP_PORT,
  APP_URL,
  DIST_DIR,
  MAIL_DIR,
  MAIL_PORT,
  PB_BIN,
  PB_PORT,
  PB_URL,
  ROOT,
  SEED_FILE,
  STATE_FILE,
  SUPERUSER,
} from "./env";
import globalTeardown from "./global-teardown";
import { startMailCatcher } from "./mail-catcher";
import { assertPortFree, run, start, waitFor } from "./processes";
import { adminPb, seedGlobal } from "./seed";

/**
 * A throwaway PocketBase (every migration from scratch, hooks loaded), a
 * local mail catcher it sends through, and the production build of the
 * app, wired to each other. Set E2E_SKIP_BUILD=1
 * to reuse the last .next-e2e build.
 */
export default async function globalSetup() {
  await assertPortFree(`${PB_URL}/api/health`);
  await assertPortFree(APP_URL);
  try {
    await startEverything();
  } catch (error) {
    // Don't leave PocketBase or the app holding a port for the next run.
    await globalTeardown();
    throw error;
  }
}

async function startEverything() {
  const dataDir = mkdtempSync(path.join(os.tmpdir(), "syllabus-e2e-"));
  const pbArgs = [
    `--dir=${dataDir}`,
    `--migrationsDir=${path.join(ROOT, "pb_migrations")}`,
    `--hooksDir=${path.join(ROOT, "pb_hooks")}`,
  ];
  // Never let the throwaway database talk to a real bucket.
  const pbEnv = {
    S3_BUCKET: "",
    APP_URL,
  };

  run(PB_BIN, ["migrate", "up", ...pbArgs], pbEnv);
  run(PB_BIN, ["superuser", "upsert", SUPERUSER.email, SUPERUSER.password, ...pbArgs], pbEnv);
  const pocketbase = start("pb", PB_BIN, ["serve", `--http=127.0.0.1:${PB_PORT}`, ...pbArgs], pbEnv);
  // Teardown needs the pids even if a later step fails.
  const state = { dataDir, pocketbase: pocketbase.pid, app: undefined as number | undefined };
  writeFileSync(STATE_FILE, JSON.stringify(state));
  await waitFor(`${PB_URL}/api/health`, 30_000);

  // Real emails: verification links and notifications land in MAIL_DIR.
  await startMailCatcher(MAIL_DIR, MAIL_PORT);
  await (await adminPb()).settings.update({
    meta: {
      appName: "Syllabus E2E",
      // Verification links point at PocketBase's own confirmation page.
      appURL: PB_URL,
      senderName: "Syllabus E2E",
      senderAddress: "no-reply@buksu.edu.ph",
    },
    smtp: { enabled: true, host: "127.0.0.1", port: MAIL_PORT, tls: false },
  });

  writeFileSync(SEED_FILE, JSON.stringify(await seedGlobal(), null, 2));

  const appEnv = {
    NEXT_DIST_DIR: DIST_DIR,
    POCKETBASE_URL: PB_URL,
    POCKETBASE_SUPERUSER_EMAIL: SUPERUSER.email,
    POCKETBASE_SUPERUSER_PASSWORD: SUPERUSER.password,
    ALLOWED_EMAIL_DOMAINS: "buksu.edu.ph",
  };
  if (!process.env.E2E_SKIP_BUILD) run("npx", ["next", "build"], appEnv);
  const app = start("app", "npx", ["next", "start", "-p", String(APP_PORT)], appEnv);
  state.app = app.pid;
  writeFileSync(STATE_FILE, JSON.stringify(state));
  await waitFor(`${APP_URL}/login`, 60_000);
}
