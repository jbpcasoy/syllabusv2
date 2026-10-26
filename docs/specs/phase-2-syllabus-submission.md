# Phase 2: Syllabus submission

Status: implemented 2026-10-26 (tasks 1–15 done). Source: project plan (v5), section 9, Phase 2, extended with syllabus references.

Verification: 1351 tests pass, `tsc` clean, production build succeeds, and a 31-step end-to-end run (syllabi, versions, PDFs, references) passed against a disposable PocketBase and app copy. Lint adds only two known repo-wide patterns (8 × `react-hooks/set-state-in-effect` from the shared fetch-effect pattern, 4 × `triple-slash-reference` in migrations).

Deviations from this spec, all deliberate: the reference sources list has no version count (one extra query per row); requesting a reference doesn't require an open term; `syllabus_references.syllabus` cascades on delete (only ended references can remain when a draft is deleted).

## Decisions (2026-10-26)

| Topic | Decision |
| --- | --- |
| Target program | Every syllabus is written **for a target program** (`syllabi.program`). A GE course can have an IT, a Nursing and a Business variant. |
| Uniqueness | One syllabus per **(course, term, target program)**. A second instructor in the same program is added as a co-author. |
| Who may lead or co-author | Active faculty of the **target program** only, and the target program's published prospectus must list the course for that term. A GE-only instructor needs a membership in IT to write the IT variant. |
| Review chain | The **target program's** chain (Phase 3): its chair, department head and college dean, then FDIS chair, CITL director and VPAA. |
| References | Instead of writing its own, a program's **chair** can request to reference another program's syllabus for the same course and term. The source syllabus's **lead** approves or rejects. Any source status can be referenced. The source's review covers it, so there is no second review. After approval, either side can end it: the referencing chair withdraws, or the source lead revokes. |
| Submit | Minimal `lib/syllabus-workflow.ts`: `draft → submitted` (stage 1) only. Phase 3 adds approve and return. Submitted syllabi are read-only. |
| S3 | A settings migration copies `S3_*` env vars into `settings.s3`. It does nothing when they are unset. |
| Size limit | 20 MB (`20971520` bytes), enforced on the file field and in the route. |
| Deferred | Copy from the previous term (needs "approved", Phase 3), lead transfer (Phase 3). |

This replaces the "Unique per course and term" Syllabi rule in `AGENTS.md` and closes open question 3.

## Definitions

**Term match.** A prospectus item matches a term when `prospectus.published = true`, `prospectus.school_year = term.school_year` and `item.semester = term.semester`.

**Listed.** Course C is listed for program P in term T when P's prospectus has an item for C that matches T.

**Eligible author** for (course, term, program P): an active faculty member of P, where C is listed for P in T. This is checked again on every write (create, co-author change, upload, submit).

**Covered.** Program P is covered for (C, T) when P has its own syllabus, or a `pending` or `approved` reference. Only one of these can exist at a time.

**Access** to a syllabus. This is a relationship, not a role, so it lives in `lib/syllabus.ts` (`getSyllabusAccess`) and not in `capability-rules.ts`:

| Access | Who | Can |
| --- | --- | --- |
| `lead` | `syllabi.lead` | edit, upload, submit, decide and revoke references |
| `coAuthor` | in `co_authors` | view |
| `referencer` | active faculty of a program holding an **approved** reference | view (they teach from it) |
| `admin` | `users.isAdmin` | view |

Before a reference is approved, the requesting chair sees only the source's metadata (course, term, program, lead, status, version count), not the PDF. Phase 3 adds `reviewer`. Callers with no access get 404.

## Schema changes (to apply to `pb_schema.json`)

All three collections have `null` API rules, so only the superuser has access.

**`syllabi`**

| Field | Type | Notes |
| --- | --- | --- |
| `course` | relation → courses, required | |
| `term` | relation → terms, required | |
| `program` | relation → programs, required | Target program, chosen on create from the author's eligible programs |
| `lead` | relation → users, required | |
| `co_authors` | relation → users, maxSelect 50 | |
| `status` | select [`draft`, `submitted`], required | Phase 3 adds values |
| `stage` | number, int, min 0, max 6 | 0 = not routed |
| `submitted_at` | date | |
| `created`, `updated` | autodate | |

Indexes: `UNIQUE (course, term, program)`, `(lead)`, `(term, status)`.

**`syllabus_versions`**

| Field | Type | Notes |
| --- | --- | --- |
| `syllabus` | relation → syllabi, required, cascadeDelete true | |
| `version_no` | number, int, min 1, required | |
| `file` | file, maxSelect 1, maxSize 20971520, mimeTypes [`application/pdf`], **protected** | |
| `uploaded_by` | relation → users, required | |
| `notes` | text, max 1000 | |
| `created` | autodate | |

Index: `UNIQUE (syllabus, version_no)`.

**`syllabus_references`**

| Field | Type | Notes |
| --- | --- | --- |
| `syllabus` | relation → syllabi, required, cascadeDelete true | Source. Deleting a draft removes its ended references (the route refuses while one is live) |
| `program` | relation → programs, required | Referencing program, never the source's program |
| `course`, `term` | relation, required | Copied from the source so the index can enforce coverage |
| `requested_by` | relation → users, required | |
| `note` | text, max 500 | |
| `status` | select [`pending`, `approved`, `rejected`, `withdrawn`, `revoked`], required | |
| `reason` | text, max 500 | Required on reject and revoke |
| `decided_by`, `decided_at` | relation → users, date | Approve or reject |
| `ended_by`, `ended_at` | relation → users, date | Withdraw or revoke |
| `created`, `updated` | autodate | |

Index: `UNIQUE (program, course, term) WHERE status IN ('pending','approved')` (same pattern as `idx_program_join_requests_pending`). The no-own-syllabus check across collections is done in the route, and the create batch re-checks it.

**Settings migration.** Sets `settings.s3` from `S3_ENDPOINT`, `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET` and `S3_FORCE_PATH_STYLE` (read with `$os.getenv`). It does nothing when `S3_BUCKET` is empty.

## Capabilities

`syllabusReference.request` covers requesting and withdrawing: chair of the referencing program, scoped `{ program }`. Admin passes. Deciding and revoking use the `lead` relationship. A chair who leads the source syllabus may approve their own request; self-approval is allowed by design. Admin may approve, reject and revoke on the lead's behalf (decided 2026-10-26).

## API

All routes call `requireUser()` first. Lists follow the standard paging, search and sort conventions.

**Syllabi**

| Route | Who | Behaviour |
| --- | --- | --- |
| `GET /api/syllabus/available?term=&program=&search=` | signed in | (course, open term, program) rows the caller may author, each with its coverage: own syllabus (id, lead) or reference (source program, status) |
| `GET /api/syllabus?term=&status=&search=` | signed in | Syllabi where the caller is lead, co-author or referencer (admin: all) |
| `POST /api/syllabus` `{ course, term, program }` | eligible author | 201. 409 when the term is closed, the program already has a syllabus ("…led by X. Ask them to add you as a co-author."), or the program has a pending or approved reference ("Withdraw the reference first.") |
| `GET /api/syllabus/[id]` | access | Detail with lead, co-authors, latest version and references |
| `PATCH /api/syllabus/[id]` `{ co_authors }` | lead, draft | Each user must be an eligible author for the target program and not the lead. Duplicates removed |
| `DELETE /api/syllabus/[id]` | lead, draft, never submitted | 204. 409 while any reference is pending or approved |
| `GET /api/syllabus/[id]/co-author-candidates?search=` | lead | Eligible authors for the Combobox |
| `GET /api/syllabus/[id]/version` | access | Versions, newest first. No file URLs |
| `POST /api/syllabus/[id]/version` multipart `file`, `notes` | lead, draft, term open, still eligible | Checks `type === application/pdf`, leading `%PDF-` bytes and size ≤ 20 MB, then sets `version_no` = max + 1. The unique index catches races and returns a 409 retry message |
| `GET /api/syllabus/[id]/version/[versionId]/file` | access | Streams bytes fetched server-side with a superuser file token. Headers: `Content-Type: application/pdf`, `Content-Disposition: inline; filename="<code>-<program>-<term>-v<n>.pdf"`, `Cache-Control: private, no-store`, `X-Content-Type-Options: nosniff` |
| `POST /api/syllabus/[id]/submit` | lead | Through the workflow. 409 when there is no version, the term is closed, the status isn't draft, or the target program's chain is incomplete (names the missing roles) |

**References** (template: `program-join-request`)

| Route | Who | Behaviour |
| --- | --- | --- |
| `GET /api/syllabus-reference/sources?course=&term=&program=` | `syllabusReference.request` for `program` | Other programs' syllabi for that course and term, metadata only |
| `GET /api/syllabus-reference?program=&syllabus=&status=` | chair of program, source lead, admin | Scoped list |
| `POST /api/syllabus-reference` `{ syllabus, program, note? }` | `syllabusReference.request` for `program` | 201. 409 when the source belongs to the same program, the course isn't listed for the program in that term, the program already has its own syllabus, or a pending or approved reference already exists |
| `PATCH /api/syllabus-reference/[id]` `{ action: "approve" \| "reject" \| "withdraw" \| "revoke", reason? }` | approve and reject: source lead (including when the lead is also the requester) or admin, pending. withdraw: `syllabusReference.request` for the program, pending or approved. revoke: source lead or admin, approved | 409 on a wrong status. `reason` is required for reject and revoke |

## Workflow (`lib/syllabus-workflow.ts`, pure)

`transition(state, event)` with `state = { status, stage }` and `event = { type: "submit", hasVersion, termOpen, missingRoles }` returns `{ ok: true, next }` or `{ ok: false, error }`. It makes no PocketBase calls and has exhaustive unit tests. `lib/syllabus-chain.ts` computes `missingRoles` for the target program: chair, department head, dean, FDIS chair, CITL director and VPAA, each active.

Reference transitions are a small pure function in `lib/syllabus-reference.ts`, using the same `{ ok, next | error }` shape.

## UI

- `/syllabus`: **My syllabi** manager (course, program, term, status, my access, versions, updated). Search, term and status filters, 10 rows per page.
  - The **New syllabus** modal asks for an open term, then a target program (the author's eligible programs), then a course via Combobox over `/available`. Covered rows are disabled and show "led by X" or "referenced from IT".
- `/syllabus/[id]`: header, versions table with **View PDF** (file route in a new tab), **Upload new version** modal, co-authors panel, **Submit** dialog and delete dialog.
  - A **References** panel lists programs referencing this syllabus. The lead sees approve, reject and revoke actions.
  - Write controls are shown only to the lead.
- `/syllabus-reference`: for chairs. Requests made by their programs (withdraw), plus a **Reference a syllabus** modal: pick a course and term listed for the program, then pick a source.
- Navigation: "My syllabi" for any signed-in user. "Syllabus references" when `canSomewhere("syllabusReference.request")`.

## Out of scope

Review actions, Form 17 and 18-1, proxy, reviewer access, lead transfer, copy from the previous term, deadlines and notifications.

## Task plan (one reviewable change each, lint and tests green after each)

**2a: Syllabi and versions**

1. **Schema.** Migrations for `syllabi`, `syllabus_versions` and S3 settings. Update `AGENTS.md` (domain rules, data model, close question 3).
2. **Workflow.** `lib/syllabus-workflow.ts` plus exhaustive tests (TDD).
3. **Types and validators.** `types/syllabus.ts`, `types/syllabus-version.ts`, `lib/validators/syllabus.ts` plus tests. Template: `program-join-request`.
4. **Server helpers.** `lib/syllabus.ts` (`toSyllabusResponse`, `getSyllabusAccess`, `isEligibleAuthor`, `listAvailable`), `lib/syllabus-chain.ts`, `lib/pdf.ts` plus tests.
5. **Syllabus routes.** available, list and create, detail, PATCH, DELETE, candidates, plus tests.
6. **Version and file routes** plus tests: bad MIME, bad magic bytes, oversize, non-lead upload, co-author can read, stranger gets 404.
7. **Submit route** plus tests, one for each 409 case.
8. **Client.** `lib/syllabus-client.ts` (multipart upload bypasses the JSON body of `request<T>()`).
9. **UI.** My syllabi manager, new-syllabus modal, page and nav.
10. **UI.** Detail page: versions, upload, co-authors, submit and delete.

**2b: References**

11. **Schema.** `syllabus_references` migration. Add the `syllabusReference.request` capability and the `{ syllabusReference }` scope target.
12. **Types, validator and pure transitions** plus tests.
13. **Routes.** sources, list, create and PATCH, plus tests. Extend `getSyllabusAccess` with `referencer`, and make syllabus create and delete respect references.
14. **UI.** References page, request modal, and the References panel on the syllabus detail page.
15. **Verify.** Run lint, tests and build, then a manual pass with S3 on and off. Mark Phase 2 done in `AGENTS.md`.
