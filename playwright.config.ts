import { defineConfig, devices } from "@playwright/test";
import { APP_URL } from "./e2e/env";

// End-to-end run (Phase 6): a throwaway PocketBase on 8099 and the built app
// on 3099, both started by e2e/global-setup.ts. The specs share one
// database and walk one syllabus through the chain in order, so they run
// serially in a single worker.
export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.spec.ts",
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: APP_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
