# Phase 5: Visibility and communication

Status: **implemented 2026-10-28** (D1 to D4 decided, P1 to P8 accepted, tasks 1 to 14 done).

Verification:
- 2,675 tests pass, `tsc` is clean, and the production build succeeds. Project-wide lint shows only findings from before Phase 5: the generated `pb_data/types.d.ts`, the migrations' `/// <reference>` header, and three unused variables in older files. Beyond those, it shows the known `set-state-in-effect` pattern in the six new client managers and the same `/// <reference>` header in `pb_hooks/notifications.pb.js`.
- **End-to-end run, 69 of 69 checks passed.** It ran against a throwaway PocketBase (every migration applied from scratch, port 8099, `pb_hooks` loaded, `APP_URL` set, SMTP pointed at a local sink on 2525) and the built app (port 3099). The data covered two colleges, a full chain, a program chair, a department head, last year's filed syllabus and a filed Nursing GE syllabus. Every workflow step went through the real routes.
  1. **Submit:** the program reviewer got one unread `review_requested`, linked to `/syllabus/<id>/review`, with the header badge "Notifications, 1 unread", and an email with the `APP_URL` link within 90 s. The lead and co-author got nothing.
  2. **Approve and return:** stage-1 approval asked the dean and told the lead. Nursing's dean got nothing. The dean's return told the lead and co-author, linked to `/revise`. After the revision, an answered point and the resubmit, only the dean was notified.
  3. **Final approval:** stages 3 to 5 each asked the next holder. VPAA approval sent `final_approved`, with the signed-copy request, to the lead and co-author, and the VPAA got nothing for their own approval. The syllabus listed under Awaiting signed copy, then left the list once filed.
  4. **Overdue:** a submit backdated 4 days on a 3-day limit reads "Overdue 1 day" and counts as overdue review. A draft past the deadline carries the deadline its badge reads.
  5. **Scope:** the dean's dashboard showed only their college. Their filter for Nursing's program answered 403, and for their own program 200. BSIT completion was 2 of 5 (IT 101 filed, GE 1 by an approved reference to Nursing's filed syllabus), Nursing 1 of 1, and the counts by stage matched. The department head and program chair were refused justifications (scope, API and export). The dean saw IT 101's justification as "not started". Faculty got a 403 and "No dashboard for your roles". The home page and `/dashboard` redirected as specified.
  6. **Exports:** all four were 200 `text/csv` attachments, starting with bytes EF BB BF, with no emails. Completion read 40% for BSIT and left out Nursing. The syllabi, overdue, justification and stage-1 tile exports matched their panels. An out-of-scope export answered 403.
  7. **Outbox:** every notification was emailed on its first attempt, exactly once (15 rows, 15 messages).
- **The run found one defect, now fixed:** `daysOverdue` rounded up, so 4 days and a few seconds on a 3-day limit read "2 days". It now counts whole days, with the first partial day as 1 (see task 7).
- **Not covered:** the pages were checked as server responses and API data, not clicked in a browser. So the client-rendered parts have no runtime check yet: the overdue badges, the bell popover, the dashboard tiles and table, and the filters.

Source: roadmap in `AGENTS.md`: "Notifications for submitted, returned and approved events (email through PocketBase's mailer, plus an in-app badge). Term deadlines and overdue indicators. Role dashboards: counts by stage, completion rate per program, department and college, 'awaiting signed copy' and justification views, filtered exports."

## Objective

Phase 4 made review workable for whoever opens the queue. Phase 5 tells people when they have something to do, and shows managers where things stand:

- **Everyone in a syllabus's path** learns about it when it reaches them: in the app (a badge and a list) and by email.
- **Reviewers and faculty** see when something is late: a syllabus past its term's submission deadline, or a syllabus that has waited at a stage longer than the review limit.
- **Managers** (admin, VPAA, FDIS chair, CITL director, deans, department heads, program chairs and program reviewers) get a dashboard for their scope: counts by stage, completion rates, the syllabi awaiting a signed copy, justifications and CSV exports.

No workflow rule changes. Deadlines are indicators only and never block an action. `term.open` still decides whether submission is allowed.

## Decisions (2026-10-28)

| # | Topic | Decision |
| --- | --- | --- |
| D1 | Email | **Outbox plus a PocketBase hook.** Each transition writes `notifications` rows in its existing batch, and those rows feed the in-app badge. A `pb_hooks` file emails each row through PocketBase's mailer and records the result. An email can never go out for a transition that didn't commit. `pb_hooks/*.pb.js` is JavaScript, an accepted exception to the TypeScript-only rule, like `pb_migrations/*.js`. |
| D2 | Recipients | **Actors and authors.** Submitted or resubmitted: whoever can act at the waiting stage. Approved at stages 1 to 4: the next stage's actors, plus the lead. Approved at stage 5: the lead and co-authors, told to upload the signed copy. Returned: the lead and co-authors. |
| D3 | Deadlines | **Submission deadline and review limit.** A slot past its term's `submission_deadline` that has nothing submitted for review is overdue: no syllabus, or only a draft, whether its own or the one its pending or approved reference points to. A syllabus waiting at a stage longer than the review limit is overdue for that stage. |
| D4 | Completion | **Filed ÷ expected slots.** Expected = every course in each program's published prospectus for the term (matching school year and semester). A slot is complete when its own syllabus is `filed`, or when it holds an approved reference to a `filed` syllabus. Missing syllabi count against the rate. A scope with no expected slots shows "—", not 0% or 100%. |

## Proposals (accept or amend before task 1)

| # | Topic | Proposal |
| --- | --- | --- |
| P1 | Sending | The hook doesn't send on create. A cron in the hook file (`cronAdd`, every minute) drains the outbox: it claims up to 50 `pending` rows (sets them to `sending`), sends each, and marks it `sent` or `failed`. Failed rows are retried on later runs, at most 3 attempts in all, and never after 24 hours. Rows left in `sending` for over 10 minutes go back to `pending`. Why: a hook that sends after create would make the reviewer's Approve request wait on SMTP, and a single sender can't race itself. Emails go out within about a minute. |
| P2 | Message text | Title, body and link are built **in TypeScript** (`lib/notifications.ts`, pure and tested) and stored on the row. The hook only sends what's stored: subject = title, and body = body plus `APP_URL` + link. The in-app list shows the same text. The hook file stays dumb transport of about 60 lines. |
| P3 | Review limit | One field per term: `terms.review_days` (0 = no limit), edited by admin in the existing term form. A single global setting would need a new settings collection and module, while terms already have the module, the admin UI and the deadline next to them. |
| P4 | Deadline day | A deadline date runs to the end of that day in Philippine time (UTC+8, no daylight saving time), so "overdue" starts at 00:00 PHT the next day. A review limit of N days counts from `status_changed_at`. |
| P5 | Dashboard access | New capability `dashboard.view`: admin, VPAA, FDIS chair, CITL director, dean, department head, program chair, program reviewer. The scope widens org visibility: global for admin, VPAA, FDIS and CITL; a dean's college; a head's department; a chair's or reviewer's programs (combined when a user holds several roles). **The justification panel and its export are limited to the roles of the existing `justification.return` capability**, through `justificationScope` (see task 9), so department heads and program chairs never see justifications. AGENTS.md limits them to lead, co-authors, reviewers and admins. |
| P6 | Out-of-scope filter | A `college`, `department` or `program` filter outside the viewer's scope returns 403 and touches nothing else, as `GET /api/review-queue` does for a stage the viewer doesn't hold. |
| P7 | Badge freshness | The header renders the unread count server-side on each navigation. Marking items read refreshes it (`router.refresh()`). No polling. |
| P8 | Exports | CSV only (no dependency): UTF-8 with BOM so Excel opens it correctly, at most 5,000 rows (when there are more, `X-Truncated: true` and a note in the UI), names but never emails, and cells beginning with `=`, `+`, `-`, `@`, tab or CR are prefixed with `'` (formula injection). |

## Schema changes (to apply to `pb_schema.json`)

**`notifications`** (new, `null` API rules, superuser only; the browser sees it only through the routes below)

| Field | Type |
| --- | --- |
| `user` | relation → users, required, cascade delete |
| `syllabus` | relation → syllabi, required, cascade delete |
| `kind` | select: `review_requested`, `approved`, `final_approved`, `returned` |
| `stage` | number, int, 1 to 5 |
| `actor` | relation → users, required |
| `title` | text, required, max 200 |
| `body` | text, max 1000 |
| `link` | text, required, max 200 (an app path such as `/syllabus/<id>/review`) |
| `read_at` | date |
| `email_status` | select: `pending`, `sending`, `sent`, `failed`, `skipped` |
| `email_attempts` | number, int, min 0 |
| `email_error` | text, max 500 |
| `emailed_at` | date |
| `created`, `updated` | autodate |

Indexes: `(user, read_at, created)`, `(email_status, created)`.

**`terms`** (changed): add `review_days` (number, int, 0 to 90, default 0).

Migration `1793000025` creates both. No backfill: earlier transitions don't notify.

**PocketBase environment** (documented under Email in `AGENTS.md`): `APP_URL` (for example `https://syllabus.buksu.edu.ph`), read by the hook to build links. SMTP is configured in PocketBase's settings (Mail settings), as for verification email. Without SMTP, rows end `failed` and the in-app badge still works.

## Notifications

**Module:** copied from `syllabus-events` (a batch writer) and the plain list pattern in `program-join-request`.

- `types/notification.ts`: `NotificationKind`, `Notification` (record), `NotificationResponse` (`id`, `kind`, `stage`, `title`, `body`, `link`, `read`, `created`, `actor_name`; never `email_*`).
- `lib/notifications.ts` (pure, no `server-only`, like `syllabus-events`):
  - `notificationRecipients(event, syllabus, holders, standIns)` returns `{ user, kind, stage }[]`:
    - `submitted` or `resubmitted` at stage s: `review_requested` to the actors at s. That is the stand-in at s if one is set, otherwise the holders at s. Authors are never included.
    - `approved` at s < 5: `review_requested` to the actors at s + 1, and `approved` to the lead.
    - `approved` at 5: `final_approved` to the lead and co-authors.
    - `returned` at s: `returned` to the lead and co-authors.
    - Every kind leaves out the actor and deduplicates users.
  - `notificationText(kind, stage, facts)` builds `{ title, body, link }` from the course code and title, program code, stage label (`CHAIN_ROLES`) and actor name. For example: "BSIT · IT 101 is waiting for your review (Dean)", or "IT 101 is fully approved. Upload the signed copy." Links: `review_requested` goes to `/syllabus/<id>/review`, `returned` to `/syllabus/<id>/revise`, and the others to `/syllabus/<id>`.
  - `addNotifications(batch, syllabusId, actorId, rows)` queues the creates, all `email_status: "pending"`.
- **Writes:** submit, resubmit and review (in `recordDecision`, which receives the rows) call `addNotifications` in the batch that already carries the event. All three routes already load the holders and stand-ins, so nothing extra is queried. The course, program and actor names come from one `getOne` with `expand` added to each route's existing reads.
- **Routes** (any signed-in user, own rows only, filtered with `pb.filter("user = {:me}")`):
  - `GET /api/notification?unread=true&page=&perPage=`: newest first, `perPage` clamped 1 to 100 (default 30). Returns a list plus `unread_count`.
  - `PATCH /api/notification/[id]` with `{ read: boolean }`: 404 when the row isn't the caller's (the same response as a missing row, so ids can't be probed).
  - `POST /api/notification/read-all`: returns 204.
- **UI:**
  - `components/layout/notification-bell.tsx` in the header: a bell with an unread count (`aria-label="Notifications, 3 unread"`) and a Headless UI `Popover` showing the 5 newest, plus "Mark all read" and "See all".
  - `app/notifications/page.tsx`: the full list, with All and Unread tabs, 10 rows per page, Retry banner. Clicking an item marks it read and follows its link.
- **Hook:** `pb_hooks/notifications.pb.js`: the cron drain from P1. Each row loads the user. Unverified users and users with no email are marked `skipped`. Each message gets one plain text part and one escaped HTML part. Errors go to `email_error` (truncated) and the PocketBase log, and never to the browser.

## Deadlines

- `lib/deadlines.ts` (pure): `deadlineEnd(date)` (P4), `isSubmissionOverdue(term, slotState, now)`, `reviewDueAt(statusChangedAt, reviewDays)`, `isReviewOverdue(syllabus, term, now)` and `daysOverdue(due, now)`. Only `submitted` syllabi can be review-overdue: returned ones are with faculty, and approved and filed ones are done.
- **Term module** (`types/term.ts`, `lib/validators/term.ts`, `lib/term.ts`, term modal): `review_days`, int 0 to 90, default 0.
- **Indicators** (a shared `components/syllabus/overdue-badge.tsx`, with text and not only colour):
  - Review queue rows: "Overdue 3 days" when review-overdue at that tab's stage. `ReviewQueueItem` gains `review_due_at` (the term is already expanded).
  - My Syllabi rows: "Past submission deadline" on a `draft` whose term's deadline has passed. Available-course rows get the same label when the slot has nothing yet.
  - Hub header: the same two labels, where they apply.

## Dashboards

**Module:** a read-only report module, with the route style of `review-queue` and the manager pattern of `components/review-queue/`.

- `lib/dashboard-scope.ts` (pure): `dashboardScope(roles)` returns `{ all: true }` or `{ all: false, collegeIds, departmentIds, programIds }` (P5). `programScopeFilter(pb, scope, filters)` builds the `programs` filter. `filterInScope(scope, filters, programOrg)` decides P6.
- `lib/dashboard.ts` (server-only): `loadTermSlots(pb, termId, programIds)` makes four `getFullList` calls with slim `fields`: the programs in scope with their department and college, published prospectus items for the term's school year and semester, the term's syllabi (`program, course, status, stage, status_changed_at, based_on`), and the term's pending or approved references with their source's status. The pure `aggregate(slots, term, now)` returns:
  - **Counts:** not started, draft, waiting at stages 1 to 5, returned, approved (awaiting signed copy), filed, overdue submission, overdue review.
  - **Completion rows:** per program, rolled up per department and per college. Each row has expected, filed, rate, overdue submission and overdue review.
- **Routes** (`requireUser("dashboard.view")`, then the scope check from P6):
  - `GET /api/dashboard/summary?term=&college=&department=&program=` returns `{ counts, completion }`. `term` is required (400 when missing or malformed).
  - `GET /api/dashboard/signed-copies?term=&…&page=&perPage=` lists `approved` syllabi, oldest `status_changed_at` first, with days waiting, program, course and lead name.
  - `GET /api/dashboard/justifications?term=&…&status=&page=` requires `justification.return` somewhere (403 otherwise). It lists approved or filed syllabi with `based_on` set, and their justification state: `none`, `draft`, `submitted` or `returned`. The scope is narrowed further to stages the viewer holds: a program reviewer sees their programs, a dean their college, FDIS, CITL and VPAA everything.
  - `GET /api/dashboard/export?view=completion|syllabi|signed-copies|justifications&term=&…&status=&stage=&overdue=` returns `text/csv` with `Content-Disposition: attachment; filename="<view>-<term>.csv"`. It uses the same scope and capability checks as the matching JSON route (P8). `view=syllabi` is the filtered syllabus list (status, stage, overdue).
- **UI:** `app/dashboard/page.tsx`, which redirects to `/login?next=/dashboard` when signed out and shows "No dashboard for your roles" without `dashboard.view`.
  - Filters: term (`Select`, defaulting to the newest open term), and college, department and program (a `Combobox` with server-side search for program), each limited to the scope. Changing a filter reloads every panel.
  - Panels: count tiles (each linking to the export with that filter), the completion table (college, then department, then program, with expand and collapse, and a `<progress>` bar plus the percentage as text), Awaiting signed copy, and Justifications (only with the capability). Each panel has an Export CSV link, its own loading and Retry state, and an `AbortController`.
- **Home:** `app/page.tsx` (still the create-next-app template) redirects to `/dashboard` for `dashboard.view`, otherwise to `/syllabus`, and to `/login` when signed out.
- **Nav:** `{ label: "Dashboard", href: "/dashboard", capability: "dashboard.view" }` first, and `{ label: "Notifications", href: "/notifications" }`.

## Testing

Vitest, following the conventions in `AGENTS.md`.

- **Pure, exhaustive:**
  - `notificationRecipients` for every event type and stage 1 to 5, with a stand-in, a proxy and no stand-in, the actor excluded, authors never asked to review, and deduplication.
  - `notificationText` for each kind.
  - `lib/deadlines.ts`, including the PHT edges: 15:59:59Z on the deadline day is on time, and 16:00Z is overdue. Also limit 0, no deadline, and each status.
  - `dashboardScope` and `filterInScope` for every role mix plus admin.
  - `aggregate`: references to filed and unfiled syllabi, missing slots, expected 0, roll-ups.
  - The CSV writer: quoting, BOM, formula prefix, truncation.
- **Routes:** one file per route under `tests/api/notification/` and `tests/api/dashboard/`. They cover success, 401, 403 with nothing touching PocketBase, 400, malformed JSON (PATCH), 404 for another user's notification, `handlePbError`, and in scope, out of scope and admin override for `dashboard.view` and `justification.return`.
- **Transition routes:** the existing submit, resubmit and review tests assert that the notification rows are in the same batch as the event, with the right recipients.
- **Hook:** not unit-testable in Vitest (JSVM globals). It is verified in the end-to-end run: SMTP pointed at nothing makes rows go `failed` and retry up to 3 times, an unverified user is `skipped`, and with SMTP configured rows go `sent`.

## Boundaries

- **Always:** keep message text and recipients in TypeScript; write notifications in the transition's batch; use `pb.filter()` for every input; scope every dashboard query; run lint and tests after each task.
- **Ask first:** any dependency (mail, chart or CSV libraries included); any schema change beyond the two above; notifying on further events (`filed`, `scan_returned`, justification returned).
- **Never:** put PDFs, raw file URLs or other users' emails in notifications, dashboards or exports; let a deadline block an action; let department heads or program chairs see justifications; build Phase 6 audit, override or rate-limit features.

## Success criteria

1. A lead submits. Within a minute the program reviewer has an unread badge and an email linking to the review workspace. The lead gets nothing for their own action.
2. The dean returns the syllabus. The lead and each co-author see a `returned` notification linking to the revise workspace. After the resubmit, only the dean (or the stage-2 stand-in) is notified.
3. VPAA approval sends `final_approved` to the lead and co-authors, and the syllabus appears under Awaiting signed copy until it is filed.
4. With `review_days = 3`, a syllabus waiting 4 days shows "Overdue 1 day" in the queue and counts as overdue review on the dashboard. A draft past the term deadline shows "Past submission deadline".
5. A dean's dashboard shows only their college. A program filter for another college returns 403. The completion rate equals filed ÷ expected, and a slot covered by a reference to a filed syllabus counts as filed. A department head sees no justification panel.
6. Each export downloads a CSV whose rows match the panel, with names only, and opens correctly in Excel.
7. Lint, tests and the production build pass, and an end-to-end run of criteria 1 to 6 passes against a throwaway PocketBase.

## Out of scope

Per-user email preferences or digests, push or SMS, notifications for filed, scan returned and justification events, revision deadlines for returned syllabi, charts beyond progress bars, PDF or Excel exports, and anything in Phase 6.

## Task plan (one reviewable change each, lint and tests green after each)

**5a: Notifications**

1. **(Done 2026-10-28.)** Applied, reverted and reapplied on a scratch PocketBase (all migrations from scratch). Existing terms read `review_days = 0`. `Term` gains `review_days`. `TermResponse` waits for task 7. **Schema.** Migration `1793000025`: `notifications`, `terms.review_days`, indexes. Types in `types/notification.ts` and `types/term.ts`.
2. **(Done 2026-10-28.)** `stageActors` (who can act at a stage) is exported and tested on its own. The actor's name falls back to "Someone" when the session has none. **Recipients and text.** `lib/notifications.ts` plus exhaustive tests.
3. **(Done 2026-10-28.)** Each route's first syllabus read gains `expand: NOTIFY_EXPAND` (`course,program`), so the facts cost no extra query. `recordDecision` takes an optional `notify: { targets, facts }` and queues the rows after the event. The submit test now mocks `syllabus-workflow` with `importOriginal`, because `lib/notifications` needs the real `CHAIN_ROLES`. **Writes.** Wire `addNotifications` into submit, resubmit and `recordDecision`, plus batch assertions in the existing route tests.
4. **(Done 2026-10-28.)** The read side lives in `lib/notification.ts` (server-only: `toNotificationResponse`, `ownFilter`, `countUnread`, `markAllRead`). The pure batch writer stays in `lib/notifications.ts`. `PATCH` finds the row with `id = {:id} && user = {:me}`, so another user's row gets PocketBase's own 404. Marking a read row read again keeps its first read time. `read-all` stamps rows in batches of 50 (PocketBase's default batch limit). The `read_at = ''` filter on a date field is only checked with mocks so far; task 6 checks it against a real PocketBase. **Routes.** List, mark read and read all, plus tests and `lib/notification-client.ts`.
5. **(Done 2026-10-28.)** **Amends P7:** the header sits in the root layout, which stays mounted across client navigations, so a server-rendered count alone would go stale. The server still renders the first count (and falls back to 0 if counting fails). The bell then re-fetches the count on every route change (`?unread=true&perPage=1`), and after it is opened or anything is marked read. Still no polling. The popover loads its 5 newest each time it opens. Opening an item marks it read without waiting, and then navigates. `/notifications` has All and Unread tabs, Mark read or unread per row, and Mark all read. Lint shows only the known `set-state-in-effect` pattern. Not yet run in a browser; task 6 sets up a running app. **UI.** Header bell, `/notifications`, nav entry.
6. **(Done 2026-10-28.)** The API was checked against the `types.d.ts` that PocketBase 0.40.4 generates: `cronAdd`, `MailerMessage`, `$app.newMailClient().send`, `$os.getenv`, `findRecordsByFilter`, and `Query.execute().rowsAffected()`. Each row is claimed with a conditional `UPDATE … WHERE email_status = <as read>`, so overlapping runs can't send twice. Rows past 24 hours are marked `failed` ("Not sent within 24 hours."), and only while they have attempts left, so a real error is never overwritten. AGENTS.md now lists the `pb_hooks` exception and the Email environment. **Verified** on a throwaway PocketBase (port 8099) with a local SMTP sink built on `node:net` (no dependency):
   - With no SMTP, the row failed and retried once a minute, and stopped at 3 attempts.
   - The unverified recipient was `skipped`, and the backdated row expired.
   - A row stuck in `sending` for 15 minutes was reset and retried.
   - With SMTP pointed at the sink, the row went `sent` with `emailed_at`. Exactly one message arrived and none on the next run. It had the configured sender, the recipient's name, a plain text part and an escaped HTML part (`<script>` arrived as `&lt;script&gt;`), and the link `APP_URL` + path.
   - The built app (port 3099) passed 20 checks against that PocketBase: own rows only, no email fields, `read_at = ''` filtering on a real date field (left open in task 4), read and unread, 404 for another user's or a missing row, 400 for malformed JSON, the header badge label ("Notifications, 3 unread"), the page, the nav entry, read-all 204 clearing the badge, and a 401 and the login redirect when signed out.
   - Still not clicked through in a browser: the popover and the client-side count refresh.

   **Hook.** `pb_hooks/notifications.pb.js` (P1, P2). First confirm `cronAdd`, `$app.newMailClient()`, `MailerMessage` and `$os.getenv` against PocketBase 0.40.4's JSVM types (`pb_data/types.d.ts`). Verify by hand against a throwaway PocketBase.

**5b: Deadlines**

7. **(Done 2026-10-28.)** `lib/deadlines.ts` is pure (no `server-only`), so the browser badges can use it. `daysOverdue` returns at least 1 once late. **Changed in task 14:** it first rounded up, so 4 days and a few seconds on a 3-day limit read "2 days". It now counts whole days (floor) with the first partial day as 1, so 4 days on a 3-day limit is "1 day". `isSubmissionOverdue` takes a `SlotState { syllabusStatus, hasReference }`. Terms from before the migration read `review_days` 0. `MAX_REVIEW_DAYS = 90` lives in `types/term.ts`. The routes needed no code change, because `toTermRecord` passes the field through; only their comments changed. The term modal gains "Review limit (days per stage)", and the terms table gains a Review limit column. **Library and term field.** `lib/deadlines.ts` plus tests, and `review_days` through the term module (validator, helper, modal, route tests).
8. **(Done 2026-10-28.)** **Changed:** `ReviewQueueItem` did not gain `review_due_at`. Instead, the term summary on every syllabus row (`TermSummary` in `types/syllabus.ts`, built by `toTermSummary` in `lib/syllabus.ts`) now carries `submission_deadline` (the day) and `review_days`. The queue, My Syllabi, the course picker and the hub all compute both states with the same `lib/deadlines.ts` rules, and no route needed a new field. `components/syllabus/overdue-badge.tsx` has `ReviewOverdueBadge` ("Overdue N days", on Waiting rows only), `SubmissionOverdueBadge` ("Past submission deadline"), and the two day-count helpers (tested with a fixed clock). The course picker appends the label as text, because a pill clashes with the highlighted option. Lint findings in the touched components are unchanged from HEAD (the known `set-state-in-effect`). Not yet seen rendered: the badges appear after client-side loads, so task 14 checks them. **Indicators.** `OverdueBadge`, `review_due_at` on queue items, My Syllabi, available rows and the hub.

**5c: Dashboards**

9. **(Done 2026-10-28.)**
   - **Capability:** `dashboard.view` is a global rule, like `reviewQueue.view`.
   - **Amends P5:** the justification gate can't be `canAnywhere(roles, "justification.return")`, because `canAnywhere` has no program-reviewer scopes and would refuse a program reviewer. Instead `justificationScope(roles)` in `lib/dashboard-scope.ts` covers the same five roles: global for admin, VPAA, FDIS and CITL, a dean's colleges, and a reviewer's programs. It is empty for department heads, program chairs and faculty, and tests pin that.
   - **P6:** `filterInScope(scope, filters, programs)` passes when some program both sits in the scope and matches every filter, or when every filter names one of the viewer's own scope ids. The second rule lets a new college with no programs show an empty dashboard instead of a 403.
   - **Aggregate:** the pure `aggregate` lives in `lib/dashboard-aggregate.ts`. Task 10's `lib/dashboard.ts` holds only the server-only loaders. Types are in `types/dashboard.ts`.
   - **Counts:** they gain `referenced` (expected slots covered by a reference). Syllabi for courses missing from the prospectus count by stage but not in completion.
   - **Completion rows:** ordered college, then department, then program, by name, each with `parentId` for collapsing.

   **Scope and aggregate.** `dashboard.view`, `lib/dashboard-scope.ts`, the pure `aggregate`, plus tests.
10. **(Done 2026-10-28.)**
    - **Validator:** `parseDashboardQuery` in `lib/validators/dashboard.ts` requires a valid `term` id and validates each optional filter id (400 otherwise).
    - **Loaders:** `lib/dashboard.ts` (server-only) loads the programs matching the filters, ignoring scope, with their department and college. That one query serves both the P6 check and the scoped list, so a 403 reads no term data. `loadTermSlots` makes three parallel `getFullList` calls with slim `fields`. They drop the program clause when the viewer sees everything unfiltered, which keeps the largest scope's filter short.
    - **Real PocketBase:** checked by running the real loaders against a throwaway PocketBase from a temporary test file, deleted afterwards. That covered the nested `fields`/`expand` paths, the relation filters (`prospectus.published`, `prospectus.school_year`, `department.college`), the semester match (a second-semester item excluded), a dean's scope, and `aggregate` over the real rows.

    **Summary route.** `GET /api/dashboard/summary` plus tests.
11. **(Done 2026-10-28.)**
    - **Shared scope step:** every dashboard route now goes through `resolveScopedPrograms` (one read, then the pure `scopePrograms` in `lib/dashboard-scope.ts`). The summary route was moved onto it. Route tests fake only the program read and keep the scope decision real.
    - **Signed copies:** `listAwaitingSignedCopy` pages in PocketBase, sorted `status_changed_at,id`.
    - **Justifications:** `listJustifications` joins the term's approved or filed syllabi that have `based_on` with `syllabus_justifications` (filtered `syllabus.term = …`) in memory. It sorts by program and course code, then pages. That lets the state filter include `none` (no justification yet), which a PocketBase filter can't express simply.
    - **Parameter name:** the query parameter is `state` (none, draft, submitted, returned), not `status`, so it can't be confused with the syllabus status.
    - **Justification gate:** the route answers 403 ("Only reviewers and administrators see justifications.") when `justificationScope` is empty, before any read.
    - **Real PocketBase:** both lists were checked against a throwaway PocketBase from a temporary test file, deleted afterwards. That covered order, names, no emails, the `syllabus.term` relation filter (an old term's justification excluded), `based_on != ''` (a submitted syllabus excluded), and the `none` state.

    **List routes.** Signed copies and justifications, plus tests.
12. **(Done 2026-10-28.)**
    - **CSV writer:** `lib/csv.ts` (pure) handles the BOM, CRLF line endings, quoting and the formula prefix. Numbers are written as they are, so `-3` stays a number.
    - **Builders:** `lib/dashboard-export.ts` (pure) has one CSV builder per view. Times are Philippine time, `YYYY-MM-DD HH:MM`, and the completion percentage has one decimal (blank when nothing is expected).
    - **Overdue filter:** `overdue=review|submission` on `view=syllabi` is applied in memory, because it needs the term's limits and the clock.
    - **Shared loaders:** to export more than one page, `allAwaitingSignedCopy` and `justificationRows` return every row. The paged list routes use the same queries, so a panel and its export can't disagree. `termSyllabusRows` feeds `view=syllabi`, sorted `program.code,course.code`.
    - **Response:** `Content-Disposition: attachment; filename="<view>-<school-year>-<semester>.csv"` (slugged), `Cache-Control: no-store`, and always an `X-Truncated` of `true` or `false`.
    - **Justification gate:** `view=justifications` uses `justificationScope`, so department heads and program chairs get 403 for it and nothing is read.
    - **Real PocketBase:** checked against a throwaway PocketBase from a temporary test file, deleted afterwards. That covered the relation sort, the status and stage filters, the nested `expand.school_year.label` field, a name with a comma and `ñ` quoted correctly, and a formula in a course title prefixed with `'`.

    **Export.** The CSV writer plus `GET /api/dashboard/export`, plus tests.
13. **(Done 2026-10-28.)**
    - **Added a route:** `GET /api/dashboard/scope` returns the programs in the caller's dashboard scope, with their department and college, plus `justifications: boolean`. The filters are built from it, so a dean is never offered another college. The existing program combobox searches every program, because org lists are visible to everyone, so it would have offered choices that answer 403.
    - **Changed:** the program filter is a `Combobox` that searches that already loaded, scoped list in the browser (50 shown at a time), instead of searching on the server. The scoped list is the whole set of valid choices and is loaded once. College and department are `Select`s shown only when there is more than one choice. Narrowing a level clears the levels below it.
    - **Tiles:** each count tile is a download link for the export with that filter: status, stage or overdue, or completion for "Not started" and "Referenced".
    - **Completion table:** colleges and departments collapse and expand (`aria-expanded`). Each row shows a `<progress>` bar plus the percentage and "filed of expected" as text, or "— (nothing expected)".
    - **Panels:** each has its own `AbortController`, dimmed loading, Retry banner and Export CSV link. A filter change remounts them, which resets them to page 1.
    - **Pages:** `/dashboard` shows "No dashboard for your roles" without `dashboard.view`. `/` redirects as specified. Nav gets "Dashboard" first.
    - **Checks:** the production build passes. Lint shows only the known `set-state-in-effect` pattern. The page is not yet clicked through in a browser; task 14 runs it against a seeded PocketBase.

    **UI.** `/dashboard`, the home redirect, nav.

**5d: Verify**

14. **(Done 2026-10-28; see Verification at the top.)** Lint, tests, build, and the end-to-end run of the success criteria. Mark Phase 5 done in `AGENTS.md`, and add `notifications` and `terms.review_days` to its data model.
