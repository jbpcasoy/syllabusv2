# Graph Report - syllabusv2  (2026-10-29)

## Corpus Check
- 658 files · ~302,089 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 4, .ico 1, .css 1)

## Summary
- 3366 nodes · 10553 edges · 208 communities (135 shown, 73 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 325 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7db54cfc`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- notification-bell.tsx
- dashboard-scope.ts
- react
- college-manager.tsx
- lib/syllabus-review.ts
- Project Docs & Domain Rules
- validators/user.ts
- course-modal.tsx
- Package & Tooling Config
- stand-ins-panel.tsx
- createAdminPb
- mock-auth.ts
- getCurrentUser
- global-setup.ts
- mockAuth
- resolveSyllabusAccess
- pocketbase
- timeline/route.ts
- pocketbase
- UserCombobox
- department-head/route.ts
- Faculty UI
- lib/prospectus-duplicate.ts
- capability-rules.ts
- lib/syllabus-reference.ts
- pocketbase.ts
- export/route.ts
- VPAA UI
- can
- Program Chair UI
- auth-client.ts
- dean-manager.tsx
- TypeScript Config
- faculty/route.ts
- pocketbase.ts
- fdis-chair/route.ts
- getUserRoles
- types/notification.ts
- resubmit/route.ts
- [id]/justification/route.ts
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
- next
- pocketbase
- prospectus-client.ts
- prospectus-item/[id]/route.ts
- syllabus-detail.tsx
- types/roles.ts
- syllabus-manager.tsx
- PostCSS Config
- review/route.ts
- types/term.ts
- user-manager.tsx
- Program
- users.ts
- [code]/page.tsx
- dean/route.ts
- reference-manager.tsx
- review-workspace.tsx
- pocketbase
- Syllabus Development Guidelines
- syllabus-workflow.ts
- types/prospectus-item.ts
- 05-a11y.spec.ts
- Phase 4: Reviewer experience
- dean-manager.tsx
- org-visibility.ts
- scripts
- types/dashboard.ts
- dependencies
- AppUser
- revise-workspace.tsx
- Phase 5: Visibility and communication
- Retention policy
- index.ts
- Criteria
- lib/review-queue.ts
- Phase 3: Review engine and forms
- 3. Letter Body (in order, top to bottom)
- README.md
- CITL Syllabus Review Guide (Instructions for Part B)
- prospectus/route.test.ts
- app-header.tsx
- overdue-badge.tsx
- program-join-request-manager.tsx
- form18-panel.tsx
- canAnywhere
- types/department.ts
- dean/route.test.ts
- program-chair/route.test.ts
- [pointId]/route.ts
- [pointId]/route.ts
- program-join-request/[id]/route.test.ts
- prospectus-item/route.test.ts
- term/route.test.ts
- stand-in/route.test.ts
- requireUserMock
- approval-verify.ts
- Phase 6: Hardening
- Feature walkthrough
- dean/[id]/route.test.ts
- program-reviewer/route.ts
- submit/route.test.ts
- syllabus-client.ts
- [versionId]/file/route.test.ts
- user/route.test.ts
- citl-director/route.test.ts
- college/route.test.ts
- fdis-chair/route.test.ts
- timeline/route.test.ts
- export/form17/route.test.ts
- vpaa/route.test.ts
- export/form18/route.test.ts
- scope.test.ts
- [id]/form18/route.test.ts
- syllabus-reference/route.test.ts
- from-previous/route.test.ts
- audit-phase-a.ts
- next
- types/review-queue.ts
- summary/route.ts
- program-reviewer/route.test.ts
- co-author-candidates/route.test.ts
- school-year/route.test.ts
- forms/justification.ts
- review-queue/route.test.ts

## God Nodes (most connected - your core abstractions)
1. `createAdminPb()` - 347 edges
2. `handlePbError()` - 247 edges
3. `next` - 231 edges
4. `requireUser()` - 221 edges
5. `vitest` - 153 edges
6. `pocketbase` - 137 edges
7. `mockAuth()` - 125 edges
8. `getUserRoles` - 123 edges
9. `react` - 111 edges
10. `@headlessui/react` - 95 edges

## Surprising Connections (you probably didn't know these)
- `Deadlines` --references--> `ReviewQueueItem`  [INFERRED]
  docs/specs/phase-5-visibility.md → types/review-queue.ts
- `Definitions` --references--> `getSyllabusAccess()`  [INFERRED]
  docs/specs/phase-2-syllabus-submission.md → lib/syllabus.ts
- `Accepted 2026-10-27` --references--> `getSyllabusAccess()`  [INFERRED]
  docs/specs/phase-3-review-engine.md → lib/syllabus.ts
- `Timeline` --references--> `resolveSyllabusAccess()`  [INFERRED]
  docs/specs/phase-4-reviewer-experience.md → lib/syllabus.ts
- `Hub (`/syllabus/[id]`)` --references--> `SyllabusVersions()`  [INFERRED]
  docs/specs/phase-4-reviewer-experience.md → components/syllabus/syllabus-versions.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Review engine flow (Phase 3)** — agents_syllabus_workflow_state_machine, agents_review_chain, syllabus_review_system_project_plan__v5__syllabus_statuses, syllabus_review_system_project_plan__v5__routing_readiness, agents_proxy_reviewer, agents_approval_reference [EXTRACTED 1.00]
- **University review forms supported by the system** — agents_form17, agents_form18_1, agents_justification_form, syllabus_review_system_project_plan__v5__enhanced_obe_syllabus, syllabus_review_system_project_plan__v5__form_definitions_versioning [EXTRACTED 1.00]
- **Phase A migration from role-based PERMISSIONS to derived-role capabilities** — project_context_users_role_field, project_context_permissions_map, agents_isadmin, agents_getuserroles, agents_capability_authorization [INFERRED 0.85]

## Communities (208 total, 73 thin omitted)

### Community 0 - "notification-bell.tsx"
Cohesion: 0.18
Nodes (21): metadata, NotificationsPage(), BellIcon(), BellPanel(), markAll(), open(), NotificationBell(), NotificationBellProps (+13 more)

### Community 1 - "dashboard-scope.ts"
Cohesion: 0.06
Nodes (32): anyOf(), Bind, filterInScope(), programInScope(), programMatches(), programScopeFilter(), ScopedPrograms, scopePrograms() (+24 more)

### Community 2 - "react"
Cohesion: 0.10
Nodes (34): DELETE(), GET(), PATCH(), RouteContext, GET(), POST(), DeleteSchoolYearDialog(), handleDelete() (+26 more)

### Community 3 - "college-manager.tsx"
Cohesion: 0.16
Nodes (21): CollegePage(), metadata, CollegeManager(), ModalState, CollegeModal(), handleSubmit(), CollegeModalMode, CollegeModalProps (+13 more)

### Community 4 - "lib/syllabus-review.ts"
Cohesion: 0.22
Nodes (15): Authors, ChainHolders, holdersAt(), isAuthor(), isPersonalReviewer(), isReviewer(), needsStandIn(), resolveActor() (+7 more)

### Community 5 - "Project Docs & Domain Rules"
Cohesion: 0.06
Nodes (37): AGENTS.md (agent guidance), Approval reference code (SYL-<term>-<seq>-S<stage>), Capability-based authorization (can, requireUser, authorize, canSomewhere), Form 17 (OVPAA-F-INS-017) review checklist, Form 18-1 (CITL-F-018) review points, getUserRoles resolver (derived roles from assignment records), users.isAdmin (only stored role), Justification Form (missing lead signature) (+29 more)

### Community 6 - "validators/user.ts"
Cohesion: 0.13
Nodes (17): isDuplicateEmail(), POST(), RegisterFormProps, DEFAULT_EMAIL_DOMAINS, parseDomainList(), ParsedRegistration, parseRegisterInput(), ParseResult (+9 more)

### Community 7 - "course-modal.tsx"
Cohesion: 0.05
Nodes (57): DELETE(), GET(), PATCH(), RouteContext, GET(), POST(), CoursePage(), metadata (+49 more)

### Community 8 - "Package & Tooling Config"
Cohesion: 0.09
Nodes (27): eslintConfig, devDependencies, @axe-core/playwright@^4.14.0, eslint@^9, eslint-config-next@16.3.6, @playwright/test@^1.64.1, tailwindcss@^4, @tailwindcss/postcss@^4 (+19 more)

### Community 9 - "stand-ins-panel.tsx"
Cohesion: 0.31
Nodes (6): StandInPicker(), StandInPickerProps, StandInsPanel(), save(), StandInsPanelProps, setStandIn()

### Community 10 - "createAdminPb"
Cohesion: 0.07
Nodes (75): GET(), DELETE(), GET(), PATCH(), RouteContext, GET(), POST(), DELETE() (+67 more)

### Community 11 - "mock-auth.ts"
Cohesion: 0.07
Nodes (20): evaluateCapability(), base, listResult, mocks, ctx, forbidden(), mocks, ctx (+12 more)

### Community 12 - "getCurrentUser"
Cohesion: 0.09
Nodes (31): CitlDirectorPage(), metadata, DeanPage(), metadata, DepartmentHeadPage(), metadata, FacultyPage(), metadata (+23 more)

### Community 13 - "global-setup.ts"
Cohesion: 0.15
Nodes (22): APP_PORT, APP_URL, DIST_DIR, LOCAL_PB, PB_BIN, PB_PORT, PB_URL, ROOT (+14 more)

### Community 14 - "mockAuth"
Cohesion: 0.05
Nodes (39): ctx, forbidden(), mocks, unauthorized(), ctx, forbidden(), mocks, unauthorized() (+31 more)

### Community 15 - "resolveSyllabusAccess"
Cohesion: 0.11
Nodes (30): GET(), notFound(), POST(), RouteContext, GET(), notFound(), RouteContext, PATCH() (+22 more)

### Community 16 - "pocketbase"
Cohesion: 0.16
Nodes (20): metadata, ProgramPage(), DeleteProgramDialog(), handleDelete(), DeleteProgramDialogProps, ModalState, ProgramManager(), Detail() (+12 more)

### Community 17 - "timeline/route.ts"
Cohesion: 0.17
Nodes (12): buildTimeline(), name(), Named, TimelineEvent, TimelineVersion, base, SYLLABUS_EVENT_TYPES, SyllabusEvent (+4 more)

### Community 18 - "pocketbase"
Cohesion: 0.14
Nodes (14): addAudit(), Batch, Batch, StatusChange, WorkflowState, TARGET, UPLOAD_LIMIT, UPLOAD_WINDOW_MS (+6 more)

### Community 19 - "UserCombobox"
Cohesion: 0.27
Nodes (8): CitlDirectorModalProps, UserCombobox(), UserComboboxProps, VpaaModal(), handleSubmit(), VpaaModalProps, createVpaa(), UserOption

### Community 20 - "department-head/route.ts"
Cohesion: 0.07
Nodes (49): PATCH(), RouteContext, POST(), DepartmentPage(), metadata, DeleteDepartmentDialog(), handleDelete(), DeleteDepartmentDialogProps (+41 more)

### Community 21 - "Faculty UI"
Cohesion: 0.20
Nodes (16): DeleteFacultyDialog(), handleDelete(), DeleteFacultyDialogProps, FacultyManager(), toggleActive(), FacultyManagerProps, FacultyModal(), handleSubmit() (+8 more)

### Community 22 - "lib/prospectus-duplicate.ts"
Cohesion: 0.15
Nodes (20): GET(), POST(), applyDuplicate(), batchSize(), DuplicatePlan, MAX_BATCH_REQUESTS, newRecordId(), planDuplicate() (+12 more)

### Community 23 - "capability-rules.ts"
Cohesion: 0.09
Nodes (16): CAPABILITIES, Capability, Rule, RULES, ScopeChain, admin, ADMIN_ONLY, chair (+8 more)

### Community 24 - "lib/syllabus-reference.ts"
Cohesion: 0.10
Nodes (29): PATCH(), RouteContext, LIVE_REFERENCE_FILTER, REFERENCE_EXPAND, ReferenceActor, referenceTransition, RULES, SourceQuery (+21 more)

### Community 25 - "pocketbase.ts"
Cohesion: 0.18
Nodes (16): POST(), GET(), RouteContext, conflict(), GET(), notFound(), PUT(), RouteContext (+8 more)

### Community 26 - "export/route.ts"
Cohesion: 0.15
Nodes (23): cap(), GET(), RFC-4180, csvCell, fileSlug(), toCsv(), completionCsv(), filterOverdue() (+15 more)

### Community 27 - "VPAA UI"
Cohesion: 0.20
Nodes (15): DeleteVpaaDialog(), handleDelete(), DeleteVpaaDialogProps, VpaaManager(), toggleActive(), VpaaManagerProps, ParseResult, deleteVpaa() (+7 more)

### Community 28 - "can"
Cohesion: 0.23
Nodes (15): GET(), PATCH(), RouteContext, GET(), POST(), can(), PROSPECTUS_EXPAND, toProspectusResponse() (+7 more)

### Community 29 - "Program Chair UI"
Cohesion: 0.16
Nodes (19): DeleteProgramChairDialog(), handleDelete(), DeleteProgramChairDialogProps, ProgramChairManager(), toggleActive(), ProgramChairManagerProps, ProgramChairModal(), handleSubmit() (+11 more)

### Community 30 - "auth-client.ts"
Cohesion: 0.30
Nodes (9): getInitials(), HeaderAuth(), handleLogout(), HeaderAuthProps, LoginInput, logout(), RegisterInput, RegisterResponse (+1 more)

### Community 31 - "dean-manager.tsx"
Cohesion: 0.15
Nodes (21): CampusPage(), metadata, CampusManager(), formatDate(), ModalState, CampusModal(), handleSubmit(), CampusModalMode (+13 more)

### Community 32 - "TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 33 - "faculty/route.ts"
Cohesion: 0.20
Nodes (14): PATCH(), RouteContext, POST(), metadata, SyllabusPage(), isFacultyOfProgram(), listProgramsOfUser(), toFacultyResponse() (+6 more)

### Community 34 - "pocketbase.ts"
Cohesion: 0.05
Nodes (22): ctx, mocks, base, forbidden(), listResult, mocks, rows, unauthorized() (+14 more)

### Community 35 - "fdis-chair/route.ts"
Cohesion: 0.23
Nodes (14): PATCH(), RouteContext, POST(), getActiveFdisChair(), hasActiveFdisChair(), isFdisChair(), toFdisChairResponse(), parseFdisChairInput() (+6 more)

### Community 36 - "getUserRoles"
Cohesion: 0.12
Nodes (32): GET(), notFound(), PUT(), RouteContext, conflict(), POST(), RouteContext, GET() (+24 more)

### Community 37 - "types/notification.ts"
Cohesion: 0.12
Nodes (25): PATCH(), RouteContext, GET(), countUnread(), markAllRead(), NOTIFICATION_EXPAND, ownFilter(), toNotificationResponse() (+17 more)

### Community 38 - "resubmit/route.ts"
Cohesion: 0.11
Nodes (33): POST(), RouteContext, POST(), RouteContext, Notifications, copyForm17(), addNotifications(), Authors (+25 more)

### Community 39 - "[id]/justification/route.ts"
Cohesion: 0.08
Nodes (41): conflict(), GET(), load(), notFound(), PATCH(), PUT(), RouteContext, activeHolderName() (+33 more)

### Community 40 - "lib/dashboard.ts"
Cohesion: 0.15
Nodes (24): Task plan (one reviewable change each, lint and tests green after each), allAwaitingSignedCopy(), awaitingSignedCopyQuery(), emptyList(), justificationRows(), listAwaitingSignedCopy(), listJustifications(), loadFilteredPrograms() (+16 more)

### Community 41 - "program-reviewer-manager.tsx"
Cohesion: 0.22
Nodes (15): DeleteProgramReviewerDialog(), handleDelete(), DeleteProgramReviewerDialogProps, ProgramReviewerManager(), toggleActive(), ProgramReviewerManagerProps, ProgramReviewerModal(), handleSubmit() (+7 more)

### Community 42 - "types/dashboard.ts"
Cohesion: 0.13
Nodes (16): addTally(), aggregate(), blankTally(), byName(), completionRows(), row(), Tally, withRate() (+8 more)

### Community 43 - "types/syllabus.ts"
Cohesion: 0.08
Nodes (51): GET(), conflict(), PUT(), RouteContext, DELETE(), GET(), leadOnly(), notEditable() (+43 more)

### Community 44 - "register/page.tsx"
Cohesion: 0.17
Nodes (15): LoginPage(), LoginPageProps, metadata, metadata, RegisterPage(), RegisterPageProps, LoginForm(), handleSubmit() (+7 more)

### Community 45 - "course/route.test.ts"
Cohesion: 0.25
Nodes (5): base, forbidden(), listResult, mocks, rows

### Community 46 - "helpers.ts"
Cohesion: 0.34
Nodes (13): adminPb(), answerForm17AllYes(), approveInUi(), auditFor(), createDraft(), getSyllabus(), loadSeed(), ok() (+5 more)

### Community 47 - "export.ts"
Cohesion: 0.13
Nodes (25): metadata, PageProps, SyllabusFormsPage(), Form17View(), Line(), Form181View(), PointsTable(), PrintableForms() (+17 more)

### Community 48 - "dashboard-manager.tsx"
Cohesion: 0.12
Nodes (30): DashboardManager(), defaultTerm(), JustificationsPanel(), STATE_STYLES, STATES, daysSince(), ErrorBanner(), ExportLink() (+22 more)

### Community 49 - "Enhanced OBE Syllabus on `[FILL IN: course name]`"
Cohesion: 0.07
Nodes (27): About This File, BUKIDNON STATE UNIVERSITY, Course Information, Creating a syllabus, Differences between the two signatory blocks, Document Structure (in order), Enhanced OBE Syllabus on `[FILL IN: course name]`, Enhanced OBE Syllabus Template (BukSU) (+19 more)

### Community 50 - "lib/review-queue.ts"
Cohesion: 0.19
Nodes (14): Review queue, Testing, heldStages(), holdsStageFor(), listAwaitingReviewIds(), queueStages(), stageScopeFilter(), statusFilter() (+6 more)

### Community 51 - "signed-copy/route.test.ts"
Cohesion: 0.10
Nodes (15): ctx, download(), mocks, pdf, upload(), ctx, mocks, pdf (+7 more)

### Community 52 - "citl-director/route.ts"
Cohesion: 0.17
Nodes (18): CitlDirectorManager(), toggleActive(), CitlDirectorManagerProps, CitlDirectorModal(), handleSubmit(), DeleteCitlDirectorDialog(), handleDelete(), DeleteCitlDirectorDialogProps (+10 more)

### Community 53 - "next"
Cohesion: 0.09
Nodes (16): POST(), POST(), clearSessionCookie(), nextConfig, next, mocks, post(), candidates (+8 more)

### Community 54 - "pocketbase"
Cohesion: 0.19
Nodes (14): listStandInCandidates(), listStandIns(), STAND_IN_EXPAND, toStandInResponse(), isStage(), ParseResult, parseStandInInput(), fakePb() (+6 more)

### Community 55 - "prospectus-client.ts"
Cohesion: 0.14
Nodes (25): DeleteProspectusDialog(), handleDelete(), DeleteProspectusDialogProps, DuplicateProspectusDialog(), handleConfirm(), DuplicateProspectusDialogProps, ItemList(), ModalState (+17 more)

### Community 56 - "prospectus-item/[id]/route.ts"
Cohesion: 0.29
Nodes (13): GET(), PATCH(), RouteContext, GET(), POST(), PROSPECTUS_ITEM_EXPAND, toProspectusItemResponse(), isYearLevel() (+5 more)

### Community 57 - "syllabus-detail.tsx"
Cohesion: 0.08
Nodes (32): CoAuthorPicker(), CoAuthorPickerProps, CoAuthorsPanel(), save(), CoAuthorsPanelProps, DeleteSyllabusDialog(), handleDelete(), DeleteSyllabusDialogProps (+24 more)

### Community 58 - "types/roles.ts"
Cohesion: 0.14
Nodes (13): AppShell(), Sidebar(), SidebarProps, getNavItems(), NAV_ITEMS, NavItem, mocks, mocks (+5 more)

### Community 59 - "syllabus-manager.tsx"
Cohesion: 0.11
Nodes (23): metadata, ReviewQueuePage(), ProgramFilterCombobox(), ProgramFilterComboboxProps, ProgramOption, age(), ReviewQueueManager(), stageLabel() (+15 more)

### Community 110 - "review/route.ts"
Cohesion: 0.10
Nodes (24): conflict(), conflictMessage(), POST(), RouteContext, pointFacts, DecisionConflict, DecisionInput, explainConflict() (+16 more)

### Community 111 - "types/term.ts"
Cohesion: 0.10
Nodes (39): GET(), PATCH(), RouteContext, GET(), POST(), DeleteTermDialog(), handleDelete(), DeleteTermDialogProps (+31 more)

### Community 112 - "user-manager.tsx"
Cohesion: 0.11
Nodes (26): metadata, UserPage(), DeleteUserDialog(), handleDelete(), DeleteUserDialogProps, describeAccess(), KIND_LABELS, ModalState (+18 more)

### Community 113 - "Program"
Cohesion: 0.19
Nodes (13): PATCH(), RouteContext, isChairOfProgram(), listProgramsChairedBy(), programHasActiveChair(), toProgramChairResponse(), parseProgramChairUpdate(), parseRequiredString() (+5 more)

### Community 114 - "users.ts"
Cohesion: 0.19
Nodes (17): DELETE(), PATCH(), RouteContext, GET(), POST(), avatarUrl(), ASSIGNMENTS, hasOtherAdmin() (+9 more)

### Community 115 - "[code]/page.tsx"
Cohesion: 0.22
Nodes (9): ACTING_AS_LABELS, metadata, PageProps, Row(), VerifyApprovalPage(), metadata, VerifyPage(), VerifyForm() (+1 more)

### Community 118 - "dean/route.ts"
Cohesion: 0.22
Nodes (13): PATCH(), RouteContext, collegeHasActiveDean(), isDeanOfCollege(), listCollegesDeanedBy(), toDeanResponse(), parseDeanUpdate(), ParseResult (+5 more)

### Community 119 - "reference-manager.tsx"
Cohesion: 0.09
Nodes (35): AvailableCourseCombobox(), AvailableCourseComboboxProps, COPY, DialogAction, ReferenceActionDialog(), handleSubmit(), ReferenceActionDialogProps, ReferenceManagerProps (+27 more)

### Community 120 - "review-workspace.tsx"
Cohesion: 0.14
Nodes (16): metadata, PageProps, SyllabusReviewPage(), Draft, draftFrom(), Form17Panel(), handleSave(), Form17PanelProps (+8 more)

### Community 121 - "pocketbase"
Cohesion: 0.22
Nodes (15): DeleteFdisChairDialog(), handleDelete(), DeleteFdisChairDialogProps, FdisChairManager(), toggleActive(), FdisChairManagerProps, FdisChairModal(), handleSubmit() (+7 more)

### Community 122 - "Syllabus Development Guidelines"
Cohesion: 0.08
Nodes (23): 10. Syllabus Table Format, 11. Writing Good Outcomes, 12. Syllabus Creation Workflow, 13. Institutional Review Process, 14. Validation Checklist, 15. Output Behavior for Claude, 1. Role and Scope, 2. Bloom's Taxonomy Reference (+15 more)

### Community 123 - "syllabus-workflow.ts"
Cohesion: 0.07
Nodes (41): API, Capabilities, Decisions (2026-10-26), Definitions, Out of scope, Phase 2: Syllabus submission, Schema changes (to apply to `pb_schema.json`), UI (+33 more)

### Community 124 - "types/prospectus-item.ts"
Cohesion: 0.10
Nodes (30): CourseCombobox(), CourseComboboxProps, CourseOption, DeleteProspectusItemDialog(), handleDelete(), DeleteProspectusItemDialogProps, itemProspectusLabel(), ModalState (+22 more)

### Community 125 - "05-a11y.spec.ts"
Cohesion: 0.25
Nodes (6): PAGES, TAGS, PASSWORD, findSyllabusId(), PEOPLE, Person

### Community 126 - "Phase 4: Reviewer experience"
Cohesion: 0.18
Nodes (10): Boundaries, Decisions (2026-10-27), Events (`lib/syllabus-events.ts`, server-only), Hub (`/syllabus/[id]`), Objective, Out of scope, Phase 4: Reviewer experience, Proposals (accept or amend before task 1) (+2 more)

### Community 127 - "dean-manager.tsx"
Cohesion: 0.22
Nodes (15): DeanManager(), toggleActive(), DeanManagerProps, DeanModal(), handleSubmit(), DeanModalProps, DeleteDeanDialog(), handleDelete() (+7 more)

### Community 128 - "org-visibility.ts"
Cohesion: 0.08
Nodes (40): DELETE(), GET(), PATCH(), RouteContext, DELETE(), GET(), PATCH(), RouteContext (+32 more)

### Community 129 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, audit:phase-a, build, dev, lint, pb, start, test (+1 more)

### Community 130 - "types/dashboard.ts"
Cohesion: 0.21
Nodes (14): SyllabusStatus, DashboardQuery, ParseResult, SyllabusExportFilters, DashboardFilters, EXPORT_ROW_LIMIT, EXPORT_VIEWS, ExportView (+6 more)

### Community 131 - "dependencies"
Cohesion: 0.29
Nodes (7): dependencies, @headlessui/react@^2.2.10, next@16.3.6, pocketbase@^0.28.1, react@19.2.8, react-dom@19.2.8, react-dom

### Community 132 - "AppUser"
Cohesion: 0.19
Nodes (13): CRITERIA, parseForm17Input(), ParseResult, FORM17_ANSWERS, Form17Answer, Form17AnswerInput, Form17AnswerRecord, Form17ChangeRecord (+5 more)

### Community 133 - "revise-workspace.tsx"
Cohesion: 0.10
Nodes (30): metadata, PageProps, SyllabusRevisePage(), PdfPane(), PdfPaneProps, ResubmitSyllabusDialog(), handleResubmit(), ResubmitSyllabusDialogProps (+22 more)

### Community 134 - "Phase 5: Visibility and communication"
Cohesion: 0.10
Nodes (16): Boundaries, Dashboards, Deadlines, Decisions (2026-10-28), Objective, Out of scope, Phase 5: Visibility and communication, Schema changes (to apply to `pb_schema.json`) (+8 more)

### Community 139 - "Retention policy"
Cohesion: 0.33
Nodes (5): Changing this policy, Removing records, Retention policy, Rule, Storage growth

### Community 140 - "index.ts"
Cohesion: 0.08
Nodes (45): GET(), notFound(), RouteContext, GET(), RouteContext, Batch, form17Facts(), listForm17Answers() (+37 more)

### Community 141 - "Criteria"
Cohesion: 0.12
Nodes (16): A. Preliminaries, B. Vision, Mission, Goals, Objectives, and Outcomes, C. Course Content, Closing Section, Criteria, D. Assessment, E. Learning Modality and Methods, F. Resources, Required Readings, and References (+8 more)

### Community 142 - "lib/review-queue.ts"
Cohesion: 0.31
Nodes (11): GET(), Cover, loadMyStandIns(), loadQueueExtras(), QUEUE_EXPAND, queueFilter(), queueSort(), STAGES (+3 more)

### Community 143 - "Phase 3: Review engine and forms"
Cohesion: 0.13
Nodes (14): config, isTokenExpired(), proxy(), PUBLIC_PATHS, Accepted 2026-10-27, Capabilities, Decisions (2026-10-26), Justification (+6 more)

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
Cohesion: 0.29
Nodes (7): GET(), metadata, RootLayout(), AppHeader(), unreadFor(), toSessionUser(), APP_NAME

### Community 149 - "overdue-badge.tsx"
Cohesion: 0.25
Nodes (16): Badge(), plural(), ReviewOverdueBadge(), reviewOverdueDays(), SubmissionOverdueBadge(), submissionOverdueDays(), TermDeadlines, syllabusOverdue() (+8 more)

### Community 150 - "program-join-request-manager.tsx"
Cohesion: 0.06
Nodes (48): DELETE(), notPending(), PATCH(), RouteContext, POST(), ProgramJoinRequestManager(), approve(), reloadAfterRowLeft() (+40 more)

### Community 151 - "form18-panel.tsx"
Cohesion: 0.09
Nodes (29): Form18Panel(), run(), Form18PanelProps, NewPointForm(), PointForm(), PointFormProps, PointRow(), PointRowProps (+21 more)

### Community 152 - "canAnywhere"
Cohesion: 0.21
Nodes (8): DashboardPage(), metadata, Home(), metadata, SchoolYearPage(), SchoolYearsAndTerms(), SchoolYearsAndTermsProps, canAnywhere()

### Community 153 - "types/department.ts"
Cohesion: 0.27
Nodes (6): parseCollegeInput(), parseRequiredString(), ParseResult, ParseResult, CollegeInput, DepartmentInput

### Community 155 - "dean/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 156 - "program-chair/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 157 - "[pointId]/route.ts"
Cohesion: 0.20
Nodes (11): ctx, EDIT, given(), HOLDERS, mocks, patch(), point(), remove() (+3 more)

### Community 158 - "[pointId]/route.ts"
Cohesion: 0.13
Nodes (28): conflict(), DELETE(), load(), Loaded, notFound(), PATCH(), reviewerCheck(), RouteContext (+20 more)

### Community 159 - "program-join-request/[id]/route.test.ts"
Cohesion: 0.29
Nodes (5): approve, ctx, mocks, pending, SCOPE

### Community 160 - "prospectus-item/route.test.ts"
Cohesion: 0.25
Nodes (5): base, forbidden(), listResult, mocks, rows

### Community 161 - "term/route.test.ts"
Cohesion: 0.25
Nodes (5): base, forbidden(), listResult, mocks, rows

### Community 162 - "stand-in/route.test.ts"
Cohesion: 0.22
Nodes (4): ctx, HOLDERS, ITEMS, mocks

### Community 163 - "requireUserMock"
Cohesion: 0.05
Nodes (22): get(), mocks, page, ctx, mocks, listResult, mocks, forbidden() (+14 more)

### Community 164 - "approval-verify.ts"
Cohesion: 0.14
Nodes (18): approvalCode(), ApprovalCodeParts, parseApprovalCode(), SEMESTER_CODES, validStage(), findApproval(), ReviewWithExpand, VerifiedApproval (+10 more)

### Community 165 - "Phase 6: Hardening"
Cohesion: 0.05
Nodes (52): AuditPage(), metadata, ACTION_LABELS, AuditManager(), version(), Schema changes (to apply to `pb_schema.json`), Accessibility pass, Audit module (+44 more)

### Community 166 - "Feature walkthrough"
Cohesion: 0.20
Nodes (18): 0. Before you start, 1. Cast, Feature walkthrough, Part 10 — Negative checks, Part 11 — Keyboard and accessibility pass, Part 1 — Admin setup (as `admin`), Part 2 — Org chain and roles, Part 3 — Registration and joining a program (+10 more)

### Community 167 - "dean/[id]/route.test.ts"
Cohesion: 0.33
Nodes (4): ctx, forbidden(), mocks, unauthorized()

### Community 169 - "program-reviewer/route.ts"
Cohesion: 0.28
Nodes (12): PATCH(), RouteContext, POST(), programHasActiveReviewer(), toProgramReviewerResponse(), parseProgramReviewerInput(), parseProgramReviewerUpdate(), ParseResult (+4 more)

### Community 170 - "submit/route.test.ts"
Cohesion: 0.33
Nodes (4): ctx, draft, HOLDERS, mocks

### Community 171 - "syllabus-client.ts"
Cohesion: 0.12
Nodes (38): JustificationPanel(), adopt(), handlePreview(), handleSave(), run(), STATUS_LABELS, SignedCopyPanel(), handleReturn() (+30 more)

### Community 173 - "[versionId]/file/route.test.ts"
Cohesion: 0.33
Nodes (4): ctx, mocks, syllabus, version

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

### Community 178 - "timeline/route.test.ts"
Cohesion: 0.40
Nodes (4): ctx, get(), mocks, syllabus

### Community 190 - "export/form17/route.test.ts"
Cohesion: 0.33
Nodes (5): ctx, form17(), mocks, SYLLABUS, VERSION

### Community 191 - "vpaa/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 192 - "export/form18/route.test.ts"
Cohesion: 0.33
Nodes (5): ctx, form18(), mocks, SYLLABUS, VERSION

### Community 194 - "scope.test.ts"
Cohesion: 0.50
Nodes (3): fullChain, mocks, records

### Community 195 - "[id]/form18/route.test.ts"
Cohesion: 0.25
Nodes (5): ctx, HOLDERS, LATEST, mocks, post()

### Community 197 - "syllabus-reference/route.test.ts"
Cohesion: 0.25
Nodes (5): input, mocks, SCOPE, source, term

### Community 198 - "from-previous/route.test.ts"
Cohesion: 0.33
Nodes (4): ctx, mocks, OLD_VERSION, post()

### Community 201 - "audit-phase-a.ts"
Cohesion: 0.33
Nodes (6): AssignmentRow, ASSIGNMENTS, main(), requireEnv(), UNASSIGNED_FILTER, UserRow

### Community 202 - "next"
Cohesion: 0.06
Nodes (22): mocks, mocks, ctx, get(), mocks, ctx, HOLDERS, mocks (+14 more)

### Community 203 - "types/review-queue.ts"
Cohesion: 0.31
Nodes (8): listReviewQueue(), request(), ReviewQueueParams, QueueQuery, QUEUE_STATUSES, QueueStatus, ReviewQueueItem, ReviewQueueResponse

### Community 205 - "summary/route.ts"
Cohesion: 0.26
Nodes (15): GET(), GET(), GET(), GET(), Proposals (accept or amend before task 1), paging(), resolveScopedPrograms(), dashboardScope() (+7 more)

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
Cohesion: 0.24
Nodes (10): metadata, PageProps, SyllabusJustificationLetterPage(), JustificationLetterView(), PrintableJustificationLetter(), buildJustificationLetter(), JUSTIFICATION_TEMPLATE, JustificationLetterData (+2 more)

### Community 216 - "review-queue/route.test.ts"
Cohesion: 0.33
Nodes (5): COVERS, get(), mocks, STAND_INS, VERSIONS

## Knowledge Gaps
- **10 isolated node(s):** `RFC-4180`, `Org chain (campus, college, department, program)`, `Scoped list visibility (lib/org-visibility.ts)`, `Plain CRUD entities (campus, college, department, program, user)`, `Advisory PDF checks (informational only)` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1184 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **73 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `notification-bell.tsx`, `dashboard-scope.ts`, `react`, `college-manager.tsx`, `validators/user.ts`, `course-modal.tsx`, `Package & Tooling Config`, `createAdminPb`, `mock-auth.ts`, `getCurrentUser`, `mockAuth`, `resolveSyllabusAccess`, `pocketbase`, `pocketbase`, `department-head/route.ts`, `lib/prospectus-duplicate.ts`, `lib/syllabus-reference.ts`, `pocketbase.ts`, `export/route.ts`, `can`, `auth-client.ts`, `dean-manager.tsx`, `faculty/route.ts`, `pocketbase.ts`, `fdis-chair/route.ts`, `getUserRoles`, `types/notification.ts`, `resubmit/route.ts`, `[id]/justification/route.ts`, `types/syllabus.ts`, `register/page.tsx`, `course/route.test.ts`, `export.ts`, `dashboard-manager.tsx`, `signed-copy/route.test.ts`, `prospectus-item/[id]/route.ts`, `syllabus-detail.tsx`, `types/roles.ts`, `syllabus-manager.tsx`, `review/route.ts`, `types/term.ts`, `user-manager.tsx`, `Program`, `users.ts`, `[code]/page.tsx`, `dean/route.ts`, `reference-manager.tsx`, `review-workspace.tsx`, `org-visibility.ts`, `dependencies`, `revise-workspace.tsx`, `Phase 5: Visibility and communication`, `index.ts`, `lib/review-queue.ts`, `Phase 3: Review engine and forms`, `prospectus/route.test.ts`, `app-header.tsx`, `program-join-request-manager.tsx`, `canAnywhere`, `dean/route.test.ts`, `program-chair/route.test.ts`, `[pointId]/route.ts`, `[pointId]/route.ts`, `program-join-request/[id]/route.test.ts`, `prospectus-item/route.test.ts`, `term/route.test.ts`, `stand-in/route.test.ts`, `requireUserMock`, `Phase 6: Hardening`, `dean/[id]/route.test.ts`, `program-reviewer/route.ts`, `submit/route.test.ts`, `syllabus-client.ts`, `[versionId]/file/route.test.ts`, `user/route.test.ts`, `citl-director/route.test.ts`, `college/route.test.ts`, `fdis-chair/route.test.ts`, `timeline/route.test.ts`, `export/form17/route.test.ts`, `vpaa/route.test.ts`, `export/form18/route.test.ts`, `[id]/form18/route.test.ts`, `syllabus-reference/route.test.ts`, `from-previous/route.test.ts`, `next`, `summary/route.ts`, `program-reviewer/route.test.ts`, `co-author-candidates/route.test.ts`, `school-year/route.test.ts`, `forms/justification.ts`, `review-queue/route.test.ts`?**
  _High betweenness centrality (0.178) - this node is a cross-community bridge._
- **Are the 79 inferred relationships involving `createAdminPb()` (e.g. with `audit/route.test.ts` and `register/route.test.ts`) actually correct?**
  _`createAdminPb()` has 79 INFERRED edges - model-reasoned connections that need verification._
- **What connects `RFC-4180`, `Org chain (campus, college, department, program)`, `Scoped list visibility (lib/org-visibility.ts)` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dashboard-scope.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.061224489795918366 - nodes in this community are weakly interconnected._
- **Why does `pocketbase` connect `pocketbase` to `react`, `college-manager.tsx`, `dependencies`, `revise-workspace.tsx`, `validators/user.ts`, `course-modal.tsx`, `Package & Tooling Config`, `AppUser`, `createAdminPb`, `index.ts`, `lib/review-queue.ts`, `resolveSyllabusAccess`, `pocketbase`, `timeline/route.ts`, `department-head/route.ts`, `Faculty UI`, `program-join-request-manager.tsx`, `lib/prospectus-duplicate.ts`, `lib/syllabus-reference.ts`, `pocketbase.ts`, `types/department.ts`, `VPAA UI`, `form18-panel.tsx`, `Program Chair UI`, `[pointId]/route.ts`, `dean-manager.tsx`, `can`, `faculty/route.ts`, `auth-client.ts`, `fdis-chair/route.ts`, `approval-verify.ts`, `Phase 6: Hardening`, `types/notification.ts`, `[id]/justification/route.ts`, `lib/dashboard.ts`, `program-reviewer-manager.tsx`, `resubmit/route.ts`, `types/syllabus.ts`, `syllabus-client.ts`, `getUserRoles`, `helpers.ts`, `program-reviewer/route.ts`, `dashboard-manager.tsx`, `lib/review-queue.ts`, `signed-copy/route.test.ts`, `citl-director/route.ts`, `pocketbase`, `prospectus-client.ts`, `syllabus-manager.tsx`, `audit-phase-a.ts`, `next`, `types/review-queue.ts`, `review/route.ts`, `types/term.ts`, `user-manager.tsx`, `Program`, `dean/route.ts`, `reference-manager.tsx`, `pocketbase`, `types/prospectus-item.ts`, `05-a11y.spec.ts`, `dean-manager.tsx`?**
  _High betweenness centrality (0.156) - this node is a cross-community bridge._
- **Are the 20 inferred relationships involving `handlePbError()` (e.g. with `Testing` and `Testing`) actually correct?**
  _`handlePbError()` has 20 INFERRED edges - model-reasoned connections that need verification._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.1014799154334038 - nodes in this community are weakly interconnected._