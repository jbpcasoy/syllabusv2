# Plan: automated frontend (end-to-end) coverage

Status: agreed. All decisions in section 7 are made. Nothing here is built yet.

## 1. Goal and boundaries

Automate every user-facing scenario in the system: everything `docs/feature-walkthrough.md` asks a person to click through (Parts 1–11), plus the UI conventions in `AGENTS.md` (managers, modals, error states, accessibility).

**Split of responsibility with Vitest.** The 149 route tests already cover every 400, 401, 403 and 409 branch, and scope permutations. E2E does not repeat each permutation. It checks what only a browser can show:

- the flow works end to end through the real UI, PocketBase and hooks
- each role sees the right navigation, controls and read-only states
- refusals reach the user as readable `role="alert"` messages
- the UI conventions hold (search, filters, pagination, retry, remount, block close while saving)
- accessibility (axe, keyboard, zoom)

Rule (decided): one E2E test per *scenario*, not per *branch*, plus two additions that close the gap Vitest can't see (it mocks PocketBase and auth):

1. **Navigation per role (NAV-01).** One test per role asserts the exact menu items, written out by hand.
2. **One allowed and one refused role per action button.** The allowed role is never admin, since admin passes every check and would hide a wrong one. The refused role checks the control is absent (or the page refuses), not just the API.

Everything else in a permission rule (other allowed roles, out-of-scope variants, each 400/403/409) stays in the Vitest route and capability tests.

## 2. What exists today

- Playwright + axe, `npm run test:e2e`, throwaway PocketBase on 8099, production build on 3099 (`e2e/global-setup.ts`).
- One shared seed (`e2e/seed.ts`): one college chain, nine users, four courses.
- Five specs, run serially in file order and depending on each other's leftovers: full chain, return and resubmit, lead override, upload limit, axe on 15 pages.
- No CI workflow.

That order coupling is the main thing to change before adding ~150 tests: one failure today makes every spec after it fail.

## 3. Architecture changes

### 3.1 Isolated worlds instead of one shared seed

Replace the single seed with a factory, `createWorld(name, options)`, that builds a fresh, namespaced org per spec file (or per test where needed): its own campus, college, department, program(s), term, prospectus, courses and users (`e2e.<world>.lead@buksu.edu.ph`, …). Everything still runs in sequence (one worker, as today). Separate worlds are about independence, not speed. Specs then:

- don't depend on file order, so one failure doesn't break the specs after it
- can be run alone (`npx playwright test e2e/references.spec.ts`) while debugging
- get their own upload-limit budget per user

**Constraint: global single-active roles.** VPAA, FDIS Chair and CITL Director allow one active holder system-wide, and stages 3–5 of every chain use them. So:

- Global setup creates those three holders once; worlds reuse them.
- Specs that *change* global assignments (assign a second VPAA, 409) restore the original holder in `afterAll`, so later specs still see a full chain.
- Reviewer queues for those three roles will contain other worlds' syllabi, so tests locate rows by course code (already the pattern), never by row position or count.

