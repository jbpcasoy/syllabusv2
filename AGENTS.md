<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project guidance

Guidance for AI coding agents working in this repo. `CLAUDE.md` imports this file, so keep everything here.

## Project

Syllabus review system for Bukidnon State University. Faculty upload syllabi as PDFs. Each syllabus is reviewed through a fixed five-stage chain using the university's forms, then wet-signed, scanned and filed.

**Stack:** Next.js (App Router, `app/` directory), React, TypeScript, Tailwind CSS, Headless UI, PocketBase (database and S3 file storage), Vitest.

## Hard rules

- TypeScript only (`.ts` / `.tsx`). Never plain JavaScript, except the files PocketBase runs itself: `pb_migrations/*.js` and `pb_hooks/*.pb.js`. Keep hooks as thin transport; logic stays in tested TypeScript.
- Follow the Next.js rules block at the top of this file: read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code. Route `params` are `Promise`s and must be awaited. Request interception lives in `app/proxy.ts`.
- UI is Headless UI + Tailwind only. No other component libraries.
- PocketBase is the only data store. Server code uses `createAdminPb()` from `lib/pocketbase.ts`.
- Every PocketBase filter that includes user input must use `pb.filter(expr, params)`. Never concatenate input into a filter string.
- Server-only modules start their imports with `"server-only"` and are never imported by client components.
- Never send hidden or sensitive fields to the browser. Map records through a `to<X>Response` helper.
- Do not add dependencies without asking.
- Do not change the PocketBase schema silently. State the exact collection, field and index changes in your answer so they can be applied to `pb_schema.json`.

## Commands

- `npm run dev` runs Next.js
- `npm run pb` runs PocketBase
- `npm test` runs Vitest
- `npm run lint` runs ESLint
- `npm run build` runs a production build

Run lint and tests before calling a task done.

## Module pattern

Build features in these layers, one module per resource. Copy an existing module instead of inventing a new shape.

1. `types/<x>.ts`: record, input, update-input and `<X>Response` types
2. `lib/validators/<x>.ts`: `parse<X>Input(body)` returning `{ ok: true, data } | { ok: false, error }`. IDs match `/^[a-z0-9]{15}$/`
3. `lib/<x>.ts`: server-only helpers (`to<X>Response`, scope and uniqueness checks)
4. `app/api/<x>/route.ts` and `app/api/<x>/[id]/route.ts`
5. `lib/<x>-client.ts`: browser fetch wrappers using the shared `request<T>()` pattern
6. `components/<x>/`: manager, modal, delete dialog
7. `app/<x>/page.tsx`: server page that redirects to `/login?next=...` when signed out
8. `tests/api/<x>/`: route tests
9. Navigation entry in `lib/navigation.ts`

Templates:

- single active record: `fdis-chair`, `citl-director`, `vpaa`
- scoped assignment: `program-chair`, `program-reviewer`, `dean`, `department-head`
- record with a published flag: `prospectus`
- plain CRUD: `campus`, `college`

## API route conventions

- Guard first with `requireUser(...)`. Return `auth.response` when `!auth.ok`.
- Parse the body with `request.json().catch(() => null)`, then validate. Return 400 with the validator's error.
- Wrap in `try/catch` and return `handlePbError(error)`.
- Lists accept `page`, `perPage` (clamped 1 to 100, default 30), `search` and relation filters, and sort explicitly.
- Status codes: 201 on create, 204 with no body on delete, 409 for conflicts with a clear human message, 404 propagated from PocketBase.
- Single-active rules: check for an existing record and for another active record, return 409, and rely on unique indexes for races.
- Keep a short route comment above each handler with the URL and body shape.

## UI conventions

- Client components start with `"use client"`.
- Manager components: debounced search (300 ms), filters that reset to page 1, 10 rows per page, `AbortController` on every fetch, a Retry banner on error, loading state that dims the table.
- Modals and delete dialogs are remounted with a counter `key` so form state resets. Block closing while saving.
- Error text uses `role="alert"`. Labels use Headless UI `Field` and `Label`.
- Lists of more than about 100 options (for example courses) need a Headless UI `Combobox` with server-side search, not a `Select`.

