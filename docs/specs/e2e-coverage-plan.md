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

`e2e/SCENARIOS.md` lists every scenario with a stable ID (`ORG-03`, `REV-12`, …). Each test title carries its IDs as a tag: `test("return needs a point @REV-07", …)`. A small script (`npm run test:e2e:coverage`) fails if any catalog ID has no test, so "covers every scenario" is checkable rather than a claim. Section 4 is the first version of that catalog.

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

## 4. Scenario catalog (first cut)

Grouped by spec file. Walkthrough part in brackets.

### `auth.spec.ts` [Part 3, Part 10]
- AUTH-01 Register with a non-institutional domain is refused with a message.
- AUTH-02 Register with `@buksu.edu.ph` succeeds and a verification email arrives; sign-in refused while unverified.
- AUTH-02b Signing in while unverified shows the "We sent a new link" message and a second email arrives.
- AUTH-02c Following the emailed link verifies the account (PocketBase's confirmation page); signing in through the app then works.
- AUTH-02d A used or tampered link doesn't verify.
- AUTH-03 Verified user signs in through the form, lands on the right page; `?next=` is honoured.
- AUTH-04 Wrong password shows an alert; no account enumeration in the message.
- AUTH-05 Sign out clears the session; protected pages redirect to `/login?next=…`.
- AUTH-06 Every protected page redirects when signed out (data-driven over `NAV_ITEMS` + syllabus subpages).

### `navigation.spec.ts` [Part 2, Part 9]
- NAV-01 For each role (admin, VPAA, FDIS, CITL, dean, head, chair, reviewer, faculty, unassigned, stand-in only), the nav shows exactly the expected items. One data-driven test per role, expected lists written out by hand (not derived from `getNavItems`, or the test proves nothing).
- NAV-02 A direct URL to a capability-gated page the role lacks is refused (`/user`, `/audit`, `/dashboard` for faculty).
- NAV-03 A stand-in-only user sees Review Queue.

### `managers.spec.ts` — shared UI conventions [AGENTS.md UI conventions]
Data-driven over every manager page (campus, college, dean, department, department head, program, program chair, program reviewer, school year and term, course, prospectus, prospectus item, VPAA, FDIS chair, CITL director, faculty, join requests, user, audit, syllabus, syllabus reference, review queue):
- MGR-01 Debounced search narrows the table (one request after typing stops).
- MGR-02 Changing a filter resets to page 1.
- MGR-03 Pagination at 10 rows per page (world seeds 11+ rows where needed).
- MGR-04 A failed list request shows the Retry banner; Retry recovers.
- MGR-05 The table dims while loading.
- MGR-06 Create/edit modal: validation error shown as an alert; reopening after cancel shows a clean form (remount key).
- MGR-07 Modal and delete dialog can't be closed (Esc, backdrop, Cancel) while saving.
- MGR-08 Delete dialog removes the row; 409 conflict message shown when the record is referenced.
- MGR-09 Large option lists use the server-searched Combobox (course pickers).

### `org-setup.spec.ts` [Parts 1–2]
- ORG-01 Admin creates campus; VPAA creates colleges; VPAA assigns dean, FDIS chair, CITL director.
- ORG-02 Second active VPAA / FDIS / CITL / program reviewer → 409 message (the spec restores the original holders afterwards).
- ORG-03 Dean creates a department in their college; refused in another college.
- ORG-04 Dean assigns a department head; creates programs.
- ORG-05 Department head edits own department name; parent select locked; can't create a program.
- ORG-06 Department head assigns program chair and program reviewer in their department only.
- ORG-07 VPAA can't reach admin pages; `/course` is read-only (no create/edit/delete controls).
- ORG-08 Scoped lists: dean, head, chair see their scope in assignment lists; org lists fully visible to an unassigned user.

### `curriculum.spec.ts` [Part 1–2]
- CUR-01 Admin creates school years and terms; opens and closes a term.
- CUR-02 Admin creates courses with an owning program; GE course owned by GE program.
- CUR-03 Prospectus create, add items, publish; unpublished prospectus doesn't offer courses.
- CUR-04 Duplicate prospectus into the next school year, add an item, publish.
- CUR-05 School year label and term semester locked once a syllabus there holds a `ref_seq` (message shown).
- CUR-06 Term review days and submission deadline editable by admin.

### `membership.spec.ts` [Part 2–3]
- MEM-01 Chair adds faculty to own program; refused for another program.
- MEM-02 User requests to join with a note; duplicate pending refused; withdraw; request again.
- MEM-03 Chair rejects with a reason (reason required); requester sees it.
- MEM-04 Chair approves; user appears in `/faculty` (reactivation of an inactive record too).
- MEM-05 Requester can't decide own request; department head who chairs the program can approve own, never reject.

### `syllabus-authoring.spec.ts` [Part 4–5, Part 10]
- SYL-01 Create draft via modal (term, program, course combobox).
- SYL-02 Course not in the published prospectus, or closed term, isn't offered / is refused.
- SYL-03 Non-faculty (e.g. FDIS chair) can't create.
- SYL-04 Duplicate (course, term, program) refused.
- SYL-05 Upload a version; fake PDF (wrong magic bytes) refused; oversize refused.
- SYL-06 Submit disabled with no PDF; submit dialog; status Submitted.
- SYL-07 Submit refused when a chain stage has no active holder (message names the gap).
- SYL-08 "Start from last year's syllabus" banner when `based_on` exists; creates a version from it.
- SYL-09 Co-authors: add active faculty; non-faculty refused; co-author view is read-only (no upload/submit).
- SYL-10 Co-authors editable only in draft or returned; while returned, a stand-in or decider can't be added.
- SYL-11 Delete a draft; delete not offered once submitted.
- SYL-12 Versions list, PDF opens in viewer through the scoped route.

### `review-chain.spec.ts` [Part 4–5]
- REV-01 Full chain: stages 1–5 approve from their queues (existing `01-full-chain`, rebuilt on a world).
- REV-02 Queue lists only syllabi at the user's stage; Review link opens the workspace.
- REV-03 Approving at a stage that isn't yours isn't offered; direct POST refused (one UI check).
- REV-04 Form 17: every criterion required; "No" requires remarks; "No" blocks Approve.
- REV-05 Form 17 edits by a later reviewer are logged and shown in history.
- REV-06 Form 18-1 Part A (stages 1–2) without legend; Part B (3–5) with legend code.
- REV-07 Return with no points refused; return with points works.
- REV-08 Approve dialog shows `SYL-…-S<n>` code.
- REV-09 Admin opening the workspace can't review.
- REV-10 Reviewer who leads or co-authors is refused in the workspace.

### `return-revise.spec.ts` [Part 5]
- RET-01 Returned syllabus: revise workspace; Resubmit disabled until a new version is uploaded and every open point answered.
- RET-02 Resubmit resumes at the returning stage (stage 1 case, stage 3 case).
- RET-03 Reviewer marks points resolved/unresolved; unresolved blocks Approve; return without a new point re-opens only unresolved points.
- RET-04 A return only re-opens points from the returning stage; earlier stages' points stay resolved.
- RET-05 Review points history shows every round.

### `stand-ins.spec.ts` [Part 6]
- STA-01 Conflicted reviewer: submit dialog warns; submit succeeds; page shows "Waiting for a proxy".
- STA-02 `/review` "Needs a proxy" panel for dean; limited view (header, co-authors, stand-ins only).
- STA-03 Conflicted reviewer is notified, workspace refuses and shows proxy picker.
- STA-04 Proxy must be active program faculty; lead/co-author refused; valid proxy accepted.
- STA-05 Proxy is notified, sees it "as proxy" in queue, approves.
- STA-06 Later-stage holder designates a stand-in for a conflicted later stage.

### `approval-filing.spec.ts` [Part 5]
- FIL-01 Verify page: valid code shows course, stage, reviewer, date; fake code shows not found.
- FIL-02 Print view `/syllabus/[id]/forms` shows Form 17, Form 18-1, reference codes, signature lines.
- FIL-03 Timeline lists every submit, return, resubmit, approve; versions show decisions.
- FIL-04 Lead uploads signed scan → Filed.
- FIL-05 Each allowed role can return the scan as invalid with a reason (one in UI, e.g. dean) → Approved; returned scan still listed; non-allowed role sees no control.
- FIL-06 Re-upload → Filed again.
- FIL-07 CSV/PDF exports for Form 17, 18-1, justification download.

### `justification.spec.ts` [Part 5]
- JUS-01 Panel appears only when `based_on` exists and after approval.
- JUS-02 Entry needs a reason; save; letter preview addressed to the active CITL director.
- JUS-03 Upload signed letter locks entries.
- JUS-04 Reviewer or higher returns it with a reason; lead re-uploads.
- JUS-05 Never blocks routing; co-author can view; referencer and program chair never see it.

### `references.spec.ts` [Part 7]
- REF-01 Chair requests a reference with a note; duplicate refused; withdraw; request again.
- REF-02 Source lead is notified and approves from the References panel (self-approval case too).
- REF-03 Referencing chair and faculty see the read-only banner, can view PDFs, no controls, no justification.
- REF-04 Source lead revokes with a reason; referencing chair notified with link to `/syllabus-reference`.
- REF-05 Admin rejects and revokes on the lead's behalf.
- REF-06 Referencing program can't also create its own syllabus for that course and term.
- REF-07 Withdraw-pending and stop-approved notify the source lead.

### `lead-transfer.spec.ts` [Part 8]
- LEAD-01 Chair transfers lead; only the new lead sees edit controls.
- LEAD-02 Admin (not chair) transfer requires a 10+ character reason; marked override in audit (existing `03-lead-override`).

### `notifications.spec.ts` [Part 5, 9]
- NOT-01 Bell badge count after submit, return, approve, resubmit (per recipient).
- NOT-02 `/notifications` list, open one (link target correct), mark one read, mark all read.
- NOT-03 Stand-in and proxy notifications only when their stage is waiting.
- NOT-04 After a return, the lead receives the email: subject and body name the course, the link is absolute and opens the syllabus. Row goes `pending → sending → sent`.
- NOT-05 A notification for an unverified recipient ends `skipped` and no email is sent.
- NOT-06 With the catcher refusing connections, rows end `failed` after retries while the in-app bell still shows them (may be left to a hook unit check if it proves slow).

### `dashboard.spec.ts` [Part 9]
- DSH-01 VPAA sees everything incl. justification panel; CSV export on each panel downloads and has the expected header row.
- DSH-02 Dean sees own college only; head and chair see own scope, no justification panel.
- DSH-03 Faculty: no Dashboard link, direct URL refused.
- DSH-04 Scope filters narrow counts.
- DSH-05 Review overdue badge after backdating `status_changed_at` past `review_days`.
- DSH-06 Submission overdue: no syllabus, draft only, or reference to a draft, after the deadline.

### `audit.spec.ts` [Part 9]
- AUD-01 Admin filters by syllabus; status changes, uploads and override listed; override marked.
- AUD-02 VPAA refused.

### `limits-and-files.spec.ts` [Part 9–10]
- LIM-01 21st upload in an hour shows a 429 message with retry time (existing `04-upload-limit`, own world user).
- LIM-02 PDF route for a syllabus without access returns 404; no S3 or PocketBase file URL appears in any page HTML or network response for that page.

### `a11y.spec.ts` [Part 11]
- A11Y-01 axe (WCAG 2.2 AA, zero serious/critical) on **every** page, each opened by a role that can use it, in its main states (empty, with data, modal open, error banner).
- A11Y-02 Keyboard-only return and resubmit: Tab order, visible focus, arrows in comboboxes and radio groups, Esc closes dialogs except while saving.
- A11Y-03 Every error message is in a `role="alert"` region (checked as each form refuses).
- A11Y-04 200% zoom (1280×720 viewport at `deviceScaleFactor` 1 with CSS zoom, or 640px-wide viewport): no horizontal clipping on `/review`, review workspace, `/dashboard`.

Screen-reader announcement (NVDA/Narrator) stays manual; note it in the walkthrough.

## 5. Delivery order

Small, reviewable steps, one PR each:

1. **Foundation:** `createWorld`, fixtures, `arrange/`, `faults.ts`, projects config, scenario catalog + coverage script. Port the five existing specs onto worlds with no behaviour change. Exit: same tests green, and each spec passes when run on its own.
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
