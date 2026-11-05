import type { Page, Request } from "@playwright/test";
import { failNext, hold, pretendTwoPages } from "./faults";
import { expect, test } from "./fixtures";
import { alerts, signIn } from "./helpers";
import type { Person } from "./world";

// The list-page conventions from AGENTS.md (UI conventions), checked on
// every manager page. Pagination and filter reset run against a rewritten
// response that claims two pages (faults.ts), so no page needs eleven
// real rows. Behaviour that needs a real save (blocking close, delete) is
// checked once, on campuses, which every manager copies.

interface ListPage {
  path: string;
  /** The list endpoint the page's table loads from. */
  api: string;
  as: Person;
  /** Accessible name of the search box, when the page has one. */
  search?: string;
  /** Has a native select filter that should reset the page to 1. */
  filter?: boolean;
  /** Has the Previous/Next pagination bar. */
  paginated?: boolean;
  /** Label of the button that opens the create modal. */
  create?: string;
  /** Narrows `api` when another part of the page calls it too. */
  only?: (url: URL) => boolean;
}

const PAGES: ListPage[] = [
  { path: "/campus", api: "/api/campus", as: "admin", search: "Search campuses", paginated: true, create: "New campus" },
  { path: "/college", api: "/api/college", as: "admin", search: "Search colleges", filter: true, paginated: true, create: "New college" },
  { path: "/dean", api: "/api/dean", as: "admin", search: "Search deans", filter: true, paginated: true, create: "Assign dean" },
  { path: "/department", api: "/api/department", as: "admin", search: "Search departments", filter: true, paginated: true, create: "New department" },
  { path: "/department-head", api: "/api/department-head", as: "admin", search: "Search department heads", filter: true, paginated: true, create: "Assign head" },
  { path: "/program", api: "/api/program", as: "admin", search: "Search programs", filter: true, paginated: true, create: "New program" },
  { path: "/program-chair", api: "/api/program-chair", as: "admin", search: "Search program chairs", filter: true, paginated: true, create: "Assign chair" },
  { path: "/program-reviewer", api: "/api/program-reviewer", as: "admin", search: "Search program reviewers", filter: true, paginated: true, create: "Assign reviewer" },
  { path: "/course", api: "/api/course", as: "admin", search: "Search courses", filter: true, paginated: true, create: "New course" },
  { path: "/prospectus", api: "/api/prospectus", as: "admin", search: "Search prospectuses", filter: true, paginated: true, create: "New prospectus" },
  { path: "/prospectus-item", api: "/api/prospectus-item", as: "admin", search: "Search prospectus items", filter: true, paginated: true, create: "New item" },
  { path: "/vpaa", api: "/api/vpaa", as: "admin", search: "Search VPAA records", filter: true, paginated: true, create: "Assign VPAA" },
  { path: "/fdis-chair", api: "/api/fdis-chair", as: "admin", search: "Search FDIS chairs", filter: true, paginated: true, create: "Assign chair" },
  { path: "/citl-director", api: "/api/citl-director", as: "admin", search: "Search CITL directors", filter: true, paginated: true, create: "Assign director" },
  { path: "/faculty", api: "/api/faculty", as: "admin", search: "Search faculty", filter: true, paginated: true, create: "Add faculty" },
  { path: "/program-join-request", api: "/api/program-join-request", as: "admin", search: "Search join requests", filter: true, paginated: true },
  { path: "/user", api: "/api/user", as: "admin", search: "Search users", filter: true, paginated: true, create: "New user" },
  { path: "/syllabus", api: "/api/syllabus", as: "lead", search: "Search syllabi", filter: true, paginated: true, create: "New syllabus" },
  { path: "/syllabus-reference", api: "/api/syllabus-reference", as: "chair", search: "Search references", filter: true, paginated: true },
  { path: "/review", api: "/api/review-queue", as: "dean", filter: true, paginated: true },
  { path: "/audit", api: "/api/audit", as: "admin", filter: true, paginated: true },
  // The header bell calls the same endpoint with its own page size.
  {
    path: "/notifications",
    api: "/api/notification",
    as: "lead",
    paginated: true,
    only: (url) => url.searchParams.get("perPage") === "10",
  },
  // School years and terms share a page and have no pagination bar.
  { path: "/school-year", api: "/api/school-year", as: "admin", create: "New school year" },
  { path: "/school-year", api: "/api/term", as: "admin", create: "New term" },
];

/** Requests from this page's own list, not filters or the header. */
const own = (p: ListPage) => (url: URL) => url.pathname === p.api && (!p.only || p.only(url));
const listRequest = (p: ListPage) => (r: Request) => r.method() === "GET" && own(p)(new URL(r.url()));

