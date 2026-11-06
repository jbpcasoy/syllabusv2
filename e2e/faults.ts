import type { Page } from "@playwright/test";

// Network faults for UI states a healthy server never shows. `api` is a
// path ("/api/campus", exact; query strings ignored), a path pattern, or a
// predicate on the URL when the path alone is shared with other callers.

export type Api = string | RegExp | ((url: URL) => boolean);
const at = (api: Api) => (url: URL) =>
  typeof api === "string" ? url.pathname === api : api instanceof RegExp ? api.test(url.pathname) : api(url);

/** The next request to `api` (optionally only this method) answers 500. */
export async function failNext(page: Page, api: Api, method?: string) {
  let done = false;
  await page.route(
    at(api),
    async (route) => {
      if (done || (method && route.request().method() !== method)) {
        return route.fallback();
      }
      done = true;
      await route.fulfill({ status: 500, json: { error: "Injected failure" } });
    },
  );
}

/**
 * Holds requests to `api` (optionally only this method) until the
 * returned `release()` is called, so a test can look at the waiting UI.
 */
export async function hold(page: Page, api: Api, method?: string) {
  let release!: () => void;
  const released = new Promise<void>((resolve) => (release = resolve));
  await page.route(
    at(api),
    async (route) => {
      if (method && route.request().method() !== method) return route.fallback();
      await released;
      await route.fallback();
    },
  );
  return release;
}

/**
 * Rewrites list responses from `api` so the UI believes there are two
 * pages, whatever the data. Pagination and filter-reset tests use it on
 * pages that would otherwise need eleven real rows each.
 */
export async function pretendTwoPages(page: Page, api: Api) {
  await page.route(
    at(api),
    async (route) => {
      if (route.request().method() !== "GET") return route.fallback();
      try {
        const response = await route.fetch();
        const body = (await response.json()) as Record<string, unknown>;
        await route.fulfill({
          response,
          json: { ...body, totalPages: 2, totalItems: 11 },
        });
      } catch {
        // The app aborted the request (a newer one replaced it) or the
        // test ended; nobody is waiting for this response.
      }
    },
  );
}
