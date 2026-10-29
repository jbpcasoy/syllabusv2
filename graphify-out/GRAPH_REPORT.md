# Graph Report - syllabusv2  (2026-10-29)

## Corpus Check
- 662 files · ~306,550 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 4, .ico 1, .css 1)

## Summary
- 3380 nodes · 10645 edges · 220 communities (146 shown, 74 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 331 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6be64e02`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- reference-manager.tsx
- dashboard-scope.ts
- react
- college-manager.tsx
- lib/syllabus-review.ts
- Project Docs & Domain Rules
- validators/user.ts
- course-modal.tsx
- Package & Tooling Config
- export/form18/route.ts
- handlePbError
- mock-auth.ts
- getCurrentUser
- global-setup.ts
- mockAuth
- resolveSyllabusAccess
- pocketbase
- timeline/route.ts
- vpaa/route.ts
- department-head-manager.tsx
- react
- Faculty UI
- lib/prospectus-duplicate.ts
- capability-rules.ts
- index.ts
- next
- export/route.ts
- VPAA UI
- capabilities.ts
- Program Chair UI
- auth-client.ts
- dean-manager.tsx
- TypeScript Config
- resubmit/route.ts
- authorize
- school-year/[id]/route.ts
- signed-copy/route.ts
- types/notification.ts
- lib/dashboard.ts
- [id]/justification/route.ts
- lib/dashboard.test.ts
- program-reviewer-manager.tsx
- types/dashboard.ts
- types/syllabus.ts
- register/page.tsx
- course/route.test.ts
- helpers.ts
- fdis-chair/route.ts
- dashboard-manager.tsx
- Enhanced OBE Syllabus on `[FILL IN: course name]`
- lib/review-queue.ts
- signed-copy/route.test.ts
- citl-director/route.ts
- citl-director/route.ts
- pocketbase
- prospectus-client.ts
- prospectus-item/[id]/route.ts
- syllabus-detail.tsx
- types/roles.ts
- syllabus-manager.tsx
- PostCSS Config
- lib/justification.test.ts
- types/term.ts
- user-manager.tsx
- program-chair/route.ts
- users.ts
- [code]/page.tsx
- dean/route.ts
- lib/syllabus-reference.ts
- review-workspace.tsx
- pocketbase
- Syllabus Development Guidelines
- syllabus-workflow.ts
- types/prospectus-item.ts
- 05-a11y.spec.ts
- SyllabusResponse
- dean-manager.tsx
- org-visibility.ts
- scripts
- validators/dashboard.ts
- dependencies
- export/form17/route.ts
- revise-workspace.tsx
- Phase 5: Visibility and communication
- Retention policy
- export/form18/route.ts
- Criteria
- campus/[id]/route.ts
- Phase 3: Review engine and forms
- 3. Letter Body (in order, top to bottom)
- README.md
- CITL Syllabus Review Guide (Instructions for Part B)
- prospectus/route.test.ts
- [id]/form18/route.ts
- overdue-badge.tsx
- program-join-request-manager.tsx
- form18-panel.tsx
- app-shell.tsx
- term/[id]/route.ts
- dean/route.test.ts
- program-chair/route.test.ts
- [pointId]/route.ts
- [pointId]/route.ts
- types/form18.ts
- prospectus-item/route.test.ts
- term/route.test.ts
- stand-in/route.test.ts
- next
- review/route.ts
- Phase 6: Hardening
- Feature walkthrough
- types/justification.ts
- program-reviewer/route.ts
- faculty/route.test.ts
- syllabus-client.ts
- [versionId]/file/route.test.ts
- form17-view.tsx
- citl-director/route.test.ts
- program-reviewer/route.test.ts
- user/route.test.ts
- Phase 2: Syllabus submission
- vitest
- vpaa/route.test.ts
- signed-copy-panel.tsx
- review-queue.test.ts
- college/route.test.ts
- syllabus-reference/route.test.ts
- lead/route.test.ts
- resubmit/route.test.ts
- register/page.tsx
- audit-phase-a.ts
- program-join-request/route.test.ts
- dashboard-aggregate.test.ts
- course/[id]/route.test.ts
- approval-code.ts
- duplicate/route.test.ts
- Schema changes (to apply to `pb_schema.json`)
- options/route.test.ts
- transition
- school-year/route.test.ts
- forms/justification.ts
- [id]/justification/route.test.ts
- dean/[id]/route.test.ts
- lead-candidates/route.test.ts
- syllabus-reference/[id]/route.test.ts
- review-queue/route.test.ts
- term/[id]/route.test.ts
- approval-verify.test.ts

## God Nodes (most connected - your core abstractions)
1. `createAdminPb()` - 350 edges
2. `handlePbError()` - 250 edges
3. `next` - 234 edges
4. `requireUser()` - 223 edges
5. `vitest` - 154 edges
6. `pocketbase` - 137 edges
7. `getUserRoles` - 127 edges
8. `mockAuth()` - 126 edges
9. `react` - 112 edges
10. `@headlessui/react` - 95 edges

## Surprising Connections (you probably didn't know these)
- `Deadlines` --references--> `ReviewQueueItem`  [INFERRED]
  docs/specs/phase-5-visibility.md → types/review-queue.ts
- `Proposals (accept or amend before task 1)` --references--> `justificationScope()`  [INFERRED]
  docs/specs/phase-5-visibility.md → lib/dashboard-scope.ts
- `Timeline` --references--> `resolveSyllabusAccess()`  [INFERRED]
  docs/specs/phase-4-reviewer-experience.md → lib/syllabus.ts
- `Definitions` --references--> `getSyllabusAccess()`  [INFERRED]
  docs/specs/phase-2-syllabus-submission.md → lib/syllabus.ts
- `Part 1 — Admin setup (as `admin`)` --references--> `vpaa()`  [INFERRED]
  docs/feature-walkthrough.md → lib/capability-rules.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Review engine flow (Phase 3)** — agents_syllabus_workflow_state_machine, agents_review_chain, syllabus_review_system_project_plan__v5__syllabus_statuses, syllabus_review_system_project_plan__v5__routing_readiness, agents_proxy_reviewer, agents_approval_reference [EXTRACTED 1.00]
- **University review forms supported by the system** — agents_form17, agents_form18_1, agents_justification_form, syllabus_review_system_project_plan__v5__enhanced_obe_syllabus, syllabus_review_system_project_plan__v5__form_definitions_versioning [EXTRACTED 1.00]
- **Phase A migration from role-based PERMISSIONS to derived-role capabilities** — project_context_users_role_field, project_context_permissions_map, agents_isadmin, agents_getuserroles, agents_capability_authorization [INFERRED 0.85]

## Communities (220 total, 74 thin omitted)

### Community 0 - "reference-manager.tsx"
Cohesion: 0.11
Nodes (30): COPY, DialogAction, ReferenceActionDialog(), handleSubmit(), ReferenceActionDialogProps, ReferenceManager(), ReferenceManagerProps, ReferenceModal() (+22 more)

### Community 1 - "dashboard-scope.ts"
Cohesion: 0.08
Nodes (28): anyOf(), Bind, filterInScope(), justificationScope(), OUT_OF_SCOPE_ERROR, programInScope(), programMatches(), programScopeFilter() (+20 more)

### Community 2 - "react"
Cohesion: 0.14
Nodes (23): DeleteSchoolYearDialog(), handleDelete(), DeleteSchoolYearDialogProps, ModalState, SchoolYearManager(), changed(), SchoolYearManagerProps, SchoolYearModal() (+15 more)

### Community 3 - "college-manager.tsx"
Cohesion: 0.19
Nodes (18): CollegeManager(), ModalState, CollegeModal(), handleSubmit(), CollegeModalMode, CollegeModalProps, Detail(), TITLES (+10 more)

### Community 4 - "lib/syllabus-review.ts"
Cohesion: 0.11
Nodes (30): GET(), notFound(), PUT(), RouteContext, Authors, canDesignate(), ChainHolders, holdersAt() (+22 more)

### Community 5 - "Project Docs & Domain Rules"
Cohesion: 0.06
Nodes (37): AGENTS.md (agent guidance), Approval reference code (SYL-<term>-<seq>-S<stage>), Capability-based authorization (can, requireUser, authorize, canSomewhere), Form 17 (OVPAA-F-INS-017) review checklist, Form 18-1 (CITL-F-018) review points, getUserRoles resolver (derived roles from assignment records), users.isAdmin (only stored role), Justification Form (missing lead signature) (+29 more)

### Community 6 - "validators/user.ts"
Cohesion: 0.20
Nodes (11): RegisterFormProps, DEFAULT_EMAIL_DOMAINS, ParsedRegistration, parseRegisterInput(), ParseResult, EMAIL, MAX_NAME, MAX_PASSWORD (+3 more)

### Community 7 - "course-modal.tsx"
Cohesion: 0.08
Nodes (39): CourseCombobox(), CourseComboboxProps, CourseOption, CourseModal(), handleSubmit(), CourseModalMode, CourseModalProps, NUMBER_FIELDS (+31 more)

### Community 8 - "Package & Tooling Config"
Cohesion: 0.09
Nodes (27): eslintConfig, devDependencies, @axe-core/playwright@^4.14.0, eslint@^9, eslint-config-next@16.3.6, @playwright/test@^1.64.1, tailwindcss@^4, @tailwindcss/postcss@^4 (+19 more)

### Community 9 - "export/form18/route.ts"
Cohesion: 0.21
Nodes (11): GET(), RouteContext, listApprovals(), loadExportSyllabus(), getForm18(), canViewJustification(), ctx, form18() (+3 more)

### Community 10 - "handlePbError"
Cohesion: 0.06
Nodes (67): GET(), GET(), GET(), GET(), DELETE(), GET(), DELETE(), DELETE() (+59 more)

### Community 11 - "mock-auth.ts"
Cohesion: 0.06
Nodes (29): base, forbidden(), listResult, mocks, rows, unauthorized(), base, listResult (+21 more)

### Community 12 - "getCurrentUser"
Cohesion: 0.08
Nodes (30): CitlDirectorPage(), metadata, CollegePage(), metadata, CoursePage(), metadata, DepartmentHeadPage(), metadata (+22 more)

### Community 13 - "global-setup.ts"
Cohesion: 0.15
Nodes (22): APP_PORT, APP_URL, DIST_DIR, LOCAL_PB, PB_BIN, PB_PORT, PB_URL, ROOT (+14 more)

### Community 14 - "mockAuth"
Cohesion: 0.04
Nodes (40): ctx, forbidden(), mocks, unauthorized(), ctx, forbidden(), mocks, unauthorized() (+32 more)

### Community 15 - "resolveSyllabusAccess"
Cohesion: 0.22
Nodes (11): listSignedCopies(), SIGNED_COPY_EXPAND, signedCopyFileName(), toSignedCopyResponse(), ParseResult, parseSignedCopyReturn(), copy, MAX_SIGNED_COPY_REASON (+3 more)

### Community 16 - "pocketbase"
Cohesion: 0.12
Nodes (24): metadata, ProgramPage(), CourseManagerProps, ModalState, NotificationBellProps, DeleteProgramDialog(), handleDelete(), DeleteProgramDialogProps (+16 more)

### Community 17 - "timeline/route.ts"
Cohesion: 0.14
Nodes (15): Batch, StatusChange, buildTimeline(), name(), Named, TimelineEvent, TimelineVersion, WorkflowState (+7 more)

### Community 18 - "vpaa/route.ts"
Cohesion: 0.22
Nodes (15): PATCH(), RouteContext, GET(), POST(), ParseResult, parseVpaaInput(), parseVpaaUpdate(), getActiveVpaa() (+7 more)

### Community 19 - "department-head-manager.tsx"
Cohesion: 0.20
Nodes (16): DeleteDepartmentHeadDialog(), handleDelete(), DeleteDepartmentHeadDialogProps, DepartmentHeadManager(), toggleActive(), DepartmentHeadManagerProps, DepartmentHeadModal(), handleSubmit() (+8 more)

### Community 20 - "react"
Cohesion: 0.15
Nodes (21): DepartmentPage(), metadata, DeleteDepartmentDialog(), handleDelete(), DeleteDepartmentDialogProps, DepartmentManager(), ModalState, DepartmentModal() (+13 more)

### Community 21 - "Faculty UI"
Cohesion: 0.18
Nodes (17): FacultyPage(), metadata, DeleteFacultyDialog(), handleDelete(), DeleteFacultyDialogProps, FacultyManager(), toggleActive(), FacultyManagerProps (+9 more)

### Community 22 - "lib/prospectus-duplicate.ts"
Cohesion: 0.15
Nodes (20): GET(), POST(), applyDuplicate(), batchSize(), DuplicatePlan, MAX_BATCH_REQUESTS, newRecordId(), planDuplicate() (+12 more)

### Community 23 - "capability-rules.ts"
Cohesion: 0.09
Nodes (19): CAPABILITIES, Capability, Rule, RULES, ScopeChain, QueueQuery, admin, ADMIN_ONLY (+11 more)

### Community 24 - "index.ts"
Cohesion: 0.18
Nodes (16): FORM17_REV04, FORM18_REV01, checklistCriteria(), FORM17_REVISIONS, form17Status(), FORM18_REVISIONS, isLegendCode(), legendEntries() (+8 more)

### Community 25 - "next"
Cohesion: 0.06
Nodes (36): GET(), POST(), POST(), GET(), isDuplicateEmail(), POST(), POST(), GET() (+28 more)

### Community 26 - "export/route.ts"
Cohesion: 0.16
Nodes (19): RFC-4180, csvCell, fileSlug(), toCsv(), completionCsv(), filterOverdue(), JUSTIFICATION_LABELS, justificationsCsv() (+11 more)

### Community 27 - "VPAA UI"
Cohesion: 0.22
Nodes (15): DeleteVpaaDialog(), handleDelete(), DeleteVpaaDialogProps, VpaaManager(), toggleActive(), VpaaManagerProps, VpaaModal(), handleSubmit() (+7 more)

### Community 28 - "capabilities.ts"
Cohesion: 0.11
Nodes (27): GET(), PATCH(), RouteContext, GET(), POST(), metadata, ProgramJoinRequestPage(), metadata (+19 more)

### Community 29 - "Program Chair UI"
Cohesion: 0.16
Nodes (20): DeleteProgramChairDialog(), handleDelete(), DeleteProgramChairDialogProps, ProgramChairManager(), toggleActive(), ProgramChairManagerProps, ProgramChairModal(), handleSubmit() (+12 more)

### Community 30 - "auth-client.ts"
Cohesion: 0.21
Nodes (13): getInitials(), HeaderAuth(), handleLogout(), HeaderAuthProps, LoginInput, logout(), request(), RegisterInput (+5 more)

### Community 31 - "dean-manager.tsx"
Cohesion: 0.15
Nodes (22): CampusPage(), metadata, CampusManager(), formatDate(), ModalState, CampusModal(), handleSubmit(), CampusModalMode (+14 more)

### Community 32 - "TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 33 - "resubmit/route.ts"
Cohesion: 0.12
Nodes (33): POST(), RouteContext, conflict(), notFound(), PUT(), RouteContext, POST(), RouteContext (+25 more)

### Community 34 - "authorize"
Cohesion: 0.22
Nodes (15): PATCH(), RouteContext, GET(), POST(), departmentHasActiveHead(), isHeadOfDepartment(), listDepartmentsHeadedBy(), toDepartmentHeadResponse() (+7 more)

### Community 35 - "school-year/[id]/route.ts"
Cohesion: 0.22
Nodes (13): DELETE(), GET(), PATCH(), RouteContext, GET(), POST(), DEPENDENTS, describeSchoolYearDependents() (+5 more)

### Community 36 - "signed-copy/route.ts"
Cohesion: 0.11
Nodes (33): notFound(), POST(), RouteContext, notFound(), POST(), RouteContext, conflict(), POST() (+25 more)

### Community 37 - "types/notification.ts"
Cohesion: 0.06
Nodes (51): PATCH(), RouteContext, GET(), metadata, RootLayout(), AppHeader(), unreadFor(), AppShell() (+43 more)

### Community 38 - "lib/dashboard.ts"
Cohesion: 0.18
Nodes (24): cap(), GET(), Task plan (one reviewable change each, lint and tests green after each), Testing, aggregate(), allAwaitingSignedCopy(), awaitingSignedCopyQuery(), emptyList() (+16 more)

### Community 39 - "[id]/justification/route.ts"
Cohesion: 0.27
Nodes (15): conflict(), GET(), load(), notFound(), PATCH(), PUT(), RouteContext, findJustification() (+7 more)

### Community 40 - "lib/dashboard.test.ts"
Cohesion: 0.22
Nodes (8): loadFilteredPrograms(), toProgramOrg(), scoped(), fakePb(), filter(), IT, N, Options

### Community 41 - "program-reviewer-manager.tsx"
Cohesion: 0.20
Nodes (17): DeleteProgramReviewerDialog(), handleDelete(), DeleteProgramReviewerDialogProps, ProgramReviewerManager(), toggleActive(), ProgramReviewerManagerProps, ProgramReviewerModal(), handleSubmit() (+9 more)

### Community 42 - "types/dashboard.ts"
Cohesion: 0.14
Nodes (21): addTally(), blankTally(), byName(), completionRows(), row(), Tally, withRate(), DashboardQuery (+13 more)

### Community 43 - "types/syllabus.ts"
Cohesion: 0.07
Nodes (44): conflict(), PUT(), RouteContext, DELETE(), leadOnly(), notEditable(), notFound(), PATCH() (+36 more)

### Community 44 - "register/page.tsx"
Cohesion: 0.33
Nodes (7): LoginPage(), LoginPageProps, metadata, LoginForm(), handleSubmit(), LoginFormProps, login()

### Community 45 - "course/route.test.ts"
Cohesion: 0.25
Nodes (5): base, forbidden(), listResult, mocks, rows

### Community 46 - "helpers.ts"
Cohesion: 0.34
Nodes (13): adminPb(), answerForm17AllYes(), approveInUi(), auditFor(), createDraft(), getSyllabus(), loadSeed(), ok() (+5 more)

### Community 47 - "fdis-chair/route.ts"
Cohesion: 0.29
Nodes (11): PATCH(), RouteContext, GET(), POST(), getActiveFdisChair(), hasActiveFdisChair(), isFdisChair(), toFdisChairResponse() (+3 more)

### Community 48 - "dashboard-manager.tsx"
Cohesion: 0.12
Nodes (30): DashboardManager(), defaultTerm(), JustificationsPanel(), STATE_STYLES, STATES, daysSince(), ErrorBanner(), ExportLink() (+22 more)

### Community 49 - "Enhanced OBE Syllabus on `[FILL IN: course name]`"
Cohesion: 0.07
Nodes (27): About This File, BUKIDNON STATE UNIVERSITY, Course Information, Creating a syllabus, Differences between the two signatory blocks, Document Structure (in order), Enhanced OBE Syllabus on `[FILL IN: course name]`, Enhanced OBE Syllabus Template (BukSU) (+19 more)

### Community 50 - "lib/review-queue.ts"
Cohesion: 0.19
Nodes (22): GET(), Review queue, Testing, Cover, heldStages(), holdsStageFor(), listAwaitingReviewIds(), loadMyStandIns() (+14 more)

### Community 51 - "signed-copy/route.test.ts"
Cohesion: 0.10
Nodes (15): ctx, download(), mocks, pdf, upload(), ctx, mocks, pdf (+7 more)

### Community 52 - "citl-director/route.ts"
Cohesion: 0.15
Nodes (20): CitlDirectorManager(), toggleActive(), CitlDirectorManagerProps, CitlDirectorModal(), handleSubmit(), CitlDirectorModalProps, DeleteCitlDirectorDialog(), handleDelete() (+12 more)

### Community 53 - "citl-director/route.ts"
Cohesion: 0.13
Nodes (26): DELETE(), PATCH(), RouteContext, POST(), DELETE(), GET(), PATCH(), RouteContext (+18 more)

### Community 54 - "pocketbase"
Cohesion: 0.19
Nodes (14): listStandInCandidates(), listStandIns(), STAND_IN_EXPAND, toStandInResponse(), isStage(), ParseResult, parseStandInInput(), fakePb() (+6 more)

### Community 55 - "prospectus-client.ts"
Cohesion: 0.12
Nodes (24): DeleteProspectusDialog(), handleDelete(), DeleteProspectusDialogProps, DuplicateProspectusDialog(), handleConfirm(), DuplicateProspectusDialogProps, ItemList(), ModalState (+16 more)

### Community 56 - "prospectus-item/[id]/route.ts"
Cohesion: 0.19
Nodes (21): GET(), PATCH(), RouteContext, GET(), POST(), ProspectusItemListParams, PROSPECTUS_ITEM_EXPAND, toProspectusItemResponse() (+13 more)

### Community 57 - "syllabus-detail.tsx"
Cohesion: 0.10
Nodes (28): metadata, PageProps, SyllabusDetailPage(), CoAuthorPicker(), CoAuthorPickerProps, CoAuthorsPanel(), save(), CoAuthorsPanelProps (+20 more)

### Community 58 - "types/roles.ts"
Cohesion: 0.19
Nodes (7): mocks, mocks, USER, mocks, hasAnyRole(), NO_ROLES, roleLabels()

### Community 59 - "syllabus-manager.tsx"
Cohesion: 0.08
Nodes (31): metadata, ReviewQueuePage(), NeedsProxyPanel(), ProgramFilterCombobox(), ProgramFilterComboboxProps, ProgramOption, age(), ReviewQueueManager() (+23 more)

### Community 110 - "lib/justification.test.ts"
Cohesion: 0.20
Nodes (9): ensureBasedOn(), userNames(), findPreviousSyllabus(), previousSchoolYearLabel(), fakePb(), filter(), Handlers, pbWith() (+1 more)

### Community 111 - "types/term.ts"
Cohesion: 0.12
Nodes (28): DeleteTermDialog(), handleDelete(), DeleteTermDialogProps, ModalState, TermManager(), toggleOpen(), TermManagerProps, TermModal() (+20 more)

### Community 112 - "user-manager.tsx"
Cohesion: 0.13
Nodes (24): DeleteUserDialog(), handleDelete(), DeleteUserDialogProps, describeAccess(), KIND_LABELS, ModalState, UserManager(), UserManagerProps (+16 more)

### Community 113 - "program-chair/route.ts"
Cohesion: 0.31
Nodes (10): PATCH(), RouteContext, POST(), isChairOfProgram(), listProgramsChairedBy(), programHasActiveChair(), toProgramChairResponse(), parseProgramChairInput() (+2 more)

### Community 114 - "users.ts"
Cohesion: 0.15
Nodes (19): DELETE(), GET(), PATCH(), RouteContext, GET(), GET(), POST(), avatarUrl() (+11 more)

### Community 115 - "[code]/page.tsx"
Cohesion: 0.21
Nodes (10): ACTING_AS_LABELS, metadata, PageProps, Row(), VerifyApprovalPage(), metadata, VerifyPage(), VerifyForm() (+2 more)

### Community 118 - "dean/route.ts"
Cohesion: 0.12
Nodes (23): DELETE(), GET(), PATCH(), RouteContext, GET(), POST(), PATCH(), RouteContext (+15 more)

### Community 119 - "lib/syllabus-reference.ts"
Cohesion: 0.07
Nodes (57): PATCH(), RouteContext, GET(), POST(), POST(), ReviewWithExpand, isFacultyOfProgram(), AvailableList (+49 more)

### Community 120 - "review-workspace.tsx"
Cohesion: 0.10
Nodes (22): metadata, PageProps, SyllabusReviewPage(), Draft, draftFrom(), Form17Panel(), handleSave(), Form17PanelProps (+14 more)

### Community 121 - "pocketbase"
Cohesion: 0.15
Nodes (20): FdisChairPage(), metadata, DeleteFdisChairDialog(), handleDelete(), DeleteFdisChairDialogProps, FdisChairManager(), toggleActive(), FdisChairManagerProps (+12 more)

### Community 122 - "Syllabus Development Guidelines"
Cohesion: 0.08
Nodes (23): 10. Syllabus Table Format, 11. Writing Good Outcomes, 12. Syllabus Creation Workflow, 13. Institutional Review Process, 14. Validation Checklist, 15. Output Behavior for Claude, 1. Role and Scope, 2. Bloom's Taxonomy Reference (+15 more)

### Community 123 - "syllabus-workflow.ts"
Cohesion: 0.12
Nodes (19): ApproveEvent, FileEvent, INITIAL_STATE, RejectScanEvent, ResubmitEvent, ReturnEvent, RoutingFacts, SubmitEvent (+11 more)

### Community 124 - "types/prospectus-item.ts"
Cohesion: 0.13
Nodes (20): DeleteProspectusItemDialog(), handleDelete(), DeleteProspectusItemDialogProps, itemProspectusLabel(), ModalState, ProspectusItemManager(), ProspectusItemManagerProps, prospectusLabel() (+12 more)

### Community 125 - "05-a11y.spec.ts"
Cohesion: 0.25
Nodes (6): PAGES, TAGS, PASSWORD, findSyllabusId(), PEOPLE, Person

### Community 126 - "SyllabusResponse"
Cohesion: 0.09
Nodes (26): DeleteSyllabusDialog(), handleDelete(), DeleteSyllabusDialogProps, by(), currentLine(), describeEntry(), DOT, stageName() (+18 more)

### Community 127 - "dean-manager.tsx"
Cohesion: 0.14
Nodes (21): DeanPage(), metadata, DeanManager(), toggleActive(), DeanManagerProps, DeanModal(), handleSubmit(), DeanModalProps (+13 more)

### Community 128 - "org-visibility.ts"
Cohesion: 0.07
Nodes (39): DELETE(), GET(), PATCH(), RouteContext, GET(), POST(), DELETE(), GET() (+31 more)

### Community 129 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, audit:phase-a, build, dev, lint, pb, start, test (+1 more)

### Community 130 - "validators/dashboard.ts"
Cohesion: 0.16
Nodes (14): GET(), listJustifications(), paging(), resolveScopedPrograms(), scopeIsEmpty(), parseDashboardQuery(), parseJustificationState(), EMC (+6 more)

### Community 131 - "dependencies"
Cohesion: 0.29
Nodes (7): dependencies, @headlessui/react@^2.2.10, next@16.3.6, pocketbase@^0.28.1, react@19.2.8, react-dom@19.2.8, react-dom

### Community 132 - "export/form17/route.ts"
Cohesion: 0.12
Nodes (26): GET(), notFound(), RouteContext, Batch, form17Facts(), listForm17Answers(), loadForm17(), newRecordId() (+18 more)

### Community 133 - "revise-workspace.tsx"
Cohesion: 0.12
Nodes (23): metadata, PageProps, SyllabusRevisePage(), PdfPane(), PdfPaneProps, ResubmitSyllabusDialog(), handleResubmit(), ResubmitSyllabusDialogProps (+15 more)

### Community 134 - "Phase 5: Visibility and communication"
Cohesion: 0.10
Nodes (16): Boundaries, Dashboards, Deadlines, Decisions (2026-10-28), Objective, Out of scope, Phase 5: Visibility and communication, Proposals (accept or amend before task 1) (+8 more)

### Community 139 - "Retention policy"
Cohesion: 0.33
Nodes (5): Changing this policy, Removing records, Retention policy, Rule, Storage growth

### Community 140 - "export/form18/route.ts"
Cohesion: 0.27
Nodes (10): ApprovalStamp, buildForm17Export(), buildForm181Export(), ExportFormMeta, ExportSyllabus, INSTITUTION, JustificationState, meta() (+2 more)

### Community 141 - "Criteria"
Cohesion: 0.12
Nodes (16): A. Preliminaries, B. Vision, Mission, Goals, Objectives, and Outcomes, C. Course Content, Closing Section, Criteria, D. Assessment, E. Learning Modality and Methods, F. Resources, Required Readings, and References (+8 more)

### Community 142 - "campus/[id]/route.ts"
Cohesion: 0.19
Nodes (12): DELETE(), GET(), PATCH(), RouteContext, GET(), POST(), parseCampusInput(), ParseResult (+4 more)

### Community 143 - "Phase 3: Review engine and forms"
Cohesion: 0.20
Nodes (10): Accepted 2026-10-27, API, Capabilities, Decisions (2026-10-26), Justification, Out of scope, Phase 3: Review engine and forms, UI (minimal; Phase 4 polishes) (+2 more)

### Community 144 - "3. Letter Body (in order, top to bottom)"
Cohesion: 0.12
Nodes (15): 1. Document Overview, 2. Letterhead (fixed, centered at top), 3.1 Date — VARIABLE, 3.2 Recipient block — FIXED, 3.3 Salutation — FIXED, 3.4 Opening paragraph — PARTLY VARIABLE, 3.5 Table — VARIABLE (see Section 4), 3.6 Closing — FIXED (+7 more)

### Community 146 - "CITL Syllabus Review Guide (Instructions for Part B)"
Cohesion: 0.14
Nodes (13): A. Format and House Style, B. Alignment (Coherence and Logical Connection Between Learning Plan Components), C. Use of Behavioral Verbs (Bloom's Taxonomy), CITL Syllabus Review Guide (Instructions for Part B), CITL Syllabus Review: Suggestions and Action Taken (Form 18-1), D. Gradation of COs and SLOs, E. Supplementary Documentation, F. Inclusion of Prescribed Institutional Forms (+5 more)

### Community 147 - "prospectus/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 148 - "[id]/form18/route.ts"
Cohesion: 0.15
Nodes (16): notFound(), POST(), RouteContext, listPoints(), loadForm18(), person(), POINT_EXPAND, toPointResponse() (+8 more)

### Community 149 - "overdue-badge.tsx"
Cohesion: 0.25
Nodes (15): Badge(), plural(), ReviewOverdueBadge(), reviewOverdueDays(), SubmissionOverdueBadge(), submissionOverdueDays(), TermDeadlines, daysOverdue() (+7 more)

### Community 150 - "program-join-request-manager.tsx"
Cohesion: 0.08
Nodes (42): DELETE(), notPending(), PATCH(), RouteContext, ProgramJoinRequestManager(), approve(), reloadAfterRowLeft(), ProgramJoinRequestManagerProps (+34 more)

### Community 151 - "form18-panel.tsx"
Cohesion: 0.13
Nodes (19): Form18Panel(), run(), Form18PanelProps, NewPointForm(), PointForm(), PointFormProps, PointRow(), PointRowProps (+11 more)

### Community 152 - "app-shell.tsx"
Cohesion: 0.31
Nodes (6): Sidebar(), SidebarProps, canAnywhere(), getNavItems(), NAV_ITEMS, NavItem

### Community 153 - "term/[id]/route.ts"
Cohesion: 0.33
Nodes (9): GET(), PATCH(), RouteContext, GET(), POST(), termHasRefSeqs(), toTermRecord(), toTermResponse() (+1 more)

### Community 155 - "dean/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 156 - "program-chair/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 157 - "[pointId]/route.ts"
Cohesion: 0.16
Nodes (20): conflict(), DELETE(), load(), Loaded, notFound(), PATCH(), reviewerCheck(), RouteContext (+12 more)

### Community 158 - "[pointId]/route.ts"
Cohesion: 0.27
Nodes (9): Task plan (one reviewable change each, lint and tests green after each), Point, PointAction, pointCodeError(), pointFacts, Routed, partForStage(), inReview() (+1 more)

### Community 159 - "types/form18.ts"
Cohesion: 0.29
Nodes (10): isObject(), parsePointInput(), parsePointUpdate(), ParseResult, text(), MAX_PAGE_NUMBER, MAX_POINT_TEXT, POINT_STATUSES (+2 more)

### Community 160 - "prospectus-item/route.test.ts"
Cohesion: 0.25
Nodes (5): base, forbidden(), listResult, mocks, rows

### Community 161 - "term/route.test.ts"
Cohesion: 0.25
Nodes (5): base, forbidden(), listResult, mocks, rows

### Community 162 - "stand-in/route.test.ts"
Cohesion: 0.22
Nodes (4): ctx, HOLDERS, ITEMS, mocks

### Community 163 - "next"
Cohesion: 0.06
Nodes (21): ctx, draft, mocks, ctx, mocks, patch(), SCOPE, candidates (+13 more)

### Community 164 - "review/route.ts"
Cohesion: 0.08
Nodes (32): conflict(), conflictMessage(), POST(), RouteContext, VerifiedApproval, DecisionConflict, DecisionInput, ensureRefSeq() (+24 more)

### Community 165 - "Phase 6: Hardening"
Cohesion: 0.05
Nodes (52): AuditPage(), metadata, ACTION_LABELS, AuditManager(), Accessibility pass, Audit module, Boundaries, Decisions (2026-10-28) (+44 more)

### Community 166 - "Feature walkthrough"
Cohesion: 0.20
Nodes (18): 0. Before you start, 1. Cast, Feature walkthrough, Part 10 — Negative checks, Part 11 — Keyboard and accessibility pass, Part 1 — Admin setup (as `admin`), Part 2 — Org chain and roles, Part 3 — Registration and joining a program (+10 more)

### Community 167 - "types/justification.ts"
Cohesion: 0.27
Nodes (10): isObject(), parseJustificationInput(), parseJustificationReturn(), ParseResult, JUSTIFICATION_STATUSES, JustificationEntry, JustificationInput, JustificationReturnInput (+2 more)

### Community 169 - "program-reviewer/route.ts"
Cohesion: 0.28
Nodes (12): PATCH(), RouteContext, GET(), POST(), programHasActiveReviewer(), toProgramReviewerResponse(), parseProgramReviewerInput(), parseProgramReviewerUpdate() (+4 more)

### Community 170 - "faculty/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 171 - "syllabus-client.ts"
Cohesion: 0.12
Nodes (35): metadata, PageProps, SyllabusFormsPage(), PrintableForms(), JustificationPanel(), adopt(), handlePreview(), handleSave() (+27 more)

### Community 173 - "[versionId]/file/route.test.ts"
Cohesion: 0.33
Nodes (4): ctx, mocks, syllabus, version

### Community 174 - "form17-view.tsx"
Cohesion: 0.32
Nodes (9): Form17View(), Line(), Form181View(), PointsTable(), ACTING_AS, FormHeader(), SignatureLines(), ExportPoint (+1 more)

### Community 175 - "citl-director/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 176 - "program-reviewer/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 177 - "user/route.test.ts"
Cohesion: 0.29
Nodes (4): base, listResult, mocks, users

### Community 178 - "Phase 2: Syllabus submission"
Cohesion: 0.20
Nodes (10): API, Capabilities, Decisions (2026-10-26), Definitions, Out of scope, Phase 2: Syllabus submission, Schema changes (to apply to `pb_schema.json`), UI (+2 more)

### Community 190 - "vitest"
Cohesion: 0.06
Nodes (19): vitest, mocks, listResult, mocks, candidates, ctx, mocks, syllabus (+11 more)

### Community 191 - "vpaa/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 192 - "signed-copy-panel.tsx"
Cohesion: 0.21
Nodes (14): SignedCopyPanel(), handleReturn(), handleUpload(), run(), SignedCopyPanelProps, UploadVersionModal(), handleSubmit(), UploadVersionModalProps (+6 more)

### Community 194 - "review-queue.test.ts"
Cohesion: 0.22
Nodes (8): ALL_ROLES, Cover, Draft, fakePb(), filter(), needsProxyPb(), pb, Row

### Community 195 - "college/route.test.ts"
Cohesion: 0.33
Nodes (3): base, listResult, mocks

### Community 197 - "syllabus-reference/route.test.ts"
Cohesion: 0.25
Nodes (5): input, mocks, SCOPE, source, term

### Community 198 - "lead/route.test.ts"
Cohesion: 0.25
Nodes (4): ctx, mocks, put(), SCOPE

### Community 199 - "resubmit/route.test.ts"
Cohesion: 0.29
Nodes (5): ctx, HOLDERS, mocks, resubmit(), returned

### Community 200 - "register/page.tsx"
Cohesion: 0.31
Nodes (8): metadata, RegisterPage(), RegisterPageProps, RegisterForm(), handleSubmit(), register(), safeRedirect(), parseDomainList()

### Community 201 - "audit-phase-a.ts"
Cohesion: 0.33
Nodes (6): AssignmentRow, ASSIGNMENTS, main(), requireEnv(), UNASSIGNED_FILTER, UserRow

### Community 202 - "program-join-request/route.test.ts"
Cohesion: 0.22
Nodes (5): base, data, listResult, mocks, rows

### Community 203 - "dashboard-aggregate.test.ts"
Cohesion: 0.22
Nodes (5): EMC, IT, NO_DEADLINES, NOW, NURSING

### Community 204 - "course/[id]/route.test.ts"
Cohesion: 0.33
Nodes (4): ctx, EXPAND, forbidden(), mocks

### Community 205 - "approval-code.ts"
Cohesion: 0.39
Nodes (6): approvalCode(), ApprovalCodeParts, parseApprovalCode(), SEMESTER_CODES, validStage(), FINAL_STAGE

### Community 206 - "duplicate/route.test.ts"
Cohesion: 0.25
Nodes (4): forbidden(), input, mocks, pb

### Community 207 - "Schema changes (to apply to `pb_schema.json`)"
Cohesion: 0.33
Nodes (6): config, isTokenExpired(), proxy(), PUBLIC_PATHS, Schema changes (to apply to `pb_schema.json`), answer()

### Community 208 - "options/route.test.ts"
Cohesion: 0.40
Nodes (3): base, mocks, users

### Community 209 - "transition"
Cohesion: 0.48
Nodes (7): approve(), fail(), giveBack(), resubmit(), routingError(), submit(), transition()

### Community 210 - "school-year/route.test.ts"
Cohesion: 0.29
Nodes (4): forbidden(), listResult, mocks, rows

### Community 211 - "forms/justification.ts"
Cohesion: 0.24
Nodes (10): metadata, PageProps, SyllabusJustificationLetterPage(), JustificationLetterView(), PrintableJustificationLetter(), buildJustificationLetter(), JUSTIFICATION_TEMPLATE, JustificationLetterData (+2 more)

### Community 212 - "[id]/justification/route.test.ts"
Cohesion: 0.29
Nodes (4): ctx, ENTRIES, mocks, RESPONSE

### Community 213 - "dean/[id]/route.test.ts"
Cohesion: 0.33
Nodes (4): ctx, forbidden(), mocks, unauthorized()

### Community 214 - "lead-candidates/route.test.ts"
Cohesion: 0.33
Nodes (5): candidates, ctx, get(), mocks, syllabus

### Community 215 - "syllabus-reference/[id]/route.test.ts"
Cohesion: 0.33
Nodes (4): ctx, mocks, pending, SCOPE

### Community 216 - "review-queue/route.test.ts"
Cohesion: 0.33
Nodes (5): COVERS, get(), mocks, STAND_INS, VERSIONS

### Community 217 - "term/[id]/route.test.ts"
Cohesion: 0.40
Nodes (3): ctx, forbidden(), mocks

### Community 218 - "approval-verify.test.ts"
Cohesion: 0.67
Nodes (3): fakePb(), filter(), review

## Knowledge Gaps
- **10 isolated node(s):** `RFC-4180`, `Org chain (campus, college, department, program)`, `Scoped list visibility (lib/org-visibility.ts)`, `Plain CRUD entities (campus, college, department, program, user)`, `Advisory PDF checks (informational only)` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1189 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **74 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `pocketbase` connect `Program Chair UI` to `reference-manager.tsx`, `react`, `college-manager.tsx`, `export/form17/route.ts`, `revise-workspace.tsx`, `dependencies`, `course-modal.tsx`, `Package & Tooling Config`, `export/form18/route.ts`, `campus/[id]/route.ts`, `resolveSyllabusAccess`, `pocketbase`, `timeline/route.ts`, `vpaa/route.ts`, `department-head-manager.tsx`, `react`, `Faculty UI`, `program-join-request-manager.tsx`, `[id]/form18/route.ts`, `lib/prospectus-duplicate.ts`, `next`, `term/[id]/route.ts`, `VPAA UI`, `capabilities.ts`, `[pointId]/route.ts`, `auth-client.ts`, `dean-manager.tsx`, `types/form18.ts`, `resubmit/route.ts`, `authorize`, `school-year/[id]/route.ts`, `review/route.ts`, `Phase 6: Hardening`, `lib/dashboard.ts`, `types/notification.ts`, `signed-copy/route.ts`, `program-reviewer-manager.tsx`, `lib/dashboard.test.ts`, `syllabus-client.ts`, `types/syllabus.ts`, `types/justification.ts`, `helpers.ts`, `program-reviewer/route.ts`, `dashboard-manager.tsx`, `lib/review-queue.ts`, `signed-copy/route.test.ts`, `citl-director/route.ts`, `citl-director/route.ts`, `pocketbase`, `prospectus-client.ts`, `prospectus-item/[id]/route.ts`, `syllabus-manager.tsx`, `vitest`, `review-queue.test.ts`, `audit-phase-a.ts`, `approval-verify.test.ts`, `lib/justification.test.ts`, `types/term.ts`, `user-manager.tsx`, `dean/route.ts`, `lib/syllabus-reference.ts`, `pocketbase`, `types/prospectus-item.ts`, `05-a11y.spec.ts`, `dean-manager.tsx`?**
  _High betweenness centrality (0.196) - this node is a cross-community bridge._
- **Are the 80 inferred relationships involving `createAdminPb()` (e.g. with `audit/route.test.ts` and `register/route.test.ts`) actually correct?**
  _`createAdminPb()` has 80 INFERRED edges - model-reasoned connections that need verification._
- **What connects `RFC-4180`, `Org chain (campus, college, department, program)`, `Scoped list visibility (lib/org-visibility.ts)` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `reference-manager.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10897435897435898 - nodes in this community are weakly interconnected._
- **Why does `next` connect `next` to `reference-manager.tsx`, `dashboard-scope.ts`, `lib/syllabus-review.ts`, `validators/user.ts`, `Package & Tooling Config`, `export/form18/route.ts`, `handlePbError`, `mock-auth.ts`, `getCurrentUser`, `mockAuth`, `pocketbase`, `vpaa/route.ts`, `react`, `Faculty UI`, `lib/prospectus-duplicate.ts`, `capabilities.ts`, `auth-client.ts`, `dean-manager.tsx`, `resubmit/route.ts`, `authorize`, `school-year/[id]/route.ts`, `signed-copy/route.ts`, `types/notification.ts`, `lib/dashboard.ts`, `[id]/justification/route.ts`, `types/syllabus.ts`, `register/page.tsx`, `course/route.test.ts`, `fdis-chair/route.ts`, `dashboard-manager.tsx`, `lib/review-queue.ts`, `signed-copy/route.test.ts`, `citl-director/route.ts`, `prospectus-item/[id]/route.ts`, `syllabus-detail.tsx`, `types/roles.ts`, `syllabus-manager.tsx`, `program-chair/route.ts`, `users.ts`, `[code]/page.tsx`, `dean/route.ts`, `lib/syllabus-reference.ts`, `review-workspace.tsx`, `pocketbase`, `dean-manager.tsx`, `org-visibility.ts`, `validators/dashboard.ts`, `dependencies`, `export/form17/route.ts`, `revise-workspace.tsx`, `Phase 5: Visibility and communication`, `campus/[id]/route.ts`, `prospectus/route.test.ts`, `[id]/form18/route.ts`, `program-join-request-manager.tsx`, `app-shell.tsx`, `term/[id]/route.ts`, `dean/route.test.ts`, `program-chair/route.test.ts`, `[pointId]/route.ts`, `prospectus-item/route.test.ts`, `term/route.test.ts`, `stand-in/route.test.ts`, `next`, `review/route.ts`, `Phase 6: Hardening`, `program-reviewer/route.ts`, `faculty/route.test.ts`, `syllabus-client.ts`, `[versionId]/file/route.test.ts`, `citl-director/route.test.ts`, `program-reviewer/route.test.ts`, `user/route.test.ts`, `vitest`, `vpaa/route.test.ts`, `college/route.test.ts`, `syllabus-reference/route.test.ts`, `lead/route.test.ts`, `resubmit/route.test.ts`, `register/page.tsx`, `program-join-request/route.test.ts`, `course/[id]/route.test.ts`, `duplicate/route.test.ts`, `Schema changes (to apply to `pb_schema.json`)`, `options/route.test.ts`, `school-year/route.test.ts`, `forms/justification.ts`, `[id]/justification/route.test.ts`, `dean/[id]/route.test.ts`, `lead-candidates/route.test.ts`, `syllabus-reference/[id]/route.test.ts`, `review-queue/route.test.ts`, `term/[id]/route.test.ts`?**
  _High betweenness centrality (0.143) - this node is a cross-community bridge._
- **Are the 21 inferred relationships involving `handlePbError()` (e.g. with `Testing` and `Testing`) actually correct?**
  _`handlePbError()` has 21 INFERRED edges - model-reasoned connections that need verification._
- **Should `dashboard-scope.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07564102564102564 - nodes in this community are weakly interconnected._