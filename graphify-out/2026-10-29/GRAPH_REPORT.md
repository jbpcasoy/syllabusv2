# Graph Report - syllabusv2  (2026-10-28)

## Corpus Check
- 654 files · ~301,306 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 4, .ico 1, .css 1)

## Summary
- 3352 nodes · 10513 edges · 218 communities (144 shown, 74 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 325 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8c09cf79`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- prospectus-item-manager.tsx
- dashboard-scope.ts
- react
- prospectus/[id]/route.ts
- lib/syllabus-review.ts
- Project Docs & Domain Rules
- types/user.ts
- course-modal.tsx
- Package & Tooling Config
- formatDate
- createAdminPb
- mock-auth.ts
- school-year/page.tsx
- global-setup.ts
- mockAuth
- lib/auth.ts
- pocketbase
- timeline/route.ts
- college/[id]/route.ts
- index.ts
- Department UI
- Faculty UI
- lib/prospectus-duplicate.ts
- capability-rules.ts
- pocketbase
- next
- export/route.ts
- VPAA UI
- dashboard-scope.ts
- Program Chair UI
- dean/route.test.ts
- dean-manager.tsx
- TypeScript Config
- Program
- department-head/route.test.ts
- requireUserMock
- getUserRoles
- types/notification.ts
- request
- signed-copy/route.ts
- lib/dashboard.ts
- program-reviewer-manager.tsx
- types/dashboard.ts
- types/syllabus.ts
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
- AppUser
- prospectus-client.ts
- course/[id]/route.ts
- syllabus-detail.tsx
- types/roles.ts
- review-queue-manager.tsx
- PostCSS Config
- resubmit/route.ts
- term-manager.tsx
- react
- transfer-lead-dialog.tsx
- AppUser
- scan/route.ts
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
- lib/justification.ts
- dependencies
- handlePbError
- revise-workspace.tsx
- Phase 5: Visibility and communication
- Retention policy
- lib/form17.ts
- Criteria
- audit-manager.tsx
- proxy.ts
- 3. Letter Body (in order, top to bottom)
- README.md
- CITL Syllabus Review Guide (Instructions for Part B)
- prospectus/route.test.ts
- getCurrentUser
- overdue-badge.tsx
- program-join-request-manager.tsx
- types/form18.ts
- form18-panel.tsx
- [id]/form17/route.test.ts
- program-join-request/route.ts
- types/justification.ts
- [pointId]/route.ts
- [pointId]/route.ts
- program-join-request/[id]/route.test.ts
- validators/term.ts
- audit-log.test.ts
- stand-in/route.test.ts
- prospectus-item/route.test.ts
- types/syllabus-review.ts
- Phase 6: Hardening
- Feature walkthrough
- syllabus-manager.tsx
- program-reviewer/route.ts
- [id]/justification/route.ts
- justification-panel.tsx
- review/route.test.ts
- addAudit
- citl-director/route.test.ts
- citl-director/route.ts
- fdis-chair/route.test.ts
- org-visibility.ts
- export/form17/route.ts
- vpaa/route.test.ts
- stand-ins-panel.tsx
- duplicate/route.test.ts
- [id]/form18/route.test.ts
- syllabus-reference/route.test.ts
- term/route.test.ts
- validators/syllabus-reference.ts
- validators/audit.ts
- audit-phase-a.ts
- resubmit/route.test.ts
- types/review-queue.ts
- stand-in-candidates/route.test.ts
- justifications/route.test.ts
- program-chair/route.test.ts
- program-reviewer/route.test.ts
- vitest
- syllabus-justification.ts
- school-year/route.test.ts
- forms/justification.ts
- [versionId]/file/route.test.ts
- syllabus/route.test.ts
- school-year/[id]/route.ts
- course/[id]/route.test.ts
- review-queue/route.test.ts
- campus/route.test.ts

## God Nodes (most connected - your core abstractions)
1. `createAdminPb()` - 347 edges
2. `handlePbError()` - 247 edges
3. `next` - 226 edges
4. `requireUser()` - 221 edges
5. `vitest` - 153 edges
6. `pocketbase` - 137 edges
7. `mockAuth()` - 125 edges
8. `getUserRoles` - 123 edges
9. `react` - 109 edges
10. `@headlessui/react` - 94 edges

## Surprising Connections (you probably didn't know these)
- `Definitions` --references--> `getSyllabusAccess()`  [INFERRED]
  docs/specs/phase-2-syllabus-submission.md → lib/syllabus.ts
- `Deadlines` --references--> `ReviewQueueItem`  [INFERRED]
  docs/specs/phase-5-visibility.md → types/review-queue.ts
- `Timeline` --references--> `resolveSyllabusAccess()`  [INFERRED]
  docs/specs/phase-4-reviewer-experience.md → lib/syllabus.ts
- `Proposals (accept or amend before task 1)` --references--> `justificationScope()`  [INFERRED]
  docs/specs/phase-5-visibility.md → lib/dashboard-scope.ts
- `Accepted 2026-10-27` --references--> `getSyllabusAccess()`  [INFERRED]
  docs/specs/phase-3-review-engine.md → lib/syllabus.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Review engine flow (Phase 3)** — agents_syllabus_workflow_state_machine, agents_review_chain, syllabus_review_system_project_plan__v5__syllabus_statuses, syllabus_review_system_project_plan__v5__routing_readiness, agents_proxy_reviewer, agents_approval_reference [EXTRACTED 1.00]
- **University review forms supported by the system** — agents_form17, agents_form18_1, agents_justification_form, syllabus_review_system_project_plan__v5__enhanced_obe_syllabus, syllabus_review_system_project_plan__v5__form_definitions_versioning [EXTRACTED 1.00]
- **Phase A migration from role-based PERMISSIONS to derived-role capabilities** — project_context_users_role_field, project_context_permissions_map, agents_isadmin, agents_getuserroles, agents_capability_authorization [INFERRED 0.85]

## Communities (218 total, 74 thin omitted)

### Community 0 - "prospectus-item-manager.tsx"
Cohesion: 0.16
Nodes (11): metadata, ProspectusItemPage(), DeleteProspectusItemDialog(), handleDelete(), DeleteProspectusItemDialogProps, itemProspectusLabel(), ModalState, ProspectusItemManager() (+3 more)

### Community 1 - "dashboard-scope.ts"
Cohesion: 0.11
Nodes (16): filterInScope(), programInScope(), programMatches(), scopePrograms(), EMC, IT, mocks, N (+8 more)

### Community 2 - "react"
Cohesion: 0.17
Nodes (20): DeleteSchoolYearDialog(), handleDelete(), DeleteSchoolYearDialogProps, ModalState, SchoolYearManager(), SchoolYearManagerProps, SchoolYearModal(), handleSubmit() (+12 more)

### Community 3 - "prospectus/[id]/route.ts"
Cohesion: 0.23
Nodes (14): DELETE(), GET(), PATCH(), RouteContext, GET(), POST(), PROSPECTUS_EXPAND, toProspectusResponse() (+6 more)

### Community 4 - "lib/syllabus-review.ts"
Cohesion: 0.17
Nodes (21): GET(), notFound(), PUT(), RouteContext, Task plan (one reviewable change each, lint and tests green after each), Authors, canDesignate(), ChainHolders (+13 more)

### Community 5 - "Project Docs & Domain Rules"
Cohesion: 0.06
Nodes (37): AGENTS.md (agent guidance), Approval reference code (SYL-<term>-<seq>-S<stage>), Capability-based authorization (can, requireUser, authorize, canSomewhere), Form 17 (OVPAA-F-INS-017) review checklist, Form 18-1 (CITL-F-018) review points, getUserRoles resolver (derived roles from assignment records), users.isAdmin (only stored role), Justification Form (missing lead signature) (+29 more)

### Community 6 - "types/user.ts"
Cohesion: 0.07
Nodes (42): isDuplicateEmail(), POST(), LoginPage(), LoginPageProps, metadata, metadata, RegisterPage(), RegisterPageProps (+34 more)

### Community 7 - "course-modal.tsx"
Cohesion: 0.07
Nodes (44): CoursePage(), metadata, CourseCombobox(), CourseComboboxProps, CourseOption, CourseManager(), CourseManagerProps, ModalState (+36 more)

### Community 8 - "Package & Tooling Config"
Cohesion: 0.09
Nodes (27): eslintConfig, devDependencies, @axe-core/playwright@^4.14.0, eslint@^9, eslint-config-next@16.3.6, @playwright/test@^1.64.1, tailwindcss@^4, @tailwindcss/postcss@^4 (+19 more)

### Community 9 - "formatDate"
Cohesion: 0.18
Nodes (14): ACTING_AS_LABELS, metadata, PageProps, Row(), VerifyApprovalPage(), ACTING_AS, by(), currentLine() (+6 more)

### Community 10 - "createAdminPb"
Cohesion: 0.11
Nodes (38): DELETE(), PATCH(), RouteContext, GET(), POST(), DELETE(), PATCH(), RouteContext (+30 more)

### Community 11 - "mock-auth.ts"
Cohesion: 0.05
Nodes (29): evaluateCapability(), base, listResult, mocks, base, listResult, mocks, ctx (+21 more)

### Community 12 - "school-year/page.tsx"
Cohesion: 0.47
Nodes (4): metadata, SchoolYearPage(), SchoolYearsAndTerms(), SchoolYearsAndTermsProps

### Community 13 - "global-setup.ts"
Cohesion: 0.15
Nodes (22): APP_PORT, APP_URL, DIST_DIR, LOCAL_PB, PB_BIN, PB_PORT, PB_URL, ROOT (+14 more)

### Community 14 - "mockAuth"
Cohesion: 0.05
Nodes (39): ctx, forbidden(), mocks, unauthorized(), ctx, forbidden(), mocks, unauthorized() (+31 more)

### Community 15 - "lib/auth.ts"
Cohesion: 0.10
Nodes (28): POST(), DELETE(), GET(), PATCH(), RouteContext, GET(), POST(), GET() (+20 more)

### Community 16 - "pocketbase"
Cohesion: 0.13
Nodes (22): metadata, ProgramPage(), DeleteProgramDialog(), handleDelete(), DeleteProgramDialogProps, ModalState, ProgramManager(), Detail() (+14 more)

### Community 17 - "timeline/route.ts"
Cohesion: 0.13
Nodes (19): GET(), RouteContext, buildTimeline(), name(), Named, TimelineEvent, TimelineVersion, ctx (+11 more)

### Community 18 - "college/[id]/route.ts"
Cohesion: 0.09
Nodes (25): DELETE(), GET(), PATCH(), RouteContext, GET(), POST(), DELETE(), GET() (+17 more)

### Community 19 - "index.ts"
Cohesion: 0.15
Nodes (19): FORM17_REV04, FORM18_REV01, checklistCriteria(), CURRENT_FORM17, CURRENT_FORM18, FORM17_REVISIONS, form17Status(), FORM18_REVISIONS (+11 more)

### Community 20 - "Department UI"
Cohesion: 0.16
Nodes (20): DepartmentPage(), metadata, DeleteDepartmentDialog(), handleDelete(), DeleteDepartmentDialogProps, DepartmentManager(), ModalState, DepartmentModal() (+12 more)

### Community 21 - "Faculty UI"
Cohesion: 0.15
Nodes (20): FacultyPage(), metadata, DeleteFacultyDialog(), handleDelete(), DeleteFacultyDialogProps, FacultyManager(), toggleActive(), FacultyManagerProps (+12 more)

### Community 22 - "lib/prospectus-duplicate.ts"
Cohesion: 0.15
Nodes (20): GET(), POST(), applyDuplicate(), batchSize(), DuplicatePlan, MAX_BATCH_REQUESTS, newRecordId(), planDuplicate() (+12 more)

### Community 23 - "capability-rules.ts"
Cohesion: 0.09
Nodes (18): Home(), canAnywhere(), CAPABILITIES, Capability, Rule, RULES, ScopeChain, admin (+10 more)

### Community 24 - "pocketbase"
Cohesion: 0.08
Nodes (43): GET(), POST(), GET(), POST(), approvalCode(), parseApprovalCode(), SEMESTER_CODES, validStage() (+35 more)

### Community 25 - "next"
Cohesion: 0.13
Nodes (16): GET(), POST(), POST(), GET(), requestEmailVerification(), setSessionCookie(), createPb(), requireEnv() (+8 more)

### Community 26 - "export/route.ts"
Cohesion: 0.16
Nodes (22): cap(), GET(), RFC-4180, csvCell, fileSlug(), toCsv(), completionCsv(), filterOverdue() (+14 more)

### Community 27 - "VPAA UI"
Cohesion: 0.15
Nodes (20): metadata, VpaaPage(), DeleteVpaaDialog(), handleDelete(), DeleteVpaaDialogProps, VpaaManager(), toggleActive(), VpaaManagerProps (+12 more)

### Community 28 - "dashboard-scope.ts"
Cohesion: 0.15
Nodes (23): GET(), GET(), GET(), GET(), Testing, aggregate(), paging(), resolveScopedPrograms() (+15 more)

### Community 29 - "Program Chair UI"
Cohesion: 0.17
Nodes (16): metadata, ProgramChairPage(), DeleteProgramChairDialog(), handleDelete(), DeleteProgramChairDialogProps, ProgramChairManager(), toggleActive(), ProgramChairManagerProps (+8 more)

### Community 30 - "dean/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 31 - "dean-manager.tsx"
Cohesion: 0.08
Nodes (42): CampusPage(), metadata, CollegePage(), metadata, CampusManager(), formatDate(), ModalState, CampusModal() (+34 more)

### Community 32 - "TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 33 - "Program"
Cohesion: 0.18
Nodes (18): DELETE(), PATCH(), RouteContext, GET(), POST(), isChairOfProgram(), listProgramsChairedBy(), programHasActiveChair() (+10 more)

### Community 34 - "department-head/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 35 - "requireUserMock"
Cohesion: 0.06
Nodes (20): base, forbidden(), listResult, mocks, rows, unauthorized(), base, data (+12 more)

### Community 36 - "getUserRoles"
Cohesion: 0.17
Nodes (22): conflict(), POST(), RouteContext, GET(), notFound(), POST(), RouteContext, GET() (+14 more)

### Community 37 - "types/notification.ts"
Cohesion: 0.07
Nodes (48): PATCH(), RouteContext, GET(), metadata, NotificationsPage(), BellIcon(), BellPanel(), markAll() (+40 more)

### Community 38 - "request"
Cohesion: 0.36
Nodes (10): SignedCopyPanel(), handleReturn(), handleUpload(), run(), SignedCopyPanelProps, listSignedCopies(), request(), returnSignedCopy() (+2 more)

### Community 39 - "signed-copy/route.ts"
Cohesion: 0.11
Nodes (32): conflict(), PUT(), RouteContext, GET(), notFound(), RouteContext, PATCH(), RouteContext (+24 more)

### Community 40 - "lib/dashboard.ts"
Cohesion: 0.14
Nodes (26): Task plan (one reviewable change each, lint and tests green after each), allAwaitingSignedCopy(), awaitingSignedCopyQuery(), emptyList(), justificationRows(), listAwaitingSignedCopy(), listJustifications(), loadFilteredPrograms() (+18 more)

### Community 41 - "program-reviewer-manager.tsx"
Cohesion: 0.19
Nodes (17): metadata, ProgramReviewerPage(), DeleteProgramReviewerDialog(), handleDelete(), DeleteProgramReviewerDialogProps, ProgramReviewerManager(), toggleActive(), ProgramReviewerManagerProps (+9 more)

### Community 42 - "types/dashboard.ts"
Cohesion: 0.09
Nodes (29): addTally(), blankTally(), byName(), completionRows(), row(), Tally, withRate(), SyllabusStatus (+21 more)

### Community 43 - "types/syllabus.ts"
Cohesion: 0.08
Nodes (39): GET(), RouteContext, DELETE(), leadOnly(), notEditable(), notFound(), PATCH(), RouteContext (+31 more)

### Community 44 - "canSomewhere"
Cohesion: 0.15
Nodes (20): DepartmentHeadPage(), metadata, DeleteDepartmentHeadDialog(), handleDelete(), DeleteDepartmentHeadDialogProps, DepartmentHeadManager(), toggleActive(), DepartmentHeadManagerProps (+12 more)

### Community 45 - "course/route.test.ts"
Cohesion: 0.25
Nodes (5): base, forbidden(), listResult, mocks, rows

### Community 46 - "helpers.ts"
Cohesion: 0.34
Nodes (13): adminPb(), answerForm17AllYes(), approveInUi(), auditFor(), createDraft(), getSyllabus(), loadSeed(), ok() (+5 more)

### Community 47 - "export.ts"
Cohesion: 0.19
Nodes (16): metadata, PageProps, SyllabusFormsPage(), Form17View(), Line(), Form181View(), PointsTable(), PrintableForms() (+8 more)

### Community 48 - "dashboard-manager.tsx"
Cohesion: 0.11
Nodes (32): DashboardPage(), metadata, DashboardManager(), defaultTerm(), JustificationsPanel(), STATE_STYLES, STATES, daysSince() (+24 more)

### Community 49 - "Enhanced OBE Syllabus on `[FILL IN: course name]`"
Cohesion: 0.07
Nodes (27): About This File, BUKIDNON STATE UNIVERSITY, Course Information, Creating a syllabus, Differences between the two signatory blocks, Document Structure (in order), Enhanced OBE Syllabus on `[FILL IN: course name]`, Enhanced OBE Syllabus Template (BukSU) (+19 more)

### Community 50 - "lib/review-queue.ts"
Cohesion: 0.16
Nodes (24): GET(), Testing, Cover, heldStages(), holdsStageFor(), listAwaitingReviewIds(), loadMyStandIns(), loadQueueExtras() (+16 more)

### Community 51 - "signed-copy/route.test.ts"
Cohesion: 0.14
Nodes (10): ctx, mocks, pdf, upload(), ctx, draft, file, mocks (+2 more)

### Community 52 - "citl-director/route.ts"
Cohesion: 0.15
Nodes (21): CitlDirectorPage(), metadata, CitlDirectorManager(), toggleActive(), CitlDirectorManagerProps, CitlDirectorModal(), handleSubmit(), DeleteCitlDirectorDialog() (+13 more)

### Community 53 - "next"
Cohesion: 0.06
Nodes (17): mocks, base, listResult, mocks, candidates, ctx, get(), mocks (+9 more)

### Community 54 - "AppUser"
Cohesion: 0.14
Nodes (23): GET(), RouteContext, conflict(), GET(), notFound(), PUT(), RouteContext, listStandInCandidates() (+15 more)

### Community 55 - "prospectus-client.ts"
Cohesion: 0.12
Nodes (27): metadata, ProspectusPage(), DeleteProspectusDialog(), handleDelete(), DeleteProspectusDialogProps, DuplicateProspectusDialog(), handleConfirm(), DuplicateProspectusDialogProps (+19 more)

### Community 56 - "course/[id]/route.ts"
Cohesion: 0.22
Nodes (11): DELETE(), GET(), PATCH(), RouteContext, GET(), POST(), COURSE_EXPAND, DEPENDENTS (+3 more)

### Community 57 - "syllabus-detail.tsx"
Cohesion: 0.11
Nodes (24): DeleteSyllabusDialog(), handleDelete(), DeleteSyllabusDialogProps, groupPoints(), ReviewPointsHistory(), SubmitSyllabusDialog(), handleSubmit(), SubmitSyllabusDialogProps (+16 more)

### Community 58 - "types/roles.ts"
Cohesion: 0.20
Nodes (10): AppShell(), Sidebar(), SidebarProps, getNavItems(), NAV_ITEMS, NavItem, mocks, hasAnyRole() (+2 more)

### Community 59 - "review-queue-manager.tsx"
Cohesion: 0.23
Nodes (9): metadata, ReviewQueuePage(), ProgramFilterCombobox(), age(), ReviewQueueManager(), stageLabel(), STATUS_OPTIONS, listReviewQueue() (+1 more)

### Community 110 - "resubmit/route.ts"
Cohesion: 0.08
Nodes (53): load(), POST(), RouteContext, conflict(), conflictMessage(), POST(), RouteContext, GET() (+45 more)

### Community 111 - "term-manager.tsx"
Cohesion: 0.15
Nodes (22): DeleteTermDialog(), handleDelete(), DeleteTermDialogProps, ModalState, TermManager(), toggleOpen(), TermManagerProps, TermModal() (+14 more)

### Community 112 - "react"
Cohesion: 0.09
Nodes (37): CitlDirectorModalProps, DeanModalProps, DepartmentHeadModalProps, FacultyModalProps, FdisChairModalProps, ProgramChairModalProps, ProgramReviewerModalProps, DeleteUserDialog() (+29 more)

### Community 113 - "transfer-lead-dialog.tsx"
Cohesion: 0.13
Nodes (17): CoAuthorPicker(), CoAuthorPickerProps, CoAuthorsPanel(), save(), CoAuthorsPanelProps, TransferLeadDialog(), handleTransfer(), TransferLeadDialogProps (+9 more)

### Community 114 - "AppUser"
Cohesion: 0.14
Nodes (20): DELETE(), GET(), PATCH(), RouteContext, GET(), GET(), POST(), avatarUrl() (+12 more)

### Community 115 - "scan/route.ts"
Cohesion: 0.13
Nodes (21): GET(), notFound(), POST(), RouteContext, canViewJustification(), addUploadAudit(), checkUploadRate(), TARGET (+13 more)

### Community 118 - "dean/route.ts"
Cohesion: 0.20
Nodes (16): DELETE(), PATCH(), RouteContext, GET(), POST(), collegeHasActiveDean(), isDeanOfCollege(), listCollegesDeanedBy() (+8 more)

### Community 119 - "reference-manager.tsx"
Cohesion: 0.10
Nodes (34): metadata, SyllabusReferencePage(), COPY, DialogAction, ReferenceActionDialog(), handleSubmit(), ReferenceActionDialogProps, ReferenceManager() (+26 more)

### Community 120 - "review-workspace.tsx"
Cohesion: 0.10
Nodes (24): metadata, PageProps, SyllabusReviewPage(), changed(), Draft, draftFrom(), Form17Panel(), handleSave() (+16 more)

### Community 121 - "pocketbase"
Cohesion: 0.15
Nodes (20): FdisChairPage(), metadata, DeleteFdisChairDialog(), handleDelete(), DeleteFdisChairDialogProps, FdisChairManager(), toggleActive(), FdisChairManagerProps (+12 more)

### Community 122 - "Syllabus Development Guidelines"
Cohesion: 0.08
Nodes (23): 10. Syllabus Table Format, 11. Writing Good Outcomes, 12. Syllabus Creation Workflow, 13. Institutional Review Process, 14. Validation Checklist, 15. Output Behavior for Claude, 1. Role and Scope, 2. Bloom's Taxonomy Reference (+15 more)

### Community 123 - "syllabus-workflow.ts"
Cohesion: 0.05
Nodes (47): API, Capabilities, Decisions (2026-10-26), Definitions, Out of scope, Phase 2: Syllabus submission, Schema changes (to apply to `pb_schema.json`), UI (+39 more)

### Community 124 - "types/prospectus-item.ts"
Cohesion: 0.18
Nodes (21): labelOf(), ProspectusItemModal(), handleSubmit(), ProspectusItemModalMode, ProspectusItemModalProps, TITLES, ApprovalCodeParts, createProspectusItem() (+13 more)

### Community 125 - "05-a11y.spec.ts"
Cohesion: 0.25
Nodes (6): PAGES, TAGS, PASSWORD, findSyllabusId(), PEOPLE, Person

### Community 126 - "Phase 4: Reviewer experience"
Cohesion: 0.18
Nodes (10): Boundaries, Decisions (2026-10-27), Events (`lib/syllabus-events.ts`, server-only), Hub (`/syllabus/[id]`), Objective, Out of scope, Phase 4: Reviewer experience, Proposals (accept or amend before task 1) (+2 more)

### Community 127 - "dean-manager.tsx"
Cohesion: 0.20
Nodes (16): DeanPage(), metadata, DeanManager(), toggleActive(), DeanManagerProps, DeanModal(), handleSubmit(), DeleteDeanDialog() (+8 more)

### Community 128 - "org-visibility.ts"
Cohesion: 0.09
Nodes (33): DELETE(), GET(), PATCH(), RouteContext, GET(), POST(), DELETE(), GET() (+25 more)

### Community 129 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, audit:phase-a, build, dev, lint, pb, start, test (+1 more)

### Community 130 - "lib/justification.ts"
Cohesion: 0.18
Nodes (13): GET(), RouteContext, activeHolderName(), ensureBasedOn(), userNames(), ctx, get(), mocks (+5 more)

### Community 131 - "dependencies"
Cohesion: 0.29
Nodes (7): dependencies, @headlessui/react@^2.2.10, next@16.3.6, pocketbase@^0.28.1, react@19.2.8, react-dom@19.2.8, react-dom

### Community 132 - "handlePbError"
Cohesion: 0.17
Nodes (20): DELETE(), PATCH(), RouteContext, GET(), POST(), DELETE(), GET(), PATCH() (+12 more)

### Community 133 - "revise-workspace.tsx"
Cohesion: 0.12
Nodes (24): metadata, PageProps, SyllabusRevisePage(), PdfPane(), PdfPaneProps, ResubmitSyllabusDialog(), handleResubmit(), ResubmitSyllabusDialogProps (+16 more)

### Community 134 - "Phase 5: Visibility and communication"
Cohesion: 0.10
Nodes (16): Boundaries, Dashboards, Deadlines, Decisions (2026-10-28), Objective, Out of scope, Phase 5: Visibility and communication, Proposals (accept or amend before task 1) (+8 more)

### Community 139 - "Retention policy"
Cohesion: 0.33
Nodes (5): Changing this policy, Removing records, Retention policy, Rule, Storage growth

### Community 140 - "lib/form17.ts"
Cohesion: 0.14
Nodes (22): Batch, copyForm17(), form17Facts(), listForm17Answers(), loadForm17(), newRecordId(), saveForm17, Version (+14 more)

### Community 141 - "Criteria"
Cohesion: 0.12
Nodes (16): A. Preliminaries, B. Vision, Mission, Goals, Objectives, and Outcomes, C. Course Content, Closing Section, Criteria, D. Assessment, E. Learning Modality and Methods, F. Resources, Required Readings, and References (+8 more)

### Community 142 - "audit-manager.tsx"
Cohesion: 0.23
Nodes (10): AuditPage(), metadata, ACTION_LABELS, AuditManager(), AuditListResponse, AuditParams, listAudit(), request() (+2 more)

### Community 143 - "proxy.ts"
Cohesion: 0.33
Nodes (6): config, isTokenExpired(), proxy(), PUBLIC_PATHS, Schema changes (to apply to `pb_schema.json`), answer()

### Community 144 - "3. Letter Body (in order, top to bottom)"
Cohesion: 0.12
Nodes (15): 1. Document Overview, 2. Letterhead (fixed, centered at top), 3.1 Date — VARIABLE, 3.2 Recipient block — FIXED, 3.3 Salutation — FIXED, 3.4 Opening paragraph — PARTLY VARIABLE, 3.5 Table — VARIABLE (see Section 4), 3.6 Closing — FIXED (+7 more)

### Community 146 - "CITL Syllabus Review Guide (Instructions for Part B)"
Cohesion: 0.14
Nodes (13): A. Format and House Style, B. Alignment (Coherence and Logical Connection Between Learning Plan Components), C. Use of Behavioral Verbs (Bloom's Taxonomy), CITL Syllabus Review Guide (Instructions for Part B), CITL Syllabus Review: Suggestions and Action Taken (Form 18-1), D. Gradation of COs and SLOs, E. Supplementary Documentation, F. Inclusion of Prescribed Institutional Forms (+5 more)

### Community 147 - "prospectus/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 148 - "getCurrentUser"
Cohesion: 0.16
Nodes (14): GET(), metadata, RootLayout(), metadata, PageProps, SyllabusDetailPage(), metadata, SyllabusPage() (+6 more)

### Community 149 - "overdue-badge.tsx"
Cohesion: 0.25
Nodes (16): Badge(), plural(), ReviewOverdueBadge(), reviewOverdueDays(), SubmissionOverdueBadge(), submissionOverdueDays(), TermDeadlines, syllabusOverdue() (+8 more)

### Community 150 - "program-join-request-manager.tsx"
Cohesion: 0.09
Nodes (35): metadata, ProgramJoinRequestPage(), ProgramJoinRequestManager(), approve(), reloadAfterRowLeft(), ProgramJoinRequestManagerProps, RowDialog, STATUS_LABELS (+27 more)

### Community 151 - "types/form18.ts"
Cohesion: 0.26
Nodes (11): isObject(), parsePointInput(), parsePointUpdate(), ParseResult, text(), Form18Response, MAX_PAGE_NUMBER, MAX_POINT_TEXT (+3 more)

### Community 152 - "form18-panel.tsx"
Cohesion: 0.15
Nodes (14): Form18PanelProps, NewPointForm(), PointForm(), PointFormProps, PointRowProps, STATUS_LABELS, STATUS_STYLES, Point (+6 more)

### Community 153 - "[id]/form17/route.test.ts"
Cohesion: 0.18
Nodes (9): ctx, FORM, get(), HOLDERS, INPUT, LATEST, mocks, put() (+1 more)

### Community 155 - "program-join-request/route.ts"
Cohesion: 0.26
Nodes (11): DELETE(), notPending(), PATCH(), RouteContext, GET(), POST(), JOIN_REQUEST_EXPAND, toProgramJoinRequestResponse() (+3 more)

### Community 156 - "types/justification.ts"
Cohesion: 0.22
Nodes (12): isObject(), parseJustificationInput(), parseJustificationReturn(), ParseResult, Justification, JUSTIFICATION_STATUSES, JustificationEntry, JustificationInput (+4 more)

### Community 157 - "[pointId]/route.ts"
Cohesion: 0.17
Nodes (16): conflict(), DELETE(), PATCH(), reviewerCheck(), pointActionError(), ctx, EDIT, given() (+8 more)

### Community 158 - "[pointId]/route.ts"
Cohesion: 0.21
Nodes (14): Loaded, notFound(), RouteContext, GET(), notFound(), POST(), RouteContext, listPoints() (+6 more)

### Community 159 - "program-join-request/[id]/route.test.ts"
Cohesion: 0.29
Nodes (5): approve, ctx, mocks, pending, SCOPE

### Community 160 - "validators/term.ts"
Cohesion: 0.44
Nodes (7): isReviewDays(), isValidDate(), parseDeadline(), ParseResult, parseTermInput(), parseTermUpdate(), SEMESTER_ERROR

### Community 161 - "audit-log.test.ts"
Cohesion: 0.15
Nodes (18): Boundaries, anyOf(), auditDetail(), auditFilter(), AuditNames, listAudit(), stateLabel(), STATUS_LABELS (+10 more)

### Community 162 - "stand-in/route.test.ts"
Cohesion: 0.22
Nodes (4): ctx, HOLDERS, ITEMS, mocks

### Community 163 - "prospectus-item/route.test.ts"
Cohesion: 0.25
Nodes (5): base, forbidden(), listResult, mocks, rows

### Community 164 - "types/syllabus-review.ts"
Cohesion: 0.26
Nodes (9): VerifiedApproval, ActingAs, ParseResult, parseReviewInput(), REVIEW_DECISIONS, ReviewInput, ReviewResult, SyllabusReview (+1 more)

### Community 165 - "Phase 6: Hardening"
Cohesion: 0.15
Nodes (14): version(), Schema changes (to apply to `pb_schema.json`), Accessibility pass, Decisions (2026-10-28), End-to-end tests, Lead reassignment, Objective, Out of scope (+6 more)

### Community 166 - "Feature walkthrough"
Cohesion: 0.20
Nodes (18): 0. Before you start, 1. Cast, Feature walkthrough, Part 10 — Negative checks, Part 11 — Keyboard and accessibility pass, Part 1 — Admin setup (as `admin`), Part 2 — Org chain and roles, Part 3 — Registration and joining a program (+10 more)

### Community 167 - "syllabus-manager.tsx"
Cohesion: 0.14
Nodes (17): AvailableCourseCombobox(), AvailableCourseComboboxProps, SyllabusManager(), SyllabusManagerProps, ProgramOption, SyllabusModal(), handleSubmit(), SyllabusModalProps (+9 more)

### Community 169 - "program-reviewer/route.ts"
Cohesion: 0.25
Nodes (13): DELETE(), PATCH(), RouteContext, GET(), POST(), programHasActiveReviewer(), toProgramReviewerResponse(), parseProgramReviewerInput() (+5 more)

### Community 170 - "[id]/justification/route.ts"
Cohesion: 0.24
Nodes (13): conflict(), GET(), load(), notFound(), PATCH(), PUT(), RouteContext, findJustification() (+5 more)

### Community 171 - "justification-panel.tsx"
Cohesion: 0.14
Nodes (21): JustificationLetterView(), JustificationPanel(), adopt(), handlePreview(), handleSave(), run(), STATUS_LABELS, Group (+13 more)

### Community 173 - "review/route.test.ts"
Cohesion: 0.20
Nodes (7): BY_STAGE, ctx, decide(), HOLDERS, mocks, NO_POINTS, VERSION

### Community 174 - "addAudit"
Cohesion: 0.27
Nodes (7): Audit module, Tasks, addAudit(), Batch, AuditEntry, AuditInput, AuditResponse

### Community 175 - "citl-director/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 176 - "citl-director/route.ts"
Cohesion: 0.26
Nodes (12): DELETE(), PATCH(), RouteContext, GET(), POST(), getActiveCitlDirector(), hasActiveCitlDirector(), isCitlDirector() (+4 more)

### Community 177 - "fdis-chair/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 178 - "org-visibility.ts"
Cohesion: 0.27
Nodes (8): AssignmentPaths, Bind, clauses(), departmentScopeFilter(), departmentVisible(), programScopeFilter(), programVisible(), UserRoles

### Community 190 - "export/form17/route.ts"
Cohesion: 0.10
Nodes (29): GET(), notFound(), RouteContext, GET(), RouteContext, ApprovalStamp, buildForm17Export(), buildForm181Export() (+21 more)

### Community 191 - "vpaa/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 192 - "stand-ins-panel.tsx"
Cohesion: 0.27
Nodes (8): StandInPicker(), StandInPickerProps, StandInsPanel(), save(), StandInsPanelProps, listStandInCandidates(), listStandIns(), setStandIn()

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

### Community 199 - "validators/syllabus-reference.ts"
Cohesion: 0.31
Nodes (8): isObject(), isReferenceStatus(), parseReferenceActionInput(), ParseResult, parseSyllabusReferenceInput(), REFERENCE_STATUSES, ReferenceActionInput, SyllabusReferenceInput

### Community 200 - "validators/audit.ts"
Cohesion: 0.43
Nodes (5): parseAuditQuery(), ParseResult, phtMidnight(), parse(), AuditQuery

### Community 201 - "audit-phase-a.ts"
Cohesion: 0.33
Nodes (6): AssignmentRow, ASSIGNMENTS, main(), requireEnv(), UNASSIGNED_FILTER, UserRow

### Community 202 - "resubmit/route.test.ts"
Cohesion: 0.29
Nodes (5): ctx, HOLDERS, mocks, resubmit(), returned

### Community 203 - "types/review-queue.ts"
Cohesion: 0.36
Nodes (7): Review queue, ReviewQueueParams, QueueQuery, QUEUE_STATUSES, QueueStatus, ReviewQueueItem, ReviewQueueResponse

### Community 204 - "stand-in-candidates/route.test.ts"
Cohesion: 0.29
Nodes (6): candidates, ctx, get(), HOLDERS, mocks, syllabus

### Community 205 - "justifications/route.test.ts"
Cohesion: 0.22
Nodes (6): EMC, get(), IT, LIST, mocks, N

### Community 206 - "program-chair/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 207 - "program-reviewer/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 208 - "vitest"
Cohesion: 0.07
Nodes (20): vitest, candidates, ctx, mocks, syllabus, ctx, draft, mocks (+12 more)

### Community 209 - "syllabus-justification.ts"
Cohesion: 0.52
Nodes (5): Current, editError(), eligibleAuthors(), returnError(), submitScanError()

### Community 210 - "school-year/route.test.ts"
Cohesion: 0.29
Nodes (4): forbidden(), listResult, mocks, rows

### Community 211 - "forms/justification.ts"
Cohesion: 0.60
Nodes (4): buildJustificationLetter(), JUSTIFICATION_TEMPLATE, letterDate(), SEMESTERS

### Community 212 - "[versionId]/file/route.test.ts"
Cohesion: 0.33
Nodes (4): ctx, mocks, syllabus, version

### Community 213 - "syllabus/route.test.ts"
Cohesion: 0.33
Nodes (3): input, mocks, openTerm

### Community 214 - "school-year/[id]/route.ts"
Cohesion: 0.19
Nodes (16): DELETE(), GET(), PATCH(), RouteContext, GET(), POST(), DEPENDENTS, describeSchoolYearDependents() (+8 more)

### Community 215 - "course/[id]/route.test.ts"
Cohesion: 0.33
Nodes (4): ctx, EXPAND, forbidden(), mocks

### Community 216 - "review-queue/route.test.ts"
Cohesion: 0.33
Nodes (5): COVERS, get(), mocks, STAND_INS, VERSIONS

## Knowledge Gaps
- **10 isolated node(s):** `RFC-4180`, `Org chain (campus, college, department, program)`, `Scoped list visibility (lib/org-visibility.ts)`, `Plain CRUD entities (campus, college, department, program, user)`, `Advisory PDF checks (informational only)` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1178 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **74 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `pocketbase` connect `pocketbase` to `prospectus-item-manager.tsx`, `org-visibility.ts`, `react`, `lib/justification.ts`, `handlePbError`, `revise-workspace.tsx`, `types/user.ts`, `course-modal.tsx`, `Package & Tooling Config`, `dependencies`, `prospectus/[id]/route.ts`, `lib/form17.ts`, `pocketbase`, `timeline/route.ts`, `college/[id]/route.ts`, `Department UI`, `Faculty UI`, `program-join-request-manager.tsx`, `lib/prospectus-duplicate.ts`, `types/form18.ts`, `next`, `VPAA UI`, `types/justification.ts`, `Program Chair UI`, `[pointId]/route.ts`, `dean-manager.tsx`, `audit-log.test.ts`, `Program`, `getUserRoles`, `types/notification.ts`, `types/syllabus-review.ts`, `syllabus-manager.tsx`, `lib/dashboard.ts`, `program-reviewer-manager.tsx`, `signed-copy/route.ts`, `types/syllabus.ts`, `canSomewhere`, `justification-panel.tsx`, `helpers.ts`, `addAudit`, `dashboard-manager.tsx`, `program-reviewer/route.ts`, `lib/review-queue.ts`, `signed-copy/route.test.ts`, `citl-director/route.ts`, `next`, `AppUser`, `prospectus-client.ts`, `export/form17/route.ts`, `audit-phase-a.ts`, `types/review-queue.ts`, `school-year/[id]/route.ts`, `resubmit/route.ts`, `term-manager.tsx`, `react`, `scan/route.ts`, `dean/route.ts`, `reference-manager.tsx`, `pocketbase`, `types/prospectus-item.ts`, `05-a11y.spec.ts`, `dean-manager.tsx`?**
  _High betweenness centrality (0.187) - this node is a cross-community bridge._
- **Are the 79 inferred relationships involving `createAdminPb()` (e.g. with `audit/route.test.ts` and `register/route.test.ts`) actually correct?**
  _`createAdminPb()` has 79 INFERRED edges - model-reasoned connections that need verification._
- **What connects `RFC-4180`, `Org chain (campus, college, department, program)`, `Scoped list visibility (lib/org-visibility.ts)` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `dashboard-scope.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10507246376811594 - nodes in this community are weakly interconnected._
- **Why does `next` connect `next` to `prospectus-item-manager.tsx`, `dashboard-scope.ts`, `prospectus/[id]/route.ts`, `lib/syllabus-review.ts`, `types/user.ts`, `course-modal.tsx`, `Package & Tooling Config`, `formatDate`, `createAdminPb`, `mock-auth.ts`, `school-year/page.tsx`, `mockAuth`, `lib/auth.ts`, `pocketbase`, `timeline/route.ts`, `college/[id]/route.ts`, `Department UI`, `Faculty UI`, `lib/prospectus-duplicate.ts`, `capability-rules.ts`, `pocketbase`, `export/route.ts`, `VPAA UI`, `dashboard-scope.ts`, `Program Chair UI`, `dean/route.test.ts`, `dean-manager.tsx`, `Program`, `department-head/route.test.ts`, `requireUserMock`, `getUserRoles`, `types/notification.ts`, `signed-copy/route.ts`, `program-reviewer-manager.tsx`, `types/syllabus.ts`, `canSomewhere`, `course/route.test.ts`, `export.ts`, `dashboard-manager.tsx`, `lib/review-queue.ts`, `signed-copy/route.test.ts`, `citl-director/route.ts`, `next`, `AppUser`, `prospectus-client.ts`, `course/[id]/route.ts`, `syllabus-detail.tsx`, `types/roles.ts`, `review-queue-manager.tsx`, `resubmit/route.ts`, `AppUser`, `scan/route.ts`, `dean/route.ts`, `reference-manager.tsx`, `review-workspace.tsx`, `pocketbase`, `dean-manager.tsx`, `org-visibility.ts`, `lib/justification.ts`, `dependencies`, `handlePbError`, `revise-workspace.tsx`, `Phase 5: Visibility and communication`, `audit-manager.tsx`, `proxy.ts`, `prospectus/route.test.ts`, `getCurrentUser`, `program-join-request-manager.tsx`, `[id]/form17/route.test.ts`, `program-join-request/route.ts`, `[pointId]/route.ts`, `[pointId]/route.ts`, `program-join-request/[id]/route.test.ts`, `stand-in/route.test.ts`, `prospectus-item/route.test.ts`, `syllabus-manager.tsx`, `program-reviewer/route.ts`, `[id]/justification/route.ts`, `review/route.test.ts`, `citl-director/route.test.ts`, `citl-director/route.ts`, `fdis-chair/route.test.ts`, `export/form17/route.ts`, `vpaa/route.test.ts`, `duplicate/route.test.ts`, `[id]/form18/route.test.ts`, `syllabus-reference/route.test.ts`, `term/route.test.ts`, `resubmit/route.test.ts`, `stand-in-candidates/route.test.ts`, `justifications/route.test.ts`, `program-chair/route.test.ts`, `program-reviewer/route.test.ts`, `vitest`, `school-year/route.test.ts`, `[versionId]/file/route.test.ts`, `syllabus/route.test.ts`, `school-year/[id]/route.ts`, `course/[id]/route.test.ts`, `review-queue/route.test.ts`, `campus/route.test.ts`?**
  _High betweenness centrality (0.153) - this node is a cross-community bridge._
- **Are the 20 inferred relationships involving `handlePbError()` (e.g. with `Testing` and `Testing`) actually correct?**
  _`handlePbError()` has 20 INFERRED edges - model-reasoned connections that need verification._
- **Should `Project Docs & Domain Rules` be split into smaller, more focused modules?**
  _Cohesion score 0.057971014492753624 - nodes in this community are weakly interconnected._