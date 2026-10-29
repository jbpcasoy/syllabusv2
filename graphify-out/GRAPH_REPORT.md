# Graph Report - syllabusv2  (2026-10-29)

## Corpus Check
- 661 files · ~305,995 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 4, .ico 1, .css 1)

## Summary
- 3379 nodes · 10636 edges · 210 communities (137 shown, 73 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 331 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5e936cb6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- program-join-request-manager.tsx
- dashboard-scope.ts
- react
- college-manager.tsx
- lib/syllabus-review.ts
- Project Docs & Domain Rules
- validators/user.ts
- course-modal.tsx
- Package & Tooling Config
- scan/route.ts
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
- react
- Program Chair UI
- auth-client.ts
- dean-manager.tsx
- TypeScript Config
- submit/route.ts
- authorize
- createAdminPb
- Syllabus
- types/notification.ts
- resolveSyllabusAccess
- [id]/justification/route.ts
- lib/dashboard.ts
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
- vitest
- citl-director/route.ts
- citl-director/route.ts
- pocketbase
- prospectus-client.ts
- prospectus-item/[id]/route.ts
- syllabus-detail.tsx
- types/roles.ts
- syllabus-manager.tsx
- PostCSS Config
- review/route.test.ts
- types/term.ts
- user-manager.tsx
- program-chair/route.ts
- users.ts
- approval-verify.ts
- dean/route.ts
- lib/syllabus-reference.ts
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
- [id]/form17/route.test.ts
- dean/route.test.ts
- program-chair/route.test.ts
- [pointId]/route.ts
- [pointId]/route.ts
- syllabus-timeline.tsx
- prospectus-item/route.test.ts
- [id]/form18/route.test.ts
- stand-in/route.test.ts
- next
- review/route.ts
- Phase 6: Hardening
- Feature walkthrough
- transfer-lead-dialog.tsx
- program-reviewer/route.ts
- faculty/route.test.ts
- syllabus-client.ts
- [versionId]/file/route.test.ts
- printable-forms.tsx
- citl-director/route.test.ts
- program-reviewer/route.test.ts
- fdis-chair/route.test.ts
- department-head/route.test.ts
- export/form17/route.ts
- vpaa/route.test.ts
- upload-version-modal.tsx
- validators/syllabus-stand-in.ts
- college/route.test.ts
- syllabus-reference/route.test.ts
- lead/route.test.ts
- resubmit/route.test.ts
- syllabus/route.test.ts
- audit-phase-a.ts
- submit/route.test.ts
- types/review-queue.ts
- course/[id]/route.test.ts
- types/faculty.ts
- options/route.test.ts
- school-year/route.test.ts
- forms/justification.ts
- review-queue/route.test.ts

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
- `Hub (`/syllabus/[id]`)` --references--> `SyllabusVersions()`  [INFERRED]
  docs/specs/phase-4-reviewer-experience.md → components/syllabus/syllabus-versions.tsx
- `Timeline` --references--> `resolveSyllabusAccess()`  [INFERRED]
  docs/specs/phase-4-reviewer-experience.md → lib/syllabus.ts
- `Definitions` --references--> `getSyllabusAccess()`  [INFERRED]
  docs/specs/phase-2-syllabus-submission.md → lib/syllabus.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Review engine flow (Phase 3)** — agents_syllabus_workflow_state_machine, agents_review_chain, syllabus_review_system_project_plan__v5__syllabus_statuses, syllabus_review_system_project_plan__v5__routing_readiness, agents_proxy_reviewer, agents_approval_reference [EXTRACTED 1.00]
- **University review forms supported by the system** — agents_form17, agents_form18_1, agents_justification_form, syllabus_review_system_project_plan__v5__enhanced_obe_syllabus, syllabus_review_system_project_plan__v5__form_definitions_versioning [EXTRACTED 1.00]
- **Phase A migration from role-based PERMISSIONS to derived-role capabilities** — project_context_users_role_field, project_context_permissions_map, agents_isadmin, agents_getuserroles, agents_capability_authorization [INFERRED 0.85]

## Communities (210 total, 73 thin omitted)

### Community 0 - "program-join-request-manager.tsx"
Cohesion: 0.14
Nodes (20): ProgramJoinRequestManager(), approve(), reloadAfterRowLeft(), ProgramJoinRequestManagerProps, RowDialog, STATUS_LABELS, STATUS_STYLES, ProgramJoinRequestModal() (+12 more)

### Community 1 - "dashboard-scope.ts"
Cohesion: 0.08
Nodes (27): anyOf(), Bind, filterInScope(), justificationScope(), OUT_OF_SCOPE_ERROR, programInScope(), programMatches(), programScopeFilter() (+19 more)

### Community 2 - "react"
Cohesion: 0.14
Nodes (23): DeleteSchoolYearDialog(), handleDelete(), DeleteSchoolYearDialogProps, ModalState, SchoolYearManager(), changed(), SchoolYearManagerProps, SchoolYearModal() (+15 more)

### Community 3 - "college-manager.tsx"
Cohesion: 0.16
Nodes (19): CollegePage(), metadata, CollegeManager(), ModalState, CollegeModal(), handleSubmit(), CollegeModalMode, CollegeModalProps (+11 more)

### Community 4 - "lib/syllabus-review.ts"
Cohesion: 0.18
Nodes (21): conflict(), GET(), notFound(), PUT(), RouteContext, Authors, canDesignate(), ChainHolders (+13 more)

### Community 5 - "Project Docs & Domain Rules"
Cohesion: 0.06
Nodes (37): AGENTS.md (agent guidance), Approval reference code (SYL-<term>-<seq>-S<stage>), Capability-based authorization (can, requireUser, authorize, canSomewhere), Form 17 (OVPAA-F-INS-017) review checklist, Form 18-1 (CITL-F-018) review points, getUserRoles resolver (derived roles from assignment records), users.isAdmin (only stored role), Justification Form (missing lead signature) (+29 more)

### Community 6 - "validators/user.ts"
Cohesion: 0.13
Nodes (20): metadata, RegisterPage(), RegisterPageProps, RegisterForm(), handleSubmit(), RegisterFormProps, register(), DEFAULT_EMAIL_DOMAINS (+12 more)

### Community 7 - "course-modal.tsx"
Cohesion: 0.08
Nodes (39): CourseCombobox(), CourseComboboxProps, CourseOption, CourseModal(), handleSubmit(), CourseModalMode, CourseModalProps, NUMBER_FIELDS (+31 more)

### Community 8 - "Package & Tooling Config"
Cohesion: 0.09
Nodes (27): eslintConfig, devDependencies, @axe-core/playwright@^4.14.0, eslint@^9, eslint-config-next@16.3.6, @playwright/test@^1.64.1, tailwindcss@^4, @tailwindcss/postcss@^4 (+19 more)

### Community 9 - "scan/route.ts"
Cohesion: 0.10
Nodes (24): GET(), notFound(), POST(), RouteContext, Tasks, addAudit(), Batch, canViewJustification() (+16 more)

### Community 10 - "handlePbError"
Cohesion: 0.10
Nodes (30): GET(), DELETE(), PATCH(), RouteContext, POST(), DELETE(), DELETE(), DELETE() (+22 more)

### Community 11 - "mock-auth.ts"
Cohesion: 0.06
Nodes (28): listResult, mocks, base, listResult, mocks, approve, ctx, mocks (+20 more)

### Community 12 - "getCurrentUser"
Cohesion: 0.07
Nodes (39): AuditPage(), metadata, CitlDirectorPage(), metadata, CoursePage(), metadata, DepartmentHeadPage(), metadata (+31 more)

### Community 13 - "global-setup.ts"
Cohesion: 0.15
Nodes (22): APP_PORT, APP_URL, DIST_DIR, LOCAL_PB, PB_BIN, PB_PORT, PB_URL, ROOT (+14 more)

### Community 14 - "mockAuth"
Cohesion: 0.05
Nodes (38): ctx, forbidden(), mocks, unauthorized(), ctx, forbidden(), mocks, unauthorized() (+30 more)

### Community 15 - "resolveSyllabusAccess"
Cohesion: 0.16
Nodes (20): RouteContext, GET(), notFound(), POST(), RouteContext, Task plan (one reviewable change each, lint and tests green after each), listSignedCopies(), SIGNED_COPY_EXPAND (+12 more)

### Community 16 - "pocketbase"
Cohesion: 0.12
Nodes (24): metadata, ProgramPage(), CourseManagerProps, ModalState, DeleteProgramDialog(), handleDelete(), DeleteProgramDialogProps, ModalState (+16 more)

### Community 17 - "timeline/route.ts"
Cohesion: 0.17
Nodes (12): buildTimeline(), name(), Named, TimelineEvent, TimelineVersion, base, SYLLABUS_EVENT_TYPES, SyllabusEvent (+4 more)

### Community 18 - "vpaa/route.ts"
Cohesion: 0.20
Nodes (16): DELETE(), PATCH(), RouteContext, GET(), POST(), ParseResult, parseVpaaInput(), parseVpaaUpdate() (+8 more)

### Community 19 - "department-head-manager.tsx"
Cohesion: 0.22
Nodes (15): DeleteDepartmentHeadDialog(), handleDelete(), DeleteDepartmentHeadDialogProps, DepartmentHeadManager(), toggleActive(), DepartmentHeadManagerProps, DepartmentHeadModal(), handleSubmit() (+7 more)

### Community 20 - "react"
Cohesion: 0.14
Nodes (23): DepartmentPage(), metadata, DeleteDepartmentDialog(), handleDelete(), DeleteDepartmentDialogProps, DepartmentManager(), ModalState, DepartmentModal() (+15 more)

### Community 21 - "Faculty UI"
Cohesion: 0.22
Nodes (15): DeleteFacultyDialog(), handleDelete(), DeleteFacultyDialogProps, FacultyManager(), toggleActive(), FacultyManagerProps, FacultyModal(), handleSubmit() (+7 more)

### Community 22 - "lib/prospectus-duplicate.ts"
Cohesion: 0.10
Nodes (32): GET(), POST(), GET(), PATCH(), RouteContext, GET(), POST(), applyDuplicate() (+24 more)

### Community 23 - "capability-rules.ts"
Cohesion: 0.09
Nodes (15): CAPABILITIES, Rule, RULES, ScopeChain, admin, ADMIN_ONLY, chair, dean (+7 more)

### Community 24 - "index.ts"
Cohesion: 0.17
Nodes (17): FORM17_REV04, FORM18_REV01, checklistCriteria(), CURRENT_FORM17, FORM17_REVISIONS, form17Status(), FORM18_REVISIONS, isLegendCode() (+9 more)

### Community 25 - "next"
Cohesion: 0.06
Nodes (53): POST(), POST(), GET(), isDuplicateEmail(), POST(), GET(), GET(), GET() (+45 more)

### Community 26 - "export/route.ts"
Cohesion: 0.11
Nodes (33): cap(), GET(), RFC-4180, Task plan (one reviewable change each, lint and tests green after each), csvCell, fileSlug(), toCsv(), aggregate() (+25 more)

### Community 27 - "VPAA UI"
Cohesion: 0.24
Nodes (14): DeleteVpaaDialog(), handleDelete(), DeleteVpaaDialogProps, VpaaManager(), toggleActive(), VpaaManagerProps, VpaaModal(), handleSubmit() (+6 more)

### Community 28 - "react"
Cohesion: 0.15
Nodes (20): CitlDirectorModalProps, DeanModalProps, DepartmentHeadModalProps, FacultyModalProps, FdisChairModalProps, ProgramChairModalProps, ProgramReviewerModalProps, ModalState (+12 more)

### Community 29 - "Program Chair UI"
Cohesion: 0.22
Nodes (15): DeleteProgramChairDialog(), handleDelete(), DeleteProgramChairDialogProps, ProgramChairManager(), toggleActive(), ProgramChairManagerProps, ProgramChairModal(), handleSubmit() (+7 more)

### Community 30 - "auth-client.ts"
Cohesion: 0.25
Nodes (11): getInitials(), HeaderAuth(), handleLogout(), HeaderAuthProps, LoginInput, logout(), request(), RegisterInput (+3 more)

### Community 31 - "dean-manager.tsx"
Cohesion: 0.15
Nodes (22): CampusPage(), metadata, CampusManager(), formatDate(), ModalState, CampusModal(), handleSubmit(), CampusModalMode (+14 more)

### Community 32 - "TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 33 - "submit/route.ts"
Cohesion: 0.15
Nodes (21): POST(), RouteContext, Notifications, Testing, addNotifications(), Authors, Batch, clip() (+13 more)

### Community 34 - "authorize"
Cohesion: 0.21
Nodes (16): DELETE(), PATCH(), RouteContext, GET(), POST(), departmentHasActiveHead(), isHeadOfDepartment(), listDepartmentsHeadedBy() (+8 more)

### Community 35 - "createAdminPb"
Cohesion: 0.11
Nodes (29): DELETE(), GET(), PATCH(), RouteContext, GET(), POST(), DELETE(), GET() (+21 more)

### Community 36 - "Syllabus"
Cohesion: 0.16
Nodes (22): conflict(), POST(), RouteContext, GET(), notFound(), POST(), RouteContext, GET() (+14 more)

### Community 37 - "types/notification.ts"
Cohesion: 0.06
Nodes (51): PATCH(), RouteContext, GET(), metadata, RootLayout(), metadata, NotificationsPage(), AppHeader() (+43 more)

### Community 38 - "resolveSyllabusAccess"
Cohesion: 0.23
Nodes (18): GET(), notFound(), PUT(), RouteContext, load(), POST(), POST(), RouteContext (+10 more)

### Community 39 - "[id]/justification/route.ts"
Cohesion: 0.08
Nodes (40): conflict(), GET(), load(), notFound(), PATCH(), PUT(), RouteContext, ensureBasedOn() (+32 more)

### Community 40 - "lib/dashboard.ts"
Cohesion: 0.13
Nodes (18): awaitingSignedCopyQuery(), emptyList(), listAwaitingSignedCopy(), loadFilteredPrograms(), programClause(), ProgramRecord, RowSyllabus, ScopedPrograms (+10 more)

### Community 41 - "program-reviewer-manager.tsx"
Cohesion: 0.22
Nodes (15): DeleteProgramReviewerDialog(), handleDelete(), DeleteProgramReviewerDialogProps, ProgramReviewerManager(), toggleActive(), ProgramReviewerManagerProps, ProgramReviewerModal(), handleSubmit() (+7 more)

### Community 42 - "types/dashboard.ts"
Cohesion: 0.13
Nodes (18): addTally(), blankTally(), byName(), completionRows(), row(), Tally, withRate(), EMC (+10 more)

### Community 43 - "types/syllabus.ts"
Cohesion: 0.09
Nodes (49): conflict(), PUT(), RouteContext, DELETE(), GET(), leadOnly(), notEditable(), notFound() (+41 more)

### Community 44 - "register/page.tsx"
Cohesion: 0.29
Nodes (8): LoginPage(), LoginPageProps, metadata, LoginForm(), handleSubmit(), LoginFormProps, login(), safeRedirect()

### Community 45 - "course/route.test.ts"
Cohesion: 0.25
Nodes (5): base, forbidden(), listResult, mocks, rows

### Community 46 - "helpers.ts"
Cohesion: 0.34
Nodes (13): adminPb(), answerForm17AllYes(), approveInUi(), auditFor(), createDraft(), getSyllabus(), loadSeed(), ok() (+5 more)

### Community 47 - "fdis-chair/route.ts"
Cohesion: 0.26
Nodes (12): DELETE(), PATCH(), RouteContext, GET(), POST(), getActiveFdisChair(), hasActiveFdisChair(), isFdisChair() (+4 more)

### Community 48 - "dashboard-manager.tsx"
Cohesion: 0.12
Nodes (30): DashboardManager(), defaultTerm(), JustificationsPanel(), STATE_STYLES, STATES, daysSince(), ErrorBanner(), ExportLink() (+22 more)

### Community 49 - "Enhanced OBE Syllabus on `[FILL IN: course name]`"
Cohesion: 0.07
Nodes (27): About This File, BUKIDNON STATE UNIVERSITY, Course Information, Creating a syllabus, Differences between the two signatory blocks, Document Structure (in order), Enhanced OBE Syllabus on `[FILL IN: course name]`, Enhanced OBE Syllabus Template (BukSU) (+19 more)

### Community 50 - "lib/review-queue.ts"
Cohesion: 0.13
Nodes (29): GET(), Review queue, Testing, Cover, heldStages(), holdsStageFor(), listAwaitingReviewIds(), loadMyStandIns() (+21 more)

### Community 51 - "vitest"
Cohesion: 0.07
Nodes (23): vitest, mocks, candidates, ctx, get(), mocks, syllabus, ctx (+15 more)

### Community 52 - "citl-director/route.ts"
Cohesion: 0.22
Nodes (15): CitlDirectorManager(), toggleActive(), CitlDirectorManagerProps, CitlDirectorModal(), handleSubmit(), DeleteCitlDirectorDialog(), handleDelete(), DeleteCitlDirectorDialogProps (+7 more)

### Community 53 - "citl-director/route.ts"
Cohesion: 0.22
Nodes (15): DELETE(), PATCH(), RouteContext, GET(), POST(), getActiveCitlDirector(), hasActiveCitlDirector(), isCitlDirector() (+7 more)

### Community 54 - "pocketbase"
Cohesion: 0.26
Nodes (12): listStandInCandidates(), listStandIns(), STAND_IN_EXPAND, toStandInResponse(), fakePb(), filter(), record, Faculty (+4 more)

### Community 55 - "prospectus-client.ts"
Cohesion: 0.13
Nodes (21): DeleteProspectusDialog(), handleDelete(), DeleteProspectusDialogProps, DuplicateProspectusDialog(), handleConfirm(), DuplicateProspectusDialogProps, ItemList(), ProspectusManager() (+13 more)

### Community 56 - "prospectus-item/[id]/route.ts"
Cohesion: 0.30
Nodes (12): GET(), PATCH(), RouteContext, GET(), POST(), PROSPECTUS_ITEM_EXPAND, toProspectusItemResponse(), isYearLevel() (+4 more)

### Community 57 - "syllabus-detail.tsx"
Cohesion: 0.09
Nodes (28): metadata, PageProps, SyllabusDetailPage(), CoAuthorPicker(), CoAuthorPickerProps, CoAuthorsPanel(), save(), CoAuthorsPanelProps (+20 more)

### Community 58 - "types/roles.ts"
Cohesion: 0.19
Nodes (7): mocks, mocks, USER, mocks, hasAnyRole(), NO_ROLES, roleLabels()

### Community 59 - "syllabus-manager.tsx"
Cohesion: 0.09
Nodes (26): metadata, ReviewQueuePage(), NeedsProxyPanel(), ProgramFilterCombobox(), ProgramFilterComboboxProps, ProgramOption, age(), ReviewQueueManager() (+18 more)

### Community 110 - "review/route.test.ts"
Cohesion: 0.20
Nodes (7): BY_STAGE, ctx, decide(), HOLDERS, mocks, NO_POINTS, VERSION

### Community 111 - "types/term.ts"
Cohesion: 0.10
Nodes (35): GET(), PATCH(), RouteContext, DeleteTermDialog(), handleDelete(), DeleteTermDialogProps, ModalState, TermManager() (+27 more)

### Community 112 - "user-manager.tsx"
Cohesion: 0.12
Nodes (22): DeleteUserDialog(), handleDelete(), DeleteUserDialogProps, describeAccess(), KIND_LABELS, ModalState, UserManager(), UserManagerProps (+14 more)

### Community 113 - "program-chair/route.ts"
Cohesion: 0.22
Nodes (15): DELETE(), PATCH(), RouteContext, GET(), POST(), isChairOfProgram(), listProgramsChairedBy(), programHasActiveChair() (+7 more)

### Community 114 - "users.ts"
Cohesion: 0.17
Nodes (17): DELETE(), GET(), PATCH(), RouteContext, GET(), POST(), avatarUrl(), ASSIGNMENTS (+9 more)

### Community 115 - "approval-verify.ts"
Cohesion: 0.11
Nodes (22): ACTING_AS_LABELS, metadata, PageProps, Row(), VerifyApprovalPage(), metadata, VerifyPage(), VerifyForm() (+14 more)

### Community 118 - "dean/route.ts"
Cohesion: 0.10
Nodes (28): GET(), PATCH(), RouteContext, GET(), POST(), DELETE(), PATCH(), RouteContext (+20 more)

### Community 119 - "lib/syllabus-reference.ts"
Cohesion: 0.06
Nodes (63): PATCH(), RouteContext, POST(), COPY, DialogAction, ReferenceActionDialog(), handleSubmit(), ReferenceActionDialogProps (+55 more)

### Community 120 - "review-workspace.tsx"
Cohesion: 0.10
Nodes (22): metadata, PageProps, SyllabusReviewPage(), Draft, draftFrom(), Form17Panel(), handleSave(), Form17PanelProps (+14 more)

### Community 121 - "pocketbase"
Cohesion: 0.15
Nodes (21): FdisChairPage(), metadata, DeleteFdisChairDialog(), handleDelete(), DeleteFdisChairDialogProps, FdisChairManager(), toggleActive(), FdisChairManagerProps (+13 more)

### Community 122 - "Syllabus Development Guidelines"
Cohesion: 0.08
Nodes (23): 10. Syllabus Table Format, 11. Writing Good Outcomes, 12. Syllabus Creation Workflow, 13. Institutional Review Process, 14. Validation Checklist, 15. Output Behavior for Claude, 1. Role and Scope, 2. Bloom's Taxonomy Reference (+15 more)

### Community 123 - "syllabus-workflow.ts"
Cohesion: 0.07
Nodes (40): API, Capabilities, Decisions (2026-10-26), Definitions, Out of scope, Phase 2: Syllabus submission, Schema changes (to apply to `pb_schema.json`), UI (+32 more)

### Community 124 - "types/prospectus-item.ts"
Cohesion: 0.11
Nodes (30): DeleteProspectusItemDialog(), handleDelete(), DeleteProspectusItemDialogProps, itemProspectusLabel(), ModalState, ProspectusItemManager(), ProspectusItemManagerProps, prospectusLabel() (+22 more)

### Community 125 - "05-a11y.spec.ts"
Cohesion: 0.25
Nodes (6): PAGES, TAGS, PASSWORD, findSyllabusId(), PEOPLE, Person

### Community 126 - "Phase 4: Reviewer experience"
Cohesion: 0.18
Nodes (10): Boundaries, Decisions (2026-10-27), Events (`lib/syllabus-events.ts`, server-only), Hub (`/syllabus/[id]`), Objective, Out of scope, Phase 4: Reviewer experience, Proposals (accept or amend before task 1) (+2 more)

### Community 127 - "dean-manager.tsx"
Cohesion: 0.18
Nodes (18): DeanPage(), metadata, DeanManager(), toggleActive(), DeanManagerProps, DeanModal(), handleSubmit(), DeleteDeanDialog() (+10 more)

### Community 128 - "org-visibility.ts"
Cohesion: 0.07
Nodes (44): DELETE(), DELETE(), GET(), PATCH(), RouteContext, GET(), POST(), GET() (+36 more)

### Community 129 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, audit:phase-a, build, dev, lint, pb, start, test (+1 more)

### Community 130 - "validators/dashboard.ts"
Cohesion: 0.12
Nodes (21): GET(), listJustifications(), paging(), scopeIsEmpty(), DashboardQuery, parseDashboardQuery(), parseExportView(), parseJustificationState() (+13 more)

### Community 131 - "dependencies"
Cohesion: 0.29
Nodes (7): dependencies, @headlessui/react@^2.2.10, next@16.3.6, pocketbase@^0.28.1, react@19.2.8, react-dom@19.2.8, react-dom

### Community 132 - "export/form17/route.ts"
Cohesion: 0.14
Nodes (19): Batch, copyForm17(), newRecordId(), saveForm17, Version, CRITERIA, parseForm17Input(), ParseResult (+11 more)

### Community 133 - "revise-workspace.tsx"
Cohesion: 0.12
Nodes (24): metadata, PageProps, SyllabusRevisePage(), PdfPane(), PdfPaneProps, ResubmitSyllabusDialog(), handleResubmit(), ResubmitSyllabusDialogProps (+16 more)

### Community 134 - "Phase 5: Visibility and communication"
Cohesion: 0.10
Nodes (16): Boundaries, Dashboards, Deadlines, Decisions (2026-10-28), Objective, Out of scope, Phase 5: Visibility and communication, Proposals (accept or amend before task 1) (+8 more)

### Community 139 - "Retention policy"
Cohesion: 0.33
Nodes (5): Changing this policy, Removing records, Retention policy, Rule, Storage growth

### Community 140 - "export/form18/route.ts"
Cohesion: 0.16
Nodes (19): Form17View(), Line(), Form181View(), PointsTable(), ACTING_AS, FormHeader(), SignatureLines(), ApprovalStamp (+11 more)

### Community 141 - "Criteria"
Cohesion: 0.12
Nodes (16): A. Preliminaries, B. Vision, Mission, Goals, Objectives, and Outcomes, C. Course Content, Closing Section, Criteria, D. Assessment, E. Learning Modality and Methods, F. Resources, Required Readings, and References (+8 more)

### Community 142 - "campus/[id]/route.ts"
Cohesion: 0.19
Nodes (12): DELETE(), GET(), PATCH(), RouteContext, GET(), POST(), parseCampusInput(), ParseResult (+4 more)

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

### Community 148 - "[id]/form18/route.ts"
Cohesion: 0.15
Nodes (18): GET(), RouteContext, GET(), notFound(), RouteContext, listPoints(), loadForm18(), person() (+10 more)

### Community 149 - "overdue-badge.tsx"
Cohesion: 0.25
Nodes (15): Badge(), plural(), ReviewOverdueBadge(), reviewOverdueDays(), SubmissionOverdueBadge(), submissionOverdueDays(), TermDeadlines, daysOverdue() (+7 more)

### Community 150 - "program-join-request-manager.tsx"
Cohesion: 0.10
Nodes (27): notPending(), PATCH(), RouteContext, POST(), RejectProgramJoinRequestDialogProps, applyJoinRequestDecision(), ProgramJoinRequestListParams, JOIN_REQUEST_EXPAND (+19 more)

### Community 151 - "form18-panel.tsx"
Cohesion: 0.10
Nodes (28): Form18Panel(), run(), Form18PanelProps, NewPointForm(), PointForm(), PointFormProps, PointRow(), PointRowProps (+20 more)

### Community 152 - "app-shell.tsx"
Cohesion: 0.27
Nodes (7): Sidebar(), SidebarProps, canAnywhere(), Capability, getNavItems(), NAV_ITEMS, NavItem

### Community 153 - "[id]/form17/route.test.ts"
Cohesion: 0.18
Nodes (9): ctx, FORM, get(), HOLDERS, INPUT, LATEST, mocks, put() (+1 more)

### Community 155 - "dean/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 156 - "program-chair/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 157 - "[pointId]/route.ts"
Cohesion: 0.19
Nodes (12): DELETE(), ctx, EDIT, given(), HOLDERS, mocks, patch(), point() (+4 more)

### Community 158 - "[pointId]/route.ts"
Cohesion: 0.19
Nodes (17): conflict(), Loaded, notFound(), PATCH(), reviewerCheck(), RouteContext, Task plan (one reviewable change each, lint and tests green after each), Point (+9 more)

### Community 159 - "syllabus-timeline.tsx"
Cohesion: 0.33
Nodes (8): by(), currentLine(), describeEntry(), DOT, stageName(), SyllabusTimeline(), SyllabusTimelineProps, TimelineEntry

### Community 160 - "prospectus-item/route.test.ts"
Cohesion: 0.25
Nodes (5): base, forbidden(), listResult, mocks, rows

### Community 161 - "[id]/form18/route.test.ts"
Cohesion: 0.12
Nodes (10): ctx, HOLDERS, LATEST, mocks, post(), base, forbidden(), listResult (+2 more)

### Community 162 - "stand-in/route.test.ts"
Cohesion: 0.22
Nodes (4): ctx, HOLDERS, ITEMS, mocks

### Community 163 - "next"
Cohesion: 0.05
Nodes (22): forbidden(), input, mocks, pb, candidates, ctx, mocks, syllabus (+14 more)

### Community 164 - "review/route.ts"
Cohesion: 0.11
Nodes (24): conflict(), conflictMessage(), POST(), RouteContext, DecisionConflict, DecisionInput, explainConflict(), FormFacts (+16 more)

### Community 165 - "Phase 6: Hardening"
Cohesion: 0.06
Nodes (48): ACTION_LABELS, version(), Schema changes (to apply to `pb_schema.json`), Accessibility pass, Audit module, Boundaries, Decisions (2026-10-28), End-to-end tests (+40 more)

### Community 166 - "Feature walkthrough"
Cohesion: 0.20
Nodes (18): 0. Before you start, 1. Cast, Feature walkthrough, Part 10 — Negative checks, Part 11 — Keyboard and accessibility pass, Part 1 — Admin setup (as `admin`), Part 2 — Org chain and roles, Part 3 — Registration and joining a program (+10 more)

### Community 167 - "transfer-lead-dialog.tsx"
Cohesion: 0.24
Nodes (9): TransferLeadDialog(), handleTransfer(), TransferLeadDialogProps, transferLead(), LEAD_REASON_MAX, LEAD_REASON_MIN, parseLeadTransfer(), ParseResult (+1 more)

### Community 169 - "program-reviewer/route.ts"
Cohesion: 0.25
Nodes (13): DELETE(), PATCH(), RouteContext, GET(), POST(), programHasActiveReviewer(), toProgramReviewerResponse(), parseProgramReviewerInput() (+5 more)

### Community 170 - "faculty/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 171 - "syllabus-client.ts"
Cohesion: 0.13
Nodes (36): JustificationPanel(), adopt(), handlePreview(), handleSave(), run(), STATUS_LABELS, SignedCopyPanel(), handleReturn() (+28 more)

### Community 173 - "[versionId]/file/route.test.ts"
Cohesion: 0.33
Nodes (4): ctx, mocks, syllabus, version

### Community 174 - "printable-forms.tsx"
Cohesion: 0.31
Nodes (7): metadata, PageProps, SyllabusFormsPage(), PrintableForms(), Forms and export, Form17ExportData, Form181ExportData

### Community 175 - "citl-director/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 176 - "program-reviewer/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 177 - "fdis-chair/route.test.ts"
Cohesion: 0.12
Nodes (10): base, forbidden(), listResult, mocks, rows, unauthorized(), base, listResult (+2 more)

### Community 178 - "department-head/route.test.ts"
Cohesion: 0.12
Nodes (10): base, forbidden(), listResult, mocks, rows, unauthorized(), ctx, mocks (+2 more)

### Community 190 - "export/form17/route.ts"
Cohesion: 0.18
Nodes (14): GET(), notFound(), RouteContext, form17Facts(), listForm17Answers(), loadForm17(), listApprovals(), loadExportSyllabus() (+6 more)

### Community 191 - "vpaa/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 192 - "upload-version-modal.tsx"
Cohesion: 0.47
Nodes (5): UploadVersionModal(), handleSubmit(), UploadVersionModalProps, uploadSyllabusVersion(), MAX_PDF_BYTES

### Community 194 - "validators/syllabus-stand-in.ts"
Cohesion: 0.53
Nodes (4): isStage(), ParseResult, parseStandInInput(), StandInInput

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

### Community 200 - "syllabus/route.test.ts"
Cohesion: 0.33
Nodes (3): input, mocks, openTerm

### Community 201 - "audit-phase-a.ts"
Cohesion: 0.33
Nodes (6): AssignmentRow, ASSIGNMENTS, main(), requireEnv(), UNASSIGNED_FILTER, UserRow

### Community 202 - "submit/route.test.ts"
Cohesion: 0.33
Nodes (4): ctx, draft, HOLDERS, mocks

### Community 203 - "types/review-queue.ts"
Cohesion: 0.27
Nodes (10): listNeedsProxy(), listReviewQueue(), request(), ReviewQueueParams, QueueQuery, QUEUE_STATUSES, QueueStatus, ReviewQueueItem (+2 more)

### Community 204 - "course/[id]/route.test.ts"
Cohesion: 0.33
Nodes (4): ctx, EXPAND, forbidden(), mocks

### Community 205 - "types/faculty.ts"
Cohesion: 0.60
Nodes (3): ParseResult, FacultyInput, FacultyUpdateInput

### Community 208 - "options/route.test.ts"
Cohesion: 0.40
Nodes (3): base, mocks, users

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
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1188 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **73 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `pocketbase` connect `pocketbase` to `program-join-request-manager.tsx`, `org-visibility.ts`, `react`, `college-manager.tsx`, `export/form17/route.ts`, `revise-workspace.tsx`, `dependencies`, `course-modal.tsx`, `Package & Tooling Config`, `scan/route.ts`, `campus/[id]/route.ts`, `resolveSyllabusAccess`, `pocketbase`, `timeline/route.ts`, `vpaa/route.ts`, `department-head-manager.tsx`, `react`, `Faculty UI`, `[id]/form18/route.ts`, `program-join-request-manager.tsx`, `lib/prospectus-duplicate.ts`, `next`, `form18-panel.tsx`, `VPAA UI`, `react`, `Program Chair UI`, `[pointId]/route.ts`, `dean-manager.tsx`, `auth-client.ts`, `submit/route.ts`, `authorize`, `createAdminPb`, `review/route.ts`, `Phase 6: Hardening`, `types/notification.ts`, `[id]/justification/route.ts`, `lib/dashboard.ts`, `program-reviewer-manager.tsx`, `resolveSyllabusAccess`, `types/syllabus.ts`, `syllabus-client.ts`, `Syllabus`, `helpers.ts`, `program-reviewer/route.ts`, `dashboard-manager.tsx`, `lib/review-queue.ts`, `vitest`, `citl-director/route.ts`, `citl-director/route.ts`, `pocketbase`, `prospectus-client.ts`, `syllabus-manager.tsx`, `export/form17/route.ts`, `audit-phase-a.ts`, `types/review-queue.ts`, `types/faculty.ts`, `types/term.ts`, `user-manager.tsx`, `program-chair/route.ts`, `approval-verify.ts`, `dean/route.ts`, `lib/syllabus-reference.ts`, `types/prospectus-item.ts`, `05-a11y.spec.ts`, `dean-manager.tsx`?**
  _High betweenness centrality (0.175) - this node is a cross-community bridge._
- **Are the 80 inferred relationships involving `createAdminPb()` (e.g. with `audit/route.test.ts` and `register/route.test.ts`) actually correct?**
  _`createAdminPb()` has 80 INFERRED edges - model-reasoned connections that need verification._
- **What connects `RFC-4180`, `Org chain (campus, college, department, program)`, `Scoped list visibility (lib/org-visibility.ts)` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `program-join-request-manager.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._
- **Why does `next` connect `next` to `dashboard-scope.ts`, `college-manager.tsx`, `lib/syllabus-review.ts`, `validators/user.ts`, `Package & Tooling Config`, `scan/route.ts`, `handlePbError`, `mock-auth.ts`, `getCurrentUser`, `mockAuth`, `resolveSyllabusAccess`, `pocketbase`, `vpaa/route.ts`, `react`, `lib/prospectus-duplicate.ts`, `export/route.ts`, `auth-client.ts`, `dean-manager.tsx`, `submit/route.ts`, `authorize`, `createAdminPb`, `Syllabus`, `types/notification.ts`, `resolveSyllabusAccess`, `[id]/justification/route.ts`, `types/syllabus.ts`, `register/page.tsx`, `course/route.test.ts`, `fdis-chair/route.ts`, `dashboard-manager.tsx`, `lib/review-queue.ts`, `vitest`, `citl-director/route.ts`, `prospectus-item/[id]/route.ts`, `syllabus-detail.tsx`, `types/roles.ts`, `syllabus-manager.tsx`, `review/route.test.ts`, `types/term.ts`, `program-chair/route.ts`, `users.ts`, `approval-verify.ts`, `dean/route.ts`, `lib/syllabus-reference.ts`, `review-workspace.tsx`, `pocketbase`, `dean-manager.tsx`, `org-visibility.ts`, `validators/dashboard.ts`, `dependencies`, `revise-workspace.tsx`, `Phase 5: Visibility and communication`, `campus/[id]/route.ts`, `Phase 3: Review engine and forms`, `prospectus/route.test.ts`, `[id]/form18/route.ts`, `program-join-request-manager.tsx`, `app-shell.tsx`, `[id]/form17/route.test.ts`, `dean/route.test.ts`, `program-chair/route.test.ts`, `[pointId]/route.ts`, `[pointId]/route.ts`, `prospectus-item/route.test.ts`, `[id]/form18/route.test.ts`, `stand-in/route.test.ts`, `next`, `review/route.ts`, `Phase 6: Hardening`, `program-reviewer/route.ts`, `faculty/route.test.ts`, `syllabus-client.ts`, `[versionId]/file/route.test.ts`, `printable-forms.tsx`, `citl-director/route.test.ts`, `program-reviewer/route.test.ts`, `fdis-chair/route.test.ts`, `department-head/route.test.ts`, `export/form17/route.ts`, `vpaa/route.test.ts`, `college/route.test.ts`, `syllabus-reference/route.test.ts`, `lead/route.test.ts`, `resubmit/route.test.ts`, `syllabus/route.test.ts`, `submit/route.test.ts`, `course/[id]/route.test.ts`, `options/route.test.ts`, `school-year/route.test.ts`, `forms/justification.ts`, `review-queue/route.test.ts`?**
  _High betweenness centrality (0.154) - this node is a cross-community bridge._
- **Are the 21 inferred relationships involving `handlePbError()` (e.g. with `Testing` and `Testing`) actually correct?**
  _`handlePbError()` has 21 INFERRED edges - model-reasoned connections that need verification._
- **Should `dashboard-scope.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07827260458839407 - nodes in this community are weakly interconnected._