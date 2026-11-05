// Scenario coverage: which IDs in e2e/SCENARIOS.md have a test tagged with
// them (`@REV-07` in the test title). Fails on a tag that isn't in the
// catalog; with --strict, also on catalog IDs that have no test.
//
//   npm run test:e2e:coverage [-- --strict]
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const dir = import.meta.dirname;
const ID = /[A-Z][A-Z0-9]*-\d+[a-z]?/;

const catalog = new Map<string, string>();
for (const line of readFileSync(path.join(dir, "SCENARIOS.md"), "utf8").split("\n")) {
  const match = line.match(new RegExp(`^- (${ID.source}) (.*)$`));
  if (match) catalog.set(match[1], match[2]);
}

const covered = new Map<string, string[]>();
for (const file of readdirSync(dir).filter((f) => f.endsWith(".spec.ts"))) {
  const source = readFileSync(path.join(dir, file), "utf8");
  for (const [, id] of source.matchAll(new RegExp(`@(${ID.source})\\b`, "g"))) {
    covered.set(id, [...new Set([...(covered.get(id) ?? []), file])]);
  }
}

const unknown = [...covered.keys()].filter((id) => !catalog.has(id));
const missing = [...catalog.keys()].filter((id) => !covered.has(id));

console.log(`Scenarios covered: ${catalog.size - missing.length} of ${catalog.size}`);
if (missing.length) {
  console.log(`\nNo test yet (${missing.length}):`);
  for (const id of missing) console.log(`  ${id}  ${catalog.get(id)}`);
}
if (unknown.length) {
  console.error(`\nTags not in e2e/SCENARIOS.md:`);
  for (const id of unknown) console.error(`  @${id}  in ${covered.get(id)!.join(", ")}`);
}

const strict = process.argv.includes("--strict");
process.exit(unknown.length || (strict && missing.length) ? 1 : 0);