## Testing conventions

Vitest, one test file per route file, mirroring the `app/api` path under `tests/api`. Follow the existing style:

- Mock `@/lib/pocketbase`, `@/lib/auth`, the validator and the `@/lib/<x>` module (mocked wholesale so `server-only` never loads).
- Cover: success, validation 400, malformed JSON passed as `null`, 401, 403 with nothing touching PocketBase, 404 propagation, `handlePbError` delegation, and each 409 case.
- Use `mockAuth({ isAdmin, roles, scope })` from `tests/helpers/mock-auth.ts` with `authModuleMock()`, `rolesModuleMock()` and `capabilitiesModuleMock()` instead of hand-written `requireUser` mocks. Cover in scope, out of scope and admin override for every scoped capability.

## Authorization

- `users.isAdmin` is the only stored role. Every other role is derived from active assignment records (`program_chairs`, `program_reviewers`, `department_heads`, `deans`, `faculties`, `fdis_chairs`, `citl_directors`, `vpaas`).
- `getUserRoles(userId)` queries those collections in parallel, cached per request with `cache()`. It also sets `standsIn` when the user has any `syllabus_stand_ins` row. That isn't a role (no label); it only grants `reviewQueue.view`, so a proxy or stand-in sees the Review Queue link.
- `can(user, capability, target?)` in `lib/capabilities.ts`, rules in `lib/capability-rules.ts`. `requireUser(capability?, target?)` with no argument means any signed-in user. Admin always passes. Use `authorize()` when the target comes from the request body, and `canSomewhere()` in pages to decide whether to show management controls.
- Targets (`lib/scope.ts`): `{ program }`, `{ department }`, `{ college }`, or an assignment record id (`{ programChair }`, `{ programReviewer }`, `{ departmentHead }`, `{ faculty }`, `{ programJoinRequest }`, `{ syllabusReference }`, the last resolving through the referencing program).
- Lists are scoped (`lib/org-visibility.ts`): admin, VPAA, FDIS chair and CITL director see everything; deans, department heads and program chairs see their scope; everyone else sees their own assignment records. Org lists stay fully visible so unassigned users can find a program to join.
- Scope is derived through program, then department, then college. A dean manages only their college, a department head only their department, a program chair only their program.
- A user can hold several roles at once. Never assume a single role.

| Capability                                                | Who                                                                | Scope  |
| --------------------------------------------------------- | ------------------------------------------------------------------ | ------ |
| campus, vpaa, user, school year, term, course, prospectus | Admin                                                              | Global |
| college, dean, FDIS chair, CITL director                  | VPAA                                                               | Global |
| department, program (write)                               | VPAA; Dean in their college; Department Head edits own department  | Scoped |
| department head (write)                                   | VPAA; Dean for their college                                       | Scoped |
| program chair (write)                                     | VPAA; Dean for their college; Department Head for their department | Scoped |
| program reviewer (write)                                  | VPAA; Dean for their college; Department Head for their department | Scoped |
| faculty (write)                                           | Program Chair of that program                                      | Scoped |
| own join request (approve)                                | Department Head who also chairs the program                        | Scoped |
| syllabus reference (request, withdraw)                    | Program Chair of the referencing program                           | Scoped |
| signed copy (return as invalid)                           | Program Reviewer; Dean of its college; FDIS Chair; CITL Director; VPAA | Scoped |
| syllabus lead (transfer)                                  | Program Chair of the syllabus's program                            | Scoped |
| justification (return for revision)                      | Program Reviewer; Dean of its college; FDIS Chair; CITL Director; VPAA | Scoped |
| dashboard (view, export)                                  | Program Reviewer, Program Chair, Department Head, Dean, FDIS Chair, CITL Director, VPAA; justification panel only for the justification roles | Scoped |

