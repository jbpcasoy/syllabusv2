# Graph Report - syllabusv2  (2026-10-27)

## Corpus Check
- 538 files · ~234,524 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 4, .ico 1, .css 1)

## Summary
- 2640 nodes · 8321 edges · 190 communities (123 shown, 67 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 170 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `27e46adf`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- prospectus-item-manager.tsx
- pocketbase
- react
- [id]/justification/route.ts
- Route Test Helpers
- Project Docs & Domain Rules
- types/user.ts
- Course Catalog & Picker
- Package & Tooling Config
- User Admin UI
- FDIS Chair Module
- Department/Program Scoping
- CITL Director Module
- pocketbase
- mockAuth
- Role Admin Pages
- pocketbase
- dean/route.ts
- handlePbError
- resolveSyllabusAccess
- Department UI
- Faculty UI
- lib/prospectus-duplicate.ts
- capability-rules.ts
- syllabus/route.ts
- login/route.ts
- Department Head UI
- VPAA UI
- requireUserMock
- Program Chair UI
- college-client.ts
- campus-client.ts
- TypeScript Config
- Department Head API
- Program Chair API
- AppUser
- getUserRoles
- CITL Director List Tests
- syllabus-client.ts
- signed-copy/route.ts
- Prospectus List Tests
- program-reviewer-manager.tsx
- Root Layout & Header
- getUserRoles
- syllabus/route.test.ts
- Course List Tests
- Duplicate Route Tests
- formatDate
- Term List Tests
- Enhanced OBE Syllabus on `[FILL IN: course name]`
- School Year List Tests
- vitest
- School Years & Terms Page
- fdis-chair/route.ts
- lib/syllabus.ts
- prospectus-client.ts
- next
- syllabus-detail.tsx
- Request Proxy
- syllabus-manager.tsx
- PostCSS Config
- review/route.ts
- term-manager.tsx
- next
- faculty/route.test.ts
- users.ts
- prospectus/[id]/route.ts
- register/page.tsx
- reference-manager.tsx
- dean-manager.tsx
- types/syllabus-reference.ts
- Syllabus Development Guidelines
- syllabus-workflow.ts
- types/term.ts
- index.ts
- types/roles.ts
- Phase 2: Syllabus submission
- export.ts
- syllabus-reference/route.test.ts
- co-authors-panel.tsx
- upload-version-modal.tsx
- course/[id]/route.test.ts
- syllabus/page.tsx
- Phase 3: Review engine and forms
- [pointId]/route.test.ts
- form17-panel.tsx
- Criteria
- lib/form17.ts
- form18-rules.ts
- 3. Letter Body (in order, top to bottom)
- app-shell.tsx
- CITL Syllabus Review Guide (Instructions for Part B)
- program-reviewer/route.ts
- types/user.ts
- form18-panel.tsx
- approval-verify.ts
- types/form18.ts
- [code]/page.tsx
- [id]/form17/route.test.ts
- prospectus-item/route.ts
- user/[id]/route.ts
- types/justification.ts
- review/route.test.ts
- signed-copy-panel.tsx
- dean/route.test.ts
- program-chair/route.test.ts
- program-reviewer/route.test.ts
- stand-in/route.test.ts
- register/route.ts
- approval-code.ts
- [id]/form18/route.test.ts
- stand-ins-panel.tsx
- program-join-request/[id]/route.test.ts
- resubmit/route.test.ts
- stand-in-candidates/route.test.ts
- Form17Panel
- forms/justification.ts
- dean/[id]/route.test.ts
- department-head/[id]/route.test.ts
- program-chair/[id]/route.test.ts
- program/route.test.ts
- lead-candidates/route.test.ts
- submit/route.test.ts
- [versionId]/file/route.test.ts

## God Nodes (most connected - your core abstractions)
1. `createAdminPb()` - 310 edges
2. `handlePbError()` - 209 edges
3. `requireUser()` - 197 edges
4. `next` - 186 edges
5. `vitest` - 123 edges
6. `mockAuth()` - 113 edges
7. `pocketbase` - 112 edges
8. `getUserRoles` - 105 edges
9. `react` - 93 edges
10. `@headlessui/react` - 82 edges

## Surprising Connections (you probably didn't know these)
- `Accepted 2026-10-27` --references--> `getSyllabusAccess()`  [INFERRED]
  docs/specs/phase-3-review-engine.md → lib/syllabus.ts
- `Definitions` --references--> `getSyllabusAccess()`  [INFERRED]
  docs/specs/phase-2-syllabus-submission.md → lib/syllabus.ts
- `API` --references--> `requireUser()`  [INFERRED]
  docs/specs/phase-2-syllabus-submission.md → lib/auth.ts
- `Task plan (one reviewable change each, lint and tests green after each)` --references--> `Form17View()`  [INFERRED]
  docs/specs/phase-3-review-engine.md → components/forms/form17-view.tsx
- `Task plan (one reviewable change each, lint and tests green after each)` --references--> `Form181View()`  [INFERRED]
  docs/specs/phase-3-review-engine.md → components/forms/form181-view.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Review engine flow (Phase 3)** — agents_syllabus_workflow_state_machine, agents_review_chain, syllabus_review_system_project_plan__v5__syllabus_statuses, syllabus_review_system_project_plan__v5__routing_readiness, agents_proxy_reviewer, agents_approval_reference [EXTRACTED 1.00]
- **University review forms supported by the system** — agents_form17, agents_form18_1, agents_justification_form, syllabus_review_system_project_plan__v5__enhanced_obe_syllabus, syllabus_review_system_project_plan__v5__form_definitions_versioning [EXTRACTED 1.00]
- **Phase A migration from role-based PERMISSIONS to derived-role capabilities** — project_context_users_role_field, project_context_permissions_map, agents_isadmin, agents_getuserroles, agents_capability_authorization [INFERRED 0.85]

## Communities (190 total, 67 thin omitted)

### Community 0 - "prospectus-item-manager.tsx"
Cohesion: 0.13
Nodes (29): DeleteProspectusItemDialog(), handleDelete(), DeleteProspectusItemDialogProps, itemProspectusLabel(), ModalState, ProspectusItemManager(), ProspectusItemManagerProps, prospectusLabel() (+21 more)

### Community 1 - "pocketbase"
Cohesion: 0.16
Nodes (19): CollegePage(), metadata, CollegeManager(), ModalState, CollegeModal(), handleSubmit(), CollegeModalMode, CollegeModalProps (+11 more)

### Community 2 - "react"
Cohesion: 0.14
Nodes (23): DeleteSchoolYearDialog(), handleDelete(), DeleteSchoolYearDialogProps, ModalState, SchoolYearManager(), SchoolYearManagerProps, SchoolYearModal(), handleSubmit() (+15 more)

### Community 3 - "[id]/justification/route.ts"
Cohesion: 0.07
Nodes (45): GET(), RouteContext, conflict(), GET(), load(), notFound(), PATCH(), PUT() (+37 more)

### Community 4 - "Route Test Helpers"
Cohesion: 0.06
Nodes (25): base, listResult, mocks, ctx, mocks, put(), SCOPE, ctx (+17 more)

### Community 5 - "Project Docs & Domain Rules"
Cohesion: 0.06
Nodes (37): AGENTS.md (agent guidance), Approval reference code (SYL-<term>-<seq>-S<stage>), Capability-based authorization (can, requireUser, authorize, canSomewhere), Form 17 (OVPAA-F-INS-017) review checklist, Form 18-1 (CITL-F-018) review points, getUserRoles resolver (derived roles from assignment records), users.isAdmin (only stored role), Justification Form (missing lead signature) (+29 more)

### Community 6 - "types/user.ts"
Cohesion: 0.21
Nodes (11): RegisterFormProps, DEFAULT_EMAIL_DOMAINS, ParsedRegistration, ParseResult, EMAIL, MAX_NAME, MAX_PASSWORD, MIN_PASSWORD (+3 more)

### Community 7 - "Course Catalog & Picker"
Cohesion: 0.06
Nodes (53): PATCH(), RouteContext, POST(), CoursePage(), metadata, CourseCombobox(), CourseComboboxProps, CourseOption (+45 more)

### Community 8 - "Package & Tooling Config"
Cohesion: 0.06
Nodes (39): eslintConfig, dependencies, @headlessui/react@^2.2.10, next@16.3.6, pocketbase@^0.28.1, react@19.2.8, react-dom@19.2.8, devDependencies (+31 more)

### Community 9 - "User Admin UI"
Cohesion: 0.13
Nodes (24): metadata, UserPage(), DeleteUserDialog(), handleDelete(), DeleteUserDialogProps, describeAccess(), KIND_LABELS, ModalState (+16 more)

### Community 10 - "FDIS Chair Module"
Cohesion: 0.18
Nodes (19): DeleteFdisChairDialog(), handleDelete(), DeleteFdisChairDialogProps, FdisChairManager(), toggleActive(), FdisChairManagerProps, FdisChairModal(), handleSubmit() (+11 more)

### Community 11 - "Department/Program Scoping"
Cohesion: 0.08
Nodes (32): GET(), DELETE(), GET(), PATCH(), RouteContext, GET(), POST(), GET() (+24 more)

### Community 12 - "CITL Director Module"
Cohesion: 0.12
Nodes (29): PATCH(), RouteContext, POST(), CitlDirectorManager(), toggleActive(), CitlDirectorManagerProps, CitlDirectorModal(), handleSubmit() (+21 more)

### Community 13 - "pocketbase"
Cohesion: 0.06
Nodes (55): notPending(), PATCH(), RouteContext, GET(), POST(), ProgramJoinRequestManager(), approve(), reloadAfterRowLeft() (+47 more)

### Community 14 - "mockAuth"
Cohesion: 0.05
Nodes (35): ctx, forbidden(), mocks, unauthorized(), ctx, forbidden(), mocks, unauthorized() (+27 more)

### Community 15 - "Role Admin Pages"
Cohesion: 0.11
Nodes (24): CitlDirectorPage(), metadata, DeanPage(), metadata, DepartmentHeadPage(), metadata, FacultyPage(), metadata (+16 more)

### Community 16 - "pocketbase"
Cohesion: 0.16
Nodes (20): metadata, ProgramPage(), DeleteProgramDialog(), handleDelete(), DeleteProgramDialogProps, ModalState, ProgramManager(), Detail() (+12 more)

### Community 17 - "dean/route.ts"
Cohesion: 0.22
Nodes (15): DELETE(), PATCH(), RouteContext, GET(), POST(), collegeHasActiveDean(), isDeanOfCollege(), listCollegesDeanedBy() (+7 more)

### Community 18 - "handlePbError"
Cohesion: 0.11
Nodes (32): DELETE(), GET(), PATCH(), RouteContext, GET(), POST(), DELETE(), DELETE() (+24 more)

### Community 19 - "resolveSyllabusAccess"
Cohesion: 0.10
Nodes (40): GET(), notFound(), PUT(), RouteContext, load(), Loaded, notFound(), RouteContext (+32 more)

### Community 20 - "Department UI"
Cohesion: 0.16
Nodes (21): DepartmentPage(), metadata, DeleteDepartmentDialog(), handleDelete(), DeleteDepartmentDialogProps, DepartmentManager(), ModalState, DepartmentModal() (+13 more)

### Community 21 - "Faculty UI"
Cohesion: 0.18
Nodes (19): DeleteFacultyDialog(), handleDelete(), DeleteFacultyDialogProps, FacultyManager(), toggleActive(), FacultyManagerProps, FacultyModal(), handleSubmit() (+11 more)

### Community 22 - "lib/prospectus-duplicate.ts"
Cohesion: 0.15
Nodes (21): GET(), POST(), applyDuplicate(), batchSize(), DuplicatePlan, MAX_BATCH_REQUESTS, newRecordId(), planDuplicate() (+13 more)

### Community 23 - "capability-rules.ts"
Cohesion: 0.08
Nodes (15): CAPABILITIES, Rule, RULES, ScopeChain, admin, ADMIN_ONLY, chair, dean (+7 more)

### Community 24 - "syllabus/route.ts"
Cohesion: 0.07
Nodes (50): PATCH(), RouteContext, GET(), POST(), GET(), POST(), anyOf(), AvailableList (+42 more)

### Community 25 - "login/route.ts"
Cohesion: 0.42
Nodes (7): POST(), GET(), avatarUrl(), requestEmailVerification(), setSessionCookie(), toSessionUser(), createPb()

### Community 26 - "Department Head UI"
Cohesion: 0.17
Nodes (20): DeleteDepartmentHeadDialog(), handleDelete(), DeleteDepartmentHeadDialogProps, DepartmentHeadManager(), toggleActive(), DepartmentHeadManagerProps, DepartmentHeadModal(), handleSubmit() (+12 more)

### Community 27 - "VPAA UI"
Cohesion: 0.12
Nodes (29): PATCH(), RouteContext, POST(), DeleteVpaaDialog(), handleDelete(), DeleteVpaaDialogProps, VpaaManager(), toggleActive() (+21 more)

### Community 28 - "requireUserMock"
Cohesion: 0.07
Nodes (18): listResult, mocks, base, listResult, mocks, base, forbidden(), listResult (+10 more)

### Community 29 - "Program Chair UI"
Cohesion: 0.23
Nodes (16): DeleteProgramChairDialog(), handleDelete(), DeleteProgramChairDialogProps, ProgramChairManager(), toggleActive(), ProgramChairManagerProps, ProgramChairModal(), handleSubmit() (+8 more)

### Community 30 - "college-client.ts"
Cohesion: 0.10
Nodes (23): DELETE(), GET(), PATCH(), RouteContext, GET(), POST(), DELETE(), CollegeListParams (+15 more)

### Community 31 - "campus-client.ts"
Cohesion: 0.15
Nodes (22): CampusPage(), metadata, CampusManager(), formatDate(), ModalState, CampusModal(), handleSubmit(), CampusModalMode (+14 more)

### Community 32 - "TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 33 - "Department Head API"
Cohesion: 0.24
Nodes (13): DELETE(), PATCH(), RouteContext, GET(), POST(), departmentHasActiveHead(), isHeadOfDepartment(), listDepartmentsHeadedBy() (+5 more)

### Community 34 - "Program Chair API"
Cohesion: 0.21
Nodes (16): DELETE(), PATCH(), RouteContext, GET(), POST(), isChairOfProgram(), listProgramsChairedBy(), programHasActiveChair() (+8 more)

### Community 35 - "AppUser"
Cohesion: 0.13
Nodes (26): GET(), RouteContext, conflict(), GET(), notFound(), PUT(), RouteContext, canDesignate() (+18 more)

### Community 36 - "getUserRoles"
Cohesion: 0.16
Nodes (23): RouteContext, conflict(), POST(), RouteContext, GET(), notFound(), POST(), RouteContext (+15 more)

### Community 37 - "CITL Director List Tests"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 38 - "syllabus-client.ts"
Cohesion: 0.14
Nodes (36): JustificationLetterView(), JustificationPanel(), adopt(), handlePreview(), handleSave(), run(), STATUS_LABELS, TransferLeadDialog() (+28 more)

### Community 39 - "signed-copy/route.ts"
Cohesion: 0.12
Nodes (23): GET(), notFound(), RouteContext, RouteContext, GET(), notFound(), POST(), RouteContext (+15 more)

### Community 40 - "Prospectus List Tests"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 41 - "program-reviewer-manager.tsx"
Cohesion: 0.14
Nodes (22): metadata, ProgramReviewerPage(), DeleteProgramReviewerDialog(), handleDelete(), DeleteProgramReviewerDialogProps, ProgramReviewerManager(), toggleActive(), ProgramReviewerManagerProps (+14 more)

### Community 42 - "Root Layout & Header"
Cohesion: 0.43
Nodes (4): metadata, RootLayout(), AppHeader(), APP_NAME

### Community 43 - "getUserRoles"
Cohesion: 0.12
Nodes (23): GET(), RouteContext, GET(), RouteContext, conflict(), PUT(), RouteContext, can() (+15 more)

### Community 44 - "syllabus/route.test.ts"
Cohesion: 0.33
Nodes (3): input, mocks, openTerm

### Community 45 - "Course List Tests"
Cohesion: 0.25
Nodes (5): base, forbidden(), listResult, mocks, rows

### Community 46 - "Duplicate Route Tests"
Cohesion: 0.25
Nodes (4): forbidden(), input, mocks, pb

### Community 47 - "formatDate"
Cohesion: 0.15
Nodes (21): metadata, PageProps, SyllabusFormsPage(), Form17View(), Line(), Form181View(), PointsTable(), PrintableForms() (+13 more)

### Community 48 - "Term List Tests"
Cohesion: 0.25
Nodes (5): base, forbidden(), listResult, mocks, rows

### Community 49 - "Enhanced OBE Syllabus on `[FILL IN: course name]`"
Cohesion: 0.07
Nodes (27): About This File, BUKIDNON STATE UNIVERSITY, Course Information, Creating a syllabus, Differences between the two signatory blocks, Document Structure (in order), Enhanced OBE Syllabus on `[FILL IN: course name]`, Enhanced OBE Syllabus Template (BukSU) (+19 more)

### Community 50 - "School Year List Tests"
Cohesion: 0.29
Nodes (4): forbidden(), listResult, mocks, rows

### Community 51 - "vitest"
Cohesion: 0.08
Nodes (18): vitest, candidates, ctx, mocks, syllabus, ctx, form17(), mocks (+10 more)

### Community 52 - "School Years & Terms Page"
Cohesion: 0.47
Nodes (4): metadata, SchoolYearPage(), SchoolYearsAndTerms(), SchoolYearsAndTermsProps

### Community 53 - "fdis-chair/route.ts"
Cohesion: 0.17
Nodes (22): DELETE(), PATCH(), RouteContext, GET(), POST(), DELETE(), PATCH(), RouteContext (+14 more)

### Community 54 - "lib/syllabus.ts"
Cohesion: 0.19
Nodes (17): DELETE(), GET(), leadOnly(), notDraft(), notFound(), PATCH(), RouteContext, Task plan (one reviewable change each, lint and tests green after each) (+9 more)

### Community 55 - "prospectus-client.ts"
Cohesion: 0.15
Nodes (26): DeleteProspectusDialog(), handleDelete(), DeleteProspectusDialogProps, DuplicateProspectusDialog(), handleConfirm(), DuplicateProspectusDialogProps, ItemList(), ModalState (+18 more)

### Community 56 - "next"
Cohesion: 0.07
Nodes (27): POST(), DELETE(), GET(), PATCH(), RouteContext, GET(), POST(), GET() (+19 more)

### Community 57 - "syllabus-detail.tsx"
Cohesion: 0.09
Nodes (33): metadata, PageProps, SyllabusDetailPage(), DeleteSyllabusDialog(), handleDelete(), DeleteSyllabusDialogProps, ResubmitSyllabusDialog(), handleResubmit() (+25 more)

### Community 58 - "Request Proxy"
Cohesion: 0.50
Nodes (4): config, isTokenExpired(), proxy(), PUBLIC_PATHS

### Community 59 - "syllabus-manager.tsx"
Cohesion: 0.16
Nodes (15): AvailableCourseCombobox(), AvailableCourseComboboxProps, SyllabusManager(), SyllabusManagerProps, ProgramOption, SyllabusModal(), handleSubmit(), SyllabusModalProps (+7 more)

### Community 110 - "review/route.ts"
Cohesion: 0.19
Nodes (18): POST(), RouteContext, conflict(), POST(), RouteContext, POST(), RouteContext, missingChainRoles() (+10 more)

### Community 111 - "term-manager.tsx"
Cohesion: 0.14
Nodes (24): DeleteTermDialog(), handleDelete(), DeleteTermDialogProps, ModalState, TermManager(), toggleOpen(), TermManagerProps, TermModal() (+16 more)

### Community 112 - "next"
Cohesion: 0.10
Nodes (12): mocks, ctx, forbidden(), mocks, unauthorized(), ctx, draft, mocks (+4 more)

### Community 113 - "faculty/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 114 - "users.ts"
Cohesion: 0.18
Nodes (13): GET(), POST(), ASSIGNMENTS, listActiveAssignments(), Named, toUserResponse(), userKindFilter(), isUserKind() (+5 more)

### Community 115 - "prospectus/[id]/route.ts"
Cohesion: 0.25
Nodes (12): GET(), PATCH(), RouteContext, GET(), POST(), PROSPECTUS_EXPAND, toProspectusResponse(), parseProspectusInput() (+4 more)

### Community 118 - "register/page.tsx"
Cohesion: 0.16
Nodes (16): LoginPage(), LoginPageProps, metadata, metadata, RegisterPage(), RegisterPageProps, LoginForm(), handleSubmit() (+8 more)

### Community 119 - "reference-manager.tsx"
Cohesion: 0.12
Nodes (32): COPY, DialogAction, ReferenceActionDialog(), handleSubmit(), ReferenceActionDialogProps, ReferenceManager(), ReferenceManagerProps, ReferenceModal() (+24 more)

### Community 120 - "dean-manager.tsx"
Cohesion: 0.23
Nodes (16): DeanManager(), toggleActive(), DeanManagerProps, DeanModal(), handleSubmit(), DeanModalProps, DeleteDeanDialog(), handleDelete() (+8 more)

### Community 121 - "types/syllabus-reference.ts"
Cohesion: 0.24
Nodes (11): isObject(), isReferenceStatus(), parseReferenceActionInput(), ParseResult, parseSyllabusReferenceInput(), REFERENCE_ACTIONS, REFERENCE_STATUSES, ReferenceAction (+3 more)

### Community 122 - "Syllabus Development Guidelines"
Cohesion: 0.08
Nodes (23): 10. Syllabus Table Format, 11. Writing Good Outcomes, 12. Syllabus Creation Workflow, 13. Institutional Review Process, 14. Validation Checklist, 15. Output Behavior for Claude, 1. Role and Scope, 2. Bloom's Taxonomy Reference (+15 more)

### Community 123 - "syllabus-workflow.ts"
Cohesion: 0.11
Nodes (21): ApproveEvent, ChainRole, FileEvent, INITIAL_STATE, RejectScanEvent, ResubmitEvent, ReturnEvent, RoutingFacts (+13 more)

### Community 124 - "types/term.ts"
Cohesion: 0.21
Nodes (13): DELETE(), GET(), PATCH(), RouteContext, GET(), POST(), toTermRecord(), toTermResponse() (+5 more)

### Community 125 - "index.ts"
Cohesion: 0.18
Nodes (16): FORM17_REV04, FORM18_REV01, CURRENT_FORM18, FORM17_REVISIONS, FORM18_REVISIONS, getForm18(), isLegendCode(), legendEntries() (+8 more)

### Community 126 - "types/roles.ts"
Cohesion: 0.13
Nodes (11): mocks, mocks, USER, mocks, Cover, fakePb(), filter(), Row (+3 more)

### Community 127 - "Phase 2: Syllabus submission"
Cohesion: 0.20
Nodes (9): API, Capabilities, Decisions (2026-10-26), Definitions, Out of scope, Phase 2: Syllabus submission, Schema changes (to apply to `pb_schema.json`), UI (+1 more)

### Community 128 - "export.ts"
Cohesion: 0.18
Nodes (14): GET(), notFound(), ApprovalStamp, buildForm17Export(), buildForm181Export(), ExportFormMeta, ExportSyllabus, INSTITUTION (+6 more)

### Community 129 - "syllabus-reference/route.test.ts"
Cohesion: 0.25
Nodes (5): input, mocks, SCOPE, source, term

### Community 130 - "co-authors-panel.tsx"
Cohesion: 0.39
Nodes (7): CoAuthorPicker(), CoAuthorPickerProps, CoAuthorsPanel(), save(), CoAuthorsPanelProps, listCoAuthorCandidates(), updateSyllabusCoAuthors()

### Community 131 - "upload-version-modal.tsx"
Cohesion: 0.47
Nodes (5): UploadVersionModal(), handleSubmit(), UploadVersionModalProps, uploadSyllabusVersion(), MAX_VERSION_NOTES

### Community 132 - "course/[id]/route.test.ts"
Cohesion: 0.33
Nodes (4): ctx, EXPAND, forbidden(), mocks

### Community 133 - "syllabus/page.tsx"
Cohesion: 0.67
Nodes (3): metadata, SyllabusPage(), listProgramsOfUser()

### Community 134 - "Phase 3: Review engine and forms"
Cohesion: 0.13
Nodes (19): Accepted 2026-10-27, API, Capabilities, Decisions (2026-10-26), Justification, Out of scope, Phase 3: Review engine and forms, Schema changes (to apply to `pb_schema.json`) (+11 more)

### Community 139 - "[pointId]/route.test.ts"
Cohesion: 0.17
Nodes (16): conflict(), DELETE(), PATCH(), reviewerCheck(), pointActionError(), ctx, EDIT, given() (+8 more)

### Community 140 - "form17-panel.tsx"
Cohesion: 0.18
Nodes (13): Draft, Form17PanelProps, CRITERIA, parseForm17Input(), ParseResult, FORM17_ANSWERS, Form17Answer, Form17AnswerInput (+5 more)

### Community 141 - "Criteria"
Cohesion: 0.12
Nodes (16): A. Preliminaries, B. Vision, Mission, Goals, Objectives, and Outcomes, C. Course Content, Closing Section, Criteria, D. Assessment, E. Learning Modality and Methods, F. Resources, Required Readings, and References (+8 more)

### Community 142 - "lib/form17.ts"
Cohesion: 0.24
Nodes (15): Batch, copyForm17(), form17Facts(), listForm17Answers(), loadForm17(), newRecordId(), saveForm17, Version (+7 more)

### Community 143 - "form18-rules.ts"
Cohesion: 0.18
Nodes (12): NewPointForm(), PointForm(), Task plan (one reviewable change each, lint and tests green after each), Point, PointAction, pointCodeError(), pointFacts, Routed (+4 more)

### Community 144 - "3. Letter Body (in order, top to bottom)"
Cohesion: 0.12
Nodes (15): 1. Document Overview, 2. Letterhead (fixed, centered at top), 3.1 Date — VARIABLE, 3.2 Recipient block — FIXED, 3.3 Salutation — FIXED, 3.4 Opening paragraph — PARTLY VARIABLE, 3.5 Table — VARIABLE (see Section 4), 3.6 Closing — FIXED (+7 more)

### Community 145 - "app-shell.tsx"
Cohesion: 0.25
Nodes (9): AppShell(), Sidebar(), SidebarProps, canAnywhere(), Capability, getNavItems(), NAV_ITEMS, NavItem (+1 more)

### Community 146 - "CITL Syllabus Review Guide (Instructions for Part B)"
Cohesion: 0.14
Nodes (13): A. Format and House Style, B. Alignment (Coherence and Logical Connection Between Learning Plan Components), C. Use of Behavioral Verbs (Bloom's Taxonomy), CITL Syllabus Review Guide (Instructions for Part B), CITL Syllabus Review: Suggestions and Action Taken (Form 18-1), D. Gradation of COs and SLOs, E. Supplementary Documentation, F. Inclusion of Prescribed Institutional Forms (+5 more)

### Community 147 - "program-reviewer/route.ts"
Cohesion: 0.32
Nodes (10): DELETE(), PATCH(), RouteContext, GET(), POST(), programHasActiveReviewer(), toProgramReviewerResponse(), parseProgramReviewerInput() (+2 more)

### Community 148 - "types/user.ts"
Cohesion: 0.27
Nodes (10): getInitials(), HeaderAuth(), handleLogout(), HeaderAuthProps, LoginInput, logout(), RegisterInput, RegisterResponse (+2 more)

### Community 149 - "form18-panel.tsx"
Cohesion: 0.19
Nodes (11): AnswerForm(), Form18Panel(), run(), Form18PanelProps, PointFormProps, PointRow(), PointRowProps, STATUS_LABELS (+3 more)

### Community 150 - "approval-verify.ts"
Cohesion: 0.24
Nodes (9): ReviewWithExpand, VerifiedApproval, ActingAs, CHAIN_ROLES, ParseResult, parseReviewInput(), REVIEW_DECISIONS, ReviewInput (+1 more)

### Community 151 - "types/form18.ts"
Cohesion: 0.29
Nodes (10): isObject(), parsePointInput(), parsePointUpdate(), ParseResult, text(), MAX_PAGE_NUMBER, MAX_POINT_TEXT, POINT_STATUSES (+2 more)

### Community 152 - "[code]/page.tsx"
Cohesion: 0.24
Nodes (9): ACTING_AS_LABELS, metadata, PageProps, Row(), VerifyApprovalPage(), findApproval(), fakePb(), filter() (+1 more)

### Community 153 - "[id]/form17/route.test.ts"
Cohesion: 0.18
Nodes (9): ctx, FORM, get(), HOLDERS, INPUT, LATEST, mocks, put() (+1 more)

### Community 154 - "prospectus-item/route.ts"
Cohesion: 0.44
Nodes (7): GET(), PROSPECTUS_ITEM_EXPAND, isYearLevel(), parseProspectusItemInput(), parseProspectusItemUpdate(), ParseResult, isSemester()

### Community 155 - "user/[id]/route.ts"
Cohesion: 0.31
Nodes (6): DELETE(), PATCH(), RouteContext, hasOtherAdmin(), parseUserInput(), mocks

### Community 156 - "types/justification.ts"
Cohesion: 0.31
Nodes (8): ParseResult, Justification, JUSTIFICATION_STATUSES, JustificationEntry, JustificationInput, JustificationReturnInput, MAX_JUSTIFICATION_REASON, MAX_JUSTIFICATION_RETURN_REASON

### Community 157 - "review/route.test.ts"
Cohesion: 0.20
Nodes (7): BY_STAGE, ctx, decide(), HOLDERS, mocks, NO_POINTS, VERSION

### Community 158 - "signed-copy-panel.tsx"
Cohesion: 0.42
Nodes (8): SignedCopyPanel(), handleReturn(), handleUpload(), run(), SignedCopyPanelProps, returnSignedCopy(), signedCopyFileUrl(), uploadSignedCopy()

### Community 159 - "dean/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 160 - "program-chair/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 161 - "program-reviewer/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 162 - "stand-in/route.test.ts"
Cohesion: 0.22
Nodes (4): ctx, HOLDERS, ITEMS, mocks

### Community 163 - "register/route.ts"
Cohesion: 0.36
Nodes (5): isDuplicateEmail(), POST(), parseRegisterInput(), mocks, valid

### Community 164 - "approval-code.ts"
Cohesion: 0.39
Nodes (6): approvalCode(), ApprovalCodeParts, parseApprovalCode(), SEMESTER_CODES, validStage(), FINAL_STAGE

### Community 165 - "[id]/form18/route.test.ts"
Cohesion: 0.25
Nodes (5): ctx, HOLDERS, LATEST, mocks, post()

### Community 166 - "stand-ins-panel.tsx"
Cohesion: 0.43
Nodes (6): StandInPicker(), StandInPickerProps, StandInsPanel(), save(), StandInsPanelProps, setStandIn()

### Community 167 - "program-join-request/[id]/route.test.ts"
Cohesion: 0.29
Nodes (5): approve, ctx, mocks, pending, SCOPE

### Community 168 - "resubmit/route.test.ts"
Cohesion: 0.29
Nodes (5): ctx, HOLDERS, mocks, resubmit(), returned

### Community 169 - "stand-in-candidates/route.test.ts"
Cohesion: 0.29
Nodes (6): candidates, ctx, get(), HOLDERS, mocks, syllabus

### Community 170 - "Form17Panel"
Cohesion: 0.47
Nodes (5): changed(), draftFrom(), Form17Panel(), handleSave(), saveForm17()

### Community 171 - "forms/justification.ts"
Cohesion: 0.60
Nodes (4): buildJustificationLetter(), JUSTIFICATION_TEMPLATE, letterDate(), SEMESTERS

### Community 172 - "dean/[id]/route.test.ts"
Cohesion: 0.33
Nodes (4): ctx, forbidden(), mocks, unauthorized()

### Community 173 - "department-head/[id]/route.test.ts"
Cohesion: 0.33
Nodes (4): ctx, forbidden(), mocks, unauthorized()

### Community 174 - "program-chair/[id]/route.test.ts"
Cohesion: 0.33
Nodes (4): ctx, forbidden(), mocks, unauthorized()

### Community 175 - "program/route.test.ts"
Cohesion: 0.33
Nodes (3): base, listResult, mocks

### Community 176 - "lead-candidates/route.test.ts"
Cohesion: 0.33
Nodes (5): candidates, ctx, get(), mocks, syllabus

### Community 177 - "submit/route.test.ts"
Cohesion: 0.33
Nodes (4): ctx, draft, HOLDERS, mocks

### Community 178 - "[versionId]/file/route.test.ts"
Cohesion: 0.33
Nodes (4): ctx, mocks, syllabus, version

## Knowledge Gaps
- **9 isolated node(s):** `Org chain (campus, college, department, program)`, `Scoped list visibility (lib/org-visibility.ts)`, `Plain CRUD entities (campus, college, department, program, user)`, `Advisory PDF checks (informational only)`, `Prospectus migration (free-text items to courses, school_year to relation)` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 937 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **67 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `pocketbase` connect `pocketbase` to `prospectus-item-manager.tsx`, `pocketbase`, `react`, `export.ts`, `[id]/justification/route.ts`, `Course Catalog & Picker`, `Package & Tooling Config`, `User Admin UI`, `FDIS Chair Module`, `Department/Program Scoping`, `CITL Director Module`, `form17-panel.tsx`, `lib/form17.ts`, `pocketbase`, `dean/route.ts`, `handlePbError`, `resolveSyllabusAccess`, `Department UI`, `Faculty UI`, `approval-verify.ts`, `lib/prospectus-duplicate.ts`, `syllabus/route.ts`, `login/route.ts`, `Department Head UI`, `VPAA UI`, `[code]/page.tsx`, `Program Chair UI`, `college-client.ts`, `campus-client.ts`, `types/form18.ts`, `types/justification.ts`, `Program Chair API`, `register/route.ts`, `AppUser`, `getUserRoles`, `syllabus-client.ts`, `signed-copy/route.ts`, `program-reviewer-manager.tsx`, `formatDate`, `lib/syllabus.ts`, `prospectus-client.ts`, `next`, `syllabus-manager.tsx`, `types/user.ts`, `review/route.ts`, `term-manager.tsx`, `next`, `prospectus/[id]/route.ts`, `reference-manager.tsx`, `dean-manager.tsx`, `types/syllabus-reference.ts`, `types/roles.ts`?**
  _High betweenness centrality (0.163) - this node is a cross-community bridge._
- **Are the 68 inferred relationships involving `createAdminPb()` (e.g. with `register/route.test.ts` and `campus/[id]/route.test.ts`) actually correct?**
  _`createAdminPb()` has 68 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Org chain (campus, college, department, program)`, `Scoped list visibility (lib/org-visibility.ts)`, `Plain CRUD entities (campus, college, department, program, user)` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `prospectus-item-manager.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13363363363363365 - nodes in this community are weakly interconnected._
- **Why does `next` connect `next` to `pocketbase`, `[id]/justification/route.ts`, `Route Test Helpers`, `types/user.ts`, `Course Catalog & Picker`, `Package & Tooling Config`, `User Admin UI`, `Department/Program Scoping`, `CITL Director Module`, `pocketbase`, `mockAuth`, `Role Admin Pages`, `pocketbase`, `dean/route.ts`, `handlePbError`, `resolveSyllabusAccess`, `Department UI`, `lib/prospectus-duplicate.ts`, `syllabus/route.ts`, `login/route.ts`, `VPAA UI`, `requireUserMock`, `college-client.ts`, `campus-client.ts`, `Department Head API`, `Program Chair API`, `AppUser`, `getUserRoles`, `CITL Director List Tests`, `signed-copy/route.ts`, `Prospectus List Tests`, `program-reviewer-manager.tsx`, `Root Layout & Header`, `getUserRoles`, `syllabus/route.test.ts`, `Course List Tests`, `Duplicate Route Tests`, `formatDate`, `Term List Tests`, `School Year List Tests`, `vitest`, `School Years & Terms Page`, `fdis-chair/route.ts`, `lib/syllabus.ts`, `syllabus-detail.tsx`, `Request Proxy`, `syllabus-manager.tsx`, `review/route.ts`, `next`, `faculty/route.test.ts`, `users.ts`, `prospectus/[id]/route.ts`, `register/page.tsx`, `reference-manager.tsx`, `types/term.ts`, `types/roles.ts`, `syllabus-reference/route.test.ts`, `course/[id]/route.test.ts`, `syllabus/page.tsx`, `[pointId]/route.test.ts`, `app-shell.tsx`, `program-reviewer/route.ts`, `types/user.ts`, `[code]/page.tsx`, `[id]/form17/route.test.ts`, `prospectus-item/route.ts`, `user/[id]/route.ts`, `review/route.test.ts`, `dean/route.test.ts`, `program-chair/route.test.ts`, `program-reviewer/route.test.ts`, `stand-in/route.test.ts`, `register/route.ts`, `[id]/form18/route.test.ts`, `program-join-request/[id]/route.test.ts`, `resubmit/route.test.ts`, `stand-in-candidates/route.test.ts`, `dean/[id]/route.test.ts`, `department-head/[id]/route.test.ts`, `program-chair/[id]/route.test.ts`, `program/route.test.ts`, `lead-candidates/route.test.ts`, `submit/route.test.ts`, `[versionId]/file/route.test.ts`?**
  _High betweenness centrality (0.138) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `handlePbError()` (e.g. with `[id]/form17/route.test.ts` and `[pointId]/route.test.ts`) actually correct?**
  _`handlePbError()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.14482758620689656 - nodes in this community are weakly interconnected._