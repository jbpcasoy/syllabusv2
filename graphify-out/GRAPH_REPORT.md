# Graph Report - syllabusv2  (2026-10-26)

## Corpus Check
- 401 files · ~159,601 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 4, .ico 1, .css 1)

## Summary
- 1845 nodes · 5671 edges · 139 communities (83 shown, 56 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 95 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ff44f3db`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- prospectus-item-manager.tsx
- pocketbase
- react
- handlePbError
- Route Test Helpers
- Project Docs & Domain Rules
- types/user.ts
- Course Catalog & Picker
- Package & Tooling Config
- User Admin UI
- FDIS Chair Module
- Department/Program Scoping
- CITL Director Module
- program-join-request/route.ts
- Assignment [id] Route Tests
- Role Admin Pages
- pocketbase
- dean/route.ts
- Campus Module
- vpaa/route.ts
- Department UI
- Faculty UI
- lib/prospectus-duplicate.ts
- capability-rules.test.ts
- syllabus/route.ts
- lib/auth.ts
- Department Head UI
- VPAA UI
- requireUserMock
- Program Chair UI
- next
- campus-client.ts
- TypeScript Config
- Department Head API
- Program Chair API
- AppUser
- getUserRoles
- CITL Director List Tests
- Department Head List Tests
- FDIS Chair List Tests
- Prospectus List Tests
- VPAA List Tests
- Root Layout & Header
- capabilities.ts
- vitest
- Course List Tests
- Duplicate Route Tests
- Prospectus Item List Tests
- Term List Tests
- Phase A Audit Script
- School Year List Tests
- User List Tests
- School Years & Terms Page
- fdis-chair/route.ts
- lib/syllabus.ts
- prospectus-client.ts
- school-year/[id]/route.ts
- syllabus-detail.tsx
- Request Proxy
- syllabus-client.ts
- PostCSS Config
- course/[id]/route.ts
- term-manager.tsx
- next
- faculty/route.test.ts
- user/[id]/route.ts
- prospectus/[id]/route.ts
- register/page.tsx
- reference-row-actions.tsx
- dean-manager.tsx
- types/syllabus-reference.ts
- program-join-request-manager.tsx
- syllabus-workflow.ts
- types/term.ts
- types/syllabus.ts
- reference-modal.tsx
- Phase 2: Syllabus submission
- program-join-request/route.test.ts
- syllabus-reference/route.test.ts
- co-authors-panel.tsx
- upload-version-modal.tsx
- course/[id]/route.test.ts
- syllabus/page.tsx
- term/[id]/route.test.ts

## God Nodes (most connected - your core abstractions)
1. `createAdminPb()` - 239 edges
2. `handlePbError()` - 153 edges
3. `requireUser()` - 147 edges
4. `next` - 142 edges
5. `mockAuth()` - 89 edges
6. `pocketbase` - 82 edges
7. `react` - 81 edges
8. `vitest` - 79 edges
9. `@headlessui/react` - 71 edges
10. `getUserRoles` - 62 edges

## Surprising Connections (you probably didn't know these)
- `Definitions` --references--> `getSyllabusAccess()`  [INFERRED]
  docs/specs/phase-2-syllabus-submission.md → lib/syllabus.ts
- `API` --references--> `requireUser()`  [INFERRED]
  docs/specs/phase-2-syllabus-submission.md → lib/auth.ts
- `Task plan (one reviewable change each, lint and tests green after each)` --references--> `getSyllabusAccess()`  [INFERRED]
  docs/specs/phase-2-syllabus-submission.md → lib/syllabus.ts
- `Task plan (one reviewable change each, lint and tests green after each)` --references--> `listAvailable()`  [INFERRED]
  docs/specs/phase-2-syllabus-submission.md → lib/syllabus.ts
- `Task plan (one reviewable change each, lint and tests green after each)` --references--> `toSyllabusResponse()`  [INFERRED]
  docs/specs/phase-2-syllabus-submission.md → lib/syllabus.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Review engine flow (Phase 3)** — agents_syllabus_workflow_state_machine, agents_review_chain, syllabus_review_system_project_plan__v5__syllabus_statuses, syllabus_review_system_project_plan__v5__routing_readiness, agents_proxy_reviewer, agents_approval_reference [EXTRACTED 1.00]
- **University review forms supported by the system** — agents_form17, agents_form18_1, agents_justification_form, syllabus_review_system_project_plan__v5__enhanced_obe_syllabus, syllabus_review_system_project_plan__v5__form_definitions_versioning [EXTRACTED 1.00]
- **Phase A migration from role-based PERMISSIONS to derived-role capabilities** — project_context_users_role_field, project_context_permissions_map, agents_isadmin, agents_getuserroles, agents_capability_authorization [INFERRED 0.85]

## Communities (139 total, 56 thin omitted)

### Community 0 - "prospectus-item-manager.tsx"
Cohesion: 0.15
Nodes (27): DeleteProspectusItemDialog(), handleDelete(), DeleteProspectusItemDialogProps, itemProspectusLabel(), ModalState, ProspectusItemManager(), ProspectusItemManagerProps, prospectusLabel() (+19 more)

### Community 1 - "pocketbase"
Cohesion: 0.19
Nodes (18): CollegeManager(), ModalState, CollegeModal(), handleSubmit(), CollegeModalMode, CollegeModalProps, Detail(), TITLES (+10 more)

### Community 2 - "react"
Cohesion: 0.13
Nodes (25): ModalState, ProspectusManagerProps, ProspectusModalMode, ProspectusModalProps, TITLES, DeleteSchoolYearDialog(), handleDelete(), DeleteSchoolYearDialogProps (+17 more)

### Community 3 - "handlePbError"
Cohesion: 0.15
Nodes (27): DELETE(), GET(), DELETE(), DELETE(), PATCH(), RouteContext, GET(), POST() (+19 more)

### Community 4 - "Route Test Helpers"
Cohesion: 0.06
Nodes (23): base, listResult, mocks, base, listResult, mocks, ctx, forbidden() (+15 more)

### Community 5 - "Project Docs & Domain Rules"
Cohesion: 0.06
Nodes (37): AGENTS.md (agent guidance), Approval reference code (SYL-<term>-<seq>-S<stage>), Capability-based authorization (can, requireUser, authorize, canSomewhere), Form 17 (OVPAA-F-INS-017) review checklist, Form 18-1 (CITL-F-018) review points, getUserRoles resolver (derived roles from assignment records), users.isAdmin (only stored role), Justification Form (missing lead signature) (+29 more)

### Community 6 - "types/user.ts"
Cohesion: 0.13
Nodes (18): isDuplicateEmail(), POST(), RegisterFormProps, DEFAULT_EMAIL_DOMAINS, parseDomainList(), ParsedRegistration, parseRegisterInput(), ParseResult (+10 more)

### Community 7 - "Course Catalog & Picker"
Cohesion: 0.08
Nodes (39): CourseCombobox(), CourseComboboxProps, CourseOption, CourseModal(), handleSubmit(), CourseModalMode, CourseModalProps, NUMBER_FIELDS (+31 more)

### Community 8 - "Package & Tooling Config"
Cohesion: 0.06
Nodes (39): eslintConfig, dependencies, @headlessui/react@^2.2.10, next@16.3.6, pocketbase@^0.28.1, react@19.2.8, react-dom@19.2.8, devDependencies (+31 more)

### Community 9 - "User Admin UI"
Cohesion: 0.12
Nodes (25): CitlDirectorModalProps, DeleteUserDialog(), handleDelete(), DeleteUserDialogProps, describeAccess(), KIND_LABELS, ModalState, UserManager() (+17 more)

### Community 10 - "FDIS Chair Module"
Cohesion: 0.22
Nodes (17): DeleteFdisChairDialog(), handleDelete(), DeleteFdisChairDialogProps, FdisChairManager(), toggleActive(), FdisChairManagerProps, FdisChairModal(), handleSubmit() (+9 more)

### Community 11 - "Department/Program Scoping"
Cohesion: 0.11
Nodes (27): PATCH(), GET(), POST(), DELETE(), GET(), PATCH(), RouteContext, GET() (+19 more)

### Community 12 - "CITL Director Module"
Cohesion: 0.13
Nodes (28): PATCH(), RouteContext, POST(), CitlDirectorManager(), toggleActive(), CitlDirectorManagerProps, CitlDirectorModal(), handleSubmit() (+20 more)

### Community 13 - "program-join-request/route.ts"
Cohesion: 0.13
Nodes (23): notPending(), PATCH(), RouteContext, RejectProgramJoinRequestDialogProps, WithdrawProgramJoinRequestDialog(), handleWithdraw(), WithdrawProgramJoinRequestDialogProps, applyJoinRequestDecision() (+15 more)

### Community 14 - "Assignment [id] Route Tests"
Cohesion: 0.05
Nodes (33): ctx, forbidden(), mocks, unauthorized(), ctx, forbidden(), mocks, unauthorized() (+25 more)

### Community 15 - "Role Admin Pages"
Cohesion: 0.07
Nodes (34): GET(), CitlDirectorPage(), metadata, CollegePage(), metadata, CoursePage(), metadata, DeanPage() (+26 more)

### Community 16 - "pocketbase"
Cohesion: 0.11
Nodes (27): metadata, ProgramPage(), CourseManagerProps, ModalState, DeleteProgramDialog(), handleDelete(), DeleteProgramDialogProps, ModalState (+19 more)

### Community 17 - "dean/route.ts"
Cohesion: 0.13
Nodes (23): PATCH(), GET(), POST(), DELETE(), PATCH(), RouteContext, GET(), POST() (+15 more)

### Community 18 - "Campus Module"
Cohesion: 0.19
Nodes (12): DELETE(), GET(), PATCH(), RouteContext, GET(), POST(), parseCampusInput(), ParseResult (+4 more)

### Community 19 - "vpaa/route.ts"
Cohesion: 0.31
Nodes (13): DELETE(), PATCH(), RouteContext, GET(), POST(), createAdminPb(), parseVpaaInput(), parseVpaaUpdate() (+5 more)

### Community 20 - "Department UI"
Cohesion: 0.18
Nodes (19): DeleteDepartmentDialog(), handleDelete(), DeleteDepartmentDialogProps, DepartmentManager(), ModalState, DepartmentModal(), handleSubmit(), DepartmentModalMode (+11 more)

### Community 21 - "Faculty UI"
Cohesion: 0.22
Nodes (16): DeleteFacultyDialog(), handleDelete(), DeleteFacultyDialogProps, FacultyManager(), toggleActive(), FacultyManagerProps, FacultyModal(), handleSubmit() (+8 more)

### Community 22 - "lib/prospectus-duplicate.ts"
Cohesion: 0.16
Nodes (19): GET(), POST(), applyDuplicate(), batchSize(), DuplicatePlan, MAX_BATCH_REQUESTS, newRecordId(), planDuplicate() (+11 more)

### Community 23 - "capability-rules.test.ts"
Cohesion: 0.06
Nodes (30): AppShell(), Sidebar(), SidebarProps, canAnywhere(), CAPABILITIES, Capability, Rule, RULES (+22 more)

### Community 24 - "syllabus/route.ts"
Cohesion: 0.12
Nodes (28): PATCH(), RouteContext, GET(), POST(), GET(), POST(), anyOf(), isListedForProgram() (+20 more)

### Community 25 - "lib/auth.ts"
Cohesion: 0.24
Nodes (11): POST(), POST(), AUTH_COOKIE, AuthResult, avatarUrl(), clearSessionCookie(), requestEmailVerification(), setSessionCookie() (+3 more)

### Community 26 - "Department Head UI"
Cohesion: 0.23
Nodes (16): DeleteDepartmentHeadDialog(), handleDelete(), DeleteDepartmentHeadDialogProps, DepartmentHeadManager(), toggleActive(), DepartmentHeadManagerProps, DepartmentHeadModal(), handleSubmit() (+8 more)

### Community 27 - "VPAA UI"
Cohesion: 0.19
Nodes (18): DeleteVpaaDialog(), handleDelete(), DeleteVpaaDialogProps, VpaaManager(), toggleActive(), VpaaManagerProps, VpaaModal(), handleSubmit() (+10 more)

### Community 28 - "requireUserMock"
Cohesion: 0.08
Nodes (15): listResult, mocks, base, listResult, mocks, approve, ctx, mocks (+7 more)

### Community 29 - "Program Chair UI"
Cohesion: 0.23
Nodes (16): DeleteProgramChairDialog(), handleDelete(), DeleteProgramChairDialogProps, ProgramChairManager(), toggleActive(), ProgramChairManagerProps, ProgramChairModal(), handleSubmit() (+8 more)

### Community 30 - "next"
Cohesion: 0.10
Nodes (18): DELETE(), GET(), RouteContext, DELETE(), GET(), RouteContext, Child, CHILDREN (+10 more)

### Community 31 - "campus-client.ts"
Cohesion: 0.15
Nodes (22): CampusPage(), metadata, CampusManager(), formatDate(), ModalState, CampusModal(), handleSubmit(), CampusModalMode (+14 more)

### Community 32 - "TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 33 - "Department Head API"
Cohesion: 0.22
Nodes (15): PATCH(), RouteContext, GET(), POST(), departmentHasActiveHead(), isHeadOfDepartment(), listDepartmentsHeadedBy(), toDepartmentHeadResponse() (+7 more)

### Community 34 - "Program Chair API"
Cohesion: 0.22
Nodes (15): DELETE(), PATCH(), RouteContext, GET(), POST(), isChairOfProgram(), listProgramsChairedBy(), programHasActiveChair() (+7 more)

### Community 35 - "AppUser"
Cohesion: 0.26
Nodes (11): isFacultyOfProgram(), ParseResult, Course, Faculty, FacultyInput, FacultyResponse, FacultyUpdateInput, Program (+3 more)

### Community 36 - "getUserRoles"
Cohesion: 0.13
Nodes (27): POST(), RouteContext, GET(), notFound(), POST(), RouteContext, GET(), notFound() (+19 more)

### Community 37 - "CITL Director List Tests"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 38 - "Department Head List Tests"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 39 - "FDIS Chair List Tests"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 40 - "Prospectus List Tests"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 41 - "VPAA List Tests"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 42 - "Root Layout & Header"
Cohesion: 0.23
Nodes (10): metadata, RootLayout(), AppHeader(), getInitials(), HeaderAuth(), handleLogout(), HeaderAuthProps, logout() (+2 more)

### Community 43 - "capabilities.ts"
Cohesion: 0.16
Nodes (20): GET(), PATCH(), RouteContext, GET(), POST(), can(), evaluateCapability(), PROSPECTUS_ITEM_EXPAND (+12 more)

### Community 44 - "vitest"
Cohesion: 0.09
Nodes (12): vitest, mocks, ctx, draft, mocks, ctx, draft, mocks (+4 more)

### Community 45 - "Course List Tests"
Cohesion: 0.25
Nodes (5): base, forbidden(), listResult, mocks, rows

### Community 46 - "Duplicate Route Tests"
Cohesion: 0.25
Nodes (4): forbidden(), input, mocks, pb

### Community 47 - "Prospectus Item List Tests"
Cohesion: 0.25
Nodes (5): base, forbidden(), listResult, mocks, rows

### Community 48 - "Term List Tests"
Cohesion: 0.25
Nodes (5): base, forbidden(), listResult, mocks, rows

### Community 49 - "Phase A Audit Script"
Cohesion: 0.33
Nodes (6): AssignmentRow, ASSIGNMENTS, main(), requireEnv(), UNASSIGNED_FILTER, UserRow

### Community 50 - "School Year List Tests"
Cohesion: 0.29
Nodes (4): forbidden(), listResult, mocks, rows

### Community 51 - "User List Tests"
Cohesion: 0.29
Nodes (4): base, listResult, mocks, users

### Community 52 - "School Years & Terms Page"
Cohesion: 0.47
Nodes (4): metadata, SchoolYearPage(), SchoolYearsAndTerms(), SchoolYearsAndTermsProps

### Community 53 - "fdis-chair/route.ts"
Cohesion: 0.22
Nodes (15): DELETE(), PATCH(), RouteContext, GET(), POST(), getActiveFdisChair(), hasActiveFdisChair(), isFdisChair() (+7 more)

### Community 54 - "lib/syllabus.ts"
Cohesion: 0.15
Nodes (24): GET(), RouteContext, DELETE(), GET(), leadOnly(), notDraft(), notFound(), PATCH() (+16 more)

### Community 55 - "prospectus-client.ts"
Cohesion: 0.16
Nodes (21): DeleteProspectusDialog(), handleDelete(), DeleteProspectusDialogProps, DuplicateProspectusDialog(), handleConfirm(), DuplicateProspectusDialogProps, ItemList(), ProspectusManager() (+13 more)

### Community 56 - "school-year/[id]/route.ts"
Cohesion: 0.23
Nodes (11): DELETE(), GET(), PATCH(), RouteContext, GET(), POST(), DEPENDENTS, describeSchoolYearDependents() (+3 more)

### Community 57 - "syllabus-detail.tsx"
Cohesion: 0.13
Nodes (20): metadata, PageProps, SyllabusDetailPage(), DeleteSyllabusDialog(), handleDelete(), DeleteSyllabusDialogProps, SubmitSyllabusDialog(), handleSubmit() (+12 more)

### Community 58 - "Request Proxy"
Cohesion: 0.50
Nodes (4): config, isTokenExpired(), proxy(), PUBLIC_PATHS

### Community 59 - "syllabus-client.ts"
Cohesion: 0.17
Nodes (19): AvailableCourseCombobox(), AvailableCourseComboboxProps, SyllabusModal(), handleSubmit(), SyllabusModalProps, SyllabusVersions(), SyllabusVersionsProps, AvailableListParams (+11 more)

### Community 110 - "course/[id]/route.ts"
Cohesion: 0.25
Nodes (11): DELETE(), GET(), PATCH(), RouteContext, GET(), POST(), COURSE_EXPAND, DEPENDENTS (+3 more)

### Community 111 - "term-manager.tsx"
Cohesion: 0.18
Nodes (20): DeleteTermDialog(), handleDelete(), DeleteTermDialogProps, ModalState, TermManager(), toggleOpen(), TermManagerProps, TermModal() (+12 more)

### Community 112 - "next"
Cohesion: 0.06
Nodes (19): mocks, base, forbidden(), listResult, mocks, rows, unauthorized(), candidates (+11 more)

### Community 113 - "faculty/route.test.ts"
Cohesion: 0.10
Nodes (12): base, forbidden(), listResult, mocks, rows, unauthorized(), base, forbidden() (+4 more)

### Community 114 - "user/[id]/route.ts"
Cohesion: 0.17
Nodes (17): DELETE(), GET(), PATCH(), RouteContext, GET(), POST(), ASSIGNMENTS, hasOtherAdmin() (+9 more)

### Community 115 - "prospectus/[id]/route.ts"
Cohesion: 0.18
Nodes (16): PATCH(), RouteContext, POST(), PROSPECTUS_EXPAND, toProspectusResponse(), parseProspectusInput(), parseProspectusUpdate(), ParseResult (+8 more)

### Community 118 - "register/page.tsx"
Cohesion: 0.15
Nodes (17): LoginPage(), LoginPageProps, metadata, metadata, RegisterPage(), RegisterPageProps, LoginForm(), handleSubmit() (+9 more)

### Community 119 - "reference-row-actions.tsx"
Cohesion: 0.16
Nodes (18): COPY, DialogAction, ReferenceActionDialog(), handleSubmit(), ReferenceActionDialogProps, ACTION_LABELS, ReferenceRowActions(), approve() (+10 more)

### Community 120 - "dean-manager.tsx"
Cohesion: 0.23
Nodes (16): DeanManager(), toggleActive(), DeanManagerProps, DeanModal(), handleSubmit(), DeanModalProps, DeleteDeanDialog(), handleDelete() (+8 more)

### Community 121 - "types/syllabus-reference.ts"
Cohesion: 0.20
Nodes (15): ReferenceListParams, ReferenceSourceParams, isObject(), isReferenceStatus(), parseReferenceActionInput(), ParseResult, parseSyllabusReferenceInput(), MAX_REFERENCE_TEXT (+7 more)

### Community 122 - "program-join-request-manager.tsx"
Cohesion: 0.20
Nodes (16): ProgramJoinRequestManager(), approve(), reloadAfterRowLeft(), ProgramJoinRequestManagerProps, RowDialog, STATUS_LABELS, STATUS_STYLES, ProgramJoinRequestModal() (+8 more)

### Community 123 - "syllabus-workflow.ts"
Cohesion: 0.17
Nodes (14): CHAIN_ROLES, ChainRole, INITIAL_STATE, submit(), SubmitEvent, transition(), TransitionResult, WorkflowEvent (+6 more)

### Community 124 - "types/term.ts"
Cohesion: 0.28
Nodes (12): PATCH(), RouteContext, POST(), toTermRecord(), toTermResponse(), parseDeadline(), ParseResult, parseTermInput() (+4 more)

### Community 125 - "types/syllabus.ts"
Cohesion: 0.22
Nodes (14): AvailableList, SYLLABUS_STATUSES, SyllabusStatus, isObject(), ParseResult, parseSyllabusInput(), parseSyllabusUpdateInput(), parseSyllabusVersionInput() (+6 more)

### Community 126 - "reference-modal.tsx"
Cohesion: 0.22
Nodes (10): ReferenceModal(), handleSubmit(), ReferenceModalProps, ReferenceSourceCombobox(), ReferenceSourceComboboxProps, ProgramOption, STATUS_LABELS, createReference() (+2 more)

### Community 127 - "Phase 2: Syllabus submission"
Cohesion: 0.20
Nodes (9): API, Capabilities, Decisions (2026-10-26), Definitions, Out of scope, Phase 2: Syllabus submission, Schema changes (to apply to `pb_schema.json`), UI (+1 more)

### Community 128 - "program-join-request/route.test.ts"
Cohesion: 0.22
Nodes (5): base, data, listResult, mocks, rows

### Community 129 - "syllabus-reference/route.test.ts"
Cohesion: 0.25
Nodes (5): input, mocks, SCOPE, source, term

### Community 130 - "co-authors-panel.tsx"
Cohesion: 0.43
Nodes (6): CoAuthorPicker(), CoAuthorPickerProps, CoAuthorsPanel(), save(), CoAuthorsPanelProps, updateSyllabusCoAuthors()

### Community 131 - "upload-version-modal.tsx"
Cohesion: 0.47
Nodes (5): UploadVersionModal(), handleSubmit(), UploadVersionModalProps, uploadSyllabusVersion(), MAX_VERSION_NOTES

### Community 132 - "course/[id]/route.test.ts"
Cohesion: 0.33
Nodes (4): ctx, EXPAND, forbidden(), mocks

### Community 133 - "syllabus/page.tsx"
Cohesion: 0.60
Nodes (4): metadata, SyllabusPage(), SyllabusManager(), listProgramsOfUser()

### Community 134 - "term/[id]/route.test.ts"
Cohesion: 0.40
Nodes (3): ctx, forbidden(), mocks

## Knowledge Gaps
- **9 isolated node(s):** `Org chain (campus, college, department, program)`, `Scoped list visibility (lib/org-visibility.ts)`, `Plain CRUD entities (campus, college, department, program, user)`, `Advisory PDF checks (informational only)`, `Prospectus migration (free-text items to courses, school_year to relation)` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 630 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **56 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `pocketbase` connect `pocketbase` to `prospectus-item-manager.tsx`, `pocketbase`, `react`, `types/user.ts`, `Course Catalog & Picker`, `Package & Tooling Config`, `User Admin UI`, `FDIS Chair Module`, `CITL Director Module`, `program-join-request/route.ts`, `dean/route.ts`, `Campus Module`, `Department UI`, `Faculty UI`, `lib/prospectus-duplicate.ts`, `syllabus/route.ts`, `lib/auth.ts`, `Department Head UI`, `VPAA UI`, `Program Chair UI`, `campus-client.ts`, `Department Head API`, `Program Chair API`, `AppUser`, `getUserRoles`, `Phase A Audit Script`, `fdis-chair/route.ts`, `lib/syllabus.ts`, `prospectus-client.ts`, `syllabus-client.ts`, `course/[id]/route.ts`, `term-manager.tsx`, `next`, `prospectus/[id]/route.ts`, `dean-manager.tsx`, `types/syllabus-reference.ts`, `program-join-request-manager.tsx`, `syllabus-workflow.ts`, `types/term.ts`, `types/syllabus.ts`?**
  _High betweenness centrality (0.194) - this node is a cross-community bridge._
- **Are the 48 inferred relationships involving `createAdminPb()` (e.g. with `register/route.test.ts` and `campus/[id]/route.test.ts`) actually correct?**
  _`createAdminPb()` has 48 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Org chain (campus, college, department, program)`, `Scoped list visibility (lib/org-visibility.ts)`, `Plain CRUD entities (campus, college, department, program, user)` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `prospectus-item-manager.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14772727272727273 - nodes in this community are weakly interconnected._
- **Why does `next` connect `next` to `program-join-request/route.test.ts`, `syllabus-reference/route.test.ts`, `handlePbError`, `course/[id]/route.test.ts`, `syllabus/page.tsx`, `types/user.ts`, `Route Test Helpers`, `Package & Tooling Config`, `term/[id]/route.test.ts`, `Department/Program Scoping`, `CITL Director Module`, `program-join-request/route.ts`, `Assignment [id] Route Tests`, `Role Admin Pages`, `pocketbase`, `dean/route.ts`, `Campus Module`, `vpaa/route.ts`, `lib/prospectus-duplicate.ts`, `capability-rules.test.ts`, `syllabus/route.ts`, `lib/auth.ts`, `requireUserMock`, `campus-client.ts`, `Department Head API`, `Program Chair API`, `getUserRoles`, `CITL Director List Tests`, `Department Head List Tests`, `FDIS Chair List Tests`, `Prospectus List Tests`, `VPAA List Tests`, `Root Layout & Header`, `capabilities.ts`, `vitest`, `Course List Tests`, `Duplicate Route Tests`, `Prospectus Item List Tests`, `Term List Tests`, `School Year List Tests`, `User List Tests`, `School Years & Terms Page`, `fdis-chair/route.ts`, `lib/syllabus.ts`, `school-year/[id]/route.ts`, `syllabus-detail.tsx`, `Request Proxy`, `course/[id]/route.ts`, `next`, `faculty/route.test.ts`, `user/[id]/route.ts`, `prospectus/[id]/route.ts`, `register/page.tsx`, `types/term.ts`?**
  _High betweenness centrality (0.155) - this node is a cross-community bridge._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.12878787878787878 - nodes in this community are weakly interconnected._
- **Why does `react` connect `react` to `prospectus-item-manager.tsx`, `pocketbase`, `co-authors-panel.tsx`, `upload-version-modal.tsx`, `types/user.ts`, `Course Catalog & Picker`, `Package & Tooling Config`, `User Admin UI`, `FDIS Chair Module`, `CITL Director Module`, `program-join-request/route.ts`, `pocketbase`, `Department UI`, `Faculty UI`, `capability-rules.test.ts`, `lib/auth.ts`, `Department Head UI`, `VPAA UI`, `Program Chair UI`, `campus-client.ts`, `getUserRoles`, `Root Layout & Header`, `School Years & Terms Page`, `prospectus-client.ts`, `syllabus-detail.tsx`, `syllabus-client.ts`, `term-manager.tsx`, `register/page.tsx`, `reference-row-actions.tsx`, `dean-manager.tsx`, `program-join-request-manager.tsx`, `reference-modal.tsx`?**
  _High betweenness centrality (0.107) - this node is a cross-community bridge._