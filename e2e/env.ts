import { existsSync } from "node:fs";
import path from "node:path";

/** Ports and paths shared by the e2e harness and specs. */
export const PB_PORT = 8099;
export const APP_PORT = 3099;
export const PB_URL = `http://127.0.0.1:${PB_PORT}`;
// localhost, not 127.0.0.1: `next start` sets a Secure session cookie,
// which Chromium accepts over plain http only on localhost.
export const APP_URL = `http://localhost:${APP_PORT}`;

export const SUPERUSER = {
  email: "e2e-superuser@example.com",
  password: "e2e-superuser-password",
};
/** Every seeded user signs in with this. */
export const PASSWORD = "e2e-password-123";

export const ROOT = path.resolve(__dirname, "..");
/** Written by global setup, read by specs and teardown. Git-ignored. */
export const STATE_FILE = path.join(ROOT, "e2e", ".state.json");
export const SEED_FILE = path.join(ROOT, "e2e", ".seed.json");
/** Separate from .next so a running `next dev` is never overwritten. */
export const DIST_DIR = ".next-e2e";

/**
 * The binary `npm run pb` uses: the repo's own pocketbase(.exe) when there
 * is one, otherwise `pocketbase` on PATH. Override with PB_BIN.
 */
const LOCAL_PB = path.join(ROOT, process.platform === "win32" ? "pocketbase.exe" : "pocketbase");
export const PB_BIN = process.env.PB_BIN || (existsSync(LOCAL_PB) ? LOCAL_PB : "pocketbase");
