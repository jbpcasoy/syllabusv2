# Phase 3: Review engine and forms

Status: **implemented 2026-10-27** (tasks 1 to 15 done; P1 to P10 accepted, P3 amended).

Verification:
- 2,202 tests pass, `tsc` is clean, and the production build succeeds.
- A 43-step end-to-end run passed against a throwaway PocketBase (every migration applied from scratch) and the built app. It covered a five-stage review with one return, Form 17 copy-forward, Form 18-1 points, and two simultaneous approvals (one 200, one 409, one review row), which confirms `hasNotUniqueError` against a real batch error. It also covered `/verify`, the exports, a signed copy returned and re-filed, and the justification through to a return.
- Lint adds only the known patterns: `set-state-in-effect` from the shared fetch-effect pattern, and `triple-slash-reference` in each migration. The 692 findings in the generated `pb_data/types.d.ts` aren't project code. Source: project plan (v5), sections 6 to 9, Phase 3, plus the Phase 2 carry-overs in `AGENTS.md`.

## Decisions (2026-10-26)

| Topic | Decision |
| --- | --- |
| Form text | The originals go in `docs/forms/` (supplied by the project owner). Criteria, legend and layout come only from those files. Slices that need form text wait for them. |
| PDF/DOCX export | Out of our hands. The project owner builds the export with docx-js. Phase 3 provides a **typed export-data interface** and a JSON route per form, and renders each form in a React component (screen and print) from the same data. |
| Justification Form | Answered by the review committee (2026-10-27). See **Justification** below. |
| Five-stage chain | 2026-10-27. The chain is **1 Program Reviewer, 2 Dean, 3 FDIS Chair, 4 CITL Director, 5 VPAA**. The Program Reviewer is a **new assignment** (`program_reviewers`, one active per program, assigned under `programReviewer.write` by the VPAA, the dean of the college or the head of the department). It is separate from the program chair and department head, who keep their other duties but take no part in review. Migration `1793000017` lowered the stage maximum to 5 (it also added `programs.level`, which `1793000018` drops again while creating `program_reviewers`). |
| Signed scan | The **lead** uploads it after VPAA approval, which moves the syllabus to `filed`. The **program reviewer, dean, FDIS chair, CITL director, VPAA** (of the syllabus's chain) or an **admin** can return it as invalid with a reason. That moves the syllabus back to `approved` so the lead can upload again. Returned copies are kept. This replaces "write-once" in `AGENTS.md`. |

### Accepted 2026-10-27

| # | Topic | Proposal |
| --- | --- | --- |
| P1 | Statuses | Keep `draft` and `submitted` (shown as "In review"; no data migration) and add `returned`, `approved` and `filed`. |
| P2 | Who acts at stage N | The active holder of the stage-N role in the target program's chain, unless a stand-in is set for that stage, in which case only the stand-in acts. The stage-1 stand-in is called the **proxy**. **Admin cannot review** (overrides are Phase 6). Nobody reviews a syllabus they lead or co-author. |
| P3 | Proxy and stand-ins | **Who designates** a stand-in for stage N: an admin, or any active holder of a later stage in that syllabus's chain. For stage 1, the program reviewer also designates their own proxy. So a conflicted VPAA (stage 5) can only be covered by an admin. A stage-1 proxy must be active faculty of the program. No stand-in may lead or co-author the syllabus. **Readiness:** a conflicted holder at any stage doesn't block submit or resubmit. (Changed 2026-10-29: submit used to return 409 while the program reviewer was an author with no proxy; an author could get around that by removing them.) Now the submit dialog warns the lead, the program reviewer is still notified at stage 1, and their workspace refuses them with "Name a proxy from the program's faculty to review it in your place." alongside the proxy picker. Stage 1 waits until a proxy is named (`proxyNeeded`). At stages 2 to 5 the refusal is "A stand-in must be assigned for this stage." |
| P4 | Approval code | `SYL-<yy><yy>-<sem>-<seq>-S<stage>`, for example `SYL-2627-1-0042-S3`. `<sem>` is `1`, `2` or `M` (Summer). `<seq>` is a four-digit number per term, assigned to the syllabus at first submit (`syllabi.ref_seq`, unique per term, retried on collision). It is shared by all stage codes of that syllabus. |
| P5 | Concurrency guard | Approve and return write the `syllabus_reviews` row and the syllabus update in **one PocketBase batch**. `UNIQUE (version, stage)` on reviews makes the second of two simultaneous decisions fail with a 409. |
| P6 | Points across versions | A point belongs to the syllabus and stage and records the version it was raised on. Return needs at least one `open` point at the caller's stage. Resubmit needs a version uploaded after the return and every `open` point `responded`. Before deciding again, the returning reviewer marks each `responded` point `resolved` or `unresolved`. A later return re-opens `unresolved` points. Approve needs no `open`, `responded` or `unresolved` points at that stage. |
| P7 | Form 17 across versions | Answers belong to a version. Resubmit copies the previous version's answers forward so reviewers re-check rather than start over. Approve at **any** stage needs every criterion answered and no "No". Edits after stage 1 are logged in `form17_changes`. |
| P8 | Reviewer access | `getSyllabusAccess` gains `reviewer`: once the syllabus is out of draft, the active chain holders of its chain plus its proxy and stand-ins can view it, including PDFs and forms. |
| P9 | Finding work | Phase 4 owns the queues. Phase 3 only adds `?scope=review` to `GET /api/syllabus`, listing syllabi waiting on the caller, so reviewers can reach them before Phase 4. |
| P10 | Carry-overs | Lead transfer and "start from the previous approved syllabus" form the last slice (3e). The concurrency guard is P5. Reviewer access is P8. |

## Justification

The authors of the **previous syllabus** are acknowledged as authors of the current one. The previous syllabus is the approved or filed syllabus for the same course and program in the same semester of the **previous school year**, and only that one, never older ones. When one of those authors can't sign, the current syllabus carries a justification.

- **Applies** whenever a previous syllabus exists, even if the current one was written from scratch. `based_on` holds it. Syllabus create sets it automatically with `findPreviousSyllabus(course, program, term)` (same course and program, same semester of the previous school year, `approved` or `filed`). If it is still empty when the lead opens the justification, the route looks it up once more and saves it, in case the previous syllabus was approved later. Nobody sets it by hand.
- **Entries.** There is one entry per previous author (lead or co-author) who can't sign: the author plus a reason. Previous authors who are also authors of the current syllabus can sign, so they never need an entry. When the same lead continues alone, nothing applies.
- **Who and when.** The **lead** creates it once the syllabus is `approved` (ready for wet signing), and may edit the entries until the scan is submitted, or again after a return.
- **Letter.** The lead generates it. It is addressed to the active CITL Director, fills the semester and school year from the term, and lists the course **code and title** only, followed by the entries (author name and reason). Signature lines stay blank. There is one letter per syllabus, because the scan and its return are per syllabus.
- **Scan.** The lead uploads the signed letter. That submits it and locks the entries.
- **Return.** The program reviewer or any higher role in the syllabus's chain (dean, FDIS chair, CITL director, VPAA), or an admin, may return the scan for revision with a reason. That unlocks the entries for edit and a new upload.
- **Never blocks.** Review, approval and filing of the syllabus ignore it.
- **Visibility.** The lead, co-authors, reviewers (P8) and admins can see it. Referencers never can.
- Form 18-1 F.3 can be pre-filled from whether a justification exists.

States (`lib/syllabus-justification.ts`, pure, same `{ ok, next | error }` shape as references): `draft --submitScan--> submitted --return--> returned --submitScan--> submitted`.

## Workflow (`lib/syllabus-workflow.ts`, pure)

```
draft --submit--> submitted@1 --approve--> submitted@2 ... submitted@5 --approve--> approved --file--> filed
                  submitted@N --return-->  returned@N  --resubmit--> submitted@N
                                                     filed --rejectScan--> approved
```

The events carry facts gathered by the route, and the machine never calls PocketBase:

| Event | Facts | Allowed from |
| --- | --- | --- |
| `submit` | hasVersion, termOpen, missingRoles | `draft` |
| `approve` | actorStage (stage the caller may act at, or null), form17Complete, form17HasNo, pendingPoints | `submitted@N`, actorStage = N |
| `return` | actorStage, openPoints | `submitted@N`, actorStage = N |
| `resubmit` | newVersionSinceReturn, unansweredPoints, termOpen, missingRoles | `returned@N` |
| `file` | hasScan | `approved` |
| `rejectScan` | (none) | `filed` |

`approve` at stage 5 goes to `approved`, and stage stays 5. The tests cover every pair of (state, event), each refusal message, and the stage arithmetic.

**Reviewer resolution** (`lib/syllabus-review.ts`, pure): `actorStage(userId, syllabus, chain, proxy, standIns)` returns the stage the user may act at now, or null. It never returns a stage when the user is the lead or a co-author. `chain` is the set of active holder ids per stage, loaded by an extension of `lib/syllabus-chain.ts`. This is a relationship like `getSyllabusAccess`, not a capability.

## Schema changes (to apply to `pb_schema.json`)

All new collections have `null` API rules (superuser only).

**`syllabi`** (changed)

| Field | Change |
| --- | --- |
| `status` | select values become [`draft`, `submitted`, `returned`, `approved`, `filed`] |
| `ref_seq` | number, int, min 1. Index `UNIQUE (term, ref_seq) WHERE ref_seq > 0` |
| `returned_at` | date |
**`syllabi`** (changed again in 3e): `based_on` (relation → syllabi, optional): the previous school year's syllabus, set automatically (see Justification). Not editable through the API.

**`syllabus_justifications`** (3e): `syllabus` (→ syllabi, cascade), `entries` (json: `[{ author: userId, reason: string ≤ 2000 }]`, validated in the route against the previous syllabus's authors), `status` (select `draft`, `submitted`, `returned`), `scan` (protected PDF, 20 MB), `submitted_at`, `return_reason` (text, max 500), `returned_by`, `returned_at`, `created`, `updated`. Index `UNIQUE (syllabus)`.

**`syllabus_stand_ins`**: `syllabus` (→ syllabi, cascade), `stage` (int 1 to 5; stage 1 is the proxy), `user` (→ users), `assigned_by` (→ users), `created`, `updated`. Index `UNIQUE (syllabus, stage)`. This replaces the per-syllabus proxy fields in plan v5 §8. The who and when are `assigned_by` and `updated`.

**`syllabus_reviews`**: `syllabus` (cascade), `version` (→ syllabus_versions), `stage` (int 1 to 5), `reviewer` (→ users), `acting_as` (select `holder`, `proxy`, `standIn`), `decision` (select `approve`, `return`), `approval_code` (text, empty on return), `created`. Indexes `UNIQUE (version, stage)` and `UNIQUE (approval_code) WHERE approval_code != ''`.

**`form17_answers`**: `version` (cascade), `criterion` (text), `answer` (select `yes`, `no`), `remarks` (text, max 2000), `form_revision` (text), `last_edited_by` (→ users), `created`, `updated`. Index `UNIQUE (version, criterion)`.

**`form17_changes`**: `answer` (→ form17_answers, cascade), `stage` (int), `by` (→ users), `from_answer`, `to_answer`, `from_remarks`, `to_remarks`, `created`. Append-only.

**`syllabus_versions`** (changed): add `form17_suggestions` (text, max 5000).

**`form18_points`**: `syllabus` (cascade), `version` (→ syllabus_versions), `part` (select `A`, `B`; A for stages 1 and 2, B for 3 to 5), `stage` (int 1 to 5), `code` (text, Part B only, from the legend), `review_point` (text, max 2000, required), `action_taken` (text, max 2000), `page_number` (text, max 50), `remarks` (text, max 2000), `status` (select `open`, `responded`, `resolved`, `unresolved`), `form_revision`, `raised_by`, `created`, `updated`. Index `(syllabus, stage, status)`.

**`syllabus_signed_copies`**: `syllabus` (cascade), `file` (protected PDF, 20 MB), `uploaded_by`, `status` (select `valid`, `returned`), `reason` (text, max 500), `returned_by`, `returned_at`, `created`. Index `UNIQUE (syllabus) WHERE status = 'valid'`.

## Capabilities

| Capability | Rule | Use |
| --- | --- | --- |
| `programReviewer.write` | VPAA; dean for their college; department head for their department | Assign, (de)activate and remove program reviewers (implemented) |
| `signedCopy.return` | program reviewer, dean, FDIS chair, CITL director or VPAA, scoped `{ program }` of the syllabus | Return a signed scan as invalid |
| `justification.return` | program reviewer, dean, FDIS chair, CITL director or VPAA, scoped `{ program }` of the syllabus | Return a justification scan for revision (the program reviewer "or any higher role") |

Reviewing, responding, uploading and designating stand-ins are relationships, not capabilities. They depend on the actor stage, the lead, or `canDesignate(userId, isAdmin, stage, chain)` in `lib/syllabus-review.ts` (P3).

## API

| Route | Who | Behaviour |
| --- | --- | --- |
| `GET /api/syllabus/[id]/stand-in` | access | Stand-ins by stage, each with who assigned it |
| `PUT /api/syllabus/[id]/stand-in` `{ stage, user \| null }` | `canDesignate` for `stage` | Not `approved` or `filed`, and the stage not yet passed. The stage-1 proxy also works in draft. The user may not lead or co-author the syllabus. A stage-1 proxy must be active faculty of the program |
| `GET /api/syllabus/[id]/stand-in-candidates?stage=&search=` | `canDesignate` for `stage` | Stage 1: the program's active faculty. Stages 2 to 5: users by name. Lead and co-authors excluded |
| `POST /api/syllabus/[id]/review` `{ decision: "approve" \| "return" }` | actor stage = current stage | Runs the workflow, then writes the review and the syllabus update in one batch (P5) |
| `POST /api/syllabus/[id]/resubmit` | lead | Through the workflow. Copies Form 17 forward (P7) |
| `GET /api/syllabus/[id]/form17?version=` | access | Answers, suggestions, change log and form revision |
| `PUT /api/syllabus/[id]/form17` `{ answers: [{ criterion, answer, remarks }], suggestions }` | actor stage | Current version only. Logs changes after stage 1 |
| `GET /api/syllabus/[id]/form18` | access | Points, both parts |
| `POST /api/syllabus/[id]/form18` `{ review_point, code?, remarks? }` | actor stage | Part from the stage. `code` is required and must be in the legend for Part B |
| `PATCH /api/syllabus/[id]/form18/[pointId]` | reviewer: edit while `open` and own stage, or judge `resolved`/`unresolved`. Lead: `{ action_taken, page_number }` while returned | 409 on a wrong status |
| `DELETE /api/syllabus/[id]/form18/[pointId]` | raising stage, while `open` and not yet returned | 204 |
| `POST /api/syllabus/[id]/signed-copy` multipart `file` | lead, `approved` | Same PDF checks as versions. `file` transition |
| `GET /api/syllabus/[id]/justification` | lead, co-author, reviewer, admin (others 404) | Entries with author names, status, return reason, and the eligible previous authors |
| `PUT /api/syllabus/[id]/justification` `{ entries: [{ author, reason }] }` | lead | Syllabus `approved` or `filed`, and the justification absent, `draft` or `returned`. 409 when there is no previous syllabus. Each author must be a previous author who isn't a current author. Reasons required. An empty list deletes a draft |
| `POST /api/syllabus/[id]/justification/scan` multipart `file` | lead | At least one entry. `draft` or `returned` → `submitted`. Same PDF checks as versions |
| `PATCH /api/syllabus/[id]/justification` `{ action: "return", reason }` | `justification.return` | `submitted` → `returned` |
| `GET /api/syllabus/[id]/justification/scan` | as GET | Same headers as version files |
| `GET /api/syllabus/[id]/export/justification` | lead | Letter export data |
| `PATCH /api/syllabus/[id]/signed-copy/[copyId]` `{ reason }` | `signedCopy.return` | `rejectScan` transition |
| `GET /api/syllabus/[id]/signed-copy/[copyId]/file` | access | Same headers as version files |
| `GET /api/syllabus/[id]/export/{form17,form18}?version=` | access | Export-data JSON (below) |
| `GET /verify/[code]` (page) | signed in | What the approval code refers to |

The existing upload route is extended to accept `returned` as well as `draft`. `GET /api/syllabus` gains `scope=review` (P9).

## Forms and export

- `lib/forms/types.ts` holds `FormDefinition { code, revision, title, sections[{ key, title, criteria[{ key, text }] }] }` and `LegendDefinition` for Part B.
- `lib/forms/form17/rev04.ts` and `lib/forms/form18-1/rev01.ts` are transcribed from `docs/forms/`. Old revisions stay importable by `{ code, revision }`.
- `lib/forms/export.ts` holds `Form17ExportData` and `Form181ExportData`: header fields (course, program, term, lead, co-authors), every criterion's text with its answer and remarks, points grouped by part and stage, and the signature blocks (name, role, stage, timestamp, approval code) in template order. It contains everything the docx-js export needs and nothing it has to look up.
- `components/forms/Form17View.tsx` and `Form181View.tsx` are read-only, print-friendly renders of that data. The editors sit beside them on the syllabus page.

## UI (minimal; Phase 4 polishes)

On `/syllabus/[id]`:

- **Review** panel for the actor: Form 17 editor, Form 18-1 point editor, and Approve or Return dialogs that show why they're disabled.
- **Return points** panel for the lead (respond) and the returning reviewer (judge).
- **Stand-ins** panel (proxy included), editable for those who may designate.
- **Signed copy** panel: upload for the lead, return for the listed roles.
- **Forms** tab with the two view components.

Also the `/verify/[code]` page, and a "Waiting on me" filter on My syllabi.

## Out of scope

The docx-js export itself, queues and timeline (Phase 4), notifications (Phase 5), the audit log and admin overrides (Phase 6).

## Task plan (one reviewable change each, lint and tests green after each)

**3a: Engine** (no form text needed)

1. **Schema.** Migrations for the `syllabi` changes, `syllabus_stand_ins` and `syllabus_reviews`. Update `AGENTS.md` (signed-copy rule, open question 2 answered, justification deferred).
2. **Workflow.** All events in `lib/syllabus-workflow.ts`, written test-first and exhaustively.
3a. **Program reviewers** (done 2026-10-27). Migration `1793000018`, the `program-reviewer` module (copied from `program-chair`), the `reviewerOfPrograms` role, the `programReviewer.write` capability, the `{ programReviewer }` scope target and navigation.
3. **Reviewer resolution.** `lib/syllabus-review.ts` (`actorStage`, `canDesignate`), chain holders in `lib/syllabus-chain.ts`, `reviewer` access, approval codes, plus tests.
4. **(Done 2026-10-27.) Stand-in routes** (proxy included) plus tests. When a stand-in may change is the pure `standInWindowError` in `lib/syllabus-review.ts`. Later-stage candidates are limited to verified users. Tests: a later stage may designate, an earlier stage or the same stage may not (except the program reviewer at stage 1), admin may, conflicted candidates are refused, and a non-faculty proxy is refused.
5. **(Done 2026-10-27.)** Form facts come from `loadFormFacts()` in `lib/syllabus-decision.ts`. Until tasks 8 and 9 it reports Form 17 complete and no points, so approve works and return is always refused; tasks 8 and 9 must land before real use. `ref_seq` is assigned on submit (and on first approval for syllabi submitted earlier). The batch conflict check (`hasNotUniqueError`) searches the whole error because a batch nests it; confirm it against a live PocketBase in task 15. **Review and resubmit routes** plus tests (every guard, self-review, batch conflict 409). Submit gains `proxyNeeded`. Upload accepts `returned`.
6. **(Done 2026-10-27.)** `GET /api/syllabus/[id]` returns `review` (`reviewContext()`: actor stage, capacity, designatable stages). "Waiting on me" is `lib/syllabus-queue.ts`. `/verify/[code]` uses `lib/approval-verify.ts` (metadata only). **Client and minimal UI.** Review actions, proxy, stand-ins, the waiting-on-me filter and the `/verify` page.

**3b: Forms** (needs `docs/forms/`)

7. **(Done 2026-10-27.)** `lib/forms/` holds `FORM17_REV04` and `FORM18_REV01`, plus `getForm17` and `getForm18` by revision, `form17Status` and `partForStage`. The Form 18-1 legend includes A.4.1 to A.4.3. The "Note for …" lines became on-screen `hint`s that never print. **Definitions.** `lib/forms/*` transcribed from the originals, plus tests (keys unique, revisions resolvable).
8. **(Done 2026-10-27.)** Migration `1793000019`, `lib/form17.ts` and `GET`/`PUT /api/syllabus/[id]/form17`. Saves are one batch with pre-generated ids, so change rows can reference new answers. `loadFormFacts(pb, versionId)` now reads Form 17. Resubmit copies answers and suggestions from the version of the latest return, in the same batch as the status change. **Schema and routes, Form 17.** Answers, changes, suggestions and copy-forward. Approve reads completeness.
9. **(Done 2026-10-27.)** Migration `1793000020`, pure rules in `lib/form18-rules.ts` (`pointFacts`, `pointCodeError`, `pointActionError`), `lib/form18.ts`, and `GET`/`POST /form18` plus `PATCH`/`DELETE /form18/[pointId]`. Return now also needs every answered point judged (`unjudgedPoints`), and it counts open plus unresolved points as returnable; unresolved points re-open in the return batch. Edit and delete only apply to open points raised on the current version. **Schema and routes, Form 18-1.** Points, the reviewer/lead status machine, and wiring into return, resubmit and approve.
10. **(Done 2026-10-27.)** `components/syllabus/form17-panel.tsx` and `form18-panel.tsx` on the detail page once the syllabus leaves draft. Form text comes from `lib/forms`. **UI.** Form editors and the points panel.

**3c: Export interface**

11. **(Done 2026-10-27.)** Pure builders in `lib/forms/export.ts` (`buildForm17Export`, `buildForm181Export`), loaders in `lib/forms-export.ts` (latest approval per stage), `GET /api/syllabus/[id]/export/{form17,form18}`, the views in `components/forms/`, and `/syllabus/[id]/forms`, a print view. Each printed signature line maps to the stage that signs it (`Signatory.signer`). `lib/forms/export.ts`, the export routes, the `Form17View` and `Form181View` components, plus tests.

**3d: Signed copy**

12. **(Done 2026-10-27.)** Migration `1793000021`, `lib/signed-copy.ts`, the routes `GET`/`POST /signed-copy`, `PATCH /signed-copy/[copyId]` and `GET .../file`, the `signedCopy.return` capability, and `components/syllabus/signed-copy-panel.tsx`. The upload is two writes, because a file upload can't join a batch: the copy is deleted if filing fails. The return is one batch. **Schema, routes and capability** plus tests, and the panel.

**3e: Carry-overs**

13. **(Done 2026-10-27.)** Migration `1793000022`, `lib/syllabus-previous.ts`, `PUT /lead` and `GET /lead-candidates` (capability `syllabus.transferLead`; the previous lead stays a co-author unless `keep_previous: false`; any status but filed), `POST /version/from-previous`, and the UI. Lead transfer (Program Chair or admin). Set `based_on` automatically on create. Add an option to start from `based_on` by copying its latest PDF as version 1.
14. **(Done 2026-10-27.)** Migration `1793000023`; pure rules in `lib/syllabus-justification.ts`; the letter in `lib/forms/justification.ts`, transcribed from the template with the active CITL director as recipient and the program chair on the "Noted" line; `lib/justification.ts`; `GET`/`PUT`/`PATCH /justification`, `POST`/`GET /justification/scan`, `GET /export/justification`; the `justification.return` capability; the panel and the letter preview. Form 18-1 export data carries `justification` for F.3, and it is null for referencers. **Justification.** `syllabus_justifications` schema, pure transitions, routes, the `justification.return` capability, letter export data (template from `docs/forms/`), a panel, and F.3 pre-fill, plus tests. The tests cover: before approval refused, edits locked while submitted, unlocked after a return, a non-previous author refused, a current co-author refused, a return by each listed role in and out of scope, and a referencer getting 404.
15. **(Done 2026-10-27; see Verification at the top.)** **Verify.** Lint, tests, build, and an end-to-end pass through all five stages with one return. Mark Phase 3 done in `AGENTS.md`.
