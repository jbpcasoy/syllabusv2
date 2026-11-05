import { existsSync, readFileSync, rmSync } from "node:fs";
import { APP_URL, MAIL_DIR, PB_URL, SEED_FILE, STATE_FILE } from "./env";
import { stopMailCatcher } from "./mail-catcher";
import { stop, waitForClosed } from "./processes";

/** Stops the app, PocketBase and the mail catcher and deletes the throwaway data. */
export default async function globalTeardown() {
  await stopMailCatcher();
  if (!process.env.E2E_KEEP_DATA) rmSync(MAIL_DIR, { recursive: true, force: true });
  if (!existsSync(STATE_FILE)) return;
  const state = JSON.parse(readFileSync(STATE_FILE, "utf8")) as {
    dataDir?: string;
    pocketbase?: number;
    app?: number;
  };
  stop(state.app);
  stop(state.pocketbase);
  await waitForClosed(APP_URL, 15_000);
  await waitForClosed(`${PB_URL}/api/health`, 15_000);

  if (state.dataDir && !process.env.E2E_KEEP_DATA) {
    try {
      // Windows can hold the SQLite files for a moment after the process dies.
      rmSync(state.dataDir, { recursive: true, force: true, maxRetries: 20, retryDelay: 500 });
    } catch (error) {
      console.warn(`Could not delete ${state.dataDir}; remove it by hand.`, error);
    }
  }
  rmSync(STATE_FILE, { force: true });
  rmSync(SEED_FILE, { force: true });
}
