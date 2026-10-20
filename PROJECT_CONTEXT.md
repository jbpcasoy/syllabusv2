# PROJECT_CONTEXT: Syllabus (syllabusv2)

Paste this at the start of a chat, then attach only the files being changed plus one sibling "template" file.

## Rules for the assistant
- Next.js App Router (`app/`), latest version. TypeScript only (`.ts`/`.tsx`).
- Put the file path above every code block.
- UI: Headless UI (`@headlessui/react`) + Tailwind 4. No other UI libraries.
- Database and file storage: PocketBase (S3 bucket for files; not used in code yet).
- Copy the existing patterns below exactly. Don't invent new structures.

## Stack
Next.js 16, React 19, TypeScript, Tailwind 4, Headless UI 2, `pocketbase` SDK 0.28, Vitest 5 (`vite-tsconfig-paths`).
Env vars: `POCKETBASE_URL`, `POCKETBASE_SUPERUSER_EMAIL`, `POCKETBASE_SUPERUSER_PASSWORD`.
Import alias: `@/` = project root.

## Roles and auth
- Roles (`types/user.ts`): `admin, faculty, programchair, departmenthead, dean, fdischair, vpaa`. Self-registration always gives `faculty` (`lib/constants.ts`).
- Session: httpOnly cookie `pb_auth` holding the PocketBase token.
  - `getCurrentUser()` (`lib/auth.ts`, cached) validates it with `authRefresh`. Returns `AppUser | null`.
  - `requireUser(roles?)` is for route handlers. Returns `{ ok: true, user } | { ok: false, response }` (401 or 403).
    - No argument: any signed-in user.
    - With roles: the user needs one of them. `admin` always passes. An empty array `[]` means admin only.
- `app/proxy.ts` is an optimistic redirect to `/login?next=...` when the token is missing or expired. Real checks happen in `getCurrentUser`/`requireUser`.
- `lib/permissions.ts` `PERMISSIONS` (write roles; admin implied):
  - `campus: []`, `vpaa: []`, `faculty: []`, `user: []` (admin only)
  - `college: [vpaa]`, `dean: [vpaa]`, `fdisChair: [vpaa]`
  - `department`, `program`, `programChair`: `[vpaa, dean, departmenthead]`
  - `departmentHead: [vpaa, dean]`
- Assigning someone to dean/chair/etc. does NOT change `users.role`. An admin sets the role separately on the Users page.

## PocketBase
- `lib/pocketbase.ts`: `createPb()` (anonymous), `createAdminPb()` (superuser, async), `handlePbError(error)` (maps to JSON `{ error }`).
- Collections: `users`, `campuses`, `colleges`, `departments`, `programs`, `program_chairs`, `department_heads`, `deans`, `fdis_chairs`, `vpaas`, `faculties`.
- Always bind filter params: `pb.filter("user = {:userId}", { userId })`. Never string-concatenate.
- IDs are 15 chars: validate with `PB_ID = /^[a-z0-9]{15}$/`.
- Hierarchy: campus → college → department → program. Relations are stored as ID strings, and `""` means unset.

## Two kinds of entities

### A. Plain CRUD: campus, college, department, program, user
- `GET /api/x`: public (anonymous `createPb`; `user` requires `PERMISSIONS.user.read`). Query: `page`, `perPage`, `search`, parent filter. Sort `name`, `expand` the parent.
- `GET /api/x/:id`, `POST`, `PATCH`, `DELETE` (DELETE returns 204 with no body). Writes use `requireUser(PERMISSIONS.x.write)` then `createAdminPb()`.
- PATCH uses `parseXInput(body, { partial: true })`. `""` or `null` clears a relation.

### B. Role assignments: dean, department-head, program-chair, fdis-chair, vpaa, faculty
A record links a `user` to a scope (college/department/program, or none) with `active: boolean`. Inactive records are kept for history.

| Entity | Collection | Scope | Only one active per |
|---|---|---|---|
| dean | `deans` | college | college |
| department-head | `department_heads` | department | department |
| program-chair | `program_chairs` | program | program |
| fdis-chair | `fdis_chairs` | none | whole app |
| vpaa | `vpaas` | none | whole app |
| faculty | `faculties` | program | (no limit) |

Route behavior:
- **GET** `/api/x`: `requireUser()` (any signed-in user). Uses `createAdminPb` because `expand` of other users is hidden otherwise. Filters: `search` (`user.name`/`user.email`), scope id, `user` (`me` resolves to the caller), `active=true|false`. Non-managers (`canManageX` false) are forced to `user = their own id`. Sort `-created`, `expand` `user[,scope]`. Response items go through `toXResponse`.
- **POST**: `requireUser(PERMISSIONS.x.write)` → `parseXInput` (400) → look up an existing record for the same user (+ scope):
  - active → 409 "already ...".
  - inactive → 409 "...inactive ... record... Reactivate it instead."
  - then, if `active !== false`, check the scope already has an active record → 409 "...Deactivate them first."
  - then create (the unique index covers races) → 201 `toXResponse`.
