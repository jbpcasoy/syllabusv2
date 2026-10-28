# Phase 4: Reviewer experience

Status: **implemented 2026-10-28** (D1 to D3, Q1 to Q6 accepted; tasks 1 to 11 done).

Verification:
- 2,272 tests pass, `tsc` is clean, and the production build succeeds. Lint adds only the known `set-state-in-effect` pattern; no other rule fires in the new or changed files.
- A 42-check end-to-end run passed against a throwaway PocketBase (every migration applied from scratch, port 8099) and the built app (port 3099). Two programs sat in two colleges. It covered:
  - the program reviewer's and both deans' queues (scope, filters, a 403 for a stage not held)
  - a return at stage 2, then a revision with an answered point and a resubmit back into the dean's Waiting tab
  - approval through VPAA, filing, a returned scan, and filing again
  - the full timeline (14 entries in order, codes, names only, no emails) and one event row per transition (11)
  - read-only Passed and admin views, and no tabs for a lead
  - every new page rendering, and the redirect when signed out

  One check failed only in the script, which expected `next=%2Freview`; the app's actual redirect, `/login?next=/review`, is correct.
- Migration `1793000024`: the backfill was checked against seeded data (task 1), and the down migration reverts and reapplies (confirmed through a bash pipe).
- Not covered: the pages were checked as server responses, not clicked through in a browser, so the client-side behaviour (tabs, PDF frame, per-point saves, the checklist) has no runtime check yet.

Source: roadmap in `AGENTS.md`: "Review queue per stage with filters (program, term, status). PDF viewer beside the form panel. Syllabus detail page with status timeline, version history and all review points. Faculty return view with a per-point Action Taken editor and resubmit."

## Objective

Phase 3 made review possible. Phase 4 makes it workable:

- **Reviewers** find their work in a queue for each stage, then review in one workspace with the PDF on one side and Forms 17 and 18-1 on the other.
- **Faculty leads** with a returned syllabus get a workspace that shows the PDF beside each review point, with an Action Taken editor per point, the revision upload and Resubmit.
- **Everyone with access** gets a syllabus page that answers "where is it and what happened?": a status timeline, the version history and every review point across versions.

No workflow rule changes. Phase 4 uses the Phase 3 state machine, routes and rules as they are, and adds one write: a timeline event in each transition batch.

## Decisions (2026-10-27)

| # | Topic | Decision |
| --- | --- | --- |
| D1 | Queue contents | **Stage pipeline.** One tab per stage the viewer holds or stands in for. Rows are syllabi in the viewer's scope that have reached that stage. Status filter: **Waiting** (default), **Returned** (with faculty), **Passed** (approved at this stage or beyond). Admin gets a read-only view of all five stages. |
| D2 | Timeline data | **New append-only `syllabus_events`**, written in the same batch as every transition. It is narrower than the Phase 6 `audit_log` and doesn't replace it. |
| D3 | Pages | **Separate workspaces.** `/syllabus/[id]` is the read-only hub. `/syllabus/[id]/review` is for the acting reviewer. `/syllabus/[id]/revise` is for the lead while the syllabus is returned. |

## Proposals (accept or amend before task 1)

| # | Topic | Proposal |
| --- | --- | --- |
| Q1 | PDF viewer | A native `<iframe>` pointed at the existing protected file route, which already serves `inline`, same origin, with no frame-blocking header. **No new dependency.** It always shows an "Open in new tab" link, because some mobile browsers show only the first page in a frame. pdf.js would need approval as a dependency. |
| Q2 | Events for existing syllabi | The schema migration **backfills** events from the existing records: `submitted_at` gives `submitted`, `syllabus_reviews` give `approved` and `returned`, and `syllabus_signed_copies` give `filed` and `scan_returned`. Resubmits from before the migration can't be recovered and are left out. One code path reads the events, with no derived fallback at runtime. (This refines "syllabi from before the change show derived events".) |
| Q3 | "Waiting since" | Add `syllabi.status_changed_at` (date), set by each transition route next to `result.next` and backfilled from the latest event. The queue sorts by it server-side. Deriving it from events would need a join per row, which PocketBase can't sort on. |
| Q4 | Queue capability | Add `reviewQueue.view` to `lib/capability-rules.ts`: a program reviewer, dean, FDIS chair, CITL director or VPAA anywhere (admin passes). It gates the nav entry and the page. A stand-in or proxy who holds none of those roles still finds their syllabi through **Waiting on me** on My syllabi (`scope=review`, unchanged). The queue route lets any signed-in user through, and returns only the stages they hold or stand in for. |
| Q5 | Authors in the queue | Syllabi the viewer leads or co-authors never appear in their queue (they're on My syllabi). A Waiting syllabus covered by someone else's stand-in still appears, but read-only and labelled "Covered by <name>". |
| Q6 | Hub changes | Approve and Return move off the hub into the review workspace, and Answer moves into the revise workspace. The hub shows an "Open review workspace" or "Open revision workspace" button when the viewer can act. Co-authors, stand-ins, signed copy, justification, references and lead transfer stay on the hub. The Form 17 panel on the hub becomes read-only. |

## Schema changes (to apply to `pb_schema.json`)

**`syllabus_events`** (new, `null` API rules, superuser only, append-only)

| Field | Type |
| --- | --- |
| `syllabus` | relation → syllabi, required, cascade delete |
| `type` | select: `submitted`, `approved`, `returned`, `resubmitted`, `filed`, `scan_returned` |
| `stage` | number, int, 0 to 5 (0 when it doesn't apply: `filed`, `scan_returned`) |
| `version` | relation → syllabus_versions, optional |
| `actor` | relation → users, required |
| `approval_code` | text (on `approved` only) |
| `reason` | text, max 500 (on `scan_returned` only) |
| `created` | autodate |

Index: `(syllabus, created)`.

**`syllabi`** (changed): add `status_changed_at` (date). Index `(status, stage, status_changed_at)`.

The migration (next number `1793000024`) creates both and runs the backfill (Q2, Q3).

## Events (`lib/syllabus-events.ts`, server-only)

`addSyllabusEvent(batch, event)` queues one create on an existing batch. Each route below already sends one batch, so the event is written atomically with the transition. Where a route can't batch, the event joins the write that changes the status.

| Route | Event |
| --- | --- |
| `POST /submit` | `submitted`, stage 1, current version |
| `POST /review` | `approved` (with `approval_code`) or `returned`, at the decided stage and version |
| `POST /resubmit` | `resubmitted`, the returning stage, new version |
| `POST /signed-copy` | `filed` (in the filing update, after the upload; deleted with the copy if filing fails) |
| `PATCH /signed-copy/[copyId]` | `scan_returned` with `reason` |

Each also sets `status_changed_at`. Route tests assert both writes are in the batch.

## Review queue

**Module:** copied from the scoped-list pattern in `syllabus` (`GET /api/syllabus`) and the manager pattern in `components/program-reviewer/`.

- `types/review-queue.ts`: `QueueStatus = "waiting" | "returned" | "passed"`, `ReviewQueueItem` (syllabus summary: course code and title, target program, term, lead, version number, stage, status, `status_changed_at`, `actionable`, `covered_by` name or null) and `ReviewQueueResponse` (a list result plus `stages: number[]`, the tabs this viewer may open).
- `lib/review-queue.ts` (server-only), which **replaces `lib/syllabus-queue.ts`**:
  - `queueStages(roles, standInStages)` (pure): roles give 1 (reviewer of a program), 2 (dean), 3, 4 and 5. Stand-ins add their stages. Admin gets all five.
  - `stageScopeFilter(pb, stage, roles, standInSyllabusIds)` (pure on `pb.filter`): stage 1 is `program ∈ reviewerOfPrograms`, stage 2 is `program.department.college ∈ deanOfColleges`, stages 3 to 5 have no constraint, plus `id ∈` the syllabi the viewer stands in for at that stage. Admin has no constraint.
  - `statusFilter(stage, status)` (pure):
    - waiting: `status = 'submitted' && stage = N`
    - returned: `status = 'returned' && stage = N`
    - passed: `((status = 'submitted' || status = 'returned') && stage > N) || status = 'approved' || status = 'filed'`
  - `listAwaitingReviewIds` keeps its signature for `scope=review` and is rebuilt on the helpers above, so it can't drift from the queue.
- `GET /api/review-queue?stage=&status=waiting&program=&term=&search=&page=&perPage=`: any signed-in user. 403 when `stage` isn't one of the viewer's stages. Authored syllabi are excluded (Q5). Waiting rows sort oldest `status_changed_at` first. Returned and Passed rows sort newest first. `actionable` comes from `resolveActor` with the chain, proxy and stand-ins already loaded for the page (one query each per page, never per row).
- `lib/review-queue-client.ts`, `components/review-queue/review-queue-manager.tsx`: stage tabs (Headless UI `TabGroup`), status, program and term filters that reset to page 1, a 300 ms debounced search, 10 rows per page, `AbortController`, a Retry banner, and a dimmed table while loading. The program filter is a `Combobox` with server-side search, because it can exceed 100 options. Each row shows "waiting N days" from `status_changed_at` and links to `/syllabus/[id]/review` when `actionable`, otherwise to `/syllabus/[id]`.
- `app/review/page.tsx`: redirects to `/login?next=/review` when signed out, and shows "You don't review syllabi" when `queueStages` is empty.
- Nav: `{ label: "Review Queue", href: "/review", capability: "reviewQueue.view" }`.

## Timeline

- `lib/syllabus-timeline.ts` (pure): `buildTimeline({ syllabus, versions, events })` merges `created`, each version upload (with `version_no` and uploader) and the events into one list, oldest first. It returns `TimelineEntry { kind, at, stage, stageLabel, versionNo, actorName, approvalCode, reason }`.
- `GET /api/syllabus/[id]/timeline`: the same access as `GET /api/syllabus/[id]` (`resolveSyllabusAccess`, 404 otherwise). It returns actor **names only**, mapped through `toTimelineResponse`.
- `components/syllabus/syllabus-timeline.tsx`: a vertical list with the current status on top (for example "Waiting on Dean since 12 Oct"). It is shown on the hub.

## Workspaces

**Shared:** `components/syllabus/pdf-pane.tsx` takes `syllabusId`, a list of versions, and a selected version id with a setter. It renders a version `Select` (labelled "v3, uploaded 12 Oct"), an `<iframe title="Syllabus PDF v3">` and an "Open in new tab" link (Q1). The layout is two columns from `lg` (`grid-cols-2`, both full height and each scrolling on its own), stacked below `lg`.

**`/syllabus/[id]/review`** (`app/syllabus/[id]/review/page.tsx`, `components/syllabus/review-workspace.tsx`)

- It loads `GET /api/syllabus/[id]`. When `review.actorStage` is null, it shows why ("Not waiting on you", or "Covered by <stand-in>") and a link to the hub, with no forms.
- Left: the PDF pane, defaulting to the current version.
- Right: tabs **Form 17** (the existing `Form17Panel`, editable) and **Form 18-1** (the existing `Form18Panel` in reviewer mode), plus a sticky footer with Approve and Return (the existing `ReviewDecisionDialog`). After a decision it routes back to `/review`.

**`/syllabus/[id]/revise`** (`app/syllabus/[id]/revise/page.tsx`, `components/syllabus/revise-workspace.tsx`)

- For the lead while the syllabus is `returned`. Anyone else is shown a message and a link to the hub.
- Left: the PDF pane, with a toggle between **Returned version** (from the latest `returned` event) and **Your revision** (the latest upload, once there is one).
- Right: a checklist ("New version uploaded" ✓/✗, "N of M points answered"), the **Upload revision** button (the existing `UploadVersionModal`), and one card per point at the returning stage, `open` or `responded`. Each card shows the stage, code, review point and reviewer remarks, and has its own Action Taken (textarea) and Page Number editor that saves with the existing `PATCH /form18/[pointId] { action: "respond" }`. Each card has its own saving and error state, and saving one card never resets another. Points judged `resolved` earlier show collapsed, read-only.
- Footer: **Resubmit** (the existing `ResubmitSyllabusDialog`), disabled with the reason shown until both checklist items pass. The server still enforces both. On success it routes to the hub.
- The Answer form leaves `Form18Panel` (Q6), so a point is answered in exactly one place.

**No new API routes for the workspaces.** They compose the existing Phase 3 routes. The one addition is `last_returned_version` on `GET /api/syllabus/[id]` for a returned syllabus, read from the latest `returned` event.

## Hub (`/syllabus/[id]`)

- Header as today, plus the workspace button (Q6).
- **Timeline** (above).
- **Version history:** the existing `SyllabusVersions`, plus for each version the decisions made on it (for example "S1 approved, S2 returned"), read from the timeline data the page already loaded.
- **Review points:** every Form 18-1 point across versions, grouped by version (newest first) and then by stage, with status badges and the Action Taken responses. It is read-only and reuses `GET /form18`.
- The Form 17 panel is read-only. The other panels are unchanged.

## Testing

Vitest, following the conventions in `AGENTS.md`.

- Pure, exhaustive: `queueStages`, `statusFilter` for each (stage, status) pair, `stageScopeFilter` for every role, stand-in and admin case, and `buildTimeline` ordering and labels.
- `tests/api/review-queue/route.test.ts`: success for each status, 401, 403 for a stage the viewer doesn't hold (nothing touches PocketBase), a stand-in-only stage allowed, authored syllabi excluded, the covered-by label, admin with all stages, in scope and out of scope for stage 1 (program) and stage 2 (college), paging clamps, and `handlePbError` delegation.
- `tests/api/syllabus/[id]/timeline/route.test.ts`: access, 404 for no access and for missing records, names only (no emails), and `handlePbError`.
- The existing submit, review, resubmit and signed-copy tests gain an assertion that the event and `status_changed_at` are in the batch.
- `scope=review` tests stay green unchanged, which shows the rebuilt helper behaves the same.

## Boundaries

- **Always:** reuse the Phase 3 routes and components instead of reimplementing rules; route every status change through `lib/syllabus-workflow.ts`; use `pb.filter()` for every input; run lint and tests after each task.
- **Ask first:** any dependency (pdf.js included); any schema change beyond the two above; any change to workflow rules.
- **Never:** expose raw file URLs or user emails in the queue or timeline; let the browser see `syllabus_events` directly; build Phase 5 notifications or deadlines, or Phase 6 audit or override features.

## Success criteria

1. A dean opens Review Queue, sees only the stage-2 tab, filters to one program and term, and sees only their college's syllabi waiting at stage 2, oldest first, each with how long it has waited.
2. From a queue row the dean opens the review workspace, reads the PDF beside Form 17 and Form 18-1, adds a point, returns the syllabus, and lands back on the queue. The syllabus now appears under Returned.
3. The lead opens the revise workspace, compares the returned version with a new upload, answers each point in its own card, sees Resubmit enabled only once both checklist items pass, resubmits, and the syllabus is back in the dean's Waiting tab.
4. The hub timeline lists created, uploads, submitted, approved (with codes), returned, resubmitted, filed and scan returned, each with actor and time. Syllabi from before the migration show the backfilled entries.
5. The VPAA's Passed tab and the admin's tabs are read-only. Nobody sees a syllabus they author in their queue.
6. Lint, tests and the production build pass, and an end-to-end pass of criteria 1 to 4 succeeds against a throwaway PocketBase.

## Out of scope

Notifications and deadlines (Phase 5), and the audit log, overrides and rate limits (Phase 6). Also out: annotations on the PDF, side-by-side diffs of versions, and bulk actions in the queue.

## Task plan (one reviewable change each, lint and tests green after each)

**4a: Events**

1. **(Done 2026-10-27.)** Because `created` is an autodate, the backfill saves each event and then sets its original time with raw SQL (as in `1793000007`). Checked against a fresh scratch database, where all migrations apply, and against seeded data: a submit, a return, an approval, a filing and a scan return all landed in order with their original times, and `status_changed_at` took the latest. The down migration is not yet exercised, because `migrate down` needs an interactive confirmation. **Schema.** Migration `1793000024`: `syllabus_events`, `syllabi.status_changed_at`, indexes, and the backfill. Types in `types/syllabus-event.ts`.
2. **(Done 2026-10-27.)** `addSyllabusEvent` is pure and has no `server-only`: it only queues a create on the caller's batch, so route tests see the event in their batch mock instead of mocking it away. The approve and return event lives in `recordDecision`. Submit now writes one batch and then reloads (it was a single `update` with `expand`), and uses `latestVersion` so the event records the version. The signed-copy upload's filing update is now a batch of update plus event, and the copy is still deleted if that batch fails. **Writes.** `lib/syllabus-events.ts`, wired into submit, review, resubmit and both signed-copy routes, with `status_changed_at`, plus test assertions.

**4b: Queue**

3. **(Done 2026-10-27.)** The author exclusion is `lead != me && co_authors:each != me`. A scratch PocketBase confirmed it keeps syllabi with no co-authors. `actionable` comes from `holdsStageFor` (roles plus the expanded `program.department.college`) and the page's stand-ins, not `resolveActor`. It answers the same question from the same assignment records without loading a chain per program, and the review route still decides. `listAwaitingReviewIds` treats admin as a non-holder, as before. **Queue library.** `lib/review-queue.ts` pure helpers plus tests. Rebuild `listAwaitingReviewIds` on them and delete `lib/syllabus-queue.ts`.
4. **(Done 2026-10-27.)** `reviewQueue.view` is a global rule (holds any chain role), because `canAnywhere` has no program-reviewer scopes. Scope tests live in `tests/lib/review-queue.test.ts`; the route test mocks the module wholesale. **Queue route and capability.** `GET /api/review-queue`, `reviewQueue.view`, plus tests.
5. **(Done 2026-10-27.)** `/review` is open to any signed-in user: a stand-in without a chain role gets their stand-in tabs, and anyone with no stages gets the empty-state message. Only the nav entry needs `reviewQueue.view`. `SyllabusResponse` gains `status_changed_at`. Rows reuse `toSyllabusResponse`, so the lead's email is sent exactly as on My syllabi. That narrows the "no emails" boundary to the timeline. **Queue UI.** Client, manager, `app/review/page.tsx`, nav entry.

**4c: Hub**

6. **(Done 2026-10-27.)** Timeline entries use snake_case like every other response (`version_no`, `actor_name`, `approval_code`). The client derives stage labels from `CHAIN_ROLES`. The "created" entry names nobody, because the creator isn't recorded once a lead is transferred. The route keeps the pure `buildTimeline` real in its test, so the test can show that no email leaves the server. **Timeline.** `lib/syllabus-timeline.ts`, `GET /timeline`, the component, plus tests.
7. **(Done 2026-10-27.)** Form 18-1 points now carry `version_no` (`POINT_EXPAND` gains `version`), so the history groups them without a second request. Decisions per version come from the timeline the hub already loads. **Reordered:** to keep every task usable on its own, the hub's Approve, Return and Answer controls, and the editable Form 17 there, leave in tasks 9 and 10, when their workspaces exist. Until then the hub shows the read-only `ReviewPointsHistory` to everyone except the acting reviewer and the lead of a returned syllabus, who keep the interactive `Form18Panel`. **Hub layout.** Decisions per version, review points grouped across versions, workspace buttons, read-only Form 17, and Approve, Return and Answer removed from the hub.

**4d: Workspaces**

8. **(Done 2026-10-28.)** `tags` labels versions in the select, for example "returned" or "your revision". **PDF pane.** `components/syllabus/pdf-pane.tsx`.
9. **(Done 2026-10-28.)** `useSyllabusWorkspace` loads the syllabus and its versions for both workspaces. The form tabs stay mounted (`unmount={false}`), so unsaved Form 17 edits survive a tab switch. After a decision the reviewer lands on `/review`. The hub lost Approve, Return, the decision dialog and the editable Form 17. **Review workspace.** Page plus component.
10. **(Done 2026-10-28.)** **Changed:** `last_returned_version` was not added to `GET /api/syllabus/[id]`. The workspace reads the returned version from the latest `returned` timeline entry, so no route changes. Each `PointCard` keeps its own draft, saving and error state, and a save replaces only that point in the list. `Form18Panel` is now reviewer-only: `isLead` and `AnswerForm` are gone. The hub lost Upload revision and Resubmit, and its points section is the read-only history for everyone. **Revise workspace.** `last_returned_version` on `GET /api/syllabus/[id]` (plus a test), page, component, and the Answer form moved out of `Form18Panel`.

**4e: Verify**

11. **(Done 2026-10-28; see Verification at the top.)** Lint, tests, build, and the end-to-end run of the success criteria. Mark Phase 4 done in `AGENTS.md`.