const pageParam = (r: Request) => new URL(r.url()).searchParams.get("page") ?? "1";

async function open(page: Page, p: ListPage) {
  const loaded = page.waitForResponse((r) => listRequest(p)(r.request()) && r.ok());
  await page.goto(p.path);
  await loaded;
}

/** The pagination bar that belongs to this page's list. */
const pager = (page: Page) => page.getByRole("navigation", { name: "Pagination" });

for (const p of PAGES) {
  const label = p.path === "/school-year" ? `${p.path} (${p.api})` : p.path;

  test.describe(label, () => {
    test.beforeEach(async ({ page, world }) => {
      await signIn(page, world.people[p.as]);
    });
    test.afterEach(async ({ page }) => {
      // Rewritten or held requests may still be in flight.
      await page.unrouteAll({ behavior: "ignoreErrors" });
    });

    if (p.search) {
      test(`search is debounced into one request @MGR-01`, async ({ page }) => {
        await open(page, p);
        const searches: Request[] = [];
        page.on("request", (r) => {
          if (listRequest(p)(r) && new URL(r.url()).searchParams.get("search")) searches.push(r);
        });
        const answered = page.waitForResponse(
          (r) => listRequest(p)(r.request()) && new URL(r.url()).searchParams.get("search") === "zzqxjv",
        );
        await page.getByLabel(p.search!).pressSequentially("zzqxjv", { delay: 40 });
        await answered;
        // Asserting nothing else arrives needs a pause longer than the 300 ms debounce.
        await page.waitForTimeout(500);
        expect(searches.map((r) => new URL(r.url()).searchParams.get("search"))).toEqual(["zzqxjv"]);
        await expect(page.getByText(/0 results|No .* match/).first()).toBeVisible();
      });
    }

    if (p.paginated) {
      test(`pages through with Previous and Next, 10 per page @MGR-03`, async ({ page }) => {
        await pretendTwoPages(page, own(p));
        await open(page, p);
        await expect(pager(page).getByText("Page 1 of 2")).toBeVisible();
        await expect(pager(page).getByRole("button", { name: "Previous" })).toBeDisabled();

        const next = page.waitForRequest((r) => listRequest(p)(r) && pageParam(r) === "2");
        await pager(page).getByRole("button", { name: "Next" }).click();
        expect(new URL((await next).url()).searchParams.get("perPage")).toBe("10");
        await expect(pager(page).getByText("Page 2 of 2")).toBeVisible();
        await expect(pager(page).getByRole("button", { name: "Next" })).toBeDisabled();
      });
    }

    if (p.filter && p.paginated) {
      test(`changing a filter goes back to page 1 @MGR-02`, async ({ page }) => {
        await pretendTwoPages(page, own(p));
        await open(page, p);
        const second = page.waitForResponse((r) => listRequest(p)(r.request()) && pageParam(r.request()) === "2");
        await pager(page).getByRole("button", { name: "Next" }).click();
        await second;

        // The first select filter outside any dialog, set to another option.
        const select = page.locator("main select").first();
        await expect(select).toBeEnabled();
        await expect.poll(() => select.locator("option").count()).toBeGreaterThan(1);
        const current = await select.inputValue();
        const values = await select.locator("option").evaluateAll((os) =>
          os.map((o) => (o as HTMLOptionElement).value),
        );
        const reset = page.waitForRequest((r) => listRequest(p)(r) && pageParam(r) === "1");
        await select.selectOption(values.find((v) => v !== current)!);
        await reset;
        await expect(pager(page).getByText(/Page 1 of/)).toBeVisible();
      });
    }

    test(`a failed load shows Retry, which recovers @MGR-04`, async ({ page }) => {
      await failNext(page, own(p), "GET");
      await page.goto(p.path);
      const banner = alerts(page).filter({ has: page.getByRole("button", { name: "Retry" }) });
      await expect(banner).toBeVisible();

      const recovered = page.waitForResponse((r) => listRequest(p)(r.request()) && r.ok());
      await banner.getByRole("button", { name: "Retry" }).click();
      await recovered;
      await expect(banner).toBeHidden();
    });

    test(`the table dims while loading @MGR-05`, async ({ page }) => {
      const release = await hold(page, own(p), "GET");
      await page.goto(p.path);
      const dimmed = page.locator("main .transition-opacity.opacity-50");
      await expect(dimmed.first()).toBeVisible();
      release();
      await expect(dimmed).toHaveCount(0);
    });

    if (p.create) {
      test(`a reopened create form starts empty @MGR-06`, async ({ page }) => {
        await open(page, p);
        const dialog = page.getByRole("dialog");
        const field = dialog
          .locator(
            'input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]):not([disabled]), textarea, select:not([disabled])',
          )
          .first();
        await page.getByRole("button", { name: p.create, exact: true }).click();
        const initial = await field.inputValue();

        // Change the first field: type into a text box, or pick another option.
        if ((await field.evaluate((e) => e.tagName)) === "SELECT") {
          await expect.poll(() => field.locator("option").count()).toBeGreaterThan(1);
          const values = await field
            .locator("option")
            .evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value));
          await field.selectOption(values.find((v) => v !== initial)!);
        } else {
          await field.fill("Leftover text");
        }
        await expect(field).not.toHaveValue(initial);

        // A person picker opens its options, which make the rest of the
        // dialog inert; Escape closes only the options.
        if (await dialog.locator('[aria-expanded="true"]').count()) {
          await page.keyboard.press("Escape");
        }
        await dialog.getByRole("button", { name: "Cancel" }).click();
        // The dialog root has no box of its own, so check it unmounted.
        await expect(dialog).toHaveCount(0);

        await page.getByRole("button", { name: p.create, exact: true }).click();
        await expect(field).toHaveValue(initial);
      });
    }
  });
}