The same applies to anything global that a test mutates: school years, terms and courses are created per world with unique labels and codes (`2026-2027` can't repeat if labels are unique, so worlds use labels like `W07 2026-2027`, or share one global school year that no test edits).

### 3.2 Fixtures and helpers

- `e2e/fixtures.ts`: `test.extend` with a `world` fixture (file-scoped by default via `beforeAll`, test-scoped on request) and an `as(person)` helper that signs in via the API (current `signIn`).
- `e2e/arrange/`: API and superuser shortcuts for state a test isn't about: `draftWithVersion`, `submittedAt(stage)`, `approved`, `filed`, `returnedWith(points)`, `backdate(syllabus, days)`. Each reached stage is built through the real API routes, not by writing statuses directly, so the state machine stays the only writer.
- `e2e/pages/`: thin page objects only where reuse is real: `ManagerPage` (search, filters, pagination, modal, delete dialog), `ReviewWorkspace`, `ReviseWorkspace`, `SyllabusPage`, `Header` (nav and bell).
- `e2e/faults.ts`: `failNext(page, urlPattern)` and `delay(page, urlPattern)` using `page.route`, for Retry banners and block-close-while-saving.

### 3.3 Scenario catalog and traceability

`e2e/SCENARIOS.md` lists every scenario with a stable ID (`ORG-03`, `REV-12`, …). Each test title carries its IDs as a tag: `test("return needs a point @REV-07", …)`. `npm run test:e2e:coverage` lists the IDs with no test and fails on unknown tags; with `--strict` it also fails on uncovered IDs, so "covers every scenario" is checkable rather than a claim.

### 3.4 Local mail catcher

Global setup starts a local SMTP catcher (`e2e/mail-catcher.ts`, built on `smtp-server`, parsed with `mailparser`) and points PocketBase at it, so tests read the real emails. Global setup and the test workers are separate processes, so the catcher writes each parsed message as JSON into a `mail/` folder inside the temporary PocketBase data folder, and the helpers read from there. Teardown stops it.


- PocketBase settings (via the superuser API, before seeding): SMTP on, host `127.0.0.1`, a fixed port (e.g. 2599), no TLS, no auth; `meta.appURL` set to the e2e PocketBase URL; a sender name and address.
- `APP_URL` set to the e2e app URL in PocketBase's environment, so notification links are absolute.
- Helpers: `inbox(email)`, `waitForMail(email, { subject, after })` (polls), `linkIn(mail, pattern)` (decodes quoted-printable and HTML before extracting links).

Two facts that shape the tests:

- **The verification link is PocketBase's own.** Registration calls PocketBase's built-in `requestVerification`, so the link opens PocketBase's confirmation page (`<PocketBase URL>/_/#/auth/confirm-verification/<token>`), not a page in the Next.js app. The test follows that link in the browser, then signs in through the app. (`/verify` in the app is approval-code verification, a different feature.)
- **Notification emails go out once a minute** (the `notifications.pb.js` cron). Only one test (NOT-04) waits for them, polling up to 90 s. Other notification tests check the in-app bell and the `notifications` rows.

### 3.5 Runner configuration

Keep the current setup: one Chromium project, `workers: 1`, `fullyParallel: false`, global setup and teardown as they are. The only additions are creating the three global holders in global setup and keeping `a11y.spec.ts` last, so it scans pages with data in every state.

## 4. Scenario catalog

Moved to `e2e/SCENARIOS.md`, the living list the coverage script reads.

## 5. Delivery order

Small, reviewable steps, one PR each:

1. **Foundation:** `createWorld`, the `world` fixture, `arrange.ts`, scenario catalog + coverage script. Port the five existing specs onto worlds with no behaviour change. (`faults.ts` and page objects come with the first specs that use them, in step 2.) Exit: same tests green, and each spec passes when run on its own.
2. **Mail catcher, then auth, navigation, managers** (AUTH, NAV, MGR): install `smtp-server` and `mailparser`, add the catcher and PocketBase SMTP setup, then the widest surface for least setup.
3. **Org, curriculum, membership** (ORG, CUR, MEM).
4. **Syllabus authoring and review core** (SYL, REV, RET).
5. **Stand-ins, filing, justification** (STA, FIL, JUS).
6. **References, lead transfer, notifications** (REF, LEAD, NOT).
7. **Dashboard, audit, limits** (DSH, AUD, LIM).
8. **Accessibility sweep** (A11Y) and closing the Part 11 checkbox in `AGENTS.md` except the screen-reader item.

Each step: `npm run lint`, `npm test`, `npm run test:e2e` green; coverage script shows the step's IDs covered.

## 6. Risks

- **Run time.** ~150 tests on a production build. Estimate 25–40 minutes in sequence. Mitigations: API arrangement for anything not under test, one world per file (not per test), `E2E_SKIP_BUILD` locally, and running a single spec file while working on it.
- **Flakiness from debounces and the 1-minute hook.** Never `waitForTimeout`; wait on responses (`page.waitForResponse`) and `expect.poll`. Hook timing tests poll up to 90 s and stay in one spec, so only that file pays the wait.
- **Shared global holders** (VPAA, FDIS, CITL) see every world's syllabi: always locate by course code.
- **Date-sensitive logic** (deadlines in Philippine time): set times relative to "now" in PH time; avoid tests near midnight PH by using offsets of whole days.

## 7. Decisions

- **D1. Dependencies.** Decided: two new dev dependencies, `smtp-server` and `mailparser` (with `@types/smtp-server` and `@types/mailparser`), for the mail catcher. Nothing else new.
- **D2. Email.** Decided: a local mail catcher; tests read real emails and follow the real verification link (section 3.4).
- **D3. Scope of "every scenario."** Decided: option A, one browser test per scenario, plus navigation per role and one non-admin allowed and one refused role per action button (section 1). No full role × capability matrix in the browser.
- **D4. CI.** Decided: no CI workflow. E2E runs locally only, before calling a task done.
- **D5. Browsers.** Decided: Chromium only.
