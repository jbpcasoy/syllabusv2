import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { approveThrough, fileSignedCopy, returnAt, reviseAndResubmit, submitted } from "./arrange";
import { expect, test } from "./fixtures";
import { signIn } from "./helpers";
import type { Person, World } from "./world";

// Phase 6, P7: WCAG 2.2 AA, with zero serious or critical axe violations on
// each page, opened by a role that can use it. Arranges its own syllabi:
// one filed, and one returned by the dean and resubmitted (back at stage 2).
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
    test(`${path} @A11Y-01`, async ({ page }) => {
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

// Arranged once, on first use, for every test in this file.
let arranged: Promise<{ chain: string; revise: string }> | undefined;
function syllabi(page: Page, world: World) {
  arranged ??= (async () => {
    const chain = await submitted(page, world, world.courses[0]);
    await approveThrough(page, world, chain, 1, 5);
    await fileSignedCopy(page, world, chain);

    const revise = await submitted(page, world, world.courses[1]);
    await approveThrough(page, world, revise, 1, 1);
    await returnAt(page, world, revise, 2, "Align the course outcomes with the program outcomes.");
    await reviseAndResubmit(page, world, revise);
    return { chain, revise };
  })();
  return arranged;
}

for (const [person, paths] of PAGES) {
  test.describe(`as ${person}`, () => {
    for (const path of paths) {
      test(`${path} @A11Y-01`, async ({ page, world }) => {
        const ids = await syllabi(page, world);
        await signIn(page, world.people[person]);
        await page.goto(path.replace("{chain}", ids.chain).replace("{revise}", ids.revise));
        await expectNoSeriousViolations(page);
      });
    }
  });
}