- **PATCH** `/api/x/:id` body `{ active }`: if activating, check no other active record (excluding itself). For dean/department-head/program-chair, `getOne` first to read the scope; for vpaa/fdis-chair call `hasActiveX(id)` directly. Then update with `expand`.
- **DELETE**: 204.

Per-entity files:
- `types/x.ts`: `X` (extends `RecordModel`), `XInput`, `XUpdateInput`, `XResponse` (safe shape, `expand` has only id/name/email/code).
- `lib/x.ts` (starts with `import "server-only"` at the end of the imports): `canManageXs(user)` (admin or listed in `PERMISSIONS.x.write`), `toXResponse`, `hasActiveX`/`scopeHasActiveX(scopeId, exceptId?)`, `isX…`, `list…`.
- `lib/validators/x.ts`: `parseXInput` and `parseXUpdate`, both returning `ParseResult<T>` (`{ ok: true, data } | { ok: false, error }`).
- `lib/x-client.ts`: browser fetch helpers (`listXs`, `createX`, `updateX`, `deleteX`) built on a local `request<T>()` that throws `Error(message)`.
- `app/api/x/route.ts`, `app/api/x/[id]/route.ts`, `app/x/page.tsx`.
- `components/x/x-manager.tsx`, `x-modal.tsx`, `delete-x-dialog.tsx`.

## Frontend conventions
- Page (server component): `getCurrentUser()` → `redirect("/login?next=/x")` if null → render `<XManager canManage={canManageXs(user)} />` inside `<main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">`.
- Manager (client component) state: `searchInput` (300 ms debounce) → `search`, filters, `page`, `reloadKey`, `data`, `loading`, `error`, `modal` (`{ open, key }`), `deleteState`.
  - Fetch effect with `AbortController`. `PER_PAGE = 10`.
  - Dropdown data is loaded with `perPage: 100` (the API cap).
  - Managers also load users for the assign dropdown. Non-managers don't see Assign/Deactivate/Remove.
  - Bump `key` on each open so form state resets. After a delete, step back a page if it was the last item.
- Modals and dialogs: Headless UI `Dialog`, `DialogBackdrop`, `DialogPanel`, `Field`, `Label`, `Select`, `Input`. Shared Tailwind classes (`inputClass`, `selectClass`, `thClass`). Indigo for primary, red for destructive.
- Nav: `lib/navigation.ts` `NAV_ITEMS`. Omit `roles` for any signed-in user, `roles: []` for admin only.

## Tests (Vitest, `tests/api/<entity>/route.test.ts` and `[id]/route.test.ts`)
- `vi.hoisted` mocks. Mock `@/lib/pocketbase`, `@/lib/auth` (`requireUser` returns admin by default), `@/lib/validators/x`.
- Mock `@/lib/x` wholesale (avoids loading `server-only`).
- Helpers: `get()`, `post()`, `req()`, `unauthorized()`, `forbidden()`, `signedInAs()`.
- Standard cases: pagination clamp (page ≥ 1, perPage ≤ 100, default 30), filters, user scoping, 400 on validation or bad JSON, 409 cases, 401/403 with no PocketBase calls, 404 propagation, errors via `handlePbError`.

## Response conventions
- Errors: `{ error: string }` (PocketBase errors also include `details`).
- List: `{ ...ListResult, items: mapped }`. Create: 201. Delete: 204.
- Params are parsed as `Math.max(1, Number(p) || 1)` for page and `Math.min(100, Math.max(1, Number(p) || 30))` for perPage.

## Known quirks (verify before relying on them)
- `app/proxy.ts` sits inside `app/`; Next.js normally expects `proxy.ts` at the project root (or `src/`), so it may not be running.
- `app/campus/page.tsx` has no `getCurrentUser` redirect, unlike the other pages.
- `formatDate` exists in both `lib/format-date.ts` and `components/campus/campus-manager.tsx`; campus-modal imports the latter.
- `app/page.tsx` and `app/api/route.ts` are still starter templates.
- Faculty write is admin only for now. `PERMISSIONS.*.read` is only used for `user`.
- The S3 bucket is not wired up yet.

## Checklist: adding a new role-assignment entity
1. `types/x.ts` → `lib/validators/x.ts` → `lib/x.ts` → `lib/x-client.ts`
2. Add a `PERMISSIONS.x` entry and a `NAV_ITEMS` entry
3. `app/api/x/route.ts` and `[id]/route.ts`, `app/x/page.tsx`
4. `components/x/` manager, modal, delete dialog
5. Tests mirroring the closest sibling (dean for scoped, vpaa for global)
6. Create the PocketBase collection with unique indexes (user+scope, and a partial unique on active where needed)
