# Graph Report - syllabusv2  (2026-10-28)

## Corpus Check
- 654 files · ~298,953 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 4, .ico 1, .css 1)

## Summary
- 3343 nodes · 10483 edges · 210 communities (137 shown, 73 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 322 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8c2c4230`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- prospectus-item-manager.tsx
- dashboard-scope.ts
- react
- prospectus/[id]/route.ts
- lib/syllabus-review.ts
- Project Docs & Domain Rules
- validators/user.ts
- course-modal.tsx
- Package & Tooling Config
- User Admin UI
- fdis-chair/route.ts
- mock-auth.ts
- getCurrentUser
- global-setup.ts
- mockAuth
- requireUser
- pocketbase
- timeline/route.ts
- college/[id]/route.ts
- resolveSyllabusAccess
- Department UI
- Faculty UI
- lib/prospectus-duplicate.ts
- capability-rules.ts
- Syllabus
- next
- export/route.ts
- VPAA UI
- summary/route.ts
- Program Chair UI
- dean/route.test.ts
- dean-manager.tsx
- TypeScript Config
- Department Head API
- department-head/route.test.ts
- faculty/route.test.ts
- getUserRoles
- types/notification.ts
- request
- signed-copy/route.ts
- lib/dashboard.ts
- program-reviewer-manager.tsx
- types/dashboard.ts
- lib/syllabus.ts
- canSomewhere
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
- createAdminPb
- syllabus-detail.tsx
- vitest
- react
- PostCSS Config
- resubmit/route.ts
- term-manager.tsx
- react
- transfer-lead-dialog.tsx
- AppUser
- vpaa/route.ts
- register/page.tsx
- reference-manager.tsx
- review-workspace.tsx
- pocketbase
- Syllabus Development Guidelines
- syllabus-workflow.ts
- types/term.ts
- 05-a11y.spec.ts
- Phase 4: Reviewer experience
- Phase 2: Syllabus submission
- org-visibility.ts
- scripts
- scan/route.ts
- dependencies
- handlePbError
- revise-workspace.tsx
- Phase 5: Visibility and communication
- Retention policy
- lib/form17.ts
- Criteria
- audit-manager.tsx
- Phase 3: Review engine and forms
- 3. Letter Body (in order, top to bottom)
- README.md
- CITL Syllabus Review Guide (Instructions for Part B)
- prospectus/route.test.ts
- auth-client.ts
- overdue-badge.tsx
- program-join-request-manager.tsx
- form18-panel.tsx
- notification-bell.tsx
- [id]/form17/route.test.ts
- types/program-join-request.ts
- types/justification.ts
- [pointId]/route.ts
- syllabus-client.ts
- program-join-request/[id]/route.test.ts
- term/[id]/route.ts
- audit-log.test.ts
- stand-in/route.test.ts
- requireUserMock
- validators/syllabus-review.ts
- Phase 6: Hardening
- validators/course.ts
- syllabus-modal.tsx
- prospectus-item/route.ts
- syllabus-timeline.tsx
- justification-panel.tsx
- review/route.test.ts
- addAudit
- citl-director/route.test.ts
- program-join-request/route.ts
- fdis-chair/route.test.ts
- program-join-request/route.test.ts
- export/form18/route.test.ts
- vpaa/route.test.ts
- co-authors-panel.tsx
- duplicate/route.test.ts
- [id]/form18/route.test.ts
- syllabus-reference/route.test.ts
- term/route.test.ts
- scope-filters.tsx
- validators/audit.ts
- audit-phase-a.ts
- resubmit/route.test.ts
- [copyId]/route.test.ts
- stand-in-candidates/route.test.ts
- college/route.test.ts
- co-author-candidates/route.test.ts
- [versionId]/file/route.test.ts
- syllabus/route.test.ts
- school-year/[id]/route.test.ts

## God Nodes (most connected - your core abstractions)
1. `createAdminPb()` - 347 edges
2. `handlePbError()` - 247 edges
3. `next` - 226 edges
4. `requireUser()` - 221 edges
5. `vitest` - 153 edges
6. `pocketbase` - 135 edges
7. `mockAuth()` - 125 edges
8. `getUserRoles` - 123 edges
9. `react` - 109 edges
10. `@headlessui/react` - 94 edges

## Surprising Connections (you probably didn't know these)
- `Deadlines` --references--> `ReviewQueueItem`  [INFERRED]
  docs/specs/phase-5-visibility.md → types/review-queue.ts
- `API` --references--> `requireUser()`  [INFERRED]
  docs/specs/phase-2-syllabus-submission.md → lib/auth.ts
- `Timeline` --references--> `resolveSyllabusAccess()`  [INFERRED]
  docs/specs/phase-4-reviewer-experience.md → lib/syllabus.ts
- `Boundaries` --references--> `toAuditResponse()`  [INFERRED]
  docs/specs/phase-6-hardening.md → lib/audit-log.ts
- `Proposals (accept or amend before task 1)` --references--> `justificationScope()`  [INFERRED]
  docs/specs/phase-5-visibility.md → lib/dashboard-scope.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Review engine flow (Phase 3)** — agents_syllabus_workflow_state_machine, agents_review_chain, syllabus_review_system_project_plan__v5__syllabus_statuses, syllabus_review_system_project_plan__v5__routing_readiness, agents_proxy_reviewer, agents_approval_reference [EXTRACTED 1.00]
- **University review forms supported by the system** — agents_form17, agents_form18_1, agents_justification_form, syllabus_review_system_project_plan__v5__enhanced_obe_syllabus, syllabus_review_system_project_plan__v5__form_definitions_versioning [EXTRACTED 1.00]
- **Phase A migration from role-based PERMISSIONS to derived-role capabilities** — project_context_users_role_field, project_context_permissions_map, agents_isadmin, agents_getuserroles, agents_capability_authorization [INFERRED 0.85]

## Communities (210 total, 73 thin omitted)

### Community 0 - "prospectus-item-manager.tsx"
Cohesion: 0.13
Nodes (19): DeleteProspectusItemDialog(), handleDelete(), DeleteProspectusItemDialogProps, itemProspectusLabel(), ModalState, ProspectusItemManager(), ProspectusItemManagerProps, prospectusLabel() (+11 more)

### Community 1 - "dashboard-scope.ts"
Cohesion: 0.06
Nodes (32): anyOf(), Bind, filterInScope(), programInScope(), programMatches(), programScopeFilter(), scopePrograms(), unique() (+24 more)

### Community 2 - "react"
Cohesion: 0.15
Nodes (22): DeleteSchoolYearDialog(), handleDelete(), DeleteSchoolYearDialogProps, ModalState, SchoolYearManager(), SchoolYearManagerProps, SchoolYearModal(), handleSubmit() (+14 more)

### Community 3 - "prospectus/[id]/route.ts"
Cohesion: 0.28
Nodes (10): DELETE(), GET(), PATCH(), RouteContext, GET(), POST(), PROSPECTUS_EXPAND, toProspectusResponse() (+2 more)

### Community 4 - "lib/syllabus-review.ts"
Cohesion: 0.15
Nodes (24): conflict(), GET(), notFound(), PUT(), RouteContext, Authors, canDesignate(), holdersAt() (+16 more)

### Community 5 - "Project Docs & Domain Rules"
Cohesion: 0.06
Nodes (37): AGENTS.md (agent guidance), Approval reference code (SYL-<term>-<seq>-S<stage>), Capability-based authorization (can, requireUser, authorize, canSomewhere), Form 17 (OVPAA-F-INS-017) review checklist, Form 18-1 (CITL-F-018) review points, getUserRoles resolver (derived roles from assignment records), users.isAdmin (only stored role), Justification Form (missing lead signature) (+29 more)

### Community 6 - "validators/user.ts"
Cohesion: 0.18
Nodes (15): isDuplicateEmail(), POST(), RegisterFormProps, DEFAULT_EMAIL_DOMAINS, parseDomainList(), ParsedRegistration, parseRegisterInput(), ParseResult (+7 more)

### Community 7 - "course-modal.tsx"
Cohesion: 0.10
Nodes (27): CourseCombobox(), CourseComboboxProps, CourseOption, CourseModal(), handleSubmit(), CourseModalMode, CourseModalProps, NUMBER_FIELDS (+19 more)

### Community 8 - "Package & Tooling Config"
Cohesion: 0.09
Nodes (27): eslintConfig, devDependencies, @axe-core/playwright@^4.14.0, eslint@^9, eslint-config-next@16.3.6, @playwright/test@^1.64.1, tailwindcss@^4, @tailwindcss/postcss@^4 (+19 more)

### Community 9 - "User Admin UI"
Cohesion: 0.10
Nodes (24): metadata, UserPage(), ACTING_AS_LABELS, metadata, PageProps, Row(), VerifyApprovalPage(), SyllabusVersions() (+16 more)

### Community 10 - "fdis-chair/route.ts"
Cohesion: 0.22
Nodes (15): DELETE(), PATCH(), RouteContext, GET(), POST(), getActiveFdisChair(), hasActiveFdisChair(), isFdisChair() (+7 more)

### Community 11 - "mock-auth.ts"
Cohesion: 0.07
Nodes (20): evaluateCapability(), base, listResult, mocks, ctx, forbidden(), mocks, ctx (+12 more)

### Community 12 - "getCurrentUser"
Cohesion: 0.08
Nodes (31): CitlDirectorPage(), metadata, CoursePage(), metadata, DeanPage(), metadata, DepartmentHeadPage(), metadata (+23 more)

### Community 13 - "global-setup.ts"
Cohesion: 0.15
Nodes (22): APP_PORT, APP_URL, DIST_DIR, LOCAL_PB, PB_BIN, PB_PORT, PB_URL, ROOT (+14 more)

### Community 14 - "mockAuth"
Cohesion: 0.05
Nodes (37): ctx, forbidden(), mocks, unauthorized(), ctx, forbidden(), mocks, unauthorized() (+29 more)

### Community 15 - "requireUser"
Cohesion: 0.07
Nodes (59): GET(), GET(), RouteContext, GET(), notFound(), RouteContext, GET(), RouteContext (+51 more)

### Community 16 - "pocketbase"
Cohesion: 0.11
Nodes (24): metadata, ProgramPage(), CourseManagerProps, ModalState, DeleteCourseDialogProps, DeleteProgramDialog(), handleDelete(), DeleteProgramDialogProps (+16 more)

### Community 17 - "timeline/route.ts"
Cohesion: 0.16
Nodes (13): buildTimeline(), name(), Named, TimelineEvent, TimelineVersion, base, SYLLABUS_EVENT_TYPES, SyllabusEvent (+5 more)

### Community 18 - "college/[id]/route.ts"
Cohesion: 0.09
Nodes (25): DELETE(), GET(), PATCH(), RouteContext, GET(), POST(), DELETE(), GET() (+17 more)

### Community 19 - "resolveSyllabusAccess"
Cohesion: 0.10
Nodes (32): notFound(), POST(), RouteContext, Task plan (one reviewable change each, lint and tests green after each), listPoints(), loadForm18(), person(), POINT_EXPAND (+24 more)

### Community 20 - "Department UI"
Cohesion: 0.16
Nodes (20): DepartmentPage(), metadata, DeleteDepartmentDialog(), handleDelete(), DeleteDepartmentDialogProps, DepartmentManager(), ModalState, DepartmentModal() (+12 more)

### Community 21 - "Faculty UI"
Cohesion: 0.24
Nodes (14): DeleteFacultyDialog(), handleDelete(), DeleteFacultyDialogProps, FacultyManager(), toggleActive(), FacultyManagerProps, FacultyModal(), handleSubmit() (+6 more)

### Community 22 - "lib/prospectus-duplicate.ts"
Cohesion: 0.16
Nodes (17): GET(), POST(), applyDuplicate(), batchSize(), DuplicatePlan, MAX_BATCH_REQUESTS, newRecordId(), planDuplicate() (+9 more)

### Community 23 - "capability-rules.ts"
Cohesion: 0.06
Nodes (44): DashboardPage(), metadata, AppShell(), Sidebar(), SidebarProps, 0. Before you start, 1. Cast, Feature walkthrough (+36 more)

### Community 24 - "Syllabus"
Cohesion: 0.10
Nodes (34): POST(), POST(), isListedForProgram(), ReferenceSourceParams, findLiveReference(), listReferenceSources(), LIVE_REFERENCE_FILTER, REFERENCE_EXPAND (+26 more)

### Community 25 - "next"
Cohesion: 0.07
Nodes (33): GET(), POST(), POST(), GET(), POST(), GET(), GET(), AUTH_COOKIE (+25 more)

### Community 26 - "export/route.ts"
Cohesion: 0.08
Nodes (43): cap(), GET(), RFC-4180, Task plan (one reviewable change each, lint and tests green after each), csvCell, fileSlug(), toCsv(), aggregate() (+35 more)

### Community 27 - "VPAA UI"
Cohesion: 0.17
Nodes (18): DeleteVpaaDialog(), handleDelete(), DeleteVpaaDialogProps, VpaaManager(), toggleActive(), VpaaManagerProps, VpaaModal(), handleSubmit() (+10 more)

### Community 28 - "summary/route.ts"
Cohesion: 0.37
Nodes (9): GET(), GET(), GET(), GET(), paging(), resolveScopedPrograms(), dashboardScope(), OUT_OF_SCOPE_ERROR (+1 more)

### Community 29 - "Program Chair UI"
Cohesion: 0.24
Nodes (14): DeleteProgramChairDialog(), handleDelete(), DeleteProgramChairDialogProps, ProgramChairManager(), toggleActive(), ProgramChairManagerProps, ProgramChairModal(), handleSubmit() (+6 more)

### Community 30 - "dean/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 31 - "dean-manager.tsx"
Cohesion: 0.06
Nodes (60): CampusPage(), metadata, CollegePage(), metadata, CampusManager(), formatDate(), ModalState, CampusModal() (+52 more)

### Community 32 - "TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 33 - "Department Head API"
Cohesion: 0.20
Nodes (17): DELETE(), PATCH(), RouteContext, GET(), POST(), departmentHasActiveHead(), isHeadOfDepartment(), listDepartmentsHeadedBy() (+9 more)

### Community 34 - "department-head/route.test.ts"
Cohesion: 0.05
Nodes (26): base, forbidden(), listResult, mocks, rows, unauthorized(), base, forbidden() (+18 more)

### Community 35 - "faculty/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 36 - "getUserRoles"
Cohesion: 0.15
Nodes (23): conflict(), POST(), RouteContext, notFound(), POST(), RouteContext, notFound(), RouteContext (+15 more)

### Community 37 - "types/notification.ts"
Cohesion: 0.11
Nodes (28): PATCH(), RouteContext, GET(), Notifications, countUnread(), markAllRead(), NOTIFICATION_EXPAND, ownFilter() (+20 more)

### Community 38 - "request"
Cohesion: 0.15
Nodes (23): SignedCopyPanel(), handleReturn(), handleUpload(), run(), SignedCopyPanelProps, StandInPicker(), StandInPickerProps, StandInsPanel() (+15 more)

### Community 39 - "signed-copy/route.ts"
Cohesion: 0.11
Nodes (26): RouteContext, notFound(), POST(), RouteContext, listSignedCopies(), SIGNED_COPY_EXPAND, signedCopyFileName(), toSignedCopyResponse() (+18 more)

### Community 40 - "lib/dashboard.ts"
Cohesion: 0.13
Nodes (18): awaitingSignedCopyQuery(), emptyList(), listAwaitingSignedCopy(), loadFilteredPrograms(), programClause(), ProgramRecord, RowSyllabus, ScopedPrograms (+10 more)

### Community 41 - "program-reviewer-manager.tsx"
Cohesion: 0.22
Nodes (15): DeleteProgramReviewerDialog(), handleDelete(), DeleteProgramReviewerDialogProps, ProgramReviewerManager(), toggleActive(), ProgramReviewerManagerProps, ProgramReviewerModal(), handleSubmit() (+7 more)

### Community 42 - "types/dashboard.ts"
Cohesion: 0.10
Nodes (24): addTally(), blankTally(), byName(), completionRows(), row(), Tally, withRate(), DashboardQuery (+16 more)

### Community 43 - "lib/syllabus.ts"
Cohesion: 0.15
Nodes (25): DELETE(), leadOnly(), notDraft(), notFound(), PATCH(), RouteContext, GET(), Task plan (one reviewable change each, lint and tests green after each) (+17 more)

### Community 44 - "canSomewhere"
Cohesion: 0.24
Nodes (14): DeleteDepartmentHeadDialog(), handleDelete(), DeleteDepartmentHeadDialogProps, DepartmentHeadManager(), toggleActive(), DepartmentHeadManagerProps, DepartmentHeadModal(), handleSubmit() (+6 more)

### Community 45 - "course/route.test.ts"
Cohesion: 0.25
Nodes (5): base, forbidden(), listResult, mocks, rows

### Community 46 - "helpers.ts"
Cohesion: 0.34
Nodes (13): adminPb(), answerForm17AllYes(), approveInUi(), auditFor(), createDraft(), getSyllabus(), loadSeed(), ok() (+5 more)

### Community 47 - "export.ts"
Cohesion: 0.12
Nodes (28): metadata, PageProps, SyllabusFormsPage(), Form17View(), Line(), Form181View(), PointsTable(), PrintableForms() (+20 more)

### Community 48 - "dashboard-manager.tsx"
Cohesion: 0.15
Nodes (26): DashboardManager(), defaultTerm(), JustificationsPanel(), STATE_STYLES, STATES, daysSince(), ErrorBanner(), ExportLink() (+18 more)

### Community 49 - "Enhanced OBE Syllabus on `[FILL IN: course name]`"
Cohesion: 0.07
Nodes (27): About This File, BUKIDNON STATE UNIVERSITY, Course Information, Creating a syllabus, Differences between the two signatory blocks, Document Structure (in order), Enhanced OBE Syllabus on `[FILL IN: course name]`, Enhanced OBE Syllabus Template (BukSU) (+19 more)

### Community 50 - "lib/review-queue.ts"
Cohesion: 0.11
Nodes (33): GET(), Review queue, Testing, Cover, heldStages(), holdsStageFor(), listAwaitingReviewIds(), loadMyStandIns() (+25 more)

### Community 51 - "signed-copy/route.test.ts"
Cohesion: 0.10
Nodes (15): ctx, download(), mocks, pdf, upload(), ctx, mocks, pdf (+7 more)

### Community 52 - "citl-director/route.ts"
Cohesion: 0.12
Nodes (28): PATCH(), RouteContext, POST(), CitlDirectorManager(), toggleActive(), CitlDirectorManagerProps, CitlDirectorModal(), handleSubmit() (+20 more)

### Community 53 - "next"
Cohesion: 0.06
Nodes (22): mocks, mocks, valid, candidates, ctx, get(), mocks, syllabus (+14 more)

### Community 54 - "pocketbase"
Cohesion: 0.07
Nodes (42): ReviewWithExpand, VerifiedApproval, AuditNames, STATUS_LABELS, UPLOAD_LABELS, isFacultyOfProgram(), isChairOfProgram(), listProgramsChairedBy() (+34 more)

### Community 55 - "prospectus-client.ts"
Cohesion: 0.14
Nodes (25): DeleteProspectusDialog(), handleDelete(), DeleteProspectusDialogProps, DuplicateProspectusDialog(), handleConfirm(), DuplicateProspectusDialogProps, ItemList(), ModalState (+17 more)

### Community 56 - "createAdminPb"
Cohesion: 0.11
Nodes (34): DELETE(), GET(), PATCH(), RouteContext, GET(), POST(), DELETE(), PATCH() (+26 more)

### Community 57 - "syllabus-detail.tsx"
Cohesion: 0.12
Nodes (22): metadata, PageProps, SyllabusDetailPage(), DeleteSyllabusDialog(), handleDelete(), DeleteSyllabusDialogProps, groupPoints(), ReviewPointsHistory() (+14 more)

### Community 58 - "vitest"
Cohesion: 0.11
Nodes (13): vitest, ctx, get(), mocks, mocks, mocks, USER, mocks (+5 more)

### Community 59 - "react"
Cohesion: 0.11
Nodes (25): metadata, ReviewQueuePage(), metadata, SyllabusPage(), ProgramFilterCombobox(), ProgramOption, age(), ReviewQueueManager() (+17 more)

### Community 110 - "resubmit/route.ts"
Cohesion: 0.09
Nodes (51): POST(), RouteContext, conflict(), POST(), RouteContext, POST(), RouteContext, Task plan (one reviewable change each, lint and tests green after each) (+43 more)

### Community 111 - "term-manager.tsx"
Cohesion: 0.13
Nodes (24): DeleteTermDialog(), handleDelete(), DeleteTermDialogProps, ModalState, TermManager(), toggleOpen(), TermManagerProps, TermModal() (+16 more)

### Community 112 - "react"
Cohesion: 0.15
Nodes (22): CitlDirectorModalProps, DeanModalProps, DepartmentHeadModalProps, FacultyModalProps, FdisChairModalProps, ProgramChairModalProps, ProgramReviewerModalProps, DeleteUserDialog() (+14 more)

### Community 113 - "transfer-lead-dialog.tsx"
Cohesion: 0.22
Nodes (8): TransferLeadDialog(), handleTransfer(), TransferLeadDialogProps, transferLead(), LEAD_REASON_MAX, LEAD_REASON_MIN, parseLeadTransfer(), ParseResult

### Community 114 - "AppUser"
Cohesion: 0.10
Nodes (22): DELETE(), PATCH(), RouteContext, GET(), POST(), ASSIGNMENTS, hasOtherAdmin(), listActiveAssignments() (+14 more)

### Community 115 - "vpaa/route.ts"
Cohesion: 0.26
Nodes (12): DELETE(), PATCH(), RouteContext, GET(), POST(), parseVpaaInput(), parseVpaaUpdate(), getActiveVpaa() (+4 more)

### Community 118 - "register/page.tsx"
Cohesion: 0.18
Nodes (14): LoginPage(), LoginPageProps, metadata, metadata, RegisterPage(), RegisterPageProps, LoginForm(), handleSubmit() (+6 more)

### Community 119 - "reference-manager.tsx"
Cohesion: 0.09
Nodes (31): metadata, SyllabusReferencePage(), COPY, DialogAction, ReferenceActionDialog(), handleSubmit(), ReferenceActionDialogProps, ReferenceManager() (+23 more)

### Community 120 - "review-workspace.tsx"
Cohesion: 0.16
Nodes (13): metadata, PageProps, SyllabusReviewPage(), ReviewDecisionDialog(), handleConfirm(), ReviewDecisionDialogProps, ReviewWorkspace(), useSyllabusWorkspace() (+5 more)

### Community 121 - "pocketbase"
Cohesion: 0.22
Nodes (15): DeleteFdisChairDialog(), handleDelete(), DeleteFdisChairDialogProps, FdisChairManager(), toggleActive(), FdisChairManagerProps, FdisChairModal(), handleSubmit() (+7 more)

### Community 122 - "Syllabus Development Guidelines"
Cohesion: 0.08
Nodes (23): 10. Syllabus Table Format, 11. Writing Good Outcomes, 12. Syllabus Creation Workflow, 13. Institutional Review Process, 14. Validation Checklist, 15. Output Behavior for Claude, 1. Role and Scope, 2. Bloom's Taxonomy Reference (+15 more)

### Community 123 - "syllabus-workflow.ts"
Cohesion: 0.08
Nodes (36): API, Workflow (`lib/syllabus-workflow.ts`, pure), approvalCode(), ApprovalCodeParts, parseApprovalCode(), SEMESTER_CODES, validStage(), findApproval() (+28 more)

### Community 124 - "types/term.ts"
Cohesion: 0.16
Nodes (20): SourceItem, ProspectusItemListParams, ParseResult, Course, ProspectusDuplicateInput, ProspectusDuplicateItem, ProspectusDuplicateResponse, ProspectusItem (+12 more)

### Community 125 - "05-a11y.spec.ts"
Cohesion: 0.25
Nodes (6): PAGES, TAGS, PASSWORD, findSyllabusId(), PEOPLE, Person

### Community 126 - "Phase 4: Reviewer experience"
Cohesion: 0.18
Nodes (10): Boundaries, Decisions (2026-10-27), Events (`lib/syllabus-events.ts`, server-only), Hub (`/syllabus/[id]`), Objective, Out of scope, Phase 4: Reviewer experience, Proposals (accept or amend before task 1) (+2 more)

### Community 127 - "Phase 2: Syllabus submission"
Cohesion: 0.20
Nodes (9): API, Capabilities, Decisions (2026-10-26), Definitions, Out of scope, Phase 2: Syllabus submission, Schema changes (to apply to `pb_schema.json`), UI (+1 more)

### Community 128 - "org-visibility.ts"
Cohesion: 0.07
Nodes (38): DELETE(), GET(), PATCH(), RouteContext, GET(), POST(), DELETE(), GET() (+30 more)

### Community 129 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, audit:phase-a, build, dev, lint, pb, start, test (+1 more)

### Community 130 - "scan/route.ts"
Cohesion: 0.15
Nodes (17): RouteContext, activeHolderName(), ensureBasedOn(), loadJustificationResponse(), userNames(), Current, editError(), eligibleAuthors() (+9 more)

### Community 131 - "dependencies"
Cohesion: 0.29
Nodes (7): dependencies, @headlessui/react@^2.2.10, next@16.3.6, pocketbase@^0.28.1, react@19.2.8, react-dom@19.2.8, react-dom

### Community 132 - "handlePbError"
Cohesion: 0.10
Nodes (36): DELETE(), DELETE(), PATCH(), RouteContext, GET(), POST(), DELETE(), PATCH() (+28 more)

### Community 133 - "revise-workspace.tsx"
Cohesion: 0.14
Nodes (21): metadata, PageProps, SyllabusRevisePage(), PdfPane(), PdfPaneProps, ResubmitSyllabusDialog(), handleResubmit(), ResubmitSyllabusDialogProps (+13 more)

### Community 134 - "Phase 5: Visibility and communication"
Cohesion: 0.17
Nodes (11): Boundaries, Dashboards, Deadlines, Decisions (2026-10-28), Objective, Out of scope, Phase 5: Visibility and communication, Proposals (accept or amend before task 1) (+3 more)

### Community 139 - "Retention policy"
Cohesion: 0.33
Nodes (5): Changing this policy, Removing records, Retention policy, Rule, Storage growth

### Community 140 - "lib/form17.ts"
Cohesion: 0.09
Nodes (37): notFound(), PUT(), RouteContext, changed(), Draft, draftFrom(), Form17Panel(), handleSave() (+29 more)

### Community 141 - "Criteria"
Cohesion: 0.12
Nodes (16): A. Preliminaries, B. Vision, Mission, Goals, Objectives, and Outcomes, C. Course Content, Closing Section, Criteria, D. Assessment, E. Learning Modality and Methods, F. Resources, Required Readings, and References (+8 more)

### Community 142 - "audit-manager.tsx"
Cohesion: 0.22
Nodes (11): AuditPage(), metadata, ACTION_LABELS, AuditManager(), AuditListResponse, AuditParams, listAudit(), request() (+3 more)

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

### Community 148 - "auth-client.ts"
Cohesion: 0.16
Nodes (15): metadata, RootLayout(), AppHeader(), unreadFor(), getInitials(), HeaderAuth(), handleLogout(), HeaderAuthProps (+7 more)

### Community 149 - "overdue-badge.tsx"
Cohesion: 0.23
Nodes (17): Badge(), plural(), ReviewOverdueBadge(), reviewOverdueDays(), SubmissionOverdueBadge(), submissionOverdueDays(), TermDeadlines, syllabusOverdue() (+9 more)

### Community 150 - "program-join-request-manager.tsx"
Cohesion: 0.14
Nodes (23): ProgramJoinRequestManager(), approve(), reloadAfterRowLeft(), ProgramJoinRequestManagerProps, RowDialog, STATUS_LABELS, STATUS_STYLES, ProgramJoinRequestModal() (+15 more)

### Community 151 - "form18-panel.tsx"
Cohesion: 0.09
Nodes (29): Form18Panel(), run(), Form18PanelProps, NewPointForm(), PointForm(), PointFormProps, PointRow(), PointRowProps (+21 more)

### Community 152 - "notification-bell.tsx"
Cohesion: 0.18
Nodes (20): metadata, NotificationsPage(), BellIcon(), BellPanel(), markAll(), open(), NotificationBell(), NotificationBellProps (+12 more)

### Community 153 - "[id]/form17/route.test.ts"
Cohesion: 0.18
Nodes (9): ctx, FORM, get(), HOLDERS, INPUT, LATEST, mocks, put() (+1 more)

### Community 155 - "types/program-join-request.ts"
Cohesion: 0.18
Nodes (17): DELETE(), notPending(), PATCH(), RouteContext, applyJoinRequestDecision(), JOIN_REQUEST_EXPAND, toProgramJoinRequestResponse(), parseProgramJoinRequestDecision() (+9 more)

### Community 156 - "types/justification.ts"
Cohesion: 0.22
Nodes (12): isObject(), parseJustificationInput(), parseJustificationReturn(), ParseResult, Justification, JUSTIFICATION_STATUSES, JustificationEntry, JustificationInput (+4 more)

### Community 157 - "[pointId]/route.ts"
Cohesion: 0.15
Nodes (21): conflict(), DELETE(), load(), Loaded, notFound(), PATCH(), reviewerCheck(), RouteContext (+13 more)

### Community 158 - "syllabus-client.ts"
Cohesion: 0.16
Nodes (16): AvailableListParams, SyllabusStatus, isObject(), ParseResult, parseSyllabusInput(), parseSyllabusUpdateInput(), parseSyllabusVersionInput(), JustificationResponse (+8 more)

### Community 159 - "program-join-request/[id]/route.test.ts"
Cohesion: 0.29
Nodes (5): approve, ctx, mocks, pending, SCOPE

### Community 160 - "term/[id]/route.ts"
Cohesion: 0.26
Nodes (12): GET(), PATCH(), RouteContext, GET(), POST(), toTermRecord(), toTermResponse(), isReviewDays() (+4 more)

### Community 161 - "audit-log.test.ts"
Cohesion: 0.16
Nodes (14): anyOf(), auditDetail(), auditFilter(), listAudit(), stateLabel(), syllabusLabels(), toAuditResponse(), unique() (+6 more)

### Community 162 - "stand-in/route.test.ts"
Cohesion: 0.22
Nodes (4): ctx, HOLDERS, ITEMS, mocks

### Community 163 - "requireUserMock"
Cohesion: 0.05
Nodes (23): listResult, mocks, ctx, EXPAND, forbidden(), mocks, base, forbidden() (+15 more)

### Community 164 - "validators/syllabus-review.ts"
Cohesion: 0.40
Nodes (4): ParseResult, parseReviewInput(), REVIEW_DECISIONS, ReviewInput

### Community 165 - "Phase 6: Hardening"
Cohesion: 0.17
Nodes (12): Accessibility pass, Boundaries, Decisions (2026-10-28), End-to-end tests, Lead reassignment, Objective, Out of scope, Phase 6: Hardening (+4 more)

### Community 166 - "validators/course.ts"
Cohesion: 0.27
Nodes (11): FieldResult, normalizeCourseCode(), NUMBER_FIELDS, parse(), parseCourseInput(), parseCourseUpdate(), parseNote(), parseNumber() (+3 more)

### Community 167 - "syllabus-modal.tsx"
Cohesion: 0.24
Nodes (8): AvailableCourseCombobox(), AvailableCourseComboboxProps, ProgramOption, SyllabusModal(), handleSubmit(), SyllabusModalProps, createSyllabus(), listAvailableSyllabi()

### Community 169 - "prospectus-item/route.ts"
Cohesion: 0.40
Nodes (9): GET(), POST(), PROSPECTUS_ITEM_EXPAND, toProspectusItemResponse(), isYearLevel(), parseProspectusItemInput(), parseProspectusItemUpdate(), ParseResult (+1 more)

### Community 170 - "syllabus-timeline.tsx"
Cohesion: 0.27
Nodes (10): by(), currentLine(), describeEntry(), DOT, stageName(), SyllabusTimeline(), SyllabusTimelineProps, version() (+2 more)

### Community 171 - "justification-panel.tsx"
Cohesion: 0.17
Nodes (18): JustificationLetterView(), JustificationPanel(), adopt(), handlePreview(), handleSave(), run(), STATUS_LABELS, buildJustificationLetter() (+10 more)

### Community 173 - "review/route.test.ts"
Cohesion: 0.20
Nodes (7): BY_STAGE, ctx, decide(), HOLDERS, mocks, NO_POINTS, VERSION

### Community 174 - "addAudit"
Cohesion: 0.28
Nodes (6): Audit module, Tasks, addAudit(), Batch, AuditEntry, AuditInput

### Community 175 - "citl-director/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 176 - "program-join-request/route.ts"
Cohesion: 0.53
Nodes (4): GET(), POST(), isJoinRequestStatus(), parseProgramJoinRequestInput()

### Community 177 - "fdis-chair/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 178 - "program-join-request/route.test.ts"
Cohesion: 0.22
Nodes (5): base, data, listResult, mocks, rows

### Community 190 - "export/form18/route.test.ts"
Cohesion: 0.33
Nodes (5): ctx, form18(), mocks, SYLLABUS, VERSION

### Community 191 - "vpaa/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 192 - "co-authors-panel.tsx"
Cohesion: 0.39
Nodes (7): CoAuthorPicker(), CoAuthorPickerProps, CoAuthorsPanel(), save(), CoAuthorsPanelProps, listCoAuthorCandidates(), updateSyllabusCoAuthors()

### Community 194 - "duplicate/route.test.ts"
Cohesion: 0.25
Nodes (4): forbidden(), input, mocks, pb

### Community 195 - "[id]/form18/route.test.ts"
Cohesion: 0.25
Nodes (5): ctx, HOLDERS, LATEST, mocks, post()

### Community 197 - "syllabus-reference/route.test.ts"
Cohesion: 0.25
Nodes (5): input, mocks, SCOPE, source, term

### Community 198 - "term/route.test.ts"
Cohesion: 0.25
Nodes (5): base, forbidden(), listResult, mocks, rows

### Community 199 - "scope-filters.tsx"
Cohesion: 0.38
Nodes (4): Option, ProgramCombobox(), ScopeFilters(), uniqueBy()

### Community 200 - "validators/audit.ts"
Cohesion: 0.43
Nodes (5): parseAuditQuery(), ParseResult, phtMidnight(), parse(), AuditQuery

### Community 201 - "audit-phase-a.ts"
Cohesion: 0.33
Nodes (6): AssignmentRow, ASSIGNMENTS, main(), requireEnv(), UNASSIGNED_FILTER, UserRow

### Community 202 - "resubmit/route.test.ts"
Cohesion: 0.29
Nodes (5): ctx, HOLDERS, mocks, resubmit(), returned

### Community 203 - "[copyId]/route.test.ts"
Cohesion: 0.29
Nodes (4): ctx, mocks, patch(), SCOPE

### Community 204 - "stand-in-candidates/route.test.ts"
Cohesion: 0.14
Nodes (11): ctx, form17(), mocks, SYLLABUS, VERSION, candidates, ctx, get() (+3 more)

### Community 205 - "college/route.test.ts"
Cohesion: 0.33
Nodes (3): base, listResult, mocks

### Community 208 - "co-author-candidates/route.test.ts"
Cohesion: 0.33
Nodes (4): candidates, ctx, mocks, syllabus

### Community 212 - "[versionId]/file/route.test.ts"
Cohesion: 0.33
Nodes (4): ctx, mocks, syllabus, version

### Community 213 - "syllabus/route.test.ts"
Cohesion: 0.33
Nodes (3): input, mocks, openTerm

### Community 214 - "school-year/[id]/route.test.ts"
Cohesion: 0.40
Nodes (3): ctx, forbidden(), mocks

## Knowledge Gaps
- **10 isolated node(s):** `RFC-4180`, `Org chain (campus, college, department, program)`, `Scoped list visibility (lib/org-visibility.ts)`, `Plain CRUD entities (campus, college, department, program, user)`, `Advisory PDF checks (informational only)` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1179 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **73 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `dashboard-scope.ts`, `prospectus/[id]/route.ts`, `lib/syllabus-review.ts`, `validators/user.ts`, `Package & Tooling Config`, `User Admin UI`, `fdis-chair/route.ts`, `mock-auth.ts`, `getCurrentUser`, `mockAuth`, `requireUser`, `pocketbase`, `college/[id]/route.ts`, `resolveSyllabusAccess`, `Department UI`, `lib/prospectus-duplicate.ts`, `capability-rules.ts`, `Syllabus`, `export/route.ts`, `summary/route.ts`, `dean/route.test.ts`, `dean-manager.tsx`, `Department Head API`, `department-head/route.test.ts`, `faculty/route.test.ts`, `getUserRoles`, `types/notification.ts`, `signed-copy/route.ts`, `lib/syllabus.ts`, `course/route.test.ts`, `export.ts`, `dashboard-manager.tsx`, `lib/review-queue.ts`, `signed-copy/route.test.ts`, `citl-director/route.ts`, `next`, `createAdminPb`, `syllabus-detail.tsx`, `vitest`, `react`, `resubmit/route.ts`, `AppUser`, `vpaa/route.ts`, `register/page.tsx`, `reference-manager.tsx`, `review-workspace.tsx`, `org-visibility.ts`, `scan/route.ts`, `dependencies`, `handlePbError`, `revise-workspace.tsx`, `lib/form17.ts`, `audit-manager.tsx`, `Phase 3: Review engine and forms`, `prospectus/route.test.ts`, `auth-client.ts`, `notification-bell.tsx`, `[id]/form17/route.test.ts`, `types/program-join-request.ts`, `[pointId]/route.ts`, `program-join-request/[id]/route.test.ts`, `term/[id]/route.ts`, `stand-in/route.test.ts`, `requireUserMock`, `prospectus-item/route.ts`, `review/route.test.ts`, `citl-director/route.test.ts`, `program-join-request/route.ts`, `fdis-chair/route.test.ts`, `program-join-request/route.test.ts`, `export/form18/route.test.ts`, `vpaa/route.test.ts`, `duplicate/route.test.ts`, `[id]/form18/route.test.ts`, `syllabus-reference/route.test.ts`, `term/route.test.ts`, `resubmit/route.test.ts`, `[copyId]/route.test.ts`, `stand-in-candidates/route.test.ts`, `college/route.test.ts`, `co-author-candidates/route.test.ts`, `[versionId]/file/route.test.ts`, `syllabus/route.test.ts`, `school-year/[id]/route.test.ts`?**
  _High betweenness centrality (0.171) - this node is a cross-community bridge._
- **Are the 79 inferred relationships involving `createAdminPb()` (e.g. with `audit/route.test.ts` and `register/route.test.ts`) actually correct?**
  _`createAdminPb()` has 79 INFERRED edges - model-reasoned connections that need verification._
- **What connects `RFC-4180`, `Org chain (campus, college, department, program)`, `Scoped list visibility (lib/org-visibility.ts)` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `prospectus-item-manager.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13230769230769232 - nodes in this community are weakly interconnected._
- **Why does `pocketbase` connect `pocketbase` to `prospectus-item-manager.tsx`, `org-visibility.ts`, `react`, `scan/route.ts`, `dependencies`, `validators/user.ts`, `course-modal.tsx`, `Package & Tooling Config`, `User Admin UI`, `fdis-chair/route.ts`, `lib/form17.ts`, `audit-manager.tsx`, `requireUser`, `pocketbase`, `timeline/route.ts`, `college/[id]/route.ts`, `resolveSyllabusAccess`, `Department UI`, `Faculty UI`, `program-join-request-manager.tsx`, `lib/prospectus-duplicate.ts`, `Syllabus`, `next`, `form18-panel.tsx`, `VPAA UI`, `types/program-join-request.ts`, `Program Chair UI`, `[pointId]/route.ts`, `dean-manager.tsx`, `syllabus-client.ts`, `audit-log.test.ts`, `Department Head API`, `types/justification.ts`, `getUserRoles`, `types/notification.ts`, `signed-copy/route.ts`, `lib/dashboard.ts`, `program-reviewer-manager.tsx`, `lib/syllabus.ts`, `canSomewhere`, `helpers.ts`, `addAudit`, `dashboard-manager.tsx`, `lib/review-queue.ts`, `signed-copy/route.test.ts`, `citl-director/route.ts`, `next`, `prospectus-client.ts`, `react`, `audit-phase-a.ts`, `resubmit/route.ts`, `term-manager.tsx`, `react`, `reference-manager.tsx`, `pocketbase`, `types/term.ts`, `05-a11y.spec.ts`?**
  _High betweenness centrality (0.166) - this node is a cross-community bridge._
- **Are the 20 inferred relationships involving `handlePbError()` (e.g. with `Testing` and `Testing`) actually correct?**
  _`handlePbError()` has 20 INFERRED edges - model-reasoned connections that need verification._
- **Should `dashboard-scope.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.061979648473635525 - nodes in this community are weakly interconnected._