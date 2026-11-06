import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

// Phase 6, P7: WCAG 2.2 AA, with zero serious or critical axe violations.
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/** Waits for loading and transitions to settle, then scans the page. */
export async function expectNoSeriousViolations(page: Page, label = page.url()) {
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
  expect(serious, `${label}\n${JSON.stringify(serious, null, 2)}`).toEqual([]);
}
