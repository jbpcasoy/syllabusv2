# Graph Report - syllabusv2  (2026-10-26)

## Corpus Check
- 335 files · ~126,466 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 4, .ico 1, .css 1)

## Summary
- 1511 nodes · 4503 edges · 118 communities (65 shown, 53 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 70 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ac4089ae`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Prospectus Items & Duplicate
- pocketbase
- School Year & Term APIs
- createAdminPb
- Route Test Helpers
- Project Docs & Domain Rules
- Users & Auth Forms
- Course Catalog & Picker
- Package & Tooling Config
- User Admin UI
- FDIS Chair Module
- Department/Program Scoping
- CITL Director Module
- program-join-request/route.ts
- Assignment [id] Route Tests
- Role Admin Pages
- react
- dean/route.ts
- Campus Module
- vpaa/route.ts
- Department UI
- Faculty UI
- lib/prospectus-duplicate.ts
- Capability Rules
- Navigation & App Shell
- pocketbase.ts
- Department Head UI
- VPAA UI
- vitest
- Program Chair UI
- API Root & Home Page
- campus-client.ts
- TypeScript Config
- Department Head API
- Program Chair API
- Faculty API
- lib/roles.ts
- CITL Director List Tests
- Department Head List Tests
- FDIS Chair List Tests
- Prospectus List Tests
- VPAA List Tests
- Root Layout & Header
- Scope Resolution
- Org Children Guards
- Course List Tests
- Duplicate Route Tests
- Prospectus Item List Tests
- Term List Tests
- Phase A Audit Script
- School Year List Tests
- User List Tests
- School Years & Terms Page
- fdis-chair/route.ts
- Program Chair [id] Tests
- Prospectus [id] Tests
- school-year/[id]/route.ts
- Course Page
- Request Proxy
- Logout Route
- PostCSS Config
- course/[id]/route.ts
- org-visibility.ts
- dean/route.test.ts
- faculty/route.test.ts
- program-chair/route.test.ts
- program-join-request/[id]/route.test.ts

## God Nodes (most connected - your core abstractions)
1. `createAdminPb()` - 204 edges
2. `handlePbError()` - 128 edges
3. `requireUser()` - 121 edges
4. `next` - 116 edges
5. `mockAuth()` - 79 edges
6. `pocketbase` - 66 edges
7. `react` - 66 edges
8. `vitest` - 60 edges
9. `@headlessui/react` - 60 edges
10. `getCurrentUser` - 45 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --indirect_call--> `toProgramJoinRequestResponse()`  [INFERRED]
  app/api/program-join-request/route.ts → lib/program-join-request.ts
- `GET()` --indirect_call--> `toFdisChairResponse()`  [INFERRED]
  app/api/fdis-chair/route.ts → lib/fdis-chair.ts
- `GET()` --indirect_call--> `toCitlDirectorResponse()`  [INFERRED]
  app/api/citl-director/route.ts → lib/citl-director.ts
- `GET()` --indirect_call--> `toDeanResponse()`  [INFERRED]
  app/api/dean/route.ts → lib/dean.ts
- `GET()` --indirect_call--> `toDepartmentHeadResponse()`  [INFERRED]
  app/api/department-head/route.ts → lib/department-head.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Review engine flow (Phase 3)** — agents_syllabus_workflow_state_machine, agents_review_chain, syllabus_review_system_project_plan__v5__syllabus_statuses, syllabus_review_system_project_plan__v5__routing_readiness, agents_proxy_reviewer, agents_approval_reference [EXTRACTED 1.00]
- **University review forms supported by the system** — agents_form17, agents_form18_1, agents_justification_form, syllabus_review_system_project_plan__v5__enhanced_obe_syllabus, syllabus_review_system_project_plan__v5__form_definitions_versioning [EXTRACTED 1.00]
- **Phase A migration from role-based PERMISSIONS to derived-role capabilities** — project_context_users_role_field, project_context_permissions_map, agents_isadmin, agents_getuserroles, agents_capability_authorization [INFERRED 0.85]

## Communities (118 total, 53 thin omitted)

### Community 0 - "Prospectus Items & Duplicate"
Cohesion: 0.06
Nodes (63): PATCH(), RouteContext, GET(), POST(), CourseCombobox(), DeleteProspectusDialog(), handleDelete(), DeleteProspectusDialogProps (+55 more)

### Community 1 - "pocketbase"
Cohesion: 0.14
Nodes (23): CollegePage(), metadata, CollegeManager(), ModalState, CollegeModal(), handleSubmit(), CollegeModalMode, CollegeModalProps (+15 more)

### Community 2 - "School Year & Term APIs"
Cohesion: 0.06
Nodes (58): PATCH(), RouteContext, GET(), POST(), DeleteSchoolYearDialog(), handleDelete(), DeleteSchoolYearDialogProps, ModalState (+50 more)

### Community 3 - "createAdminPb"
Cohesion: 0.16
Nodes (40): DELETE(), GET(), POST(), DELETE(), GET(), DELETE(), GET(), PATCH() (+32 more)

### Community 4 - "Route Test Helpers"
Cohesion: 0.08
Nodes (23): evaluateCapability(), ctx, mocks, base, listResult, mocks, ctx, mocks (+15 more)

### Community 5 - "Project Docs & Domain Rules"
Cohesion: 0.06
Nodes (37): AGENTS.md (agent guidance), Approval reference code (SYL-<term>-<seq>-S<stage>), Capability-based authorization (can, requireUser, authorize, canSomewhere), Form 17 (OVPAA-F-INS-017) review checklist, Form 18-1 (CITL-F-018) review points, getUserRoles resolver (derived roles from assignment records), users.isAdmin (only stored role), Justification Form (missing lead signature) (+29 more)

### Community 6 - "Users & Auth Forms"
Cohesion: 0.06
Nodes (56): isDuplicateEmail(), POST(), PATCH(), RouteContext, GET(), LoginPage(), LoginPageProps, metadata (+48 more)

### Community 7 - "Course Catalog & Picker"
Cohesion: 0.09
Nodes (35): CourseComboboxProps, CourseOption, CourseModal(), handleSubmit(), CourseModalMode, CourseModalProps, NUMBER_FIELDS, NumberKey (+27 more)

### Community 8 - "Package & Tooling Config"
Cohesion: 0.06
Nodes (39): eslintConfig, dependencies, @headlessui/react@^2.2.10, next@16.3.6, pocketbase@^0.28.1, react@19.2.8, react-dom@19.2.8, devDependencies (+31 more)

### Community 9 - "User Admin UI"
Cohesion: 0.12
Nodes (26): CitlDirectorManagerProps, CitlDirectorModalProps, DeleteUserDialog(), handleDelete(), DeleteUserDialogProps, describeAccess(), KIND_LABELS, ModalState (+18 more)

### Community 10 - "FDIS Chair Module"
Cohesion: 0.23
Nodes (16): DeleteFdisChairDialog(), handleDelete(), DeleteFdisChairDialogProps, FdisChairManager(), toggleActive(), FdisChairManagerProps, FdisChairModal(), handleSubmit() (+8 more)

### Community 11 - "Department/Program Scoping"
Cohesion: 0.17
Nodes (17): GET(), PATCH(), RouteContext, POST(), PATCH(), RouteContext, POST(), authorize() (+9 more)

### Community 12 - "CITL Director Module"
Cohesion: 0.13
Nodes (27): PATCH(), RouteContext, POST(), CitlDirectorManager(), toggleActive(), CitlDirectorModal(), handleSubmit(), DeleteCitlDirectorDialog() (+19 more)

### Community 13 - "program-join-request/route.ts"
Cohesion: 0.07
Nodes (42): notPending(), PATCH(), RouteContext, POST(), ProgramJoinRequestManager(), approve(), reloadAfterRowLeft(), ProgramJoinRequestModal() (+34 more)

### Community 14 - "Assignment [id] Route Tests"
Cohesion: 0.07
Nodes (25): ctx, forbidden(), mocks, unauthorized(), ctx, forbidden(), mocks, unauthorized() (+17 more)

### Community 15 - "Role Admin Pages"
Cohesion: 0.10
Nodes (26): CitlDirectorPage(), metadata, DeanPage(), metadata, DepartmentHeadPage(), metadata, FacultyPage(), metadata (+18 more)

### Community 16 - "react"
Cohesion: 0.13
Nodes (22): CourseManagerProps, ModalState, DeleteCourseDialogProps, DeleteProgramDialog(), handleDelete(), DeleteProgramDialogProps, ProgramJoinRequestManagerProps, RowDialog (+14 more)

### Community 17 - "dean/route.ts"
Cohesion: 0.10
Nodes (33): RouteContext, PATCH(), RouteContext, POST(), DeanManager(), toggleActive(), DeanModal(), handleSubmit() (+25 more)

### Community 18 - "Campus Module"
Cohesion: 0.15
Nodes (11): GET(), PATCH(), RouteContext, parseCampusInput(), ParseResult, ctx, mocks, listResult (+3 more)

### Community 19 - "vpaa/route.ts"
Cohesion: 0.25
Nodes (13): PATCH(), RouteContext, POST(), ParseResult, parseVpaaInput(), parseVpaaUpdate(), getActiveVpaa(), hasActiveVpaa() (+5 more)

### Community 20 - "Department UI"
Cohesion: 0.10
Nodes (34): DepartmentPage(), metadata, metadata, ProgramPage(), DeleteDepartmentDialog(), handleDelete(), DeleteDepartmentDialogProps, DepartmentManager() (+26 more)

### Community 21 - "Faculty UI"
Cohesion: 0.23
Nodes (16): DeleteFacultyDialog(), handleDelete(), DeleteFacultyDialogProps, FacultyManager(), toggleActive(), FacultyManagerProps, FacultyModal(), handleSubmit() (+8 more)

### Community 22 - "lib/prospectus-duplicate.ts"
Cohesion: 0.11
Nodes (31): GET(), POST(), GET(), PATCH(), RouteContext, GET(), POST(), can() (+23 more)

### Community 23 - "Capability Rules"
Cohesion: 0.09
Nodes (16): CAPABILITIES, Capability, Rule, RULES, ScopeChain, admin, ADMIN_ONLY, chair (+8 more)

### Community 24 - "Navigation & App Shell"
Cohesion: 0.28
Nodes (8): AppShell(), Sidebar(), SidebarProps, canAnywhere(), getNavItems(), NAV_ITEMS, NavItem, hasAnyRole()

### Community 25 - "pocketbase.ts"
Cohesion: 0.36
Nodes (6): POST(), requestEmailVerification(), setSessionCookie(), createPb(), requireEnv(), mocks

### Community 26 - "Department Head UI"
Cohesion: 0.23
Nodes (16): DeleteDepartmentHeadDialog(), handleDelete(), DeleteDepartmentHeadDialogProps, DepartmentHeadManager(), toggleActive(), DepartmentHeadManagerProps, DepartmentHeadModal(), handleSubmit() (+8 more)

### Community 27 - "VPAA UI"
Cohesion: 0.23
Nodes (16): DeleteVpaaDialog(), handleDelete(), DeleteVpaaDialogProps, VpaaManager(), toggleActive(), VpaaManagerProps, VpaaModal(), handleSubmit() (+8 more)

### Community 28 - "vitest"
Cohesion: 0.09
Nodes (13): vitest, ctx, mocks, base, listResult, mocks, ctx, forbidden() (+5 more)

### Community 29 - "Program Chair UI"
Cohesion: 0.23
Nodes (16): DeleteProgramChairDialog(), handleDelete(), DeleteProgramChairDialogProps, ProgramChairManager(), toggleActive(), ProgramChairManagerProps, ProgramChairModal(), handleSubmit() (+8 more)

### Community 30 - "API Root & Home Page"
Cohesion: 0.15
Nodes (6): nextConfig, next, ctx, EXPAND, forbidden(), mocks

### Community 31 - "campus-client.ts"
Cohesion: 0.15
Nodes (22): CampusPage(), metadata, CampusManager(), formatDate(), ModalState, CampusModal(), handleSubmit(), CampusModalMode (+14 more)

### Community 32 - "TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 33 - "Department Head API"
Cohesion: 0.22
Nodes (15): DELETE(), PATCH(), RouteContext, POST(), departmentHasActiveHead(), isHeadOfDepartment(), listDepartmentsHeadedBy(), toDepartmentHeadResponse() (+7 more)

### Community 34 - "Program Chair API"
Cohesion: 0.23
Nodes (14): DELETE(), PATCH(), RouteContext, POST(), isChairOfProgram(), listProgramsChairedBy(), programHasActiveChair(), toProgramChairResponse() (+6 more)

### Community 35 - "Faculty API"
Cohesion: 0.22
Nodes (13): DELETE(), PATCH(), RouteContext, POST(), isFacultyOfProgram(), listProgramsOfUser(), toFacultyResponse(), parseFacultyInput() (+5 more)

### Community 36 - "lib/roles.ts"
Cohesion: 0.14
Nodes (11): CollegeRef, DepartmentRef, ProgramRef, unique(), mocks, mocks, USER, mocks (+3 more)

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
Cohesion: 0.31
Nodes (6): GET(), metadata, RootLayout(), AppHeader(), toSessionUser(), APP_NAME

### Community 43 - "Scope Resolution"
Cohesion: 0.33
Nodes (5): resolveScope(), ScopeTarget, fullChain, mocks, records

### Community 44 - "Org Children Guards"
Cohesion: 0.25
Nodes (5): Child, CHILDREN, joinParts(), OrgParent, mocks

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
Cohesion: 0.25
Nodes (13): PATCH(), RouteContext, POST(), getActiveFdisChair(), hasActiveFdisChair(), isFdisChair(), toFdisChairResponse(), parseFdisChairInput() (+5 more)

### Community 54 - "Program Chair [id] Tests"
Cohesion: 0.33
Nodes (4): ctx, forbidden(), mocks, unauthorized()

### Community 55 - "Prospectus [id] Tests"
Cohesion: 0.33
Nodes (4): ctx, forbidden(), mocks, unauthorized()

### Community 56 - "school-year/[id]/route.ts"
Cohesion: 0.22
Nodes (11): DELETE(), GET(), PATCH(), RouteContext, GET(), POST(), DEPENDENTS, describeSchoolYearDependents() (+3 more)

### Community 57 - "Course Page"
Cohesion: 0.50
Nodes (3): CoursePage(), metadata, CourseManager()

### Community 58 - "Request Proxy"
Cohesion: 0.50
Nodes (4): config, isTokenExpired(), proxy(), PUBLIC_PATHS

### Community 110 - "course/[id]/route.ts"
Cohesion: 0.24
Nodes (13): DELETE(), GET(), PATCH(), RouteContext, GET(), POST(), COURSE_EXPAND, DEPENDENTS (+5 more)

### Community 111 - "org-visibility.ts"
Cohesion: 0.29
Nodes (7): AssignmentPaths, Bind, clauses(), departmentScopeFilter(), departmentVisible(), programScopeFilter(), programVisible()

### Community 112 - "dean/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 113 - "faculty/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 114 - "program-chair/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 115 - "program-join-request/[id]/route.test.ts"
Cohesion: 0.29
Nodes (5): approve, ctx, mocks, pending, SCOPE

## Knowledge Gaps
- **9 isolated node(s):** `Org chain (campus, college, department, program)`, `Scoped list visibility (lib/org-visibility.ts)`, `Plain CRUD entities (campus, college, department, program, user)`, `Advisory PDF checks (informational only)`, `Prospectus migration (free-text items to courses, school_year to relation)` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 515 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **53 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `pocketbase` connect `pocketbase` to `Prospectus Items & Duplicate`, `School Year & Term APIs`, `Users & Auth Forms`, `Course Catalog & Picker`, `Package & Tooling Config`, `User Admin UI`, `FDIS Chair Module`, `Department/Program Scoping`, `CITL Director Module`, `program-join-request/route.ts`, `react`, `dean/route.ts`, `Campus Module`, `vpaa/route.ts`, `Department UI`, `Faculty UI`, `lib/prospectus-duplicate.ts`, `pocketbase.ts`, `Department Head UI`, `VPAA UI`, `Program Chair UI`, `campus-client.ts`, `Department Head API`, `Program Chair API`, `Faculty API`, `Phase A Audit Script`, `fdis-chair/route.ts`, `school-year/[id]/route.ts`?**
  _High betweenness centrality (0.170) - this node is a cross-community bridge._
- **Are the 38 inferred relationships involving `createAdminPb()` (e.g. with `register/route.test.ts` and `campus/[id]/route.test.ts`) actually correct?**
  _`createAdminPb()` has 38 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Org chain (campus, college, department, program)`, `Scoped list visibility (lib/org-visibility.ts)`, `Plain CRUD entities (campus, college, department, program, user)` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Prospectus Items & Duplicate` be split into smaller, more focused modules?**
  _Cohesion score 0.06361570918532944 - nodes in this community are weakly interconnected._
- **Why does `next` connect `API Root & Home Page` to `Prospectus Items & Duplicate`, `pocketbase`, `School Year & Term APIs`, `Route Test Helpers`, `Users & Auth Forms`, `Package & Tooling Config`, `Department/Program Scoping`, `CITL Director Module`, `program-join-request/route.ts`, `Assignment [id] Route Tests`, `Role Admin Pages`, `dean/route.ts`, `Campus Module`, `vpaa/route.ts`, `Department UI`, `lib/prospectus-duplicate.ts`, `Navigation & App Shell`, `pocketbase.ts`, `vitest`, `campus-client.ts`, `Department Head API`, `Program Chair API`, `Faculty API`, `lib/roles.ts`, `CITL Director List Tests`, `Department Head List Tests`, `FDIS Chair List Tests`, `Prospectus List Tests`, `VPAA List Tests`, `Root Layout & Header`, `Course List Tests`, `Duplicate Route Tests`, `Prospectus Item List Tests`, `Term List Tests`, `School Year List Tests`, `User List Tests`, `School Years & Terms Page`, `fdis-chair/route.ts`, `Program Chair [id] Tests`, `Prospectus [id] Tests`, `school-year/[id]/route.ts`, `Course Page`, `Request Proxy`, `Logout Route`, `course/[id]/route.ts`, `dean/route.test.ts`, `faculty/route.test.ts`, `program-chair/route.test.ts`, `program-join-request/[id]/route.test.ts`?**
  _High betweenness centrality (0.149) - this node is a cross-community bridge._
- **Should `pocketbase` be split into smaller, more focused modules?**
  _Cohesion score 0.13763440860215054 - nodes in this community are weakly interconnected._
- **Why does `createAdminPb()` connect `createAdminPb` to `Prospectus Items & Duplicate`, `School Year & Term APIs`, `Route Test Helpers`, `Users & Auth Forms`, `Department/Program Scoping`, `CITL Director Module`, `program-join-request/route.ts`, `Assignment [id] Route Tests`, `dean/route.ts`, `Campus Module`, `vpaa/route.ts`, `lib/prospectus-duplicate.ts`, `pocketbase.ts`, `vitest`, `API Root & Home Page`, `Department Head API`, `Program Chair API`, `Faculty API`, `lib/roles.ts`, `CITL Director List Tests`, `Department Head List Tests`, `FDIS Chair List Tests`, `Prospectus List Tests`, `VPAA List Tests`, `Scope Resolution`, `Org Children Guards`, `Course List Tests`, `Duplicate Route Tests`, `Prospectus Item List Tests`, `Term List Tests`, `School Year List Tests`, `User List Tests`, `fdis-chair/route.ts`, `Program Chair [id] Tests`, `Prospectus [id] Tests`, `school-year/[id]/route.ts`, `course/[id]/route.ts`, `dean/route.test.ts`, `faculty/route.test.ts`, `program-chair/route.test.ts`, `program-join-request/[id]/route.test.ts`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._