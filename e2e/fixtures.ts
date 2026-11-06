import { test as base } from "@playwright/test";
import path from "node:path";
import { createWorld, type World } from "./world";

export { expect } from "@playwright/test";

// One world per spec file, created on first use and shared by the file's
// tests (they run in order, in one worker). Keyed by file, so a module
// cache is enough: a worker that runs several files builds one world each.
const worlds = new Map<string, Promise<World>>();

export const test = base.extend<{ world: World }>({
  world: async ({}, provide, testInfo) => {
    let world = worlds.get(testInfo.file);
    if (!world) {
      // "01-full-chain.spec.ts" -> "full-chain"
      const name = path.basename(testInfo.file, ".spec.ts").replace(/^\d+-/, "");
      world = createWorld(name);
      worlds.set(testInfo.file, world);
    }
    await provide(await world);
  },
});