test.describe("campuses (shared modal and delete behaviour)", () => {
  test.beforeEach(async ({ page, world }) => {
    await signIn(page, world.people.admin);
  });

  test("the create modal can't be closed while saving @MGR-07", async ({ page }) => {
    const name = `Hold Campus ${Date.now()}`;
    await page.goto("/campus");
    await page.getByRole("button", { name: "New campus" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Name").fill(name);

    const release = await hold(page, "/api/campus", "POST");
    await dialog.getByRole("button", { name: "Create" }).click();
    await expect(dialog.getByRole("button", { name: "Saving…" })).toBeDisabled();
    await expect(dialog.getByRole("button", { name: "Cancel" })).toBeDisabled();
    await page.keyboard.press("Escape");
    await page.mouse.click(5, 5); // the backdrop
    await expect(dialog.getByRole("button", { name: "Saving…" })).toBeVisible();

    release();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole("cell", { name, exact: true })).toBeVisible();
  });

  test("the delete dialog removes the row, and can't be closed while deleting @MGR-07 @MGR-08", async ({ page }) => {
    const name = `Delete Campus ${Date.now()}`;
    const created = await page.request.post("/api/campus", { data: { name } });
    expect(created.status()).toBe(201);
    const { id } = (await created.json()) as { id: string };

    await page.goto("/campus");
    await page.getByLabel("Search campuses").fill(name);
    // By the exact name cell: the empty state also quotes the search.
    const row = page.getByRole("row").filter({ has: page.getByRole("cell", { name, exact: true }) });
    await row.getByRole("button", { name: "Delete" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText(name);

    const release = await hold(page, `/api/campus/${id}`, "DELETE");
    await dialog.getByRole("button", { name: "Delete" }).click();
    await expect(dialog.getByRole("button", { name: "Deleting…" })).toBeDisabled();
    await page.keyboard.press("Escape");
    await expect(dialog.getByRole("button", { name: "Deleting…" })).toBeVisible();

    release();
    await expect(dialog).toHaveCount(0);
    await expect(row).toHaveCount(0);
  });

  test("deleting a campus a college uses is refused with the reason @MGR-08", async ({ page }) => {
    // Every world's college sits on the shared E2E Campus.
    await page.goto("/campus");
    await page.getByLabel("Search campuses").fill("E2E Campus");
    const row = page.getByRole("row").filter({ has: page.getByRole("cell", { name: "E2E Campus", exact: true }) });
    await row.getByRole("button", { name: "Delete" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Delete" }).click();
    await expect(alerts(dialog)).toBeVisible();
    await expect(alerts(dialog)).not.toBeEmpty();
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(row).toBeVisible();
  });
});

test("the course picker searches on the server @MGR-09", async ({ page, world }) => {
  await signIn(page, world.people.lead);
  await page.goto("/syllabus");
  await page.getByRole("button", { name: "New syllabus" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Term").selectOption({ label: world.term.label });
  await dialog.getByLabel("Program").selectOption({ label: world.program.label });

  const code = world.courses[2].code;
  const searched = page.waitForRequest((r) => new URL(r.url()).searchParams.get("search") === code);
  await dialog.getByRole("combobox", { name: "Course" }).fill(code);
  await searched;
  const listbox = page.getByRole("listbox");
  await expect(listbox.getByRole("option", { name: new RegExp(code) })).toBeVisible();
  await expect(listbox.getByRole("option")).toHaveCount(1);
});
