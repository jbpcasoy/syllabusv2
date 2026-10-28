import { existsSync, readFileSync, rmSync } from "node:fs";
import { APP_URL, PB_URL, SEED_FILE, STATE_FILE } from "./env";
import { stop, waitForClosed } from "./processes";

/** Stops the app and PocketBase and deletes the throwaway database. */
export default async function globalTeardown() {
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
