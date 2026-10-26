# Graph Report - syllabusv2  (2026-10-26)

## Corpus Check
- 317 files · ~117,834 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: (none) 3, .ico 1, .css 1)

## Summary
- 1423 nodes · 4233 edges · 110 communities (59 shown, 51 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 66 edges (avg confidence: 0.84)
- Token cost: 75,541 input · 0 output

## Community Hubs (Navigation)
- Prospectus Items & Duplicate
- Org Manager UIs (Campus/College/Dean)
- School Year & Term APIs
- Core CRUD Route Handlers
- Route Test Helpers
- Project Docs & Domain Rules
- Users & Auth Forms
- Course Catalog & Picker
- Package & Tooling Config
- User Admin UI
- FDIS Chair Module
- Department/Program Scoping
- CITL Director Module
- School Year & Term UI
- Assignment [id] Route Tests
- Role Admin Pages
- Prospectus UI & Duplicate Dialog
- Dean Module
- Campus Module
- Roles Resolver & VPAA
- Department UI
- Faculty UI
- Program UI
- Capability Rules
- Navigation & App Shell
- Auth Routes & Session
- Department Head UI
- VPAA UI
- Program Chair Route Tests
- Program Chair UI
- API Root & Home Page
- Register & Campus Tests
- TypeScript Config
- Department Head API
- Program Chair API
- Faculty API
- Login & Register Pages
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
- Course Manager Shell
- Program Chair [id] Tests
- Prospectus [id] Tests
- VPAA [id] Tests
- Course Page
- Request Proxy
- Logout Route
- PostCSS Config

## God Nodes (most connected - your core abstractions)
1. `createAdminPb()` - 196 edges
2. `handlePbError()` - 122 edges
3. `requireUser()` - 115 edges
4. `next` - 109 edges
5. `mockAuth()` - 77 edges
6. `react` - 62 edges
7. `pocketbase` - 60 edges
8. `@headlessui/react` - 56 edges
9. `vitest` - 54 edges
10. `getCurrentUser` - 43 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --indirect_call--> `toCitlDirectorResponse()`  [INFERRED]
  app/api/citl-director/route.ts → lib/citl-director.ts
- `GET()` --indirect_call--> `toDepartmentHeadResponse()`  [INFERRED]
  app/api/department-head/route.ts → lib/department-head.ts
- `GET()` --indirect_call--> `toFdisChairResponse()`  [INFERRED]
  app/api/fdis-chair/route.ts → lib/fdis-chair.ts
- `GET()` --indirect_call--> `toProgramChairResponse()`  [INFERRED]
  app/api/program-chair/route.ts → lib/program-chair.ts
- `GET()` --indirect_call--> `toSchoolYearResponse()`  [INFERRED]
  app/api/school-year/route.ts → lib/school-year.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **University review forms supported by the system** — agents_form17, agents_form18_1, agents_justification_form, syllabus_review_system_project_plan__v5__enhanced_obe_syllabus, syllabus_review_system_project_plan__v5__form_definitions_versioning [EXTRACTED 1.00]
- **Review engine flow (Phase 3)** — agents_syllabus_workflow_state_machine, agents_review_chain, syllabus_review_system_project_plan__v5__syllabus_statuses, syllabus_review_system_project_plan__v5__routing_readiness, agents_proxy_reviewer, agents_approval_reference [EXTRACTED 1.00]
- **Phase A migration from role-based PERMISSIONS to derived-role capabilities** — project_context_users_role_field, project_context_permissions_map, agents_isadmin, agents_getuserroles, agents_capability_authorization [INFERRED 0.85]

## Communities (110 total, 51 thin omitted)

### Community 0 - "Prospectus Items & Duplicate"
Cohesion: 0.05
Nodes (72): GET(), POST(), RouteContext, GET(), PATCH(), RouteContext, GET(), POST() (+64 more)

### Community 1 - "Org Manager UIs (Campus/College/Dean)"
Cohesion: 0.06
Nodes (58): CampusPage(), metadata, CollegePage(), metadata, CampusManager(), formatDate(), ModalState, CampusModal() (+50 more)

### Community 2 - "School Year & Term APIs"
Cohesion: 0.08
Nodes (41): PATCH(), RouteContext, POST(), PATCH(), RouteContext, GET(), POST(), DeleteTermDialog() (+33 more)

### Community 3 - "Core CRUD Route Handlers"
Cohesion: 0.11
Nodes (51): GET(), DELETE(), DELETE(), GET(), PATCH(), RouteContext, GET(), DELETE() (+43 more)

### Community 4 - "Route Test Helpers"
Cohesion: 0.06
Nodes (28): ctx, mocks, base, listResult, mocks, base, forbidden(), listResult (+20 more)

### Community 5 - "Project Docs & Domain Rules"
Cohesion: 0.06
Nodes (37): AGENTS.md (agent guidance), Approval reference code (SYL-<term>-<seq>-S<stage>), Capability-based authorization (can, requireUser, authorize, canSomewhere), Form 17 (OVPAA-F-INS-017) review checklist, Form 18-1 (CITL-F-018) review points, getUserRoles resolver (derived roles from assignment records), users.isAdmin (only stored role), Justification Form (missing lead signature) (+29 more)

### Community 6 - "Users & Auth Forms"
Cohesion: 0.09
Nodes (35): GET(), LoginForm(), handleSubmit(), LoginFormProps, RegisterForm(), handleSubmit(), RegisterFormProps, getInitials() (+27 more)

### Community 7 - "Course Catalog & Picker"
Cohesion: 0.08
Nodes (38): CourseCombobox(), CourseComboboxProps, CourseOption, CourseModal(), handleSubmit(), CourseModalMode, CourseModalProps, NUMBER_FIELDS (+30 more)

### Community 8 - "Package & Tooling Config"
Cohesion: 0.06
Nodes (39): eslintConfig, dependencies, @headlessui/react@^2.2.10, next@16.3.6, pocketbase@^0.28.1, react@19.2.8, react-dom@19.2.8, devDependencies (+31 more)

### Community 9 - "User Admin UI"
Cohesion: 0.12
Nodes (29): CitlDirectorManagerProps, CitlDirectorModalProps, DeleteUserDialog(), handleDelete(), DeleteUserDialogProps, describeAccess(), KIND_LABELS, ModalState (+21 more)

### Community 10 - "FDIS Chair Module"
Cohesion: 0.12
Nodes (29): PATCH(), RouteContext, POST(), DeleteFdisChairDialog(), handleDelete(), DeleteFdisChairDialogProps, FdisChairManager(), toggleActive() (+21 more)

### Community 11 - "Department/Program Scoping"
Cohesion: 0.12
Nodes (24): PATCH(), RouteContext, POST(), GET(), RouteContext, POST(), authorize(), AssignmentPaths (+16 more)

### Community 12 - "CITL Director Module"
Cohesion: 0.12
Nodes (27): PATCH(), RouteContext, POST(), CitlDirectorManager(), toggleActive(), CitlDirectorModal(), handleSubmit(), DeleteCitlDirectorDialog() (+19 more)

### Community 13 - "School Year & Term UI"
Cohesion: 0.12
Nodes (25): DeleteSchoolYearDialog(), handleDelete(), DeleteSchoolYearDialogProps, ModalState, SchoolYearManager(), SchoolYearManagerProps, SchoolYearModal(), handleSubmit() (+17 more)

### Community 14 - "Assignment [id] Route Tests"
Cohesion: 0.08
Nodes (23): ctx, forbidden(), mocks, unauthorized(), ctx, forbidden(), mocks, unauthorized() (+15 more)

### Community 15 - "Role Admin Pages"
Cohesion: 0.12
Nodes (22): CitlDirectorPage(), metadata, DeanPage(), metadata, DepartmentHeadPage(), metadata, FacultyPage(), metadata (+14 more)

### Community 16 - "Prospectus UI & Duplicate Dialog"
Cohesion: 0.15
Nodes (26): DeleteProspectusDialog(), handleDelete(), DeleteProspectusDialogProps, DuplicateProspectusDialog(), handleConfirm(), DuplicateProspectusDialogProps, ItemList(), ModalState (+18 more)

### Community 17 - "Dean Module"
Cohesion: 0.14
Nodes (18): PATCH(), RouteContext, GET(), POST(), collegeHasActiveDean(), isDeanOfCollege(), listCollegesDeanedBy(), toDeanResponse() (+10 more)

### Community 18 - "Campus Module"
Cohesion: 0.14
Nodes (17): DELETE(), GET(), PATCH(), RouteContext, POST(), POST(), parseCampusInput(), ParseResult (+9 more)

### Community 19 - "Roles Resolver & VPAA"
Cohesion: 0.15
Nodes (21): GET(), GET(), GET(), GET(), PATCH(), RouteContext, GET(), POST() (+13 more)

### Community 20 - "Department UI"
Cohesion: 0.16
Nodes (20): DepartmentPage(), metadata, DeleteDepartmentDialog(), handleDelete(), DeleteDepartmentDialogProps, DepartmentManager(), ModalState, DepartmentModal() (+12 more)

### Community 21 - "Faculty UI"
Cohesion: 0.17
Nodes (20): DeleteFacultyDialog(), handleDelete(), DeleteFacultyDialogProps, FacultyManager(), toggleActive(), FacultyManagerProps, FacultyModal(), handleSubmit() (+12 more)

### Community 22 - "Program UI"
Cohesion: 0.16
Nodes (19): metadata, ProgramPage(), DeleteProgramDialog(), handleDelete(), DeleteProgramDialogProps, ModalState, ProgramManager(), Detail() (+11 more)

### Community 23 - "Capability Rules"
Cohesion: 0.09
Nodes (16): CAPABILITIES, evaluateCapability(), Rule, RULES, ScopeChain, admin, ADMIN_ONLY, chair (+8 more)

### Community 24 - "Navigation & App Shell"
Cohesion: 0.15
Nodes (14): AppShell(), Sidebar(), SidebarProps, canAnywhere(), Capability, getNavItems(), NAV_ITEMS, NavItem (+6 more)

### Community 25 - "Auth Routes & Session"
Cohesion: 0.20
Nodes (13): POST(), GET(), isDuplicateEmail(), POST(), AUTH_COOKIE, AuthResult, avatarUrl(), setSessionCookie() (+5 more)

### Community 26 - "Department Head UI"
Cohesion: 0.20
Nodes (17): DeleteDepartmentHeadDialog(), handleDelete(), DeleteDepartmentHeadDialogProps, DepartmentHeadManager(), toggleActive(), DepartmentHeadManagerProps, DepartmentHeadModal(), handleSubmit() (+9 more)

### Community 27 - "VPAA UI"
Cohesion: 0.18
Nodes (17): DeleteVpaaDialog(), handleDelete(), DeleteVpaaDialogProps, VpaaManager(), toggleActive(), VpaaModal(), handleSubmit(), ParseResult (+9 more)

### Community 28 - "Program Chair Route Tests"
Cohesion: 0.10
Nodes (12): vitest, base, forbidden(), listResult, mocks, rows, unauthorized(), ctx (+4 more)

### Community 29 - "Program Chair UI"
Cohesion: 0.23
Nodes (16): DeleteProgramChairDialog(), handleDelete(), DeleteProgramChairDialogProps, ProgramChairManager(), toggleActive(), ProgramChairManagerProps, ProgramChairModal(), handleSubmit() (+8 more)

### Community 30 - "API Root & Home Page"
Cohesion: 0.11
Nodes (9): nextConfig, next, base, listResult, mocks, ctx, EXPAND, forbidden() (+1 more)

### Community 31 - "Register & Campus Tests"
Cohesion: 0.11
Nodes (9): mocks, valid, listResult, mocks, ctx, mocks, ctx, forbidden() (+1 more)

### Community 32 - "TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 33 - "Department Head API"
Cohesion: 0.25
Nodes (13): PATCH(), RouteContext, POST(), departmentHasActiveHead(), isHeadOfDepartment(), listDepartmentsHeadedBy(), toDepartmentHeadResponse(), parseDepartmentHeadInput() (+5 more)

### Community 34 - "Program Chair API"
Cohesion: 0.25
Nodes (13): PATCH(), RouteContext, POST(), isChairOfProgram(), listProgramsChairedBy(), programHasActiveChair(), toProgramChairResponse(), parseProgramChairInput() (+5 more)

### Community 35 - "Faculty API"
Cohesion: 0.27
Nodes (10): PATCH(), RouteContext, GET(), POST(), isFacultyOfProgram(), listProgramsOfUser(), toFacultyResponse(), parseFacultyInput() (+2 more)

### Community 36 - "Login & Register Pages"
Cohesion: 0.29
Nodes (7): LoginPage(), LoginPageProps, metadata, metadata, RegisterPage(), RegisterPageProps, safeRedirect()

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
Cohesion: 0.43
Nodes (4): metadata, RootLayout(), AppHeader(), APP_NAME

### Community 43 - "Scope Resolution"
Cohesion: 0.36
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

### Community 53 - "Course Manager Shell"
Cohesion: 0.40
Nodes (4): CourseManagerProps, ModalState, DeleteCourseDialogProps, react

### Community 54 - "Program Chair [id] Tests"
Cohesion: 0.33
Nodes (4): ctx, forbidden(), mocks, unauthorized()

### Community 55 - "Prospectus [id] Tests"
Cohesion: 0.33
Nodes (4): ctx, forbidden(), mocks, unauthorized()

### Community 56 - "VPAA [id] Tests"
Cohesion: 0.33
Nodes (4): ctx, forbidden(), mocks, unauthorized()

### Community 57 - "Course Page"
Cohesion: 0.50
Nodes (3): CoursePage(), metadata, CourseManager()

### Community 58 - "Request Proxy"
Cohesion: 0.50
Nodes (4): config, isTokenExpired(), proxy(), PUBLIC_PATHS

## Knowledge Gaps
- **9 isolated node(s):** `Scoped list visibility (lib/org-visibility.ts)`, `Org chain (campus, college, department, program)`, `CLAUDE.md (imports AGENTS.md)`, `Plain CRUD entities (campus, college, department, program, user)`, `README.md (create-next-app boilerplate)` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 482 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **51 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `pocketbase` connect `Faculty UI` to `Prospectus Items & Duplicate`, `Org Manager UIs (Campus/College/Dean)`, `School Year & Term APIs`, `Users & Auth Forms`, `Course Catalog & Picker`, `Package & Tooling Config`, `User Admin UI`, `FDIS Chair Module`, `Department/Program Scoping`, `CITL Director Module`, `School Year & Term UI`, `Prospectus UI & Duplicate Dialog`, `Dean Module`, `Campus Module`, `Department UI`, `Program UI`, `Auth Routes & Session`, `Department Head UI`, `VPAA UI`, `Program Chair UI`, `Register & Campus Tests`, `Department Head API`, `Program Chair API`, `Phase A Audit Script`, `Course Manager Shell`?**
  _High betweenness centrality (0.160) - this node is a cross-community bridge._
- **Are the 36 inferred relationships involving `createAdminPb()` (e.g. with `register/route.test.ts` and `campus/[id]/route.test.ts`) actually correct?**
  _`createAdminPb()` has 36 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Scoped list visibility (lib/org-visibility.ts)`, `Org chain (campus, college, department, program)`, `CLAUDE.md (imports AGENTS.md)` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Prospectus Items & Duplicate` be split into smaller, more focused modules?**
  _Cohesion score 0.05444978265843056 - nodes in this community are weakly interconnected._
- **Why does `next` connect `API Root & Home Page` to `Prospectus Items & Duplicate`, `Org Manager UIs (Campus/College/Dean)`, `School Year & Term APIs`, `Core CRUD Route Handlers`, `Route Test Helpers`, `Users & Auth Forms`, `Package & Tooling Config`, `FDIS Chair Module`, `Department/Program Scoping`, `CITL Director Module`, `Assignment [id] Route Tests`, `Role Admin Pages`, `Dean Module`, `Campus Module`, `Roles Resolver & VPAA`, `Department UI`, `Program UI`, `Navigation & App Shell`, `Auth Routes & Session`, `Program Chair Route Tests`, `Register & Campus Tests`, `Department Head API`, `Program Chair API`, `Faculty API`, `Login & Register Pages`, `CITL Director List Tests`, `Department Head List Tests`, `FDIS Chair List Tests`, `Prospectus List Tests`, `VPAA List Tests`, `Root Layout & Header`, `Course List Tests`, `Duplicate Route Tests`, `Prospectus Item List Tests`, `Term List Tests`, `School Year List Tests`, `User List Tests`, `School Years & Terms Page`, `Program Chair [id] Tests`, `Prospectus [id] Tests`, `VPAA [id] Tests`, `Course Page`, `Request Proxy`, `Logout Route`?**
  _High betweenness centrality (0.146) - this node is a cross-community bridge._
- **Should `Org Manager UIs (Campus/College/Dean)` be split into smaller, more focused modules?**
  _Cohesion score 0.061458718992965566 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Course Manager Shell` to `Prospectus Items & Duplicate`, `Org Manager UIs (Campus/College/Dean)`, `School Year & Term APIs`, `Users & Auth Forms`, `Course Catalog & Picker`, `Package & Tooling Config`, `User Admin UI`, `FDIS Chair Module`, `CITL Director Module`, `School Year & Term UI`, `Prospectus UI & Duplicate Dialog`, `Roles Resolver & VPAA`, `Department UI`, `Faculty UI`, `Program UI`, `Navigation & App Shell`, `Auth Routes & Session`, `Department Head UI`, `VPAA UI`, `Program Chair UI`, `School Years & Terms Page`?**
  _High betweenness centrality (0.115) - this node is a cross-community bridge._