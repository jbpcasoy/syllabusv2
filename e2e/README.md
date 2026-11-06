# End-to-end tests

Playwright drives Chromium against the production build of the app and a throwaway PocketBase. Vitest never reads this folder.

```sh
npx playwright install chromium   # once
npm run test:e2e                  # build, start, seed, run, tear down
```

What `npm run test:e2e` does (`global-setup.ts`):

1. Creates a temporary data folder and runs every migration from `pb_migrations/` into it, with `pb_hooks/` loaded and S3 switched off.
2. Starts PocketBase on `127.0.0.1:8099` with the mail catcher behind it, and seeds what every spec shares (`seed.ts`): the admin, the FDIS chair, CITL director and VPAA (one active holder each, system-wide), one campus and one open term. Every user signs in with `PASSWORD` from `env.ts`.
3. Builds the app into `.next-e2e/` (never `.next/`, so a running `next dev` is safe) and starts it on `localhost:3099`.

Teardown stops both processes (the whole process tree) and deletes the data folder.

The specs share one database and run in one worker, in sequence.

## Test worlds

Each spec file gets its own world (`world.ts`), built on first use by the `world` fixture (`fixtures.ts`): a college, department and program with a chair, program reviewer, dean, lead and co-author, plus a published prospectus listing four courses on the shared term. Specs don't depend on each other's leftovers, so any one runs alone:

```sh
E2E_SKIP_BUILD=1 npx playwright test e2e/03-lead-override.spec.ts
```

Import `test` and `expect` from `./fixtures`, not `@playwright/test`. Sign in with `signIn(page, world.people.lead)`. Stages 3 to 5 and the admin are shared by every world, so their queues list other worlds' syllabi too: find rows by course code, never by position.

`arrange.ts` builds states a spec isn't about through the real API (`submitted`, `approveThrough`, `returnAt`, `reviseAndResubmit`, `fileSignedCopy`). It signs in as each actor, so sign in again before using the browser.

## Email

Global setup starts a local SMTP catcher on `127.0.0.1:2599` (`mail-catcher.ts`, built on `smtp-server` and `mailparser`) and points PocketBase's SMTP settings at it, so PocketBase sends real verification and notification emails. Each one is saved as JSON in `e2e/.mail/`. In a spec, `waitForMail(email, { subject })` waits for one and `linkIn(mail, pattern)` pulls a link out of it (`mail.ts`). Verification links open PocketBase's own confirmation page. PocketBase doesn't send a second verification email to an address it just emailed, so a test that needs a fresh link uses a fresh address.

## Faults

`faults.ts` makes states a healthy server never shows: `failNext` (one 500), `hold` (keeps a request waiting until `release()`), and `pretendTwoPages` (rewrites a list response to claim two pages). `alerts(page)` finds error alerts without Next.js's empty route announcer. A Headless UI dialog's root has no box of its own, so check that a dialog closed with `toHaveCount(0)`, not `toBeHidden()`.

## Known failures

A test that finds a real bug which isn't fixed yet is marked `test.fail(...)` with the reason, so the suite stays green and Playwright reports it as an expected failure. Once the bug is fixed the test passes, and the marker makes it fail, so remove the marker then. Current ones: Form 17's radios unreachable by Tab (`a11y-keyboard.spec.ts`), and the "Open the syllabus" link on `/verify/<code>` (`KNOWN` in `05-a11y.spec.ts`).

The three outbox email tests (`@NOT-04`, `@NOT-05`, `@NOT-06`) wait on PocketBase's once-a-minute sender and take about 6 minutes together. Skip them while iterating with `--grep-invert "NOT-0[456]"`.

## Scenario coverage

`SCENARIOS.md` lists every scenario with an ID. Put the IDs a test covers in its title (`@REV-07`). `npm run test:e2e:coverage` lists IDs with no test and fails on tags missing from the catalog; `-- --strict` also fails on uncovered IDs.

| Variable | Effect |
| --- | --- |
| `E2E_SKIP_BUILD=1` | Reuse the last `.next-e2e` build. Only safe when nothing under `app/`, `components/` or `lib/` changed. |
| `E2E_VERBOSE=1` | Print PocketBase and app stdout. |
| `E2E_KEEP_DATA=1` | Keep the temporary PocketBase folder for inspection. |
| `PB_BIN` | PocketBase binary (default `pocketbase`, as `npm run pb`). |

Only the PocketBase program is needed, once; every run makes its own throwaway database. On a machine that already runs the Docker deployment, copy the binary out of that image instead of downloading it:

```sh
cid=$(docker create syllabusv2-pocketbase:latest)
docker cp "$cid":/usr/local/bin/pocketbase ~/.local/bin/pocketbase
docker rm "$cid"
```

If a run says port 8099 or 3099 is already answering, a previous run left a process behind. On Windows, use `netstat -ano | findstr :3099` and then `taskkill /PID <pid> /T /F`.
