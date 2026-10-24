<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project guidance

Guidance for AI coding agents working in this repo. `CLAUDE.md` imports this file, so keep everything here.

## Project

Syllabus review system for Bukidnon State University. Faculty upload syllabi as PDFs. Each syllabus is reviewed through a fixed six-stage chain using the university's forms, then wet-signed, scanned and filed.

**Stack:** Next.js (App Router, `app/` directory), React, TypeScript, Tailwind CSS, Headless UI, PocketBase (database and S3 file storage), Vitest.

## Hard rules

- TypeScript only (`.ts` / `.tsx`). Never plain JavaScript.
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
- scoped assignment: `program-chair`, `dean`, `department-head`
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
- Once the shared helper exists, use `mockAuth({ isAdmin, roles })` instead of hand-written `requireUser` mocks.

## Authorization

**Current state (being replaced):** `users.role` plus `PERMISSIONS` and `canManage*` helpers. These check role only, not scope.

**Target (Phase A):**

- Replace `role` with an `isAdmin` boolean. Every other role is derived from active assignment records (`program_chairs`, `department_heads`, `deans`, `faculties`, `fdis_chairs`, `citl_directors`, `vpaas`).
- `getUserRoles(userId)` queries those collections in parallel, cached per request with `cache()`.
- `can(user, capability, target?)` replaces `PERMISSIONS` and `canManage*`. `requireUser(capability?, target?)` with no argument means any signed-in user. Admin always passes.
- Scope is derived through program, then department, then college. A dean manages only their college, a department head only their department, a program chair only their program.
- A user can hold several roles at once. Never assume a single role.

| Capability                                                | Who                                                                | Scope  |
| --------------------------------------------------------- | ------------------------------------------------------------------ | ------ |
| campus, vpaa, user, school year, term, course, prospectus | Admin                                                              | Global |
| college, dean, FDIS chair, CITL director                  | VPAA                                                               | Global |
| department, program (write)                               | VPAA; Dean in their college; Department Head edits own department  | Scoped |
| department head (write)                                   | VPAA; Dean for their college                                       | Scoped |
| program chair (write)                                     | VPAA; Dean for their college; Department Head for their department | Scoped |
| faculty (write)                                           | Program Chair of that program                                      | Scoped |

Until Phase A ships, do not add new role-based checks that depend on `users.role`. Add them through a capability name so migration is mechanical.

## Domain rules

**Org chain:** campus, college, department, program. A program must have a department and a department must have a college.

**Review chain (no skipping):** Faculty submits, then 1 Program Chair, 2 Department Head, 3 Dean, 4 FDIS Chair, 5 CITL Director, 6 VPAA.

- Outcomes are Approve or Return for revision only. There is no reject.
- A return requires at least one Form 18-1 review point. After the faculty lead uploads a new version and responds to every open point, the syllabus resumes at the stage that returned it.
- All transitions go through one pure state machine (`lib/syllabus-workflow.ts`). Routes never set status or stage directly.
- Submission fails unless an active chair, department head, dean, FDIS chair, CITL director and VPAA exist for the syllabus's program chain.
- Nobody reviews a syllabus they lead or co-author.
- If the program chair leads or co-authors a syllabus, the chair designates a proxy (an active faculty member of that program, not the lead or a co-author), stored on the syllabus. For stages 2 to 6, admin assigns a stand-in.

**Forms:**

- Form 17 (OVPAA-F-INS-017): one shared Yes/No checklist per syllabus version. Every criterion answered, a "No" needs remarks and blocks Approve. Later reviewers' edits are logged.
- Form 18-1 (CITL-F-018): review points with Action Taken, Page Number and Remarks. Part A covers Program Chair, Department Head and Dean. Part B covers FDIS Chair, CITL Director and VPAA, using the code legend A.1 to F.3.
- Justification Form: flag plus text on a syllabus whose lead signature is missing. It informs reviewers and never blocks routing. The letter is generated per program and term and addressed to the active CITL director.
- Form definitions live in code, versioned by form code and revision. Stored answers record the revision they used.

**Signatures:** wet-signed on paper. Each approval creates a reference code (for example `SYL-<term>-<seq>-S<stage>`) printed on exported forms. A scan of the signed syllabus is uploaded after VPAA approval, is write-once, and moves the syllabus to "filed".

**Syllabi:**

- Unique per course and term. One lead (the only editor) and any number of co-authors (view only).
- A course has a required owning program. GE courses belong to a GE program and are referenced from other programs' prospectuses.
- A syllabus can only be created for a course and term that appear in a published prospectus, and only by faculty with an active assignment in the course's owning program.

**Files:** PDFs are validated server-side (MIME type, magic bytes, size) and are served only through a scoped route that checks the caller's access. Never expose raw S3 URLs.

## Data model

**Existing:** `users`, `campuses`, `colleges`, `departments`, `programs`, `deans`, `department_heads`, `program_chairs`, `faculties`, `fdis_chairs`, `citl_directors`, `vpaas`, `prospectuses`, `prospectus_items`.

**Planned changes:** `users.isAdmin` (then drop `role`), required `programs.department` and `departments.college`, `prospectuses.school_year` becomes a relation, and `prospectus_items` references a `course` instead of free-text code and title.

**Planned collections:** `school_years`, `terms` (unique per school year and semester), `courses` (unique code, required owning program, nominal duration in hours), `program_join_requests`, `syllabi`, `syllabus_versions`, `syllabus_reviews`, `form17_answers`, `form18_points`, `syllabus_signed_copies`, `audit_log`.

## Roadmap and status

Work in this order and do not start a phase before the previous one is done unless asked.

| Phase | Scope                                                                                                       | Status      |
| ----- | ----------------------------------------------------------------------------------------------------------- | ----------- |
| A     | `isAdmin`, roles resolver, scoped capabilities, required department and college, remove `role`, test helper | Not started |
| 1     | School years, terms, courses, prospectus and items, duplicate prospectus (admin only)                       | Not started |
| 1b    | Program membership requests                                                                                 | Not started |
| 2     | Syllabus submission, PDF versions, co-authors, protected file route                                         | Not started |
| 3     | Review engine, Form 17, Form 18-1, proxy, approval references, signed scan                                  | Not started |
| 4     | Reviewer queues, PDF viewer, timeline, faculty return view                                                  | Not started |
| 5     | Notifications, deadlines, dashboards                                                                        | Not started |
| 6     | Audit trail, overrides, rate limits, end-to-end tests, accessibility                                        | Not started |

Update the status column when a phase finishes.

## Open questions (ask before assuming)

1. Who may set the justification flag, and may it ever block routing?
2. Who uploads the signed scan (proposed: CITL director or admin)?
3. Are GE instructors co-authors on the single syllabus per course and term?
4. Do scoped managers see only their scope in lists (proposed) or the whole university?

## Working agreement

- Ask before making a decision listed above as open. Do not guess.
- Prefer small, reviewable changes: one layer or one module per task.
- State which existing module you copied the pattern from.
- When a change needs a PocketBase schema edit, list it explicitly.
- Do not generate code for a later phase while working on an earlier one.
