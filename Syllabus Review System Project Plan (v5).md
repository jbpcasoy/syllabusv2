# Syllabus Review System: Project Plan (v5)

Last updated October 24, 2026. Status: planning complete, no phase started. The codebase and `pb_schema.json` are still at the baseline described in section 3 (the `role` field still exists).

## 1. How to use this doc with AI tools

- Paste sections 2, 3 and 4 as standing context at the start of every AI session.
- Then paste only the phase you are working on (section 9) and ask for one layer at a time: types, validator, `lib`, API routes, client, UI, tests.
- Tell the tool to copy the pattern of an existing module. Good templates: `fdis-chair` or `citl-director` for single-active records, `program-chair` or `dean` for scoped assignments, `prospectus` for records with a published flag.
- Always require: TypeScript only, file path above every code block, Headless UI + Tailwind, PocketBase as database and S3 storage, latest Next.js (App Router).

## 2. Project context

**Goal.** Faculty of Bukidnon State University upload syllabi as PDFs. Each syllabus is reviewed through a fixed six-stage chain using the university's review forms, then wet-signed, scanned and filed.

**Stack.** Next.js 16 (App Router), React 19, TypeScript, Tailwind 4, Headless UI, PocketBase 0.28 SDK, S3-compatible storage through PocketBase, Vitest.

**Documents the system supports.**

- Enhanced OBE Syllabus (OVPAA-F-INS-050, Rev 05): course code, title, credit, nominal duration, prerequisite, description, course outcomes, 19-week learning plan, references, grading, policies, revision history, signature page.
- Form 17 (OVPAA-F-INS-017, Rev 04): OBE Syllabus Review Checklist, Yes/No criteria with remarks, plus suggestions for improvement.
- Form 18-1 (CITL-F-018, Rev 01): Syllabus Review Suggestions and Action Taken. Part A is Program Review, Part B is CITL Review. Each row has Review Point, Action Taken, Page Number and Remarks. Part B review points use a fixed legend of codes A.1 to F.3.
- Justification Form: a letter to the CITL Director listing syllabi that lack the lead faculty's signature, each with a justification. Signed by faculty and noted by the Program Chair.

## 3. Current codebase conventions (follow these)

**Layers per module.** `types/<x>.ts` → `lib/validators/<x>.ts` → `lib/<x>.ts` (server-only helpers) → `app/api/<x>/route.ts` and `[id]/route.ts` → `lib/<x>-client.ts` → `components/<x>/` (manager, modal, delete dialog) → `app/<x>/page.tsx` → `tests/api/<x>/`.

**API routes.**

- Guard first with `requireUser(...)`, which returns `{ ok, user }` or `{ ok: false, response }`.
- Parse the body with `request.json().catch(() => null)`, then run it through a validator returning `{ ok, data } | { ok: false, error }`. IDs are checked with `/^[a-z0-9]{15}$/`.
- Use `createAdminPb()` (superuser client) for data access, and `pb.filter(expr, params)` for every filter that includes user input.
- Wrap in try/catch and return `handlePbError(error)`.
- Lists accept `page`, `perPage` (clamped 1 to 100, default 30), `search` and relation filters. Responses are mapped through `to<X>Response` so no hidden fields leak.
- Route params are `Promise<{ id: string }>` and must be awaited.
- Single-active records (FDIS chair, CITL director, VPAA, one dean per college and similar): check for an existing record, return 409 with a clear message, then create. Unique indexes guard races.

**Client libs.** One `request<T>()` helper that throws `Error(message)` using the API's `error` field. List functions take an `AbortSignal`.

**UI.** Manager component with debounced search, filters, paginated table (10 per page), Retry banner, and modal plus delete dialog keyed by a counter so form state resets. Modals use Headless UI `Dialog`, `Field`, `Label`, `Input`, `Select`.

**Auth.** PocketBase JWT stored in the `pb_auth` httpOnly cookie. `getCurrentUser()` is cached per request. `app/proxy.ts` does an optimistic expiry check and redirects to `/login?next=...`.

**Tests.** Vitest. Each route test mocks `@/lib/pocketbase`, `@/lib/auth`, the validator and the `@/lib/<x>` module (mocked wholesale so `server-only` never loads). Cases covered per route: success, validation 400, malformed JSON, 401, 403, 404 propagation, `handlePbError` delegation, and conflict 409 where relevant.

**Known baseline facts.**

- `users.role` is a select: admin, faculty, programchair, departmenthead, dean, fdischair, vpaa.
- `PERMISSIONS` lists role names per resource and `requireUser(roles)` checks only the role, not scope. Any dean can currently manage any college's departments.
- `programs.department` and `departments.college` are optional in the schema and validators, and the modals offer "No department" and "No college".
- `prospectus_items` currently stores `subject_code` and `title` as free text, and `prospectuses.school_year` is a text field. Both change in Phase 1 (migration needed).
- `citl_directors` collection and module already exist.
- Self-registration creates a `faculty` user.

## 4. Decisions locked in

| Topic | Decision |
| --- | --- |
| Review chain | Faculty submits → Program Chair → Department Head → Dean → FDIS Chair → CITL Director → VPAA (final approval) |
| Skipping stages | Not allowed |
| Outcomes | Approve or Return for revision. No reject |
| After a return | Faculty uploads a new version and the syllabus resumes at the stage that returned it |
| Roles | Remove `role`. Add `isAdmin` boolean. Derive every other role from active assignment records |
| Registration | Stays open. New users get no role. They request to join a program (Phase 1b) |
| Org integrity | A program must have a department, and a department must have a college |
| Terms and school years | Admin-only to write |
| Courses | Admin-only to write (can widen later). Each course has a required owning program |
| GE courses | GE has its own program and department. Its courses are referenced from other programs' prospectuses |
| Prospectus | One per program and school year, no curriculum versions. Admin duplicates it into the next school year |
| Nominal duration | A number of hours |
| Form 17 | One shared checklist per syllabus version |
| Form 18-1 | Part A (Program Review) covers Program Chair, Department Head and Dean. Part B (CITL Review) covers FDIS Chair, CITL Director and VPAA |
| Signatures | Wet-signed. The system issues an approval reference per approval, which signatories cite on paper |
| Signed copy | A scan of the wet-signed syllabus is uploaded and stored |
| Co-authorship | Allowed. Only the lead can modify the syllabus in the system |
| Chair authors the syllabus | The chair designates a senior faculty member as a per-syllabus proxy. No new collection |
| Other stages with a conflict of interest | Admin assigns a stand-in |

## 5. Authorization target (Phase A)

**Principle.** Authorization comes from active assignment records, never from a stored role. A user can hold several roles at once.

**Resolver.** `getUserRoles(userId)` runs these queries in parallel, cached per request, and returns: `isAdmin`, chair of programs, head of departments, dean of colleges, `isFdisChair`, `isCitlDirector`, `isVpaa`, faculty of programs.

**Capabilities.** Replace `PERMISSIONS` and the `canManage*` helpers with `can(user, capability, target?)`. Scope is derived through program → department → college.

| Capability | Who | Scope |
| --- | --- | --- |
| campus, vpaa, user, school year, term, course | Admin | Global |
| college, dean, FDIS chair, CITL director | VPAA | Global |
| department and program (write) | VPAA globally. Dean in their college. Department Head in their own department (edit only) | Scoped |
| department head (write) | VPAA globally. Dean for their college's departments | Scoped |
| program chair (write) | VPAA globally. Dean for their college. Department Head for their department's programs | Scoped |
| faculty (write) | Program Chair of that program | Scoped |
| prospectus (write) | Admin | Global |

Admin always passes. `requireUser(capability?, target?)` with no argument means any signed-in user. Creates check the target from the request body. Updates and deletes load the record first. Scoped managers list only records in their scope. Everyone else lists only their own.

## 6. Review workflow

**Stages.** 1 Program Chair, 2 Department Head, 3 Dean, 4 FDIS Chair, 5 CITL Director, 6 VPAA.

**Statuses.** draft → submitted → in review (stage 1 to 6) ↔ returned (at a stage) → approved → filed. "Filed" means the signed scan has been uploaded.

**Rules.**

- One state machine in one file (for example `lib/syllabus-workflow.ts`) defines stages, transitions and who may act. Every route calls it.
- An action is allowed only when the syllabus is at the caller's stage and within the caller's scope. Queues belong to stages, so a replaced dean's successor inherits the queue.
- **Routing readiness.** Submission fails with a clear message unless an active chair, department head, dean, FDIS chair, CITL director and VPAA all exist for the syllabus's program chain.
- **Return** requires at least one Form 18-1 review point. The faculty lead then fills Action Taken and Page Number for each point. Resubmission is blocked until every open point has a response. The returning reviewer marks each point resolved or not.
- **Self-review blocking.** Nobody reviews a syllabus they lead or co-author.
- **Proxy.** If the chair leads or co-authors the syllabus, stage 1 is not routed until the chair designates a proxy. The proxy must be an active faculty member of the program who is not the lead or a co-author. It is stored on the syllabus with who and when, and applies to stage 1 of that syllabus only. For stages 2 to 6, admin assigns a stand-in.
- **Approval references.** Each approval creates a code such as `SYL-<term>-<seq>-S<stage>`. Exports print the name, stage, timestamp and code next to each signature line. A signed-in `/verify/<code>` page shows what the code refers to.

**Co-authorship.** One lead and any number of co-authors. Co-authors can view the syllabus, status, PDFs and return points, but cannot upload, edit, submit or respond. The Program Chair or admin can transfer the lead. A second instructor is added as a co-author instead of creating a duplicate. For GE courses, each instructor is added as a co-author on the single syllabus for that course and term (to be confirmed, see section 10).

## 7. Forms in the system

**Form 17 (shared checklist).** 43 criteria in 9 sections: Preliminaries, Vision/Mission/Goals/Objectives/Outcomes, Course Content, Assessment, Learning Modality and Methods, Resources/Readings/References, Policies, Other Required Information, House Style. Filled at stage 1 by the chair or proxy. Later reviewers may add remarks or change an answer, and each change is logged with who and when. Every criterion must be answered. A "No" requires remarks and blocks Approve, so the reviewer must Return. Ends with Suggestions for Improvement.

**Form 18-1.** Review points with Review Point, Action Taken, Page Number and Remarks. Part A (Program Chair, Department Head, Dean) uses free review points. Part B (FDIS Chair, CITL Director, VPAA) uses the legend: A Format and House Style (A.1 to A.5), B Alignment (B.1 to B.6), C Behavioral Verbs (C.1, C.2), D Gradation of COs and SLOs (D.1 to D.5), E Supplementary Documentation (E.1 to E.4), F Prescribed Forms (F.1 to F.3). The system can pre-fill F.1 to F.3 (Form 17 exists, Form 18-1 exists, justification exists if flagged).

**Justification Form.** A syllabus can carry a "lead signature missing" flag with a required justification text. It informs reviewers and does not block routing. The letter is generated, not hand-built: it batches all flagged syllabi of one program and term, fills the semester and school year from the term, and addresses the active CITL Director. Signature lines stay blank for wet signing, and the Program Chair's "Noted" line uses an approval reference.

**Form definitions** live in code, versioned by form code and revision. Each filled form stores the revision it used, so old reviews stay readable when the university revises a form. Exports match the original layouts.

**Signature page order (template):** Lead Faculty, Program Coordinator/Chairperson/Department Head, Dean, CITL Director, VPAA. "Revised by" lists the co-authors. The FDIS Chair appears on Form 18-1 Part B and in the system.

**Advisory PDF checks (optional, later).** Paper size, orientation, font names and the footer document code are reliably readable. Font sizes are approximate. Margins and line spacing are not reliable. Results only inform reviewers and never auto-fail a syllabus.

## 8. Data model

**Existing collections (keep).** `users`, `campuses`, `colleges`, `departments`, `programs`, `deans`, `department_heads`, `program_chairs`, `faculties`, `fdis_chairs`, `citl_directors`, `vpaas`.

**Changes to existing.**

- `users`: add `isAdmin` (bool). Drop `role` at the end of Phase A. Update rule must prevent non-superusers from changing their own `isAdmin`.
- `programs.department` and `departments.college`: required.
- `prospectuses`: `school_year` text becomes a relation to `school_years`.
- `prospectus_items`: replace `subject_code` and `title` with a `course` relation.

**New collections.**

| Collection | Key fields | Constraints |
| --- | --- | --- |
| `school_years` | label (e.g. 2026-2027) | Unique label |
| `terms` | school year, semester (1st, 2nd, Summer), open flag, optional submission deadline | Unique (school year, semester) |
| `courses` | code, title, owning program (required), credit units, lec units, lab units, nominal duration in hours (number), prerequisites (relation to courses), optional prerequisite note | Unique code |
| `prospectuses` | program, school year, published | Unique (program, school year) |
| `prospectus_items` | prospectus, course, year level, semester | Unique (prospectus, course) |
| `program_join_requests` | user, program, note, status (pending, approved, rejected), reason, decided by | One pending request per user and program |
| `syllabi` | course, term, lead, co-authors, program (derived from course), status, current stage, returned-at stage, proxy (user, set by, set at), justification flag and text | Unique (course, term) |
| `syllabus_versions` | syllabus, version number, PDF file, uploader, notes | Unique (syllabus, version) |
| `syllabus_reviews` | version, stage, reviewer, decision (approve, return), stage-completed time, approval reference | One decision per version and stage |
| `form17_answers` | version, criterion key, answer (yes, no), remarks, form revision, last edited by | Unique (version, criterion) |
| `form18_points` | version, part (A or B), stage, code (Part B), review point, action taken, page number, remarks, status (open, responded, resolved, unresolved) |  |
| `syllabus_signed_copies` | syllabus, scan file, uploaded by | Write-once. Replacement needs admin and is audited |
| `audit_log` | actor, action, entity, before/after, timestamp | Append-only |

A syllabus can be created only for a course and term that appear in at least one published prospectus. The term is chosen from those, not typed. Courses referenced by a prospectus item or a syllabus cannot be deleted. Terms and school years with dependents cannot be deleted.

## 9. Phases

### Phase A: Auth and org integrity (do first)

1. **Data audit.** Report users with their `role`, programs without a department, departments without a college, and mismatches between `role` and assignment records. Fix data before making fields required.
2. **`isAdmin`.** Add the field, set it for current admins, protect it in the users update rule. Keep guards: you cannot remove your own admin flag, and at least one admin must exist.
3. **Roles resolver.** `getUserRoles` as in section 5. `AppHeader`, `AppShell`, `/api/auth/me` and page guards use it.
4. **Capabilities.** `can(user, capability, target?)` replaces `PERMISSIONS` and `canManage*`. Implement the scoped table from section 5.
5. **`requireUser(capability?, target?)`.** Remove the empty-array admin-only convention.
6. **Org integrity.** Required relations in PocketBase, validators and types. Remove "No department" and "No college" options and the clear-relation handling. Show a clear error when deleting a parent that still has children.
7. **Users admin UI.** Administrator checkbox instead of the role select, a read-only list of assignments, and a filter for admin, has assignments, or unassigned. Header and nav show derived roles.
8. **Registration.** No role assigned. Remove `DEFAULT_REGISTRATION_ROLE`. Unassigned users see an "unassigned" state until Phase 1b.
9. **Remove `role`.** Ship `isAdmin` and the resolver, switch every route, page and test to capabilities, then drop the field, `USER_ROLES`, `ROLE_LABELS` and the role validators.
10. **Tests.** A shared helper such as `mockAuth({ isAdmin, roles })` replaces repeated `requireUser` mocks. New tests for the resolver and every scoped capability (in scope, out of scope, admin override).

**Done when:** existing modules behave as before except for the intentional scoping changes, and no code references `role`.

### Phase 1: Academic foundations (admin-managed)

Build order: school years and terms → courses → prospectus and items (migrate existing rows) → duplicate action. Admin-only writes, signed-in reads. Faculty see only published prospectuses.

- **Duplicate prospectus.** Choose a source (program and school year) and a target school year. A preview lists what will be copied and what is skipped as already present. Confirm applies it atomically using PocketBase's batch API (enable it in settings). Items copy as references to courses.
- **Course picker.** A university-wide catalog does not fit the "load 100 into a select" pattern. Use Headless UI Combobox with server-side search.
- **Migration.** Convert existing `prospectus_items` (free-text code and title) into `courses` records and references, and convert `prospectuses.school_year` text into `school_years` relations.
- **Nav.** School years and terms, Courses, Prospectus.

### Phase 1b: Program membership requests

A registered user picks a program (GE included) and adds an optional note. The program's chair or an admin approves, which creates the `faculties` record, or rejects with a reason. Consider requiring a verified email or restricting registration to the institutional domain, since open registration is the one public door.

### Phase 2: Syllabus submission

- Faculty see published prospectus items for programs where they hold an active faculty assignment and the term is open. One syllabus per course and term, with a lead and co-authors.
- Versioned PDF uploads validated server-side: PDF MIME type, magic bytes, size limit, and active faculty membership. Configure S3 storage and a size limit on the file field.
- **Protected file access from day one.** PDFs are served through a scoped route (lead, co-authors, admin now, reviewers in Phase 3). Never expose raw S3 URLs.
- UI: My syllabi list, upload modal, draft and submit flow, co-author management.
- Optional: start a new term's syllabus from the previous approved one.

### Phase 3: Review engine and forms

State machine, routing readiness, proxy handling, self-review blocking, approval references, Form 17, Form 18-1 Parts A and B, justification flag, signed scan upload, and PDF export of forms matching the originals. Heavy tests on the state machine and every route guard.

### Phase 4: Reviewer experience

Review queue per stage with filters (program, term, status). PDF viewer beside the form panel. Syllabus detail page with status timeline, version history and all review points. Faculty return view with a per-point Action Taken editor and resubmit.

### Phase 5: Visibility and communication

Notifications for submitted, returned and approved events (email through PocketBase's mailer, plus an in-app badge). Term deadlines and overdue indicators. Role dashboards: counts by stage, completion rate per program, department and college, "awaiting signed copy" and justification views, filtered exports.

### Phase 6: Hardening

Audit trail of every status change and admin overrides (reassign, force-return, stand-ins). Upload rate limits, optional virus scanning, retention policy for old versions. End-to-end tests of the full chain and an accessibility pass.

**Order of work:** A → 1 → 1b → 2 → 3 → 4, then 5 and 6.

## 10. Open questions

None of these block Phase A or Phase 1.

1. **Justification author.** May the Program Chair (or proxy) set the flag and sign as "Faculty", or must a faculty member? Does it ever block routing, or only inform? (Current proposal: lead, chair or proxy can set it, and it only informs.)
2. **Signed scan upload.** Who uploads it? (Proposal: CITL Director or admin, optionally the Program Chair.)
3. **GE co-authors.** Is each GE instructor added as a co-author on the single syllabus per course and term?
4. **Scoped list visibility.** Should deans see only their college's records, or the whole university? (Proposal: scoped.)

## 11. Prompt starters

**Start of any session.** "Here is my project plan (sections 2 to 4 pasted). Stack: Next.js App Router, TypeScript, Headless UI + Tailwind, PocketBase. Follow the existing layer pattern and give file paths above each code block. TypeScript only."

**For a module.** "Build the `<module>` module by copying the pattern of `<template module>`. Layer: `<types / validator / lib / API routes / client / UI / tests>`. Use `can(user, capability, target)` for authorization. Include Vitest tests in the existing mock style."

**For the review engine.** "Implement `lib/syllabus-workflow.ts` as a pure state machine (stages 1 to 6, approve or return, resume at returning stage) with no PocketBase calls, and write exhaustive unit tests first."
