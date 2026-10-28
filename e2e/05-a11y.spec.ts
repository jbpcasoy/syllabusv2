import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { findSyllabusId, loadSeed, signIn } from "./helpers";
import type { Person } from "./seed";

// Phase 6, P7: WCAG 2.2 AA, with zero serious or critical axe violations on
// each page, opened by a role that can use it. Runs last, so the earlier
// specs have left syllabi in every state.
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function expectNoSeriousViolations(page: Page) {
  // Let client managers finish loading so their tables are scanned too,
  // and let the loading fade (opacity-50 → 100) end: axe measures contrast
  // mid-transition otherwise.
  await page.waitForLoadState("networkidle");
  await page.waitForFunction(() =>
    document.getAnimations().every((a) => a.playState !== "running"),
  );
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const serious = violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.slice(0, 5).map((n) => ({
        target: n.target.join(" "),
        html: n.html.slice(0, 200),
        summary: n.failureSummary,
      })),
    }));
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
}

test.describe("signed out", () => {
  for (const path of ["/login", "/register"]) {
    test(path, async ({ page }) => {
      await page.goto(path);
      await expectNoSeriousViolations(page);
    });
  }
});

/** Pages per role; `{chain}` and `{revise}` become syllabus ids. */
const PAGES: [Person, string[]][] = [
  ["lead", ["/syllabus", "/syllabus/{chain}", "/syllabus/{revise}/revise", "/notifications"]],
  ["dean", ["/review", "/syllabus/{revise}/review", "/dashboard"]],
  ["admin", ["/audit", "/college", "/program-chair", "/fdis-chair", "/prospectus"]],
];

for (const [person, paths] of PAGES) {
  test.describe(`as ${person}`, () => {
    for (const path of paths) {
      test(path, async ({ page }) => {
        const seed = loadSeed();
        await signIn(page, "lead");
        const ids = {
          chain: await findSyllabusId(page, seed.courses.chain.code),
          revise: await findSyllabusId(page, seed.courses.revise.code),
        };
        await signIn(page, person);
        await page.goto(path.replace("{chain}", ids.chain).replace("{revise}", ids.revise));
        await expectNoSeriousViolations(page);
      });
    }
  });
}
