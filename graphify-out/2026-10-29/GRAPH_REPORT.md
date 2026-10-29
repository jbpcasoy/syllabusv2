# Graph Report - syllabusv2  (2026-10-29)

## Corpus Check
- 661 files · ~305,497 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 4, .ico 1, .css 1)

## Summary
- 3379 nodes · 10627 edges · 212 communities (138 shown, 74 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 331 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6ed7694d`
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
- stand-ins-panel.tsx
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
- can
- Program Chair UI
- auth-client.ts
- dean-manager.tsx
- TypeScript Config
- faculty/route.ts
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
- form17-view.tsx
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
- review/route.test.ts
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
- proxy.ts
- 3. Letter Body (in order, top to bottom)
- README.md
- CITL Syllabus Review Guide (Instructions for Part B)
- prospectus/route.test.ts
- [id]/form18/route.ts
- overdue-badge.tsx
- program-join-request-manager.tsx
- form18-panel.tsx
- app-shell.tsx
- college/[id]/route.ts
- dean/route.test.ts
- program-chair/route.test.ts
- [pointId]/route.ts
- [pointId]/route.ts
- next
- prospectus-item/route.test.ts
- term/route.test.ts
- stand-in/route.test.ts
- requireUserMock
- review/route.ts
- Phase 6: Hardening
- Feature walkthrough
- transfer-lead-dialog.tsx
- program-reviewer/route.ts
- types/form18.ts
- syllabus-client.ts
- [versionId]/file/route.test.ts
- printable-forms.tsx
- citl-director/route.test.ts
- form17-panel.tsx
- fdis-chair/route.test.ts
- department-head/route.test.ts
- export/form17/route.test.ts
- vpaa/route.test.ts
- export/form18/route.test.ts
- register/page.tsx
- [id]/form18/route.test.ts
- syllabus-reference/route.test.ts
- lead/route.test.ts
- resubmit/route.test.ts
- stand-in-candidates/route.test.ts
- audit-phase-a.ts
- vitest
- types/review-queue.ts
- course/[id]/route.test.ts
- fdis-chair/[id]/route.test.ts
- program-reviewer/[id]/route.test.ts
- campus/route.test.ts
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
7. `mockAuth()` - 126 edges
8. `getUserRoles` - 125 edges
9. `react` - 112 edges
10. `@headlessui/react` - 95 edges

## Surprising Connections (you probably didn't know these)
- `Deadlines` --references--> `ReviewQueueItem`  [INFERRED]
  docs/specs/phase-5-visibility.md → types/review-queue.ts
- `Hub (`/syllabus/[id]`)` --references--> `SyllabusVersions()`  [INFERRED]
  docs/specs/phase-4-reviewer-experience.md → components/syllabus/syllabus-versions.tsx
- `Timeline` --references--> `resolveSyllabusAccess()`  [INFERRED]
  docs/specs/phase-4-reviewer-experience.md → lib/syllabus.ts
- `Proposals (accept or amend before task 1)` --references--> `justificationScope()`  [INFERRED]
  docs/specs/phase-5-visibility.md → lib/dashboard-scope.ts
- `Definitions` --references--> `getSyllabusAccess()`  [INFERRED]
  docs/specs/phase-2-syllabus-submission.md → lib/syllabus.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Review engine flow (Phase 3)** — agents_syllabus_workflow_state_machine, agents_review_chain, syllabus_review_system_project_plan__v5__syllabus_statuses, syllabus_review_system_project_plan__v5__routing_readiness, agents_proxy_reviewer, agents_approval_reference [EXTRACTED 1.00]
- **University review forms supported by the system** — agents_form17, agents_form18_1, agents_justification_form, syllabus_review_system_project_plan__v5__enhanced_obe_syllabus, syllabus_review_system_project_plan__v5__form_definitions_versioning [EXTRACTED 1.00]
- **Phase A migration from role-based PERMISSIONS to derived-role capabilities** — project_context_users_role_field, project_context_permissions_map, agents_isadmin, agents_getuserroles, agents_capability_authorization [INFERRED 0.85]

## Communities (212 total, 74 thin omitted)

### Community 0 - "program-join-request-manager.tsx"
Cohesion: 0.14
Nodes (20): ProgramJoinRequestManager(), approve(), reloadAfterRowLeft(), ProgramJoinRequestManagerProps, RowDialog, STATUS_LABELS, STATUS_STYLES, ProgramJoinRequestModal() (+12 more)

### Community 1 - "dashboard-scope.ts"
Cohesion: 0.08
Nodes (27): anyOf(), Bind, filterInScope(), justificationScope(), OUT_OF_SCOPE_ERROR, programInScope(), programMatches(), programScopeFilter() (+19 more)

### Community 2 - "react"
Cohesion: 0.14
Nodes (24): DeleteSchoolYearDialog(), handleDelete(), DeleteSchoolYearDialogProps, ModalState, SchoolYearManager(), changed(), SchoolYearManagerProps, SchoolYearModal() (+16 more)

### Community 3 - "college-manager.tsx"
Cohesion: 0.16
Nodes (20): CollegePage(), metadata, CollegeManager(), ModalState, CollegeModal(), handleSubmit(), CollegeModalMode, CollegeModalProps (+12 more)

### Community 4 - "lib/syllabus-review.ts"
Cohesion: 0.11
Nodes (30): Notifications, Testing, Authors, Batch, clip(), notificationText(), NotifyEvent, stageActors() (+22 more)

### Community 5 - "Project Docs & Domain Rules"
Cohesion: 0.06
Nodes (37): AGENTS.md (agent guidance), Approval reference code (SYL-<term>-<seq>-S<stage>), Capability-based authorization (can, requireUser, authorize, canSomewhere), Form 17 (OVPAA-F-INS-017) review checklist, Form 18-1 (CITL-F-018) review points, getUserRoles resolver (derived roles from assignment records), users.isAdmin (only stored role), Justification Form (missing lead signature) (+29 more)

### Community 6 - "validators/user.ts"
Cohesion: 0.17
Nodes (13): RegisterFormProps, DEFAULT_EMAIL_DOMAINS, ParsedRegistration, parseRegisterInput(), ParseResult, EMAIL, MAX_NAME, MAX_PASSWORD (+5 more)

### Community 7 - "course-modal.tsx"
Cohesion: 0.08
Nodes (39): CourseCombobox(), CourseComboboxProps, CourseOption, CourseModal(), handleSubmit(), CourseModalMode, CourseModalProps, NUMBER_FIELDS (+31 more)

### Community 8 - "Package & Tooling Config"
Cohesion: 0.09
Nodes (27): eslintConfig, devDependencies, @axe-core/playwright@^4.14.0, eslint@^9, eslint-config-next@16.3.6, @playwright/test@^1.64.1, tailwindcss@^4, @tailwindcss/postcss@^4 (+19 more)

### Community 9 - "stand-ins-panel.tsx"
Cohesion: 0.31
Nodes (6): StandInPicker(), StandInPickerProps, StandInsPanel(), save(), StandInsPanelProps, setStandIn()

### Community 10 - "handlePbError"
Cohesion: 0.10
Nodes (32): GET(), GET(), POST(), DELETE(), GET(), PATCH(), RouteContext, GET() (+24 more)

### Community 11 - "mock-auth.ts"
Cohesion: 0.05
Nodes (27): base, listResult, mocks, base, listResult, mocks, ctx, forbidden() (+19 more)

### Community 12 - "getCurrentUser"
Cohesion: 0.08
Nodes (33): CitlDirectorPage(), metadata, CoursePage(), metadata, DeanPage(), metadata, DepartmentHeadPage(), metadata (+25 more)

### Community 13 - "global-setup.ts"
Cohesion: 0.15
Nodes (22): APP_PORT, APP_URL, DIST_DIR, LOCAL_PB, PB_BIN, PB_PORT, PB_URL, ROOT (+14 more)

### Community 14 - "mockAuth"
Cohesion: 0.05
Nodes (36): ctx, forbidden(), mocks, unauthorized(), ctx, forbidden(), mocks, unauthorized() (+28 more)

### Community 15 - "resolveSyllabusAccess"
Cohesion: 0.19
Nodes (15): RouteContext, GET(), notFound(), RouteContext, listSignedCopies(), SIGNED_COPY_EXPAND, signedCopyFileName(), toSignedCopyResponse() (+7 more)

### Community 16 - "pocketbase"
Cohesion: 0.10
Nodes (32): metadata, ProgramPage(), CourseManagerProps, ModalState, NotificationBellProps, DeleteProgramDialog(), handleDelete(), DeleteProgramDialogProps (+24 more)

### Community 17 - "timeline/route.ts"
Cohesion: 0.17
Nodes (12): buildTimeline(), name(), Named, TimelineEvent, TimelineVersion, base, SYLLABUS_EVENT_TYPES, SyllabusEvent (+4 more)

### Community 18 - "vpaa/route.ts"
Cohesion: 0.20
Nodes (16): DELETE(), PATCH(), RouteContext, GET(), POST(), ParseResult, parseVpaaInput(), parseVpaaUpdate() (+8 more)

### Community 19 - "department-head-manager.tsx"
Cohesion: 0.20
Nodes (16): DeleteDepartmentHeadDialog(), handleDelete(), DeleteDepartmentHeadDialogProps, DepartmentHeadManager(), toggleActive(), DepartmentHeadManagerProps, DepartmentHeadModal(), handleSubmit() (+8 more)

### Community 20 - "react"
Cohesion: 0.15
Nodes (22): DepartmentPage(), metadata, DeleteDepartmentDialog(), handleDelete(), DeleteDepartmentDialogProps, DepartmentManager(), ModalState, DepartmentModal() (+14 more)

### Community 21 - "Faculty UI"
Cohesion: 0.20
Nodes (16): DeleteFacultyDialog(), handleDelete(), DeleteFacultyDialogProps, FacultyManager(), toggleActive(), FacultyManagerProps, FacultyModal(), handleSubmit() (+8 more)

### Community 22 - "lib/prospectus-duplicate.ts"
Cohesion: 0.15
Nodes (20): GET(), POST(), applyDuplicate(), batchSize(), DuplicatePlan, MAX_BATCH_REQUESTS, newRecordId(), planDuplicate() (+12 more)

### Community 23 - "capability-rules.ts"
Cohesion: 0.09
Nodes (15): CAPABILITIES, Rule, RULES, ScopeChain, admin, ADMIN_ONLY, chair, dean (+7 more)

### Community 24 - "index.ts"
Cohesion: 0.18
Nodes (16): FORM17_REV04, FORM18_REV01, checklistCriteria(), FORM17_REVISIONS, form17Status(), FORM18_REVISIONS, isLegendCode(), legendEntries() (+8 more)

### Community 25 - "next"
Cohesion: 0.05
Nodes (60): POST(), POST(), GET(), isDuplicateEmail(), POST(), GET(), GET(), GET() (+52 more)

### Community 26 - "export/route.ts"
Cohesion: 0.11
Nodes (33): cap(), GET(), RFC-4180, Task plan (one reviewable change each, lint and tests green after each), csvCell, fileSlug(), toCsv(), aggregate() (+25 more)

### Community 27 - "VPAA UI"
Cohesion: 0.22
Nodes (15): DeleteVpaaDialog(), handleDelete(), DeleteVpaaDialogProps, VpaaManager(), toggleActive(), VpaaManagerProps, VpaaModal(), handleSubmit() (+7 more)

### Community 28 - "can"
Cohesion: 0.21
Nodes (15): GET(), PATCH(), RouteContext, GET(), POST(), ProspectusListParams, PROSPECTUS_EXPAND, toProspectusResponse() (+7 more)

### Community 29 - "Program Chair UI"
Cohesion: 0.20
Nodes (16): DeleteProgramChairDialog(), handleDelete(), DeleteProgramChairDialogProps, ProgramChairManager(), toggleActive(), ProgramChairManagerProps, ProgramChairModal(), handleSubmit() (+8 more)

### Community 30 - "auth-client.ts"
Cohesion: 0.25
Nodes (11): getInitials(), HeaderAuth(), handleLogout(), HeaderAuthProps, LoginInput, logout(), request(), RegisterInput (+3 more)

### Community 31 - "dean-manager.tsx"
Cohesion: 0.15
Nodes (22): CampusPage(), metadata, CampusManager(), formatDate(), ModalState, CampusModal(), handleSubmit(), CampusModalMode (+14 more)

### Community 32 - "TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 33 - "faculty/route.ts"
Cohesion: 0.20
Nodes (12): DELETE(), PATCH(), RouteContext, GET(), POST(), metadata, SyllabusPage(), isFacultyOfProgram() (+4 more)

### Community 34 - "authorize"
Cohesion: 0.12
Nodes (26): DELETE(), PATCH(), RouteContext, GET(), POST(), DELETE(), GET(), PATCH() (+18 more)

### Community 35 - "createAdminPb"
Cohesion: 0.13
Nodes (27): DELETE(), PATCH(), RouteContext, GET(), POST(), DELETE(), GET(), PATCH() (+19 more)

### Community 36 - "Syllabus"
Cohesion: 0.08
Nodes (43): GET(), notFound(), POST(), RouteContext, POST(), conflict(), POST(), RouteContext (+35 more)

### Community 37 - "types/notification.ts"
Cohesion: 0.06
Nodes (49): PATCH(), RouteContext, GET(), metadata, RootLayout(), AppHeader(), unreadFor(), AppShell() (+41 more)

### Community 38 - "resolveSyllabusAccess"
Cohesion: 0.11
Nodes (39): GET(), notFound(), PUT(), RouteContext, load(), POST(), POST(), RouteContext (+31 more)

### Community 39 - "[id]/justification/route.ts"
Cohesion: 0.08
Nodes (40): conflict(), GET(), load(), notFound(), PATCH(), PUT(), RouteContext, ensureBasedOn() (+32 more)

### Community 40 - "lib/dashboard.ts"
Cohesion: 0.13
Nodes (18): awaitingSignedCopyQuery(), emptyList(), listAwaitingSignedCopy(), loadFilteredPrograms(), programClause(), ProgramRecord, RowSyllabus, ScopedPrograms (+10 more)

### Community 41 - "program-reviewer-manager.tsx"
Cohesion: 0.20
Nodes (16): DeleteProgramReviewerDialog(), handleDelete(), DeleteProgramReviewerDialogProps, ProgramReviewerManager(), toggleActive(), ProgramReviewerManagerProps, ProgramReviewerModal(), handleSubmit() (+8 more)

### Community 42 - "types/dashboard.ts"
Cohesion: 0.13
Nodes (18): addTally(), blankTally(), byName(), completionRows(), row(), Tally, withRate(), EMC (+10 more)

### Community 43 - "types/syllabus.ts"
Cohesion: 0.07
Nodes (55): conflict(), PUT(), RouteContext, DELETE(), GET(), leadOnly(), notEditable(), notFound() (+47 more)

### Community 44 - "register/page.tsx"
Cohesion: 0.29
Nodes (8): LoginPage(), LoginPageProps, metadata, LoginForm(), handleSubmit(), LoginFormProps, login(), safeRedirect()

### Community 45 - "course/route.test.ts"
Cohesion: 0.25
Nodes (5): base, forbidden(), listResult, mocks, rows

### Community 46 - "helpers.ts"
Cohesion: 0.34
Nodes (13): adminPb(), answerForm17AllYes(), approveInUi(), auditFor(), createDraft(), getSyllabus(), loadSeed(), ok() (+5 more)

### Community 47 - "form17-view.tsx"
Cohesion: 0.32
Nodes (9): Form17View(), Line(), Form181View(), PointsTable(), ACTING_AS, FormHeader(), SignatureLines(), ExportPoint (+1 more)

### Community 48 - "dashboard-manager.tsx"
Cohesion: 0.12
Nodes (30): DashboardManager(), defaultTerm(), JustificationsPanel(), STATE_STYLES, STATES, daysSince(), ErrorBanner(), ExportLink() (+22 more)

### Community 49 - "Enhanced OBE Syllabus on `[FILL IN: course name]`"
Cohesion: 0.07
Nodes (27): About This File, BUKIDNON STATE UNIVERSITY, Course Information, Creating a syllabus, Differences between the two signatory blocks, Document Structure (in order), Enhanced OBE Syllabus on `[FILL IN: course name]`, Enhanced OBE Syllabus Template (BukSU) (+19 more)

### Community 50 - "lib/review-queue.ts"
Cohesion: 0.13
Nodes (29): GET(), Review queue, Testing, Cover, heldStages(), holdsStageFor(), listAwaitingReviewIds(), loadMyStandIns() (+21 more)

### Community 51 - "signed-copy/route.test.ts"
Cohesion: 0.14
Nodes (10): ctx, mocks, pdf, upload(), ctx, draft, file, mocks (+2 more)

### Community 52 - "citl-director/route.ts"
Cohesion: 0.19
Nodes (17): CitlDirectorManager(), toggleActive(), CitlDirectorManagerProps, CitlDirectorModal(), handleSubmit(), CitlDirectorModalProps, DeleteCitlDirectorDialog(), handleDelete() (+9 more)

### Community 53 - "citl-director/route.ts"
Cohesion: 0.22
Nodes (15): DELETE(), PATCH(), RouteContext, GET(), POST(), getActiveCitlDirector(), hasActiveCitlDirector(), isCitlDirector() (+7 more)

### Community 54 - "pocketbase"
Cohesion: 0.19
Nodes (15): listStandInCandidates(), listStandIns(), STAND_IN_EXPAND, toStandInResponse(), ParseResult, fakePb(), filter(), record (+7 more)

### Community 55 - "prospectus-client.ts"
Cohesion: 0.15
Nodes (18): DeleteProspectusDialog(), handleDelete(), DeleteProspectusDialogProps, DuplicateProspectusDialog(), handleConfirm(), DuplicateProspectusDialogProps, ItemList(), ProspectusManager() (+10 more)

### Community 56 - "prospectus-item/[id]/route.ts"
Cohesion: 0.14
Nodes (22): GET(), PATCH(), RouteContext, GET(), POST(), metadata, UserPage(), can() (+14 more)

### Community 57 - "syllabus-detail.tsx"
Cohesion: 0.09
Nodes (29): metadata, PageProps, SyllabusDetailPage(), DeleteSyllabusDialog(), handleDelete(), DeleteSyllabusDialogProps, SubmitSyllabusDialog(), handleSubmit() (+21 more)

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
Nodes (36): GET(), PATCH(), RouteContext, DeleteTermDialog(), handleDelete(), DeleteTermDialogProps, ModalState, TermManager() (+28 more)

### Community 112 - "user-manager.tsx"
Cohesion: 0.13
Nodes (24): DeleteUserDialog(), handleDelete(), DeleteUserDialogProps, describeAccess(), KIND_LABELS, ModalState, UserManager(), UserManagerProps (+16 more)

### Community 113 - "program-chair/route.ts"
Cohesion: 0.22
Nodes (15): DELETE(), PATCH(), RouteContext, GET(), POST(), isChairOfProgram(), listProgramsChairedBy(), programHasActiveChair() (+7 more)

### Community 114 - "users.ts"
Cohesion: 0.17
Nodes (17): DELETE(), GET(), PATCH(), RouteContext, GET(), POST(), avatarUrl(), ASSIGNMENTS (+9 more)

### Community 115 - "[code]/page.tsx"
Cohesion: 0.22
Nodes (9): ACTING_AS_LABELS, metadata, PageProps, Row(), VerifyApprovalPage(), metadata, VerifyPage(), VerifyForm() (+1 more)

### Community 118 - "dean/route.ts"
Cohesion: 0.20
Nodes (16): DELETE(), PATCH(), RouteContext, GET(), POST(), collegeHasActiveDean(), isDeanOfCollege(), listCollegesDeanedBy() (+8 more)

### Community 119 - "lib/syllabus-reference.ts"
Cohesion: 0.06
Nodes (63): PATCH(), RouteContext, POST(), COPY, DialogAction, ReferenceActionDialog(), handleSubmit(), ReferenceActionDialogProps (+55 more)

### Community 120 - "review-workspace.tsx"
Cohesion: 0.13
Nodes (19): metadata, PageProps, SyllabusReviewPage(), PdfPane(), PdfPaneProps, ReviewDecisionDialog(), handleConfirm(), ReviewDecisionDialogProps (+11 more)

### Community 121 - "pocketbase"
Cohesion: 0.16
Nodes (20): DeleteFdisChairDialog(), handleDelete(), DeleteFdisChairDialogProps, FdisChairManager(), toggleActive(), FdisChairManagerProps, FdisChairModal(), handleSubmit() (+12 more)

### Community 122 - "Syllabus Development Guidelines"
Cohesion: 0.08
Nodes (23): 10. Syllabus Table Format, 11. Writing Good Outcomes, 12. Syllabus Creation Workflow, 13. Institutional Review Process, 14. Validation Checklist, 15. Output Behavior for Claude, 1. Role and Scope, 2. Bloom's Taxonomy Reference (+15 more)

### Community 123 - "syllabus-workflow.ts"
Cohesion: 0.05
Nodes (53): API, Capabilities, Decisions (2026-10-26), Definitions, Out of scope, Phase 2: Syllabus submission, Schema changes (to apply to `pb_schema.json`), UI (+45 more)

### Community 124 - "types/prospectus-item.ts"
Cohesion: 0.12
Nodes (27): DeleteProspectusItemDialog(), handleDelete(), DeleteProspectusItemDialogProps, itemProspectusLabel(), ModalState, ProspectusItemManager(), ProspectusItemManagerProps, prospectusLabel() (+19 more)

### Community 125 - "05-a11y.spec.ts"
Cohesion: 0.25
Nodes (6): PAGES, TAGS, PASSWORD, findSyllabusId(), PEOPLE, Person

### Community 126 - "Phase 4: Reviewer experience"
Cohesion: 0.18
Nodes (10): Boundaries, Decisions (2026-10-27), Events (`lib/syllabus-events.ts`, server-only), Hub (`/syllabus/[id]`), Objective, Out of scope, Phase 4: Reviewer experience, Proposals (accept or amend before task 1) (+2 more)

### Community 127 - "dean-manager.tsx"
Cohesion: 0.16
Nodes (18): DeanManager(), toggleActive(), DeanManagerProps, DeanModal(), handleSubmit(), DeanModalProps, DeleteDeanDialog(), handleDelete() (+10 more)

### Community 128 - "org-visibility.ts"
Cohesion: 0.12
Nodes (23): GET(), DELETE(), GET(), PATCH(), RouteContext, GET(), GET(), POST() (+15 more)

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
Cohesion: 0.12
Nodes (27): GET(), notFound(), RouteContext, Batch, copyForm17(), form17Facts(), listForm17Answers(), loadForm17() (+19 more)

### Community 133 - "revise-workspace.tsx"
Cohesion: 0.16
Nodes (18): metadata, PageProps, SyllabusRevisePage(), ResubmitSyllabusDialog(), handleResubmit(), ResubmitSyllabusDialogProps, Check(), lastReturnedVersionNo() (+10 more)

### Community 134 - "Phase 5: Visibility and communication"
Cohesion: 0.10
Nodes (16): Boundaries, Dashboards, Deadlines, Decisions (2026-10-28), Objective, Out of scope, Phase 5: Visibility and communication, Proposals (accept or amend before task 1) (+8 more)

### Community 139 - "Retention policy"
Cohesion: 0.33
Nodes (5): Changing this policy, Removing records, Retention policy, Rule, Storage growth

### Community 140 - "export/form18/route.ts"
Cohesion: 0.18
Nodes (15): GET(), RouteContext, ApprovalStamp, buildForm17Export(), buildForm181Export(), ExportFormMeta, ExportSyllabus, INSTITUTION (+7 more)

### Community 141 - "Criteria"
Cohesion: 0.12
Nodes (16): A. Preliminaries, B. Vision, Mission, Goals, Objectives, and Outcomes, C. Course Content, Closing Section, Criteria, D. Assessment, E. Learning Modality and Methods, F. Resources, Required Readings, and References (+8 more)

### Community 142 - "campus/[id]/route.ts"
Cohesion: 0.19
Nodes (12): DELETE(), GET(), PATCH(), RouteContext, GET(), POST(), parseCampusInput(), ParseResult (+4 more)

### Community 143 - "proxy.ts"
Cohesion: 0.50
Nodes (4): config, isTokenExpired(), proxy(), PUBLIC_PATHS

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
Cohesion: 0.27
Nodes (11): GET(), notFound(), RouteContext, listPoints(), loadForm18(), person(), POINT_EXPAND, toPointResponse() (+3 more)

### Community 149 - "overdue-badge.tsx"
Cohesion: 0.25
Nodes (15): Badge(), plural(), ReviewOverdueBadge(), reviewOverdueDays(), SubmissionOverdueBadge(), submissionOverdueDays(), TermDeadlines, daysOverdue() (+7 more)

### Community 150 - "program-join-request-manager.tsx"
Cohesion: 0.10
Nodes (27): notPending(), PATCH(), RouteContext, POST(), RejectProgramJoinRequestDialogProps, applyJoinRequestDecision(), ProgramJoinRequestListParams, JOIN_REQUEST_EXPAND (+19 more)

### Community 151 - "form18-panel.tsx"
Cohesion: 0.13
Nodes (19): Form18Panel(), run(), Form18PanelProps, NewPointForm(), PointForm(), PointFormProps, PointRow(), PointRowProps (+11 more)

### Community 152 - "app-shell.tsx"
Cohesion: 0.27
Nodes (7): Sidebar(), SidebarProps, canAnywhere(), Capability, getNavItems(), NAV_ITEMS, NavItem

### Community 153 - "college/[id]/route.ts"
Cohesion: 0.12
Nodes (16): DELETE(), GET(), PATCH(), RouteContext, Child, CHILDREN, describeChildren(), joinParts() (+8 more)

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
Nodes (16): conflict(), Loaded, notFound(), PATCH(), reviewerCheck(), RouteContext, Task plan (one reviewable change each, lint and tests green after each), Point (+8 more)

### Community 159 - "next"
Cohesion: 0.08
Nodes (17): approve, ctx, mocks, pending, SCOPE, candidates, ctx, mocks (+9 more)

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
Cohesion: 0.07
Nodes (18): base, listResult, mocks, base, forbidden(), listResult, mocks, rows (+10 more)

### Community 164 - "review/route.ts"
Cohesion: 0.07
Nodes (44): conflict(), conflictMessage(), POST(), RouteContext, Task plan (one reviewable change each, lint and tests green after each), Tasks, approvalCode(), ApprovalCodeParts (+36 more)

### Community 165 - "Phase 6: Hardening"
Cohesion: 0.05
Nodes (51): AuditPage(), metadata, ACTION_LABELS, AuditManager(), version(), Schema changes (to apply to `pb_schema.json`), Accessibility pass, Audit module (+43 more)

### Community 166 - "Feature walkthrough"
Cohesion: 0.20
Nodes (18): 0. Before you start, 1. Cast, Feature walkthrough, Part 10 — Negative checks, Part 11 — Keyboard and accessibility pass, Part 1 — Admin setup (as `admin`), Part 2 — Org chain and roles, Part 3 — Registration and joining a program (+10 more)

### Community 167 - "transfer-lead-dialog.tsx"
Cohesion: 0.20
Nodes (11): CoAuthorPicker(), CoAuthorPickerProps, CoAuthorsPanel(), save(), CoAuthorsPanelProps, TransferLeadDialog(), handleTransfer(), TransferLeadDialogProps (+3 more)

### Community 169 - "program-reviewer/route.ts"
Cohesion: 0.25
Nodes (13): DELETE(), PATCH(), RouteContext, GET(), POST(), programHasActiveReviewer(), toProgramReviewerResponse(), parseProgramReviewerInput() (+5 more)

### Community 170 - "types/form18.ts"
Cohesion: 0.29
Nodes (10): isObject(), parsePointInput(), parsePointUpdate(), ParseResult, text(), MAX_PAGE_NUMBER, MAX_POINT_TEXT, POINT_STATUSES (+2 more)

### Community 171 - "syllabus-client.ts"
Cohesion: 0.13
Nodes (36): JustificationPanel(), adopt(), handlePreview(), handleSave(), run(), STATUS_LABELS, SignedCopyPanel(), handleReturn() (+28 more)

### Community 173 - "[versionId]/file/route.test.ts"
Cohesion: 0.33
Nodes (4): ctx, mocks, syllabus, version

### Community 174 - "printable-forms.tsx"
Cohesion: 0.29
Nodes (8): metadata, PageProps, SyllabusFormsPage(), PrintableForms(), Forms and export, Form17ExportData, Form181ExportData, getForm181Export()

### Community 175 - "citl-director/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 176 - "form17-panel.tsx"
Cohesion: 0.33
Nodes (6): Draft, draftFrom(), Form17Panel(), handleSave(), Form17PanelProps, saveForm17()

### Community 177 - "fdis-chair/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 178 - "department-head/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 190 - "export/form17/route.test.ts"
Cohesion: 0.33
Nodes (5): ctx, form17(), mocks, SYLLABUS, VERSION

### Community 191 - "vpaa/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 192 - "export/form18/route.test.ts"
Cohesion: 0.33
Nodes (5): ctx, form18(), mocks, SYLLABUS, VERSION

### Community 194 - "register/page.tsx"
Cohesion: 0.36
Nodes (7): metadata, RegisterPage(), RegisterPageProps, RegisterForm(), handleSubmit(), register(), parseDomainList()

### Community 195 - "[id]/form18/route.test.ts"
Cohesion: 0.25
Nodes (5): ctx, HOLDERS, LATEST, mocks, post()

### Community 197 - "syllabus-reference/route.test.ts"
Cohesion: 0.25
Nodes (5): input, mocks, SCOPE, source, term

### Community 198 - "lead/route.test.ts"
Cohesion: 0.25
Nodes (4): ctx, mocks, put(), SCOPE

### Community 199 - "resubmit/route.test.ts"
Cohesion: 0.29
Nodes (5): ctx, HOLDERS, mocks, resubmit(), returned

### Community 200 - "stand-in-candidates/route.test.ts"
Cohesion: 0.29
Nodes (6): candidates, ctx, get(), HOLDERS, mocks, syllabus

### Community 201 - "audit-phase-a.ts"
Cohesion: 0.33
Nodes (6): AssignmentRow, ASSIGNMENTS, main(), requireEnv(), UNASSIGNED_FILTER, UserRow

### Community 202 - "vitest"
Cohesion: 0.07
Nodes (17): vitest, mocks, ctx, draft, HOLDERS, mocks, ctx, mocks (+9 more)

### Community 203 - "types/review-queue.ts"
Cohesion: 0.27
Nodes (10): listNeedsProxy(), listReviewQueue(), request(), ReviewQueueParams, QueueQuery, QUEUE_STATUSES, QueueStatus, ReviewQueueItem (+2 more)

### Community 204 - "course/[id]/route.test.ts"
Cohesion: 0.33
Nodes (4): ctx, EXPAND, forbidden(), mocks

### Community 205 - "fdis-chair/[id]/route.test.ts"
Cohesion: 0.33
Nodes (4): ctx, forbidden(), mocks, unauthorized()

### Community 206 - "program-reviewer/[id]/route.test.ts"
Cohesion: 0.33
Nodes (4): ctx, forbidden(), mocks, unauthorized()

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
- **74 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `pocketbase` connect `citl-director/route.ts` to `program-join-request-manager.tsx`, `org-visibility.ts`, `react`, `college-manager.tsx`, `export/form17/route.ts`, `lib/syllabus-review.ts`, `dependencies`, `course-modal.tsx`, `Package & Tooling Config`, `export/form18/route.ts`, `campus/[id]/route.ts`, `resolveSyllabusAccess`, `pocketbase`, `timeline/route.ts`, `vpaa/route.ts`, `department-head-manager.tsx`, `react`, `Faculty UI`, `[id]/form18/route.ts`, `program-join-request-manager.tsx`, `lib/prospectus-duplicate.ts`, `next`, `VPAA UI`, `can`, `Program Chair UI`, `[pointId]/route.ts`, `dean-manager.tsx`, `auth-client.ts`, `authorize`, `createAdminPb`, `review/route.ts`, `Phase 6: Hardening`, `types/notification.ts`, `[id]/justification/route.ts`, `lib/dashboard.ts`, `program-reviewer-manager.tsx`, `resolveSyllabusAccess`, `types/syllabus.ts`, `syllabus-client.ts`, `Syllabus`, `helpers.ts`, `types/form18.ts`, `dashboard-manager.tsx`, `program-reviewer/route.ts`, `lib/review-queue.ts`, `signed-copy/route.test.ts`, `citl-director/route.ts`, `pocketbase`, `syllabus-manager.tsx`, `audit-phase-a.ts`, `vitest`, `types/review-queue.ts`, `types/term.ts`, `user-manager.tsx`, `program-chair/route.ts`, `dean/route.ts`, `lib/syllabus-reference.ts`, `review-workspace.tsx`, `pocketbase`, `types/prospectus-item.ts`, `05-a11y.spec.ts`, `dean-manager.tsx`?**
  _High betweenness centrality (0.193) - this node is a cross-community bridge._
- **Are the 80 inferred relationships involving `createAdminPb()` (e.g. with `audit/route.test.ts` and `register/route.test.ts`) actually correct?**
  _`createAdminPb()` has 80 INFERRED edges - model-reasoned connections that need verification._
- **What connects `RFC-4180`, `Org chain (campus, college, department, program)`, `Scoped list visibility (lib/org-visibility.ts)` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `program-join-request-manager.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._
- **Why does `next` connect `next` to `dashboard-scope.ts`, `college-manager.tsx`, `validators/user.ts`, `Package & Tooling Config`, `handlePbError`, `mock-auth.ts`, `getCurrentUser`, `mockAuth`, `resolveSyllabusAccess`, `pocketbase`, `vpaa/route.ts`, `react`, `lib/prospectus-duplicate.ts`, `export/route.ts`, `can`, `auth-client.ts`, `dean-manager.tsx`, `faculty/route.ts`, `authorize`, `createAdminPb`, `Syllabus`, `types/notification.ts`, `resolveSyllabusAccess`, `[id]/justification/route.ts`, `types/syllabus.ts`, `register/page.tsx`, `course/route.test.ts`, `dashboard-manager.tsx`, `lib/review-queue.ts`, `signed-copy/route.test.ts`, `citl-director/route.ts`, `prospectus-item/[id]/route.ts`, `syllabus-detail.tsx`, `types/roles.ts`, `syllabus-manager.tsx`, `review/route.test.ts`, `types/term.ts`, `program-chair/route.ts`, `users.ts`, `[code]/page.tsx`, `dean/route.ts`, `lib/syllabus-reference.ts`, `review-workspace.tsx`, `org-visibility.ts`, `validators/dashboard.ts`, `dependencies`, `export/form17/route.ts`, `revise-workspace.tsx`, `Phase 5: Visibility and communication`, `export/form18/route.ts`, `campus/[id]/route.ts`, `proxy.ts`, `prospectus/route.test.ts`, `[id]/form18/route.ts`, `program-join-request-manager.tsx`, `app-shell.tsx`, `college/[id]/route.ts`, `dean/route.test.ts`, `program-chair/route.test.ts`, `[pointId]/route.ts`, `[pointId]/route.ts`, `next`, `prospectus-item/route.test.ts`, `term/route.test.ts`, `stand-in/route.test.ts`, `requireUserMock`, `review/route.ts`, `Phase 6: Hardening`, `program-reviewer/route.ts`, `syllabus-client.ts`, `[versionId]/file/route.test.ts`, `printable-forms.tsx`, `citl-director/route.test.ts`, `fdis-chair/route.test.ts`, `department-head/route.test.ts`, `export/form17/route.test.ts`, `vpaa/route.test.ts`, `export/form18/route.test.ts`, `register/page.tsx`, `[id]/form18/route.test.ts`, `syllabus-reference/route.test.ts`, `lead/route.test.ts`, `resubmit/route.test.ts`, `stand-in-candidates/route.test.ts`, `vitest`, `course/[id]/route.test.ts`, `fdis-chair/[id]/route.test.ts`, `program-reviewer/[id]/route.test.ts`, `campus/route.test.ts`, `options/route.test.ts`, `school-year/route.test.ts`, `forms/justification.ts`, `review-queue/route.test.ts`?**
  _High betweenness centrality (0.141) - this node is a cross-community bridge._
- **Are the 21 inferred relationships involving `handlePbError()` (e.g. with `Testing` and `Testing`) actually correct?**
  _`handlePbError()` has 21 INFERRED edges - model-reasoned connections that need verification._
- **Should `dashboard-scope.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07827260458839407 - nodes in this community are weakly interconnected._