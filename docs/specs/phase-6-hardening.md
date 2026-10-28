# Phase 6: Hardening

Status: **implemented 2026-10-28** (D1 to D4 decided, P1 to P7 accepted). Tasks 1 to 10 and 12 are done. Task 11 is done except the manual keyboard pass (see below).

Verification:
- 2,756 unit tests pass, and `tsc` is clean. Lint on every file this phase touched shows only the known `set-state-in-effect` pattern of the client managers (the new audit manager follows the same pattern). The project-wide findings from before Phase 6 are unchanged (`pb_data/types.d.ts`, the migrations' `/// <reference>` header).
- **`npm run test:e2e`: 18 of 18 passed** against a throwaway PocketBase (every migration from scratch, on port 8099) and the production build (port 3099):
  1. **Full chain:** the lead created, uploaded and submitted in the UI. Each of the five holders approved from the workspace, after stage 1 had filled Form 17. The lead filed the signed copy. The audit log held exactly the seven status rows plus two upload rows.
  2. **Return and resubmit:** the dean raised a Part A point and returned. The lead uploaded a revision, answered the point and resubmitted. The syllabus came back `submitted` at stage 2, with audit rows submitted, approved, returned and resubmitted.
  3. **Lead override:** Transfer stayed disabled until a reason was entered. The transfer succeeded, and `/audit` with "Admin overrides only" showed it marked Override, with the reason and "From E2E Lead to E2E Coauthor".
  4. **Upload limit:** with 20 recent upload rows, the upload modal showed "Too many uploads. Try again in N minutes." and the API answered 429 with `Retry-After`.
  5. **axe (WCAG 2.2 AA):** zero serious or critical violations on all 14 pages listed below, each opened by a role that can use it.
- **Defects the run found, now fixed:**
  - Form 17 radios accepted clicks before the saved answers loaded, and the load then discarded them, silently. A fast reviewer lost 7 of 43 answers. The radios are now disabled until the form loads.
  - `text-gray-400` text (about 2.5:1) failed contrast on 27 components. It is now `text-gray-500`.
  - The icon-only combobox buttons had no accessible name. They are now labelled "Show options".
  - The dashboard's "Export CSV" links had an `aria-label` that didn't contain their visible text (WCAG 2.5.3). The subject is now screen-reader-only text after "Export CSV".
  - White text on `-600` green or amber (about 3.2:1) failed contrast on Form 17's selected pills and two amber buttons. Those now use `-700`.
  - `/audit`'s "Only this syllabus" button was below the 24 px target size. It now has a 24 px minimum height.
- **Not done:**
  - The manual keyboard-only pass (focus traps, combobox and popover keyboard use, the PDF viewer). axe doesn't cover it, and it still needs a person at the keyboard.
  - Applying migration `1793000026` to the dev PocketBase. It applies on the next `npm run pb`.
- **Found, out of scope:** a program chair can't open a syllabus page they don't author (`resolveSyllabusAccess` doesn't admit chairs), so the chair's Transfer lead button can't be reached in the UI. Only admin can transfer through the UI today. The route works for chairs, and its tests cover them.

Source: roadmap in `AGENTS.md`: "Audit trail of every status change and admin overrides (reassign, force-return, stand-ins). Upload rate limits, optional virus scanning, retention policy for old versions. End-to-end tests of the full chain and an accessibility pass."

## Objective

Phases 2 to 5 built the workflow. Phase 6 makes it accountable and verifiable:

- **Admin** can answer "who changed what, when, and why" for every syllabus status change and every lead reassignment, from one page.
- **Admin** can reassign a syllabus's lead when the program chair can't, but only with a recorded reason.
- **Everyone** is protected from upload floods: a user who uploads too often gets a clear 429, not a slow server.
- **The university** has a written retention rule for old versions.
- **The team** has a browser-driven end-to-end run of the full chain and an automated accessibility check, so the client UI that Phase 5 never clicked through is covered.

No workflow rule changes. Admin still never reviews.

## Decisions (2026-10-28)

| # | Topic | Decision |
| --- | --- | --- |
| D1 | Overrides | **Reassign lead only.** No force-return and no force-approve (admin never reviews). Stand-in changes are not audited in this phase. |
| D2 | Retention | **Policy only, no deletion.** Every version, signed scan and returned scan is kept. The rule is written down, and nothing is deleted automatically. |
| D3 | E2E and a11y | **Playwright plus axe**, as devDependencies `@playwright/test` and `@axe-core/playwright`, run against a throwaway PocketBase and the built app. |
| D4 | Virus scanning | **Out of scope.** Uploads keep the MIME, magic-byte and size checks in `lib/pdf.ts`. |

## Proposals (accept or amend before task 1)

| # | Topic | Proposal |
| --- | --- | --- |
| P1 | One audit table | `addSyllabusEvent()` also queues an `audit_log` row in the same batch, so every status change lands in both tables or in neither. `syllabus_events` stays the timeline's narrow source. `audit_log` is the one table the audit page reads, so it never has to page across a union. |
| P2 | What is audited | Every transition (`submitted`, `approved`, `returned`, `resubmitted`, `filed`, `scan_returned`), every lead transfer (`lead.transferred`) and every PDF upload (`file.uploaded`, for P4). Creating a draft isn't a status change and isn't audited. |
| P3 | Override marking | A lead transfer by an admin who isn't the program's chair is an override: it needs `reason` (10 to 500 characters, otherwise 400) and its row has `override: true`. A chair's transfer keeps today's body, with an optional reason. Same rules as today otherwise: not filed, new lead active faculty of the program. |
| P4 | Upload rate limit | At most **20 uploads per user per rolling hour**, across version, signed-copy and justification-scan uploads. The check counts the caller's `file.uploaded` audit rows (one indexed query, no new store, survives restarts and several app instances). Over the limit: 429, a `Retry-After` header in seconds, and "Too many uploads. Try again in N minutes." The check runs after auth and before reading the multipart body. Two simultaneous uploads at 19 can both pass. That's acceptable for a soft limit. |
| P5 | Who sees the audit log | New capability `audit.view`, admin only. `GET /api/audit` with filters `action`, `actor`, `syllabus`, `override`, `from` and `to`, newest first, `perPage` clamped 1 to 100. Page `/audit`, manager pattern copied from `components/review-queue/`. Names are shown, never emails. |
| P6 | Append-only | `audit_log` has `null` API rules, and no route updates or deletes it. A superuser can still edit it in the PocketBase dashboard. This is documented, not prevented. |
| P7 | A11y bar | WCAG 2.2 AA. axe reports **zero serious or critical violations** on every page in the list below, for each role that can open it. A keyboard-only pass covers every modal, combobox, popover and the PDF viewer. Moderate and minor findings are listed, and fixed when the fix is small. |

## Schema changes (to apply to `pb_schema.json`)

**`audit_log`** (new, `null` API rules, superuser only)

| Field | Type |
| --- | --- |
| `actor` | relation → users, optional (empty for a system action), no cascade |
| `action` | select: `submitted`, `approved`, `returned`, `resubmitted`, `filed`, `scan_returned`, `lead.transferred`, `file.uploaded` |
| `target_collection` | text, required, max 50 (for example `syllabi`) |
| `target_id` | text, required, 15 characters |
| `syllabus` | text, 15 characters or empty (a plain id, so rows outlive a deleted syllabus) |
| `override` | bool |
| `reason` | text, max 500 |
| `data` | json, max 2 KB (for example `{ "from": { "status", "stage" }, "to": {...} }`, `{ "from_lead", "to_lead" }`, `{ "kind": "version" }`) |
| `created` | autodate |

Indexes: `(actor, action, created)`, `(syllabus, created)`, `(action, created)`, `(created)`.

Migration `1793000026_created_audit_log.js`. No backfill. Earlier history stays in `syllabus_events`.

## Audit module

**Module:** copied from `syllabus-events` (batch writer) and `review-queue` (read-only list route and manager).

- `types/audit.ts`: `AuditAction`, `AuditEntry` (record), `AuditInput`, `AuditResponse` (`id`, `action`, `actor_name`, `syllabus`, `syllabus_label`, `override`, `reason`, `data`, `created`).
- `lib/audit.ts` (pure, no `server-only`, like `syllabus-events`): `addAudit(batch, input)`. Its server-only part `lib/audit-log.ts` holds `toAuditResponse`, `listAudit(pb, filters)` and `countRecentUploads(pb, userId, since)`.
- `lib/syllabus-events.ts`: `addSyllabusEvent()` gains the before and after state and calls `addAudit()`. Every caller already holds both.
- `lib/validators/audit.ts`: query parsing (action from the enum, ids matching `/^[a-z0-9]{15}$/`, ISO dates, `from` ≤ `to`).
- `app/api/audit/route.ts`, `lib/audit-client.ts`, `components/audit/audit-manager.tsx`, `app/audit/page.tsx`, a nav entry with `audit.view`.

## Lead reassignment

- `lib/validators/lead-transfer.ts`: optional `reason`, trimmed, 10 to 500 characters when given.
- `PUT /api/syllabus/[id]/lead`: decides `override = roles.isAdmin && !isChairOf(program)`. An override without a reason returns 400 "Give a reason for reassigning the lead." The update and the `lead.transferred` audit row go in one batch.
- UI: the lead transfer modal shows a required Reason field when the caller is admin and not the chair.

## Upload rate limit

- `lib/upload-limit.ts` (server-only): `UPLOAD_LIMIT = 20`, `UPLOAD_WINDOW_MS = 3_600_000`, and `checkUploadRate(pb, userId, now)`, which returns `{ ok: true } | { ok: false, retryAfter }`. `retryAfter` comes from the oldest counted row.
- The three upload routes (`version`, `signed-copy`, `justification/scan`) call it first, before reading the multipart body. `version/from-previous` copies a file without uploading one, so it isn't counted.
- A file upload can't join a PocketBase batch (as in Phase 3), so the `file.uploaded` row is written after the file is stored:
  - **signed copy:** in the filing batch, which already deletes the copy when it fails.
  - **version:** a one-row batch right after the create. If it fails, the version is deleted.
  - **justification scan:** a one-row batch after the update. The update replaced the previous scan, so it can't be undone: a failed row is logged (`console.error`) and the upload stands. This is the one place where an upload can go uncounted.
- `addUploadAudit(batch, actor, syllabus, kind, targetId)` in `lib/upload-limit.ts` builds the row (`data.kind` = `version`, `signed_copy` or `justification_scan`). Route tests use `tests/helpers/upload-limit.ts`.

## Retention policy

- `docs/retention-policy.md`: every syllabus version, signed copy (valid or returned), justification scan, review, Form 17 and 18-1 answer, event and audit row is kept indefinitely. Nothing is deleted automatically. Removing anything needs a records-office request and is done by a superuser, and is outside the app.
- AGENTS.md: one line under Files that points to the policy.

## End-to-end tests

- `playwright.config.ts` and `e2e/`. `npm run test:e2e` builds the app, and its global setup starts a throwaway PocketBase (`--dir` in a temp folder, port 8099, every migration from scratch, superuser upserted) and `next start` on port 3099. It seeds through the admin SDK: an org chain, a published prospectus, an open term, verified users for faculty, co-author and the five chain roles, plus a chair and an admin. Global teardown stops both processes and deletes the folder.
- Vitest keeps `tests/`. Playwright reads only `e2e/`. `vitest.config` excludes `e2e/`.
- Specs:
  1. `full-chain.spec.ts`: the lead creates a syllabus, uploads a PDF and submits. Each of the five holders opens `/review`, completes Form 17 and approves. The lead uploads the signed copy, and the status reads Filed. The timeline and `/audit` show seven status rows.
  2. `return-resubmit.spec.ts`: the dean adds a Form 18-1 point and returns. The lead uploads a new version, responds and resubmits. The syllabus resumes at the dean.
  3. `lead-override.spec.ts`: an admin reassign without a reason is refused in the UI. With a reason, it succeeds, and `/audit` shows it marked Override.
  4. `upload-limit.spec.ts`: the 21st upload within the hour shows the 429 message (seeded with 20 audit rows, not 20 real uploads).
  5. `a11y.spec.ts`: axe on each page in the list below, signed in as a role that can open it.
- Not in CI yet. There is no CI config in the repo. Wiring one is a separate task.

## Accessibility pass

Pages: `/login`, `/register`, `/syllabus`, `/syllabus/[id]`, `/syllabus/[id]/review`, `/syllabus/[id]/revise`, `/review`, `/dashboard`, `/notifications`, `/audit`, and one manager page per template (`/college`, `/program-chair`, `/fdis-chair`, `/prospectus`).

Keyboard pass, by hand and recorded in this spec: focus trap and return in every modal and delete dialog, combobox search and selection, the notification popover, the review workspace tabs and the PDF viewer, visible focus on everything, and a skip link to main content.

## Tasks

1. Migration `1793000026` and `types/audit.ts`. Apply it to the dev PocketBase.
2. `lib/audit.ts` `addAudit()`, with tests.
3. `addSyllabusEvent()` writes the audit row. Update the six transition routes and their tests, which assert on both creates in the batch.
4. Lead override: the validator, the route, tests (chair without a reason 200, admin non-chair without a reason 400, admin with a reason 200 plus an override row, admin who is also the chair needs no reason) and the modal field.
5. `lib/upload-limit.ts` with tests, wired into the three upload routes with `file.uploaded` rows. Route tests for 429 with `Retry-After` and for nothing touching storage.
6. `audit.view` capability, `lib/audit-log.ts`, validator and `GET /api/audit`, with tests (401, 403 for non-admin, filters, out-of-range `perPage`, 400 for bad dates).
7. `/audit` page, manager and nav entry.
8. `docs/retention-policy.md` and the AGENTS.md pointer.
9. Playwright and axe devDependencies, config, the global setup and teardown harness, and the seed.
10. E2E specs 1 to 4.
11. `a11y.spec.ts`. Fix serious and critical violations, then the keyboard pass.
12. Update AGENTS.md (data model, Phase 6 status) and this spec's status and verification.

## Boundaries

- **Always:** write an audit row in the same batch as the change it records, use `pb.filter` with params in every audit query, and map rows through `toAuditResponse`.
- **Ask first:** auditing more actions (stand-ins, assignments, user admin changes), raising or lowering the upload limit, and adding CI.
- **Never:** let a route update or delete `audit_log`, show emails in the audit page, delete a file for retention, or let admin approve or return a syllabus.

## Out of scope

Force-return, force-approve, stand-in auditing, virus scanning, automatic deletion, rate limits on non-upload routes (login and registration rely on PocketBase's own limits) and CI setup.
