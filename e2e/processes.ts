import { execFileSync, spawn, type ChildProcess } from "node:child_process";

// Windows runs npx through its .cmd shim, which needs a shell. Binaries
// given by path (PocketBase) run directly.
const needsShell = (command: string) =>
  process.platform === "win32" && command === "npx";

/** Starts a long-running command; output goes to the console with a prefix. */
export function start(
  label: string,
  command: string,
  args: string[],
  env: Record<string, string> = {},
): ChildProcess {
  const child = spawn(command, args, {
    env: { ...process.env, ...env },
    shell: needsShell(command),
    stdio: ["ignore", "pipe", "pipe"],
  });
  const log = (chunk: Buffer) => {
    if (process.env.E2E_VERBOSE) process.stdout.write(`[${label}] ${chunk}`);
  };
  child.stdout?.on("data", log);
  child.stderr?.on("data", (chunk: Buffer) => process.stderr.write(`[${label}] ${chunk}`));
  return child;
}

/** Runs a command to completion, throwing on a non-zero exit. */
export function run(command: string, args: string[], env: Record<string, string> = {}) {
  execFileSync(command, args, {
    env: { ...process.env, ...env },
    shell: needsShell(command),
    stdio: "inherit",
  });
}

/**
 * Kills a process and its children. On Windows a plain kill leaves
 * `next start`'s child node process holding the port, so kill the tree.
 */
export function stop(pid: number | undefined) {
  if (!pid) return;
  try {
    if (process.platform === "win32") {
      execFileSync("taskkill", ["/PID", String(pid), "/T", "/F"], { stdio: "ignore" });
    } else {
      process.kill(pid, "SIGTERM");
    }
  } catch {
    // Already gone.
  }
}

/** Polls a URL until it answers below 500, or throws after `timeoutMs`. */
export async function waitFor(url: string, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs;
  let last = "no answer";
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { redirect: "manual" });
      if (res.status < 500) return;
      last = `HTTP ${res.status}`;
    } catch (error) {
      last = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`${url} not ready after ${timeoutMs} ms (${last})`);
}

/** Polls until nothing answers at `url`, giving up quietly after `timeoutMs`. */
export async function waitForClosed(url: string, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      await fetch(url, { redirect: "manual" });
    } catch {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
}

/** Fails fast when something else already holds the port. */
export async function assertPortFree(url: string) {
  try {
    await fetch(url, { redirect: "manual" });
  } catch {
    return;
  }
  throw new Error(
    `${url} is already answering. Stop the leftover process (see e2e/README.md) and run again.`,
  );
}