Syllabus access (lead, co-author, admin) is a relationship to one record, not a role, so it is checked by `getSyllabusAccess()` in `lib/syllabus.ts`, not by a capability. `resolveSyllabusAccess()` adds `reviewer`, then `chair` (read-only, for an active chair of the syllabus's program, so they can reach Transfer lead; never the justification), then `referencer`. The same goes for the source lead (or admin) deciding or revoking a reference.

Add every new check as a capability in `lib/capability-rules.ts`. Never branch on role names in routes or components.

## Domain rules

**Org chain:** campus, college, department, program. A program must have a department and a department must have a college.

**Registration and membership:**

- Self-registration accepts only `ALLOWED_EMAIL_DOMAINS` (comma-separated, default `buksu.edu.ph`). Sign-in requires a verified email; `getCurrentUser()` treats unverified accounts as signed out. Admin-created users start verified.
- A signed-in user asks to join a program (GE included) with an optional note. The program's chair or an admin approves (creating or reactivating the `faculties` record in one batch) or rejects with a reason. Nobody decides their own request, except that a department head who chairs a program in their own department (for one-program departments) may approve, never reject, their own (`programJoinRequest.approveOwn`); admin passes as always. The requester may withdraw while pending. One pending request per user and program.

**Review chain (no skipping):** Faculty submits, then 1 Program Reviewer, 2 Dean, 3 FDIS Chair, 4 CITL Director, 5 VPAA. The Program Reviewer is its own assignment (`program_reviewers`, one active per program), separate from the program chair and department head, who take no part in review but keep their other duties. `CHAIN_ROLES` in `lib/syllabus-workflow.ts` is the single list of stages.

- Outcomes are Approve or Return for revision only. There is no reject.
- A return requires at least one Form 18-1 review point. After the faculty lead uploads a new version and responds to every open point, the syllabus resumes at the stage that returned it.
- All transitions go through one pure state machine (`lib/syllabus-workflow.ts`). Routes never set status or stage directly.
- Submission fails unless every stage of the syllabus's program chain has an active holder (`lib/syllabus-chain.ts`).
- Nobody reviews a syllabus they lead or co-author.
- A conflicted stage is covered by a per-syllabus stand-in (`syllabus_stand_ins`); the stage-1 stand-in is the proxy. An admin or any active holder of a later stage designates it (the program reviewer also names their own proxy). A proxy must be active faculty of the program; no stand-in may lead or co-author. A conflicted program reviewer never blocks submit or resubmit: the submit dialog warns the lead, the program reviewer is still notified, and their review workspace refuses them and asks for a proxy. Stage 1 waits until one is named (`proxyNeeded` in `lib/syllabus-review.ts`; `/review` lists these under *Needs a proxy*). Admin never reviews.
- Phase 3 spec: `docs/specs/phase-3-review-engine.md`.

**Forms:**

- Form 17 (OVPAA-F-INS-017): one shared Yes/No checklist per syllabus version. Every criterion answered, a "No" needs remarks and blocks Approve. Later reviewers' edits are logged.
- Form 18-1 (CITL-F-018): review points with Action Taken, Page Number and Remarks. Part A covers the Program Reviewer and the Dean. Part B covers FDIS Chair, CITL Director and VPAA, using the code legend A.1 to F.3.
- Justification Form: whenever an approved or filed syllabus exists for the same course, program and semester in the previous school year, its authors are acknowledged as authors of the current one, even if it was rewritten from scratch. `syllabi.based_on` holds it, set automatically on create (re-checked when the justification is opened), never by hand. One entry (author plus reason) per previous author who can't sign and isn't a current author. The lead creates it once the syllabus is approved, generates the letter (course code and title plus entries, addressed to the active CITL director) and uploads the signed scan, which locks the entries. The program reviewer or any higher role in the chain, or admin, may return the scan for revision. Informational only, never blocks. Only the lead, co-authors, reviewers and admins see it; referencers never do.
- Form definitions live in code, versioned by form code and revision. Stored answers record the revision they used.

**Signatures:** wet-signed on paper. Each approval creates a reference code (for example `SYL-<term>-<seq>-S<stage>`) printed on exported forms. The code embeds the school year's label and the term's semester, so neither can change once any of its syllabi holds a `ref_seq`. The lead uploads a scan of the signed syllabus after VPAA approval, which moves it to "filed". The program reviewer, dean, FDIS chair, CITL director, VPAA or an admin may return the scan as invalid with a reason, moving the syllabus back to "approved" for a new upload. Returned scans are kept.

**Syllabi:**

- Each syllabus is written for a target program (`syllabi.program`), so a GE course can have per-field variants (IT, Nursing, Business). Unique per course, term and target program. The target program's chain reviews it.
- One lead (the only editor) and any number of co-authors (view only). A second instructor in the same program is added as a co-author. The lead changes co-authors only while the syllabus is a draft or returned; while returned, nobody who is a stand-in on it or has decided on it may be added.
- A course has a required owning program. GE courses belong to a GE program and are referenced from other programs' prospectuses.
- A syllabus can only be created for a course and term listed in the target program's published prospectus (matching school year and semester, term open), and only by active faculty of the target program. Co-authors must meet the same rule.
- References: instead of writing its own, a program's chair may request to reference another program's syllabus for the same course and term. The source lead approves or rejects (self-approval allowed); admin may approve, reject and revoke on the lead's behalf. Any source status can be referenced and no second review happens. Once approved, the referencing program's chair and active faculty can view it (read-only, no justification). The chair may withdraw and the source lead may revoke. A program has either its own syllabus or one pending or approved reference per course and term.
- Phase 2 spec: `docs/specs/phase-2-syllabus-submission.md`.

**Files:** PDFs are validated server-side (MIME type, magic bytes, size) and are served only through a scoped route that checks the caller's access. Never expose raw S3 URLs. Uploads are limited to 20 per user per rolling hour (`lib/upload-limit.ts`, counted from `file.uploaded` audit rows; 429 with `Retry-After`). Nothing is ever deleted automatically: see `docs/retention-policy.md`.

## Data model

**Existing:** `users` (with `isAdmin`; `role` removed), `campuses`, `colleges`, `departments`, `programs`, `deans`, `department_heads`, `program_chairs`, `faculties`, `fdis_chairs`, `citl_directors`, `vpaas`, `prospectuses` (`school_year` relation), `prospectus_items` (`course` relation), `school_years`, `terms`, `courses`, `program_join_requests`, `syllabi`, `syllabus_versions` (protected PDF `file`, 20 MB), `syllabus_references` (one pending or approved per program, course and term).

**Storage:** set `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET` and `S3_FORCE_PATH_STYLE` in PocketBase's environment before migrating to store files in S3. Unset means local disk.

**Email:** `pb_hooks/notifications.pb.js` emails queued `notifications` every minute through PocketBase's mailer. Configure SMTP and the sender in PocketBase's Mail settings, and set `APP_URL` (the Next.js app's URL) in PocketBase's environment so links are absolute. Without SMTP, rows end `failed` and the in-app badge still works.

**Phase 3:** `syllabi` gains statuses `returned`, `approved`, `filed` and fields `ref_seq`, `returned_at` (a returned syllabus keeps `stage` at the returning stage); `syllabus_stand_ins`; `syllabus_reviews` (one per version and stage); `program_reviewers` (user, program, active; unique (user, program) and one active per program); stage fields max 5; `form17_answers` (unique (version, criterion)), `form17_changes` (append-only), `syllabus_versions.form17_suggestions`; `form18_points` (open → responded → resolved | unresolved; a return re-opens unresolved); `syllabus_signed_copies` (protected PDF; one valid per syllabus; returned copies kept); `syllabi.based_on`; `syllabus_justifications` (one per syllabus; draft → submitted → returned). Form definitions: `lib/forms/`.

**Phase 4:** `syllabus_events` (append-only, one row per workflow transition, written in the transition's batch by `addSyllabusEvent()` in `lib/syllabus-events.ts`; it feeds the timeline and is narrower than `audit_log`); `syllabi.status_changed_at` (set by every transition; the queue sorts on it). Queues: `lib/review-queue.ts`, `/review`. Workspaces: `/syllabus/[id]/review` (reviewer) and `/syllabus/[id]/revise` (lead); the syllabus page itself is read-only for review. Spec: `docs/specs/phase-4-reviewer-experience.md`.

**Phase 5:** `notifications` (one row per recipient per submit, resubmit, approve or return, plus one for a new stand-in or proxy whose stage is waiting now, plus one to the source lead when a reference is requested (`reference_requested`, stage 0), plus one to each active chair of the referencing program when a reference is approved (`reference_approved`, stage 0) or revoked (`reference_revoked`, stage 0, linking to `/syllabus-reference`), plus one to the source lead when the referencing program withdraws a pending request (`reference_withdrawn`, stage 0) or stops an approved reference (`reference_stopped`, stage 0), written in the change's batch by `addNotifications()` in `lib/notifications.ts`, which also builds the title, body and link; it feeds the header badge and `/notifications` and is the email outbox that `pb_hooks/notifications.pb.js` drains every minute: `pending` → `sending` → `sent` | `failed` (3 attempts, 24 hours) | `skipped` (unverified)); `terms.review_days` (days per stage, 0 = no limit). Deadlines are indicators only (`lib/deadlines.ts`, Philippine time) and never block. Dashboards: `/dashboard`, `dashboard.view`, scope in `lib/dashboard-scope.ts` (justifications only through `justificationScope`, never department heads or program chairs), counts in `lib/dashboard-aggregate.ts`, CSV exports in `lib/dashboard-export.ts`. Spec: `docs/specs/phase-5-visibility.md`.

**Phase 6:** `audit_log` (append-only, `null` API rules, one row per status change, lead transfer and PDF upload; written by `addAudit()` in `lib/audit.ts` in the change's batch, and by `addSyllabusEvent()` for every transition; `syllabus` and `target_id` are plain ids so rows outlive deletions; read only through `GET /api/audit` and `/audit`, capability `audit.view`, admin only). An admin who isn't the program's chair transferring a lead is an override (`isAdminOverride()` in `lib/capability-rules.ts`): it needs a reason and is marked `override`. End-to-end tests: `npm run test:e2e` (Playwright + axe, `e2e/README.md`). Spec: `docs/specs/phase-6-hardening.md`.

## Roadmap and status

Work in this order and do not start a phase before the previous one is done unless asked.

| Phase | Scope                                                                                                       | Status      |
| ----- | ----------------------------------------------------------------------------------------------------------- | ----------- |
| A     | `isAdmin`, roles resolver, scoped capabilities, required department and college, remove `role`, test helper | Done        |
| 1     | School years, terms, courses, prospectus and items, duplicate prospectus (admin only)                       | Done        |
| 1b    | Program membership requests, institutional-domain registration, email verification                         | Done        |
| 2     | Syllabus submission, PDF versions, co-authors, protected file route, syllabus references                    | Done        |
| 3     | Review engine, Form 17, Form 18-1, proxy, approval references, signed scan                                  | Done        |
| 4     | Reviewer queues, PDF viewer, timeline, faculty return view                                                  | Done        |
| 5     | Notifications, deadlines, dashboards                                                                        | Done        |
| 6     | Audit trail, overrides, rate limits, end-to-end tests, accessibility                                        | Done (manual keyboard pass pending) |

Update the status column when a phase finishes.

Carried into Phase 3 from Phase 2: start a new term's syllabus from the previous approved one (done: `based_on` plus `POST /version/from-previous`), lead transfer (done: `PUT /api/syllabus/[id]/lead`), reviewer access in `resolveSyllabusAccess` (done), and a concurrency guard on workflow transitions (done for approve and return: one batch plus `UNIQUE (version, stage)`; two simultaneous submits or resubmits can still both pass, which is harmless).

## Open questions (ask before assuming)

1. ~~Who may set the justification flag, and may it ever block routing?~~ Answered by the review committee: the new lead, informational only (see Forms).
2. ~~Who uploads the signed scan?~~ Answered: the lead; listed reviewers or admin may return it as invalid (see Signatures).
3. ~~Are GE instructors co-authors on the single syllabus per course and term?~~ Answered: no single GE syllabus. Each target program has its own variant, or references another program's (see Syllabi).
4. ~~Do scoped managers see only their scope in lists?~~ Answered: yes, scoped (see Authorization).

## Working agreement

- Ask before making a decision listed above as open. Do not guess.
- Prefer small, reviewable changes: one layer or one module per task.
- State which existing module you copied the pattern from.
- When a change needs a PocketBase schema edit, list it explicitly.
- Do not generate code for a later phase while working on an earlier one.
