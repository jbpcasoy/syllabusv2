# Graph Report - syllabusv2  (2026-10-29)

## Corpus Check
- 656 files · ~301,722 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 4, .ico 1, .css 1)

## Summary
- 3359 nodes · 10531 edges · 212 communities (139 shown, 73 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 325 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cd423ebc`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- syllabus/[id]/route.ts
- dashboard-scope.ts
- react
- college-manager.tsx
- lib/syllabus-review.ts
- Project Docs & Domain Rules
- validators/user.ts
- course-modal.tsx
- Package & Tooling Config
- formatDate
- createAdminPb
- mock-auth.ts
- getCurrentUser
- global-setup.ts
- mockAuth
- lib/auth.ts
- pocketbase
- timeline/route.ts
- types/college.ts
- react
- department-head/route.ts
- Faculty UI
- lib/prospectus-duplicate.ts
- capability-rules.ts
- pocketbase
- login/route.ts
- export/route.ts
- VPAA UI
- vpaa/route.ts
- Program Chair UI
- auth-client.ts
- dean-manager.tsx
- TypeScript Config
- Syllabus
- pocketbase.ts
- faculty/route.test.ts
- getUserRoles
- types/notification.ts
- notifications.ts
- signed-copy/route.ts
- lib/dashboard.ts
- program-reviewer-manager.tsx
- types/dashboard.ts
- types/syllabus.ts
- register/page.tsx
- course/route.test.ts
- helpers.ts
- export.ts
- dashboard-manager.tsx
- Enhanced OBE Syllabus on `[FILL IN: course name]`
- lib/review-queue.ts
- signed-copy/route.test.ts
- citl-director/route.ts
- vitest
- pocketbase
- prospectus-client.ts
- prospectus-item/[id]/route.ts
- syllabus-detail.tsx
- types/roles.ts
- syllabus-manager.tsx
- PostCSS Config
- review/route.ts
- term-manager.tsx
- user-manager.tsx
- transfer-lead-dialog.tsx
- users.ts
- [code]/page.tsx
- dean/route.ts
- reference-manager.tsx
- form17-panel.tsx
- pocketbase
- Syllabus Development Guidelines
- syllabus-workflow.ts
- types/prospectus-item.ts
- 05-a11y.spec.ts
- Phase 4: Reviewer experience
- dean-manager.tsx
- org-visibility.ts
- scripts
- lib/justification.ts
- dependencies
- term/[id]/route.ts
- revise-workspace.tsx
- Phase 5: Visibility and communication
- Retention policy
- index.ts
- Criteria
- user/[id]/route.ts
- Phase 3: Review engine and forms
- 3. Letter Body (in order, top to bottom)
- README.md
- CITL Syllabus Review Guide (Instructions for Part B)
- prospectus/route.test.ts
- app-header.tsx
- overdue-badge.tsx
- program-join-request-manager.tsx
- form18-panel.tsx
- faculty/[id]/route.ts
- [id]/form17/route.test.ts
- Phase 2: Syllabus submission
- register/route.ts
- [pointId]/route.ts
- [pointId]/route.ts
- program-join-request/[id]/route.test.ts
- program-join-request/route.test.ts
- audit-log.test.ts
- stand-in/route.test.ts
- requireUserMock
- approval-verify.ts
- Phase 6: Hardening
- Feature walkthrough
- types/term.ts
- program-reviewer/route.ts
- validators/syllabus-stand-in.ts
- syllabus-client.ts
- review/route.test.ts
- user/route.test.ts
- citl-director/route.test.ts
- college/route.test.ts
- fdis-chair/route.test.ts
- scope/route.test.ts
- next
- vpaa/route.test.ts
- export/form18/route.test.ts
- duplicate/route.test.ts
- [id]/form18/route.test.ts
- syllabus-reference/route.test.ts
- from-previous/route.test.ts
- validators/syllabus-reference.ts
- audit-phase-a.ts
- resubmit/route.test.ts
- types/review-queue.ts
- stand-in-candidates/route.test.ts
- justifications/route.test.ts
- program-reviewer/route.test.ts
- co-author-candidates/route.test.ts
- school-year/route.test.ts
- forms/justification.ts
- syllabus/route.test.ts
- school-year/[id]/route.ts
- review-queue/route.test.ts

## God Nodes (most connected - your core abstractions)
1. `createAdminPb()` - 347 edges
2. `handlePbError()` - 247 edges
3. `next` - 228 edges
4. `requireUser()` - 221 edges
5. `vitest` - 153 edges
6. `pocketbase` - 137 edges
7. `mockAuth()` - 125 edges
8. `getUserRoles` - 123 edges
9. `react` - 110 edges
10. `@headlessui/react` - 95 edges

## Surprising Connections (you probably didn't know these)
- `Deadlines` --references--> `ReviewQueueItem`  [INFERRED]
  docs/specs/phase-5-visibility.md → types/review-queue.ts
- `Schema changes (to apply to `pb_schema.json`)` --references--> `file()`  [INFERRED]
  docs/specs/phase-2-syllabus-submission.md → lib/syllabus-workflow.ts
- `Hub (`/syllabus/[id]`)` --references--> `SyllabusVersions()`  [INFERRED]
  docs/specs/phase-4-reviewer-experience.md → components/syllabus/syllabus-versions.tsx
- `Proposals (accept or amend before task 1)` --references--> `justificationScope()`  [INFERRED]
  docs/specs/phase-5-visibility.md → lib/dashboard-scope.ts
- `Timeline` --references--> `resolveSyllabusAccess()`  [INFERRED]
  docs/specs/phase-4-reviewer-experience.md → lib/syllabus.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Review engine flow (Phase 3)** — agents_syllabus_workflow_state_machine, agents_review_chain, syllabus_review_system_project_plan__v5__syllabus_statuses, syllabus_review_system_project_plan__v5__routing_readiness, agents_proxy_reviewer, agents_approval_reference [EXTRACTED 1.00]
- **University review forms supported by the system** — agents_form17, agents_form18_1, agents_justification_form, syllabus_review_system_project_plan__v5__enhanced_obe_syllabus, syllabus_review_system_project_plan__v5__form_definitions_versioning [EXTRACTED 1.00]
- **Phase A migration from role-based PERMISSIONS to derived-role capabilities** — project_context_users_role_field, project_context_permissions_map, agents_isadmin, agents_getuserroles, agents_capability_authorization [INFERRED 0.85]

## Communities (212 total, 73 thin omitted)

### Community 0 - "syllabus/[id]/route.ts"
Cohesion: 0.16
Nodes (25): DELETE(), GET(), leadOnly(), notEditable(), notFound(), PATCH(), RouteContext, POST() (+17 more)

### Community 1 - "dashboard-scope.ts"
Cohesion: 0.09
Nodes (27): Testing, anyOf(), Bind, dashboardScope(), filterInScope(), justificationScope(), programInScope(), programMatches() (+19 more)

### Community 2 - "react"
Cohesion: 0.15
Nodes (22): DeleteSchoolYearDialog(), handleDelete(), DeleteSchoolYearDialogProps, ModalState, SchoolYearManager(), SchoolYearManagerProps, SchoolYearModal(), handleSubmit() (+14 more)

### Community 3 - "college-manager.tsx"
Cohesion: 0.16
Nodes (20): CollegePage(), metadata, CollegeManager(), ModalState, CollegeModal(), handleSubmit(), CollegeModalMode, CollegeModalProps (+12 more)

### Community 4 - "lib/syllabus-review.ts"
Cohesion: 0.17
Nodes (23): conflict(), GET(), notFound(), PUT(), RouteContext, loadChainHolders(), Authors, canDesignate() (+15 more)

### Community 5 - "Project Docs & Domain Rules"
Cohesion: 0.06
Nodes (37): AGENTS.md (agent guidance), Approval reference code (SYL-<term>-<seq>-S<stage>), Capability-based authorization (can, requireUser, authorize, canSomewhere), Form 17 (OVPAA-F-INS-017) review checklist, Form 18-1 (CITL-F-018) review points, getUserRoles resolver (derived roles from assignment records), users.isAdmin (only stored role), Justification Form (missing lead signature) (+29 more)

### Community 6 - "validators/user.ts"
Cohesion: 0.19
Nodes (12): RegisterFormProps, DEFAULT_EMAIL_DOMAINS, ParsedRegistration, ParseResult, EMAIL, MAX_NAME, MAX_PASSWORD, MIN_PASSWORD (+4 more)

### Community 7 - "course-modal.tsx"
Cohesion: 0.07
Nodes (44): CoursePage(), metadata, CourseCombobox(), CourseComboboxProps, CourseOption, CourseManager(), CourseManagerProps, ModalState (+36 more)

### Community 8 - "Package & Tooling Config"
Cohesion: 0.09
Nodes (27): eslintConfig, devDependencies, @axe-core/playwright@^4.14.0, eslint@^9, eslint-config-next@16.3.6, @playwright/test@^1.64.1, tailwindcss@^4, @tailwindcss/postcss@^4 (+19 more)

### Community 9 - "formatDate"
Cohesion: 0.13
Nodes (18): PdfPaneProps, StandInPicker(), StandInPickerProps, StandInsPanel(), save(), StandInsPanelProps, by(), currentLine() (+10 more)

### Community 10 - "createAdminPb"
Cohesion: 0.07
Nodes (73): GET(), DELETE(), GET(), PATCH(), RouteContext, GET(), POST(), DELETE() (+65 more)

### Community 11 - "mock-auth.ts"
Cohesion: 0.07
Nodes (20): evaluateCapability(), base, listResult, mocks, ctx, forbidden(), mocks, ctx (+12 more)

### Community 12 - "getCurrentUser"
Cohesion: 0.08
Nodes (33): CitlDirectorPage(), metadata, DeanPage(), metadata, DepartmentHeadPage(), metadata, FdisChairPage(), metadata (+25 more)

### Community 13 - "global-setup.ts"
Cohesion: 0.15
Nodes (22): APP_PORT, APP_URL, DIST_DIR, LOCAL_PB, PB_BIN, PB_PORT, PB_URL, ROOT (+14 more)

### Community 14 - "mockAuth"
Cohesion: 0.05
Nodes (39): ctx, forbidden(), mocks, unauthorized(), ctx, forbidden(), mocks, unauthorized() (+31 more)

### Community 15 - "lib/auth.ts"
Cohesion: 0.09
Nodes (34): POST(), GET(), GET(), RouteContext, GET(), GET(), RouteContext, conflict() (+26 more)

### Community 16 - "pocketbase"
Cohesion: 0.13
Nodes (21): metadata, ProgramPage(), DeleteProgramDialog(), handleDelete(), DeleteProgramDialogProps, ModalState, ProgramManager(), Detail() (+13 more)

### Community 17 - "timeline/route.ts"
Cohesion: 0.16
Nodes (13): buildTimeline(), name(), Named, TimelineEvent, TimelineVersion, base, SYLLABUS_EVENT_TYPES, SyllabusEvent (+5 more)

### Community 18 - "types/college.ts"
Cohesion: 0.43
Nodes (4): ParseResult, Campus, CampusInput, College

### Community 19 - "react"
Cohesion: 0.21
Nodes (15): CitlDirectorModalProps, DeanModalProps, DepartmentHeadModalProps, FacultyModalProps, FdisChairModalProps, ProgramChairModalProps, ProgramReviewerModalProps, UserCombobox() (+7 more)

### Community 20 - "department-head/route.ts"
Cohesion: 0.07
Nodes (51): PATCH(), RouteContext, POST(), DepartmentPage(), metadata, DeleteDepartmentDialog(), handleDelete(), DeleteDepartmentDialogProps (+43 more)

### Community 21 - "Faculty UI"
Cohesion: 0.19
Nodes (17): FacultyPage(), metadata, DeleteFacultyDialog(), handleDelete(), DeleteFacultyDialogProps, FacultyManager(), toggleActive(), FacultyManagerProps (+9 more)

### Community 22 - "lib/prospectus-duplicate.ts"
Cohesion: 0.11
Nodes (27): GET(), POST(), applyDuplicate(), batchSize(), DuplicatePlan, MAX_BATCH_REQUESTS, newRecordId(), planDuplicate() (+19 more)

### Community 23 - "capability-rules.ts"
Cohesion: 0.09
Nodes (19): DashboardPage(), metadata, Home(), canAnywhere(), CAPABILITIES, Rule, RULES, ScopeChain (+11 more)

### Community 24 - "pocketbase"
Cohesion: 0.13
Nodes (25): POST(), GET(), POST(), anyOf(), isListedForProgram(), isNotUniqueError(), listReferencedSyllabusIds(), findLiveReference() (+17 more)

### Community 25 - "login/route.ts"
Cohesion: 0.36
Nodes (8): POST(), GET(), avatarUrl(), requestEmailVerification(), setSessionCookie(), toSessionUser(), createPb(), requireEnv()

### Community 26 - "export/route.ts"
Cohesion: 0.10
Nodes (36): cap(), GET(), RFC-4180, csvCell, fileSlug(), toCsv(), completionCsv(), filterOverdue() (+28 more)

### Community 27 - "VPAA UI"
Cohesion: 0.19
Nodes (17): metadata, VpaaPage(), DeleteVpaaDialog(), handleDelete(), DeleteVpaaDialogProps, VpaaManager(), toggleActive(), VpaaManagerProps (+9 more)

### Community 28 - "vpaa/route.ts"
Cohesion: 0.22
Nodes (15): DELETE(), PATCH(), RouteContext, GET(), POST(), ParseResult, parseVpaaInput(), parseVpaaUpdate() (+7 more)

### Community 29 - "Program Chair UI"
Cohesion: 0.24
Nodes (14): DeleteProgramChairDialog(), handleDelete(), DeleteProgramChairDialogProps, ProgramChairManager(), toggleActive(), ProgramChairManagerProps, ProgramChairModal(), handleSubmit() (+6 more)

### Community 30 - "auth-client.ts"
Cohesion: 0.23
Nodes (12): LoginForm(), handleSubmit(), LoginFormProps, getInitials(), HeaderAuth(), handleLogout(), HeaderAuthProps, login() (+4 more)

### Community 31 - "dean-manager.tsx"
Cohesion: 0.15
Nodes (22): CampusPage(), metadata, CampusManager(), formatDate(), ModalState, CampusModal(), handleSubmit(), CampusModalMode (+14 more)

### Community 32 - "TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 33 - "Syllabus"
Cohesion: 0.16
Nodes (16): isFacultyOfProgram(), isChairOfProgram(), listProgramsChairedBy(), ParseResult, ParseResult, Course, Faculty, FacultyInput (+8 more)

### Community 34 - "pocketbase.ts"
Cohesion: 0.04
Nodes (29): base, forbidden(), listResult, mocks, rows, unauthorized(), ctx, mocks (+21 more)

### Community 35 - "faculty/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 36 - "getUserRoles"
Cohesion: 0.23
Nodes (17): conflict(), POST(), RouteContext, GET(), notFound(), POST(), RouteContext, GET() (+9 more)

### Community 37 - "types/notification.ts"
Cohesion: 0.09
Nodes (41): PATCH(), RouteContext, GET(), BellIcon(), BellPanel(), markAll(), open(), NotificationBell() (+33 more)

### Community 38 - "notifications.ts"
Cohesion: 0.22
Nodes (12): addNotifications(), Authors, Batch, clip(), notificationRecipients(), notificationText(), NotifyEvent, stageActors() (+4 more)

### Community 39 - "signed-copy/route.ts"
Cohesion: 0.05
Nodes (60): conflict(), GET(), load(), notFound(), PATCH(), PUT(), RouteContext, notFound() (+52 more)

### Community 40 - "lib/dashboard.ts"
Cohesion: 0.14
Nodes (30): GET(), GET(), GET(), Task plan (one reviewable change each, lint and tests green after each), allAwaitingSignedCopy(), awaitingSignedCopyQuery(), emptyList(), justificationRows() (+22 more)

### Community 41 - "program-reviewer-manager.tsx"
Cohesion: 0.24
Nodes (14): DeleteProgramReviewerDialog(), handleDelete(), DeleteProgramReviewerDialogProps, ProgramReviewerManager(), toggleActive(), ProgramReviewerManagerProps, ProgramReviewerModal(), handleSubmit() (+6 more)

### Community 42 - "types/dashboard.ts"
Cohesion: 0.13
Nodes (17): addTally(), aggregate(), blankTally(), byName(), completionRows(), row(), Tally, withRate() (+9 more)

### Community 43 - "types/syllabus.ts"
Cohesion: 0.11
Nodes (27): AvailableList, AvailableQuery, holdsChainRole(), listAvailable(), toTermSummary(), SyllabusStatus, isObject(), ParseResult (+19 more)

### Community 44 - "register/page.tsx"
Cohesion: 0.22
Nodes (11): LoginPage(), LoginPageProps, metadata, metadata, RegisterPage(), RegisterPageProps, RegisterForm(), handleSubmit() (+3 more)

### Community 45 - "course/route.test.ts"
Cohesion: 0.25
Nodes (5): base, forbidden(), listResult, mocks, rows

### Community 46 - "helpers.ts"
Cohesion: 0.34
Nodes (13): adminPb(), answerForm17AllYes(), approveInUi(), auditFor(), createDraft(), getSyllabus(), loadSeed(), ok() (+5 more)

### Community 47 - "export.ts"
Cohesion: 0.11
Nodes (27): metadata, PageProps, SyllabusFormsPage(), Form17View(), Line(), Form181View(), PointsTable(), PrintableForms() (+19 more)

### Community 48 - "dashboard-manager.tsx"
Cohesion: 0.12
Nodes (30): DashboardManager(), defaultTerm(), JustificationsPanel(), STATE_STYLES, STATES, daysSince(), ErrorBanner(), ExportLink() (+22 more)

### Community 49 - "Enhanced OBE Syllabus on `[FILL IN: course name]`"
Cohesion: 0.07
Nodes (27): About This File, BUKIDNON STATE UNIVERSITY, Course Information, Creating a syllabus, Differences between the two signatory blocks, Document Structure (in order), Enhanced OBE Syllabus on `[FILL IN: course name]`, Enhanced OBE Syllabus Template (BukSU) (+19 more)

### Community 50 - "lib/review-queue.ts"
Cohesion: 0.16
Nodes (24): GET(), Testing, Cover, heldStages(), holdsStageFor(), listAwaitingReviewIds(), loadMyStandIns(), loadQueueExtras() (+16 more)

### Community 51 - "signed-copy/route.test.ts"
Cohesion: 0.10
Nodes (15): ctx, download(), mocks, pdf, upload(), ctx, mocks, pdf (+7 more)

### Community 52 - "citl-director/route.ts"
Cohesion: 0.12
Nodes (28): PATCH(), RouteContext, POST(), CitlDirectorManager(), toggleActive(), CitlDirectorManagerProps, CitlDirectorModal(), handleSubmit() (+20 more)

### Community 53 - "vitest"
Cohesion: 0.05
Nodes (33): vitest, get(), mocks, page, mocks, listResult, mocks, mocks (+25 more)

### Community 54 - "pocketbase"
Cohesion: 0.18
Nodes (15): findPreviousSyllabus(), previousSchoolYearLabel(), listStandInCandidates(), listStandIns(), STAND_IN_EXPAND, toStandInResponse(), pocketbase, fakePb() (+7 more)

### Community 55 - "prospectus-client.ts"
Cohesion: 0.12
Nodes (24): DeleteProspectusDialog(), handleDelete(), DeleteProspectusDialogProps, DuplicateProspectusDialog(), handleConfirm(), DuplicateProspectusDialogProps, ItemList(), ModalState (+16 more)

### Community 56 - "prospectus-item/[id]/route.ts"
Cohesion: 0.33
Nodes (10): PATCH(), RouteContext, GET(), POST(), PROSPECTUS_ITEM_EXPAND, toProspectusItemResponse(), isYearLevel(), parseProspectusItemInput() (+2 more)

### Community 57 - "syllabus-detail.tsx"
Cohesion: 0.11
Nodes (24): metadata, PageProps, SyllabusDetailPage(), DeleteSyllabusDialog(), handleDelete(), DeleteSyllabusDialogProps, SubmitSyllabusDialog(), handleSubmit() (+16 more)

### Community 58 - "types/roles.ts"
Cohesion: 0.13
Nodes (14): AppShell(), Sidebar(), SidebarProps, Capability, getNavItems(), NAV_ITEMS, NavItem, mocks (+6 more)

### Community 59 - "syllabus-manager.tsx"
Cohesion: 0.10
Nodes (23): metadata, ReviewQueuePage(), metadata, SyllabusPage(), ProgramFilterCombobox(), age(), ReviewQueueManager(), stageLabel() (+15 more)

### Community 110 - "review/route.ts"
Cohesion: 0.11
Nodes (30): POST(), RouteContext, conflict(), conflictMessage(), POST(), RouteContext, Task plan (one reviewable change each, lint and tests green after each), copyForm17() (+22 more)

### Community 111 - "term-manager.tsx"
Cohesion: 0.15
Nodes (20): DeleteTermDialog(), handleDelete(), DeleteTermDialogProps, ModalState, TermManager(), toggleOpen(), TermManagerProps, TermModal() (+12 more)

### Community 112 - "user-manager.tsx"
Cohesion: 0.11
Nodes (23): metadata, UserPage(), DeleteUserDialog(), handleDelete(), DeleteUserDialogProps, describeAccess(), KIND_LABELS, ModalState (+15 more)

### Community 113 - "transfer-lead-dialog.tsx"
Cohesion: 0.14
Nodes (15): CoAuthorPicker(), CoAuthorPickerProps, CoAuthorsPanel(), save(), CoAuthorsPanelProps, TransferLeadDialog(), handleTransfer(), TransferLeadDialogProps (+7 more)

### Community 114 - "users.ts"
Cohesion: 0.26
Nodes (11): GET(), POST(), ASSIGNMENTS, listActiveAssignments(), Named, toUserResponse(), userKindFilter(), isUserKind() (+3 more)

### Community 115 - "[code]/page.tsx"
Cohesion: 0.22
Nodes (9): ACTING_AS_LABELS, metadata, PageProps, Row(), VerifyApprovalPage(), metadata, VerifyPage(), VerifyForm() (+1 more)

### Community 118 - "dean/route.ts"
Cohesion: 0.23
Nodes (14): PATCH(), RouteContext, POST(), collegeHasActiveDean(), isDeanOfCollege(), listCollegesDeanedBy(), toDeanResponse(), parseDeanInput() (+6 more)

### Community 119 - "reference-manager.tsx"
Cohesion: 0.09
Nodes (38): AvailableCourseCombobox(), AvailableCourseComboboxProps, COPY, DialogAction, ReferenceActionDialog(), handleSubmit(), ReferenceActionDialogProps, ReferenceManager() (+30 more)

### Community 120 - "form17-panel.tsx"
Cohesion: 0.25
Nodes (8): changed(), Draft, draftFrom(), Form17Panel(), handleSave(), Form17PanelProps, saveForm17(), Form17Answer

### Community 121 - "pocketbase"
Cohesion: 0.17
Nodes (18): DeleteFdisChairDialog(), handleDelete(), DeleteFdisChairDialogProps, FdisChairManager(), toggleActive(), FdisChairManagerProps, FdisChairModal(), handleSubmit() (+10 more)

### Community 122 - "Syllabus Development Guidelines"
Cohesion: 0.08
Nodes (23): 10. Syllabus Table Format, 11. Writing Good Outcomes, 12. Syllabus Creation Workflow, 13. Institutional Review Process, 14. Validation Checklist, 15. Output Behavior for Claude, 1. Role and Scope, 2. Bloom's Taxonomy Reference (+15 more)

### Community 123 - "syllabus-workflow.ts"
Cohesion: 0.10
Nodes (31): API, Workflow (`lib/syllabus-workflow.ts`, pure), approve(), ApproveEvent, fail(), file(), FileEvent, giveBack() (+23 more)

### Community 124 - "types/prospectus-item.ts"
Cohesion: 0.12
Nodes (29): DeleteProspectusItemDialog(), handleDelete(), DeleteProspectusItemDialogProps, itemProspectusLabel(), ModalState, ProspectusItemManager(), ProspectusItemManagerProps, prospectusLabel() (+21 more)

### Community 125 - "05-a11y.spec.ts"
Cohesion: 0.25
Nodes (6): PAGES, TAGS, PASSWORD, findSyllabusId(), PEOPLE, Person

### Community 126 - "Phase 4: Reviewer experience"
Cohesion: 0.18
Nodes (10): Boundaries, Decisions (2026-10-27), Events (`lib/syllabus-events.ts`, server-only), Hub (`/syllabus/[id]`), Objective, Out of scope, Phase 4: Reviewer experience, Proposals (accept or amend before task 1) (+2 more)

### Community 127 - "dean-manager.tsx"
Cohesion: 0.21
Nodes (14): DeanManager(), toggleActive(), DeanManagerProps, DeanModal(), handleSubmit(), DeleteDeanDialog(), handleDelete(), DeleteDeanDialogProps (+6 more)

### Community 128 - "org-visibility.ts"
Cohesion: 0.07
Nodes (42): DELETE(), GET(), PATCH(), RouteContext, DELETE(), GET(), PATCH(), RouteContext (+34 more)

### Community 129 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, audit:phase-a, build, dev, lint, pb, start, test (+1 more)

### Community 130 - "lib/justification.ts"
Cohesion: 0.20
Nodes (11): GET(), RouteContext, activeHolderName(), ensureBasedOn(), userNames(), get(), fakePb(), filter() (+3 more)

### Community 131 - "dependencies"
Cohesion: 0.29
Nodes (7): dependencies, @headlessui/react@^2.2.10, next@16.3.6, pocketbase@^0.28.1, react@19.2.8, react-dom@19.2.8, react-dom

### Community 132 - "term/[id]/route.ts"
Cohesion: 0.23
Nodes (16): GET(), PATCH(), RouteContext, GET(), POST(), termHasRefSeqs(), toTermRecord(), toTermResponse() (+8 more)

### Community 133 - "revise-workspace.tsx"
Cohesion: 0.10
Nodes (28): metadata, PageProps, SyllabusReviewPage(), metadata, PageProps, SyllabusRevisePage(), PdfPane(), ResubmitSyllabusDialog() (+20 more)

### Community 134 - "Phase 5: Visibility and communication"
Cohesion: 0.10
Nodes (16): Boundaries, Dashboards, Deadlines, Decisions (2026-10-28), Objective, Out of scope, Phase 5: Visibility and communication, Proposals (accept or amend before task 1) (+8 more)

### Community 139 - "Retention policy"
Cohesion: 0.33
Nodes (5): Changing this policy, Removing records, Retention policy, Rule, Storage growth

### Community 140 - "index.ts"
Cohesion: 0.07
Nodes (50): GET(), notFound(), RouteContext, GET(), RouteContext, GET(), notFound(), PUT() (+42 more)

### Community 141 - "Criteria"
Cohesion: 0.12
Nodes (16): A. Preliminaries, B. Vision, Mission, Goals, Objectives, and Outcomes, C. Course Content, Closing Section, Criteria, D. Assessment, E. Learning Modality and Methods, F. Resources, Required Readings, and References (+8 more)

### Community 142 - "user/[id]/route.ts"
Cohesion: 0.24
Nodes (7): DELETE(), PATCH(), RouteContext, hasOtherAdmin(), parseUserInput(), mocks, base

### Community 143 - "Phase 3: Review engine and forms"
Cohesion: 0.14
Nodes (13): config, isTokenExpired(), proxy(), PUBLIC_PATHS, Accepted 2026-10-27, Capabilities, Decisions (2026-10-26), Justification (+5 more)

### Community 144 - "3. Letter Body (in order, top to bottom)"
Cohesion: 0.12
Nodes (15): 1. Document Overview, 2. Letterhead (fixed, centered at top), 3.1 Date — VARIABLE, 3.2 Recipient block — FIXED, 3.3 Salutation — FIXED, 3.4 Opening paragraph — PARTLY VARIABLE, 3.5 Table — VARIABLE (see Section 4), 3.6 Closing — FIXED (+7 more)

### Community 146 - "CITL Syllabus Review Guide (Instructions for Part B)"
Cohesion: 0.14
Nodes (13): A. Format and House Style, B. Alignment (Coherence and Logical Connection Between Learning Plan Components), C. Use of Behavioral Verbs (Bloom's Taxonomy), CITL Syllabus Review Guide (Instructions for Part B), CITL Syllabus Review: Suggestions and Action Taken (Form 18-1), D. Gradation of COs and SLOs, E. Supplementary Documentation, F. Inclusion of Prescribed Institutional Forms (+5 more)

### Community 147 - "prospectus/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 148 - "app-header.tsx"
Cohesion: 0.39
Nodes (5): metadata, RootLayout(), AppHeader(), unreadFor(), APP_NAME

### Community 149 - "overdue-badge.tsx"
Cohesion: 0.31
Nodes (12): reviewOverdueDays(), submissionOverdueDays(), TermDeadlines, syllabusOverdue(), daysOverdue(), deadlineEnd(), isReviewOverdue(), isSubmissionOverdue() (+4 more)

### Community 150 - "program-join-request-manager.tsx"
Cohesion: 0.08
Nodes (42): DELETE(), notPending(), PATCH(), RouteContext, ProgramJoinRequestManager(), approve(), reloadAfterRowLeft(), ProgramJoinRequestManagerProps (+34 more)

### Community 151 - "form18-panel.tsx"
Cohesion: 0.09
Nodes (29): Form18Panel(), run(), Form18PanelProps, NewPointForm(), PointForm(), PointFormProps, PointRow(), PointRowProps (+21 more)

### Community 152 - "faculty/[id]/route.ts"
Cohesion: 0.24
Nodes (8): PATCH(), RouteContext, toFacultyResponse(), parseFacultyUpdate(), ctx, forbidden(), mocks, unauthorized()

### Community 153 - "[id]/form17/route.test.ts"
Cohesion: 0.18
Nodes (9): ctx, FORM, get(), HOLDERS, INPUT, LATEST, mocks, put() (+1 more)

### Community 155 - "Phase 2: Syllabus submission"
Cohesion: 0.20
Nodes (9): API, Capabilities, Decisions (2026-10-26), Definitions, Out of scope, Phase 2: Syllabus submission, Schema changes (to apply to `pb_schema.json`), UI (+1 more)

### Community 156 - "register/route.ts"
Cohesion: 0.31
Nodes (6): isDuplicateEmail(), POST(), parseRegisterInput(), mocks, valid, RegisterResponse

### Community 157 - "[pointId]/route.ts"
Cohesion: 0.20
Nodes (11): ctx, EDIT, given(), HOLDERS, mocks, patch(), point(), remove() (+3 more)

### Community 158 - "[pointId]/route.ts"
Cohesion: 0.13
Nodes (27): conflict(), DELETE(), load(), Loaded, notFound(), PATCH(), reviewerCheck(), RouteContext (+19 more)

### Community 159 - "program-join-request/[id]/route.test.ts"
Cohesion: 0.29
Nodes (5): approve, ctx, mocks, pending, SCOPE

### Community 160 - "program-join-request/route.test.ts"
Cohesion: 0.22
Nodes (5): base, data, listResult, mocks, rows

### Community 161 - "audit-log.test.ts"
Cohesion: 0.14
Nodes (19): Boundaries, anyOf(), auditDetail(), auditFilter(), AuditNames, listAudit(), stateLabel(), STATUS_LABELS (+11 more)

### Community 162 - "stand-in/route.test.ts"
Cohesion: 0.22
Nodes (4): ctx, HOLDERS, ITEMS, mocks

### Community 163 - "requireUserMock"
Cohesion: 0.05
Nodes (24): ctx, mocks, ctx, EXPAND, forbidden(), mocks, base, forbidden() (+16 more)

### Community 164 - "approval-verify.ts"
Cohesion: 0.14
Nodes (18): approvalCode(), ApprovalCodeParts, parseApprovalCode(), SEMESTER_CODES, validStage(), findApproval(), ReviewWithExpand, VerifiedApproval (+10 more)

### Community 165 - "Phase 6: Hardening"
Cohesion: 0.07
Nodes (35): AuditPage(), metadata, ACTION_LABELS, AuditManager(), version(), Schema changes (to apply to `pb_schema.json`), Accessibility pass, Audit module (+27 more)

### Community 166 - "Feature walkthrough"
Cohesion: 0.20
Nodes (18): 0. Before you start, 1. Cast, Feature walkthrough, Part 10 — Negative checks, Part 11 — Keyboard and accessibility pass, Part 1 — Admin setup (as `admin`), Part 2 — Org chain and roles, Part 3 — Registration and joining a program (+10 more)

### Community 167 - "types/term.ts"
Cohesion: 0.46
Nodes (5): record, Term, TermInput, TermResponse, TermUpdateInput

### Community 169 - "program-reviewer/route.ts"
Cohesion: 0.24
Nodes (14): DELETE(), PATCH(), RouteContext, GET(), POST(), programHasActiveReviewer(), toProgramReviewerResponse(), parseProgramReviewerInput() (+6 more)

### Community 170 - "validators/syllabus-stand-in.ts"
Cohesion: 0.43
Nodes (5): FINAL_STAGE, isStage(), ParseResult, parseStandInInput(), StandInInput

### Community 171 - "syllabus-client.ts"
Cohesion: 0.12
Nodes (40): JustificationLetterView(), JustificationPanel(), adopt(), handlePreview(), handleSave(), run(), STATUS_LABELS, SignedCopyPanel() (+32 more)

### Community 173 - "review/route.test.ts"
Cohesion: 0.20
Nodes (7): BY_STAGE, ctx, decide(), HOLDERS, mocks, NO_POINTS, VERSION

### Community 174 - "user/route.test.ts"
Cohesion: 0.29
Nodes (4): base, listResult, mocks, users

### Community 175 - "citl-director/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 176 - "college/route.test.ts"
Cohesion: 0.33
Nodes (3): base, listResult, mocks

### Community 177 - "fdis-chair/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 178 - "scope/route.test.ts"
Cohesion: 0.33
Nodes (4): EMC, IT, mocks, N

### Community 190 - "next"
Cohesion: 0.07
Nodes (18): nextConfig, next, ctx, mocks, ctx, mocks, listResult, mocks (+10 more)

### Community 191 - "vpaa/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 192 - "export/form18/route.test.ts"
Cohesion: 0.33
Nodes (5): ctx, form18(), mocks, SYLLABUS, VERSION

### Community 194 - "duplicate/route.test.ts"
Cohesion: 0.25
Nodes (4): forbidden(), input, mocks, pb

### Community 195 - "[id]/form18/route.test.ts"
Cohesion: 0.25
Nodes (5): ctx, HOLDERS, LATEST, mocks, post()

### Community 197 - "syllabus-reference/route.test.ts"
Cohesion: 0.25
Nodes (5): input, mocks, SCOPE, source, term

### Community 198 - "from-previous/route.test.ts"
Cohesion: 0.33
Nodes (4): ctx, mocks, OLD_VERSION, post()

### Community 199 - "validators/syllabus-reference.ts"
Cohesion: 0.27
Nodes (10): isObject(), isReferenceStatus(), parseReferenceActionInput(), ParseResult, parseSyllabusReferenceInput(), REFERENCE_ACTIONS, REFERENCE_STATUSES, ReferenceActionInput (+2 more)

### Community 201 - "audit-phase-a.ts"
Cohesion: 0.33
Nodes (6): AssignmentRow, ASSIGNMENTS, main(), requireEnv(), UNASSIGNED_FILTER, UserRow

### Community 202 - "resubmit/route.test.ts"
Cohesion: 0.29
Nodes (5): ctx, HOLDERS, mocks, resubmit(), returned

### Community 203 - "types/review-queue.ts"
Cohesion: 0.26
Nodes (10): Review queue, listReviewQueue(), request(), ReviewQueueParams, QueueQuery, QUEUE_STATUSES, QueueStatus, ReviewQueueItem (+2 more)

### Community 204 - "stand-in-candidates/route.test.ts"
Cohesion: 0.29
Nodes (6): candidates, ctx, get(), HOLDERS, mocks, syllabus

### Community 205 - "justifications/route.test.ts"
Cohesion: 0.22
Nodes (6): EMC, get(), IT, LIST, mocks, N

### Community 207 - "program-reviewer/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 208 - "co-author-candidates/route.test.ts"
Cohesion: 0.33
Nodes (4): candidates, ctx, mocks, syllabus

### Community 210 - "school-year/route.test.ts"
Cohesion: 0.29
Nodes (4): forbidden(), listResult, mocks, rows

### Community 211 - "forms/justification.ts"
Cohesion: 0.60
Nodes (4): buildJustificationLetter(), JUSTIFICATION_TEMPLATE, letterDate(), SEMESTERS

### Community 213 - "syllabus/route.test.ts"
Cohesion: 0.33
Nodes (3): input, mocks, openTerm

### Community 214 - "school-year/[id]/route.ts"
Cohesion: 0.22
Nodes (12): DELETE(), GET(), PATCH(), RouteContext, GET(), POST(), DEPENDENTS, describeSchoolYearDependents() (+4 more)

### Community 216 - "review-queue/route.test.ts"
Cohesion: 0.33
Nodes (5): COVERS, get(), mocks, STAND_INS, VERSIONS

## Knowledge Gaps
- **10 isolated node(s):** `RFC-4180`, `Org chain (campus, college, department, program)`, `Scoped list visibility (lib/org-visibility.ts)`, `Plain CRUD entities (campus, college, department, program, user)`, `Advisory PDF checks (informational only)` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1181 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **73 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `syllabus/[id]/route.ts`, `dashboard-scope.ts`, `college-manager.tsx`, `lib/syllabus-review.ts`, `validators/user.ts`, `course-modal.tsx`, `Package & Tooling Config`, `createAdminPb`, `mock-auth.ts`, `getCurrentUser`, `mockAuth`, `lib/auth.ts`, `pocketbase`, `department-head/route.ts`, `Faculty UI`, `lib/prospectus-duplicate.ts`, `capability-rules.ts`, `pocketbase`, `login/route.ts`, `export/route.ts`, `VPAA UI`, `vpaa/route.ts`, `auth-client.ts`, `dean-manager.tsx`, `pocketbase.ts`, `faculty/route.test.ts`, `getUserRoles`, `types/notification.ts`, `signed-copy/route.ts`, `lib/dashboard.ts`, `register/page.tsx`, `course/route.test.ts`, `export.ts`, `dashboard-manager.tsx`, `lib/review-queue.ts`, `signed-copy/route.test.ts`, `citl-director/route.ts`, `vitest`, `prospectus-item/[id]/route.ts`, `syllabus-detail.tsx`, `types/roles.ts`, `syllabus-manager.tsx`, `review/route.ts`, `user-manager.tsx`, `users.ts`, `[code]/page.tsx`, `dean/route.ts`, `reference-manager.tsx`, `org-visibility.ts`, `lib/justification.ts`, `dependencies`, `term/[id]/route.ts`, `revise-workspace.tsx`, `Phase 5: Visibility and communication`, `index.ts`, `user/[id]/route.ts`, `Phase 3: Review engine and forms`, `prospectus/route.test.ts`, `app-header.tsx`, `program-join-request-manager.tsx`, `faculty/[id]/route.ts`, `[id]/form17/route.test.ts`, `register/route.ts`, `[pointId]/route.ts`, `[pointId]/route.ts`, `program-join-request/[id]/route.test.ts`, `program-join-request/route.test.ts`, `stand-in/route.test.ts`, `requireUserMock`, `Phase 6: Hardening`, `program-reviewer/route.ts`, `review/route.test.ts`, `user/route.test.ts`, `citl-director/route.test.ts`, `college/route.test.ts`, `fdis-chair/route.test.ts`, `scope/route.test.ts`, `vpaa/route.test.ts`, `export/form18/route.test.ts`, `duplicate/route.test.ts`, `[id]/form18/route.test.ts`, `syllabus-reference/route.test.ts`, `from-previous/route.test.ts`, `resubmit/route.test.ts`, `stand-in-candidates/route.test.ts`, `justifications/route.test.ts`, `program-reviewer/route.test.ts`, `co-author-candidates/route.test.ts`, `school-year/route.test.ts`, `syllabus/route.test.ts`, `school-year/[id]/route.ts`, `review-queue/route.test.ts`?**
  _High betweenness centrality (0.170) - this node is a cross-community bridge._
- **Are the 79 inferred relationships involving `createAdminPb()` (e.g. with `audit/route.test.ts` and `register/route.test.ts`) actually correct?**
  _`createAdminPb()` has 79 INFERRED edges - model-reasoned connections that need verification._
- **What connects `RFC-4180`, `Org chain (campus, college, department, program)`, `Scoped list visibility (lib/org-visibility.ts)` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dashboard-scope.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08708708708708708 - nodes in this community are weakly interconnected._
- **Why does `pocketbase` connect `pocketbase` to `syllabus/[id]/route.ts`, `react`, `college-manager.tsx`, `dependencies`, `lib/justification.ts`, `course-modal.tsx`, `Package & Tooling Config`, `formatDate`, `index.ts`, `pocketbase`, `timeline/route.ts`, `types/college.ts`, `react`, `department-head/route.ts`, `Faculty UI`, `program-join-request-manager.tsx`, `lib/prospectus-duplicate.ts`, `pocketbase`, `login/route.ts`, `form18-panel.tsx`, `VPAA UI`, `register/route.ts`, `Program Chair UI`, `[pointId]/route.ts`, `dean-manager.tsx`, `vpaa/route.ts`, `audit-log.test.ts`, `pocketbase.ts`, `Syllabus`, `approval-verify.ts`, `Phase 6: Hardening`, `types/notification.ts`, `notifications.ts`, `lib/dashboard.ts`, `program-reviewer-manager.tsx`, `signed-copy/route.ts`, `types/syllabus.ts`, `syllabus-client.ts`, `getUserRoles`, `helpers.ts`, `types/term.ts`, `dashboard-manager.tsx`, `program-reviewer/route.ts`, `lib/review-queue.ts`, `signed-copy/route.test.ts`, `citl-director/route.ts`, `vitest`, `prospectus-client.ts`, `syllabus-manager.tsx`, `validators/syllabus-reference.ts`, `audit-phase-a.ts`, `types/review-queue.ts`, `school-year/[id]/route.ts`, `review/route.ts`, `term-manager.tsx`, `user-manager.tsx`, `dean/route.ts`, `reference-manager.tsx`, `pocketbase`, `types/prospectus-item.ts`, `05-a11y.spec.ts`, `dean-manager.tsx`?**
  _High betweenness centrality (0.163) - this node is a cross-community bridge._
- **Are the 20 inferred relationships involving `handlePbError()` (e.g. with `Testing` and `Testing`) actually correct?**
  _`handlePbError()` has 20 INFERRED edges - model-reasoned connections that need verification._
- **Should `Project Docs & Domain Rules` be split into smaller, more focused modules?**
  _Cohesion score 0.057971014492753624 - nodes in this community are weakly interconnected._