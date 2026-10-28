# Graph Report - syllabusv2  (2026-10-28)

## Corpus Check
- 618 files · ~281,411 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 4, .ico 1, .css 1)

## Summary
- 3114 nodes · 9985 edges · 188 communities (118 shown, 70 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 282 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8f7ba164`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- prospectus-item-manager.tsx
- dashboard-scope.ts
- react
- ref_server_only
- Route Test Helpers
- Project Docs & Domain Rules
- validators/user.ts
- course-modal.tsx
- Package & Tooling Config
- User Admin UI
- fdis-chair/route.ts
- org-visibility.ts
- CITL Director Module
- pocketbase
- mockAuth
- Role Admin Pages
- pocketbase
- timeline/route.ts
- campus/[id]/route.ts
- resolveSyllabusAccess
- Department UI
- Faculty UI
- lib/prospectus-duplicate.ts
- capability-rules.ts
- AppUser
- lib/auth.ts
- lib/dashboard.ts
- VPAA UI
- department-head/route.test.ts
- Program Chair UI
- pocketbase.ts
- dean-manager.tsx
- TypeScript Config
- Department Head API
- Program Chair API
- faculty/route.ts
- getUserRoles
- types/notification.ts
- syllabus-client.ts
- signed-copy/route.ts
- Prospectus List Tests
- program-reviewer-manager.tsx
- types/dashboard.ts
- types/syllabus.ts
- syllabus/route.test.ts
- Course List Tests
- Duplicate Route Tests
- export.ts
- dashboard-manager.tsx
- Enhanced OBE Syllabus on `[FILL IN: course name]`
- lib/review-queue.ts
- vitest
- citl-director/route.ts
- campus-client.ts
- handlePbError
- prospectus-client.ts
- school-year/[id]/route.ts
- syllabus-detail.tsx
- types/roles.ts
- syllabus-manager.tsx
- PostCSS Config
- resubmit/route.ts
- term-manager.tsx
- next
- faculty/route.test.ts
- users.ts
- vpaa/route.ts
- register/page.tsx
- reference-manager.tsx
- review-workspace.tsx
- pocketbase
- Syllabus Development Guidelines
- syllabus-workflow.ts
- validators/term.ts
- index.ts
- review-queue-manager.tsx
- Phase 2: Syllabus submission
- authorize
- syllabus-reference/route.test.ts
- co-authors-panel.tsx
- revise-workspace.tsx
- can
- prospectus-item/[id]/route.ts
- Phase 5: Visibility and communication
- [pointId]/route.test.ts
- form17-panel.tsx
- Criteria
- SyllabusResponse
- org-children.ts
- 3. Letter Body (in order, top to bottom)
- stand-ins-panel.tsx
- CITL Syllabus Review Guide (Instructions for Part B)
- program-reviewer/route.ts
- types/user.ts
- overdue-badge.tsx
- program-join-request/route.ts
- form18-panel.tsx
- [code]/page.tsx
- [id]/form17/route.test.ts
- vpaa/route.test.ts
- term/route.test.ts
- types/justification.ts
- review/route.test.ts
- prospectus-item/route.test.ts
- dean/route.test.ts
- canAnywhere
- audit-phase-a.ts
- stand-in/route.test.ts
- submit/route.test.ts
- approval-verify.test.ts
- [id]/form18/route.test.ts
- college/route.test.ts
- co-author-candidates/route.test.ts
- stand-in-candidates/route.test.ts
- export/form17/route.test.ts
- forms/justification.ts
- school-year/[id]/route.test.ts
- lead-candidates/route.test.ts
- [id]/review/page.tsx

## God Nodes (most connected - your core abstractions)
1. `createAdminPb()` - 342 edges
2. `handlePbError()` - 241 edges
3. `next` - 218 edges
4. `requireUser()` - 217 edges
5. `vitest` - 146 edges
6. `pocketbase` - 125 edges
7. `mockAuth()` - 123 edges
8. `getUserRoles` - 123 edges
9. `react` - 107 edges
10. `@headlessui/react` - 92 edges

## Surprising Connections (you probably didn't know these)
- `Proposals (accept or amend before task 1)` --references--> `justificationScope()`  [INFERRED]
  docs/specs/phase-5-visibility.md → lib/dashboard-scope.ts
- `Deadlines` --references--> `ReviewQueueItem`  [INFERRED]
  docs/specs/phase-5-visibility.md → types/review-queue.ts
- `Definitions` --references--> `getSyllabusAccess()`  [INFERRED]
  docs/specs/phase-2-syllabus-submission.md → lib/syllabus.ts
- `Accepted 2026-10-27` --references--> `getSyllabusAccess()`  [INFERRED]
  docs/specs/phase-3-review-engine.md → lib/syllabus.ts
- `Timeline` --references--> `resolveSyllabusAccess()`  [INFERRED]
  docs/specs/phase-4-reviewer-experience.md → lib/syllabus.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Review engine flow (Phase 3)** — agents_syllabus_workflow_state_machine, agents_review_chain, syllabus_review_system_project_plan__v5__syllabus_statuses, syllabus_review_system_project_plan__v5__routing_readiness, agents_proxy_reviewer, agents_approval_reference [EXTRACTED 1.00]
- **University review forms supported by the system** — agents_form17, agents_form18_1, agents_justification_form, syllabus_review_system_project_plan__v5__enhanced_obe_syllabus, syllabus_review_system_project_plan__v5__form_definitions_versioning [EXTRACTED 1.00]
- **Phase A migration from role-based PERMISSIONS to derived-role capabilities** — project_context_users_role_field, project_context_permissions_map, agents_isadmin, agents_getuserroles, agents_capability_authorization [INFERRED 0.85]

## Communities (188 total, 70 thin omitted)

### Community 0 - "prospectus-item-manager.tsx"
Cohesion: 0.14
Nodes (29): DeleteProspectusItemDialog(), handleDelete(), DeleteProspectusItemDialogProps, itemProspectusLabel(), ModalState, ProspectusItemManager(), ProspectusItemManagerProps, prospectusLabel() (+21 more)

### Community 1 - "dashboard-scope.ts"
Cohesion: 0.05
Nodes (50): GET(), GET(), GET(), loadFilteredPrograms(), paging(), resolveScopedPrograms(), anyOf(), Bind (+42 more)

### Community 2 - "react"
Cohesion: 0.13
Nodes (23): metadata, SchoolYearPage(), DeleteSchoolYearDialog(), handleDelete(), DeleteSchoolYearDialogProps, ModalState, SchoolYearManager(), changed() (+15 more)

### Community 3 - "ref_server_only"
Cohesion: 0.09
Nodes (36): GET(), RouteContext, conflict(), GET(), load(), notFound(), PATCH(), PUT() (+28 more)

### Community 4 - "Route Test Helpers"
Cohesion: 0.06
Nodes (23): evaluateCapability(), base, listResult, mocks, ctx, forbidden(), mocks, ctx (+15 more)

### Community 5 - "Project Docs & Domain Rules"
Cohesion: 0.06
Nodes (37): AGENTS.md (agent guidance), Approval reference code (SYL-<term>-<seq>-S<stage>), Capability-based authorization (can, requireUser, authorize, canSomewhere), Form 17 (OVPAA-F-INS-017) review checklist, Form 18-1 (CITL-F-018) review points, getUserRoles resolver (derived roles from assignment records), users.isAdmin (only stored role), Justification Form (missing lead signature) (+29 more)

### Community 6 - "validators/user.ts"
Cohesion: 0.15
Nodes (19): isDuplicateEmail(), POST(), RegisterFormProps, LoginInput, DEFAULT_EMAIL_DOMAINS, parseDomainList(), ParsedRegistration, parseRegisterInput() (+11 more)

### Community 7 - "course-modal.tsx"
Cohesion: 0.06
Nodes (51): DELETE(), GET(), PATCH(), RouteContext, GET(), POST(), CourseCombobox(), CourseComboboxProps (+43 more)

### Community 8 - "Package & Tooling Config"
Cohesion: 0.06
Nodes (39): eslintConfig, dependencies, @headlessui/react@^2.2.10, next@16.3.6, pocketbase@^0.28.1, react@19.2.8, react-dom@19.2.8, devDependencies (+31 more)

### Community 9 - "User Admin UI"
Cohesion: 0.14
Nodes (23): DeleteUserDialog(), handleDelete(), DeleteUserDialogProps, describeAccess(), KIND_LABELS, ModalState, UserManager(), UserManagerProps (+15 more)

### Community 10 - "fdis-chair/route.ts"
Cohesion: 0.10
Nodes (26): DELETE(), PATCH(), RouteContext, GET(), POST(), getActiveFdisChair(), hasActiveFdisChair(), isFdisChair() (+18 more)

### Community 11 - "org-visibility.ts"
Cohesion: 0.19
Nodes (15): GET(), GET(), GET(), RouteContext, GET(), AssignmentPaths, assignmentScopeFilter(), Bind (+7 more)

### Community 12 - "CITL Director Module"
Cohesion: 0.23
Nodes (16): CitlDirectorManager(), toggleActive(), CitlDirectorManagerProps, CitlDirectorModal(), handleSubmit(), CitlDirectorModalProps, DeleteCitlDirectorDialog(), handleDelete() (+8 more)

### Community 13 - "pocketbase"
Cohesion: 0.16
Nodes (20): ProgramJoinRequestManager(), approve(), reloadAfterRowLeft(), ProgramJoinRequestManagerProps, RowDialog, STATUS_LABELS, STATUS_STYLES, ProgramJoinRequestModal() (+12 more)

### Community 14 - "mockAuth"
Cohesion: 0.03
Nodes (58): ctx, forbidden(), mocks, unauthorized(), base, forbidden(), listResult, mocks (+50 more)

### Community 15 - "Role Admin Pages"
Cohesion: 0.08
Nodes (35): GET(), CitlDirectorPage(), metadata, CoursePage(), metadata, DeanPage(), metadata, DepartmentHeadPage() (+27 more)

### Community 16 - "pocketbase"
Cohesion: 0.11
Nodes (27): metadata, ProgramPage(), CourseManagerProps, ModalState, DeleteProgramDialog(), handleDelete(), DeleteProgramDialogProps, ModalState (+19 more)

### Community 17 - "timeline/route.ts"
Cohesion: 0.18
Nodes (13): RouteContext, buildTimeline(), name(), Named, TimelineEvent, TimelineVersion, base, SYLLABUS_EVENT_TYPES (+5 more)

### Community 18 - "campus/[id]/route.ts"
Cohesion: 0.15
Nodes (13): GET(), PATCH(), RouteContext, GET(), POST(), parseCampusInput(), ParseResult, ctx (+5 more)

### Community 19 - "resolveSyllabusAccess"
Cohesion: 0.10
Nodes (36): GET(), notFound(), RouteContext, GET(), RouteContext, conflict(), DELETE(), load() (+28 more)

### Community 20 - "Department UI"
Cohesion: 0.14
Nodes (23): DepartmentPage(), metadata, DeleteDepartmentDialog(), handleDelete(), DeleteDepartmentDialogProps, DepartmentManager(), ModalState, DepartmentModal() (+15 more)

### Community 21 - "Faculty UI"
Cohesion: 0.23
Nodes (16): DeleteFacultyDialog(), handleDelete(), DeleteFacultyDialogProps, FacultyManager(), toggleActive(), FacultyManagerProps, FacultyModal(), handleSubmit() (+8 more)

### Community 22 - "lib/prospectus-duplicate.ts"
Cohesion: 0.15
Nodes (20): GET(), POST(), applyDuplicate(), batchSize(), DuplicatePlan, MAX_BATCH_REQUESTS, newRecordId(), planDuplicate() (+12 more)

### Community 23 - "capability-rules.ts"
Cohesion: 0.08
Nodes (15): CAPABILITIES, Rule, RULES, ScopeChain, admin, ADMIN_ONLY, chair, dean (+7 more)

### Community 24 - "AppUser"
Cohesion: 0.11
Nodes (30): PATCH(), RouteContext, GET(), POST(), POST(), approvalCode(), parseApprovalCode(), SEMESTER_CODES (+22 more)

### Community 25 - "lib/auth.ts"
Cohesion: 0.17
Nodes (14): POST(), POST(), metadata, PageProps, SyllabusDetailPage(), AUTH_COOKIE, AuthResult, avatarUrl() (+6 more)

### Community 26 - "lib/dashboard.ts"
Cohesion: 0.09
Nodes (45): cap(), GET(), RFC-4180, Task plan (one reviewable change each, lint and tests green after each), csvCell, fileSlug(), toCsv(), allAwaitingSignedCopy() (+37 more)

### Community 27 - "VPAA UI"
Cohesion: 0.23
Nodes (16): DeleteVpaaDialog(), handleDelete(), DeleteVpaaDialogProps, VpaaManager(), toggleActive(), VpaaManagerProps, VpaaModal(), handleSubmit() (+8 more)

### Community 28 - "department-head/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 29 - "Program Chair UI"
Cohesion: 0.22
Nodes (17): DeleteProgramChairDialog(), handleDelete(), DeleteProgramChairDialogProps, ProgramChairManager(), toggleActive(), ProgramChairManagerProps, ProgramChairModal(), handleSubmit() (+9 more)

### Community 30 - "pocketbase.ts"
Cohesion: 0.14
Nodes (22): PATCH(), RouteContext, POST(), PATCH(), RouteContext, GET(), POST(), collegeHasActiveDean() (+14 more)

### Community 31 - "dean-manager.tsx"
Cohesion: 0.10
Nodes (37): CollegePage(), metadata, CollegeManager(), ModalState, CollegeModal(), handleSubmit(), CollegeModalMode, CollegeModalProps (+29 more)

### Community 32 - "TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 33 - "Department Head API"
Cohesion: 0.12
Nodes (28): PATCH(), RouteContext, GET(), POST(), DeleteDepartmentHeadDialog(), handleDelete(), DeleteDepartmentHeadDialogProps, DepartmentHeadManager() (+20 more)

### Community 34 - "Program Chair API"
Cohesion: 0.23
Nodes (14): PATCH(), RouteContext, POST(), isChairOfProgram(), listProgramsChairedBy(), programHasActiveChair(), toProgramChairResponse(), parseProgramChairInput() (+6 more)

### Community 35 - "faculty/route.ts"
Cohesion: 0.11
Nodes (25): PATCH(), RouteContext, GET(), POST(), metadata, SyllabusPage(), isFacultyOfProgram(), listProgramsOfUser() (+17 more)

### Community 36 - "getUserRoles"
Cohesion: 0.18
Nodes (23): conflict(), POST(), RouteContext, GET(), notFound(), POST(), RouteContext, GET() (+15 more)

### Community 37 - "types/notification.ts"
Cohesion: 0.09
Nodes (41): PATCH(), RouteContext, GET(), metadata, NotificationsPage(), BellIcon(), BellPanel(), markAll() (+33 more)

### Community 38 - "syllabus-client.ts"
Cohesion: 0.12
Nodes (39): JustificationLetterView(), JustificationPanel(), adopt(), handlePreview(), handleSave(), run(), STATUS_LABELS, SignedCopyPanel() (+31 more)

### Community 39 - "signed-copy/route.ts"
Cohesion: 0.15
Nodes (21): GET(), notFound(), RouteContext, PATCH(), RouteContext, GET(), notFound(), POST() (+13 more)

### Community 40 - "Prospectus List Tests"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 41 - "program-reviewer-manager.tsx"
Cohesion: 0.21
Nodes (17): DeleteProgramReviewerDialog(), handleDelete(), DeleteProgramReviewerDialogProps, ProgramReviewerManager(), toggleActive(), ProgramReviewerManagerProps, ProgramReviewerModal(), handleSubmit() (+9 more)

### Community 42 - "types/dashboard.ts"
Cohesion: 0.08
Nodes (31): GET(), addTally(), aggregate(), blankTally(), byName(), completionRows(), row(), Tally (+23 more)

### Community 43 - "types/syllabus.ts"
Cohesion: 0.08
Nodes (47): GET(), RouteContext, GET(), RouteContext, conflict(), PUT(), RouteContext, DELETE() (+39 more)

### Community 44 - "syllabus/route.test.ts"
Cohesion: 0.33
Nodes (3): input, mocks, openTerm

### Community 45 - "Course List Tests"
Cohesion: 0.25
Nodes (5): base, forbidden(), listResult, mocks, rows

### Community 46 - "Duplicate Route Tests"
Cohesion: 0.13
Nodes (8): forbidden(), input, mocks, pb, ctx, mocks, pdf, upload()

### Community 47 - "export.ts"
Cohesion: 0.05
Nodes (52): config, isTokenExpired(), proxy(), PUBLIC_PATHS, metadata, PageProps, SyllabusFormsPage(), Form17View() (+44 more)

### Community 48 - "dashboard-manager.tsx"
Cohesion: 0.17
Nodes (29): DashboardManager(), defaultTerm(), JustificationsPanel(), STATE_STYLES, STATES, daysSince(), ErrorBanner(), ExportLink() (+21 more)

### Community 49 - "Enhanced OBE Syllabus on `[FILL IN: course name]`"
Cohesion: 0.07
Nodes (27): About This File, BUKIDNON STATE UNIVERSITY, Course Information, Creating a syllabus, Differences between the two signatory blocks, Document Structure (in order), Enhanced OBE Syllabus on `[FILL IN: course name]`, Enhanced OBE Syllabus Template (BukSU) (+19 more)

### Community 50 - "lib/review-queue.ts"
Cohesion: 0.16
Nodes (25): GET(), Testing, Cover, heldStages(), holdsStageFor(), listAwaitingReviewIds(), loadMyStandIns(), loadQueueExtras() (+17 more)

### Community 51 - "vitest"
Cohesion: 0.05
Nodes (29): vitest, get(), listResult, mocks, rows, approve, ctx, mocks (+21 more)

### Community 52 - "citl-director/route.ts"
Cohesion: 0.23
Nodes (14): PATCH(), RouteContext, GET(), POST(), getActiveCitlDirector(), hasActiveCitlDirector(), isCitlDirector(), toCitlDirectorResponse() (+6 more)

### Community 53 - "campus-client.ts"
Cohesion: 0.15
Nodes (22): CampusPage(), metadata, CampusManager(), formatDate(), ModalState, CampusModal(), handleSubmit(), CampusModalMode (+14 more)

### Community 54 - "handlePbError"
Cohesion: 0.12
Nodes (31): DELETE(), DELETE(), DELETE(), DELETE(), DELETE(), DELETE(), GET(), DELETE() (+23 more)

### Community 55 - "prospectus-client.ts"
Cohesion: 0.18
Nodes (19): DeleteProspectusDialog(), handleDelete(), DeleteProspectusDialogProps, DuplicateProspectusDialog(), handleConfirm(), DuplicateProspectusDialogProps, ItemList(), ProspectusManager() (+11 more)

### Community 56 - "school-year/[id]/route.ts"
Cohesion: 0.22
Nodes (14): DELETE(), PATCH(), RouteContext, GET(), POST(), DEPENDENTS, describeSchoolYearDependents(), toSchoolYearResponse() (+6 more)

### Community 57 - "syllabus-detail.tsx"
Cohesion: 0.11
Nodes (24): DeleteSyllabusDialog(), handleDelete(), DeleteSyllabusDialogProps, groupPoints(), ReviewPointsHistory(), SubmitSyllabusDialog(), handleSubmit(), SubmitSyllabusDialogProps (+16 more)

### Community 58 - "types/roles.ts"
Cohesion: 0.13
Nodes (13): AppShell(), Sidebar(), SidebarProps, Capability, getNavItems(), NAV_ITEMS, NavItem, mocks (+5 more)

### Community 59 - "syllabus-manager.tsx"
Cohesion: 0.12
Nodes (17): AvailableCourseCombobox(), AvailableCourseComboboxProps, SyllabusManager(), SyllabusManagerProps, ProgramOption, SyllabusModal(), handleSubmit(), SyllabusModalProps (+9 more)

### Community 110 - "resubmit/route.ts"
Cohesion: 0.07
Nodes (66): GET(), notFound(), PUT(), RouteContext, POST(), RouteContext, conflict(), POST() (+58 more)

### Community 111 - "term-manager.tsx"
Cohesion: 0.15
Nodes (22): DeleteTermDialog(), handleDelete(), DeleteTermDialogProps, ModalState, TermManager(), toggleOpen(), TermManagerProps, TermModal() (+14 more)

### Community 112 - "next"
Cohesion: 0.04
Nodes (41): POST(), GET(), requireEnv(), nextConfig, next, mocks, valid, ctx (+33 more)

### Community 113 - "faculty/route.test.ts"
Cohesion: 0.04
Nodes (29): mocks, ctx, mocks, base, forbidden(), listResult, mocks, rows (+21 more)

### Community 114 - "users.ts"
Cohesion: 0.11
Nodes (25): DELETE(), GET(), DELETE(), GET(), PATCH(), RouteContext, GET(), POST() (+17 more)

### Community 115 - "vpaa/route.ts"
Cohesion: 0.23
Nodes (14): PATCH(), RouteContext, GET(), POST(), ParseResult, parseVpaaInput(), parseVpaaUpdate(), getActiveVpaa() (+6 more)

### Community 118 - "register/page.tsx"
Cohesion: 0.17
Nodes (15): LoginPage(), LoginPageProps, metadata, metadata, RegisterPage(), RegisterPageProps, LoginForm(), handleSubmit() (+7 more)

### Community 119 - "reference-manager.tsx"
Cohesion: 0.07
Nodes (48): COPY, DialogAction, ReferenceActionDialog(), handleSubmit(), ReferenceActionDialogProps, ReferenceManager(), ReferenceManagerProps, ReferenceModal() (+40 more)

### Community 120 - "review-workspace.tsx"
Cohesion: 0.17
Nodes (16): PdfPane(), PdfPaneProps, ReviewDecisionDialog(), handleConfirm(), ReviewDecisionDialogProps, ReviewWorkspace(), termLabel(), SyllabusVersions() (+8 more)

### Community 121 - "pocketbase"
Cohesion: 0.19
Nodes (18): FdisChairPage(), metadata, DeleteFdisChairDialog(), handleDelete(), DeleteFdisChairDialogProps, FdisChairManager(), toggleActive(), FdisChairManagerProps (+10 more)

### Community 122 - "Syllabus Development Guidelines"
Cohesion: 0.08
Nodes (23): 10. Syllabus Table Format, 11. Writing Good Outcomes, 12. Syllabus Creation Workflow, 13. Institutional Review Process, 14. Validation Checklist, 15. Output Behavior for Claude, 1. Role and Scope, 2. Bloom's Taxonomy Reference (+15 more)

### Community 123 - "syllabus-workflow.ts"
Cohesion: 0.10
Nodes (31): API, Workflow (`lib/syllabus-workflow.ts`, pure), approve(), ApproveEvent, ChainRole, fail(), file(), FileEvent (+23 more)

### Community 124 - "validators/term.ts"
Cohesion: 0.21
Nodes (15): GET(), PATCH(), RouteContext, GET(), POST(), toTermRecord(), toTermResponse(), isReviewDays() (+7 more)

### Community 125 - "index.ts"
Cohesion: 0.17
Nodes (15): FORM17_REV04, FORM18_REV01, checklistCriteria(), CURRENT_FORM17, CURRENT_FORM18, FORM17_REVISIONS, form17Status(), FORM18_REVISIONS (+7 more)

### Community 126 - "review-queue-manager.tsx"
Cohesion: 0.08
Nodes (28): metadata, ReviewQueuePage(), ProgramFilterCombobox(), ProgramFilterComboboxProps, ProgramOption, age(), ReviewQueueManager(), stageLabel() (+20 more)

### Community 127 - "Phase 2: Syllabus submission"
Cohesion: 0.20
Nodes (9): API, Capabilities, Decisions (2026-10-26), Definitions, Out of scope, Phase 2: Syllabus submission, Schema changes (to apply to `pb_schema.json`), UI (+1 more)

### Community 128 - "authorize"
Cohesion: 0.19
Nodes (14): PATCH(), RouteContext, POST(), PATCH(), POST(), authorize(), parseDepartmentInput(), ParseResult (+6 more)

### Community 129 - "syllabus-reference/route.test.ts"
Cohesion: 0.25
Nodes (5): input, mocks, SCOPE, source, term

### Community 130 - "co-authors-panel.tsx"
Cohesion: 0.39
Nodes (7): CoAuthorPicker(), CoAuthorPickerProps, CoAuthorsPanel(), save(), CoAuthorsPanelProps, listCoAuthorCandidates(), updateSyllabusCoAuthors()

### Community 131 - "revise-workspace.tsx"
Cohesion: 0.14
Nodes (21): metadata, PageProps, SyllabusRevisePage(), ResubmitSyllabusDialog(), handleResubmit(), ResubmitSyllabusDialogProps, Check(), lastReturnedVersionNo() (+13 more)

### Community 132 - "can"
Cohesion: 0.23
Nodes (15): GET(), PATCH(), RouteContext, GET(), POST(), can(), PROSPECTUS_EXPAND, toProspectusResponse() (+7 more)

### Community 133 - "prospectus-item/[id]/route.ts"
Cohesion: 0.29
Nodes (13): GET(), PATCH(), RouteContext, GET(), POST(), PROSPECTUS_ITEM_EXPAND, toProspectusItemResponse(), isYearLevel() (+5 more)

### Community 134 - "Phase 5: Visibility and communication"
Cohesion: 0.13
Nodes (14): Schema changes (to apply to `pb_schema.json`), Boundaries, Dashboards, Deadlines, Decisions (2026-10-28), Objective, Out of scope, Phase 5: Visibility and communication (+6 more)

### Community 139 - "[pointId]/route.test.ts"
Cohesion: 0.22
Nodes (10): ctx, EDIT, given(), HOLDERS, mocks, point(), remove(), RESOLVE (+2 more)

### Community 140 - "form17-panel.tsx"
Cohesion: 0.16
Nodes (16): Draft, draftFrom(), Form17Panel(), handleSave(), Form17PanelProps, saveForm17(), CRITERIA, parseForm17Input() (+8 more)

### Community 141 - "Criteria"
Cohesion: 0.12
Nodes (16): A. Preliminaries, B. Vision, Mission, Goals, Objectives, and Outcomes, C. Course Content, Closing Section, Criteria, D. Assessment, E. Learning Modality and Methods, F. Resources, Required Readings, and References (+8 more)

### Community 142 - "SyllabusResponse"
Cohesion: 0.23
Nodes (12): by(), currentLine(), describeEntry(), DOT, stageName(), SyllabusTimeline(), SyllabusTimelineProps, version() (+4 more)

### Community 143 - "org-children.ts"
Cohesion: 0.22
Nodes (8): DELETE(), DELETE(), Child, CHILDREN, describeChildren(), joinParts(), OrgParent, mocks

### Community 144 - "3. Letter Body (in order, top to bottom)"
Cohesion: 0.12
Nodes (15): 1. Document Overview, 2. Letterhead (fixed, centered at top), 3.1 Date — VARIABLE, 3.2 Recipient block — FIXED, 3.3 Salutation — FIXED, 3.4 Opening paragraph — PARTLY VARIABLE, 3.5 Table — VARIABLE (see Section 4), 3.6 Closing — FIXED (+7 more)

### Community 145 - "stand-ins-panel.tsx"
Cohesion: 0.39
Nodes (7): StandInPicker(), StandInPickerProps, StandInsPanel(), save(), StandInsPanelProps, listStandIns(), setStandIn()

### Community 146 - "CITL Syllabus Review Guide (Instructions for Part B)"
Cohesion: 0.14
Nodes (13): A. Format and House Style, B. Alignment (Coherence and Logical Connection Between Learning Plan Components), C. Use of Behavioral Verbs (Bloom's Taxonomy), CITL Syllabus Review Guide (Instructions for Part B), CITL Syllabus Review: Suggestions and Action Taken (Form 18-1), D. Gradation of COs and SLOs, E. Supplementary Documentation, F. Inclusion of Prescribed Institutional Forms (+5 more)

### Community 147 - "program-reviewer/route.ts"
Cohesion: 0.28
Nodes (12): PATCH(), RouteContext, GET(), POST(), programHasActiveReviewer(), toProgramReviewerResponse(), parseProgramReviewerInput(), parseProgramReviewerUpdate() (+4 more)

### Community 148 - "types/user.ts"
Cohesion: 0.24
Nodes (10): metadata, RootLayout(), AppHeader(), unreadFor(), getInitials(), HeaderAuth(), handleLogout(), HeaderAuthProps (+2 more)

### Community 149 - "overdue-badge.tsx"
Cohesion: 0.23
Nodes (16): Badge(), plural(), ReviewOverdueBadge(), reviewOverdueDays(), SubmissionOverdueBadge(), submissionOverdueDays(), TermDeadlines, syllabusOverdue() (+8 more)

### Community 150 - "program-join-request/route.ts"
Cohesion: 0.10
Nodes (29): DELETE(), notPending(), PATCH(), RouteContext, GET(), POST(), RejectProgramJoinRequestDialogProps, applyJoinRequestDecision() (+21 more)

### Community 151 - "form18-panel.tsx"
Cohesion: 0.10
Nodes (28): Form18Panel(), run(), Form18PanelProps, NewPointForm(), PointForm(), PointFormProps, PointRow(), PointRowProps (+20 more)

### Community 152 - "[code]/page.tsx"
Cohesion: 0.40
Nodes (5): ACTING_AS_LABELS, metadata, PageProps, Row(), VerifyApprovalPage()

### Community 153 - "[id]/form17/route.test.ts"
Cohesion: 0.18
Nodes (9): ctx, FORM, get(), HOLDERS, INPUT, LATEST, mocks, put() (+1 more)

### Community 154 - "vpaa/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 155 - "term/route.test.ts"
Cohesion: 0.25
Nodes (5): base, forbidden(), listResult, mocks, rows

### Community 156 - "types/justification.ts"
Cohesion: 0.27
Nodes (10): isObject(), parseJustificationInput(), parseJustificationReturn(), ParseResult, JUSTIFICATION_STATUSES, JustificationEntry, JustificationInput, JustificationReturnInput (+2 more)

### Community 157 - "review/route.test.ts"
Cohesion: 0.20
Nodes (7): BY_STAGE, ctx, decide(), HOLDERS, mocks, NO_POINTS, VERSION

### Community 158 - "prospectus-item/route.test.ts"
Cohesion: 0.25
Nodes (5): base, forbidden(), listResult, mocks, rows

### Community 159 - "dean/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 160 - "canAnywhere"
Cohesion: 0.47
Nodes (4): DashboardPage(), metadata, Home(), canAnywhere()

### Community 161 - "audit-phase-a.ts"
Cohesion: 0.33
Nodes (6): AssignmentRow, ASSIGNMENTS, main(), requireEnv(), UNASSIGNED_FILTER, UserRow

### Community 162 - "stand-in/route.test.ts"
Cohesion: 0.22
Nodes (4): ctx, HOLDERS, ITEMS, mocks

### Community 163 - "submit/route.test.ts"
Cohesion: 0.33
Nodes (4): ctx, draft, HOLDERS, mocks

### Community 164 - "approval-verify.test.ts"
Cohesion: 0.67
Nodes (3): fakePb(), filter(), review

### Community 165 - "[id]/form18/route.test.ts"
Cohesion: 0.25
Nodes (5): ctx, HOLDERS, LATEST, mocks, post()

### Community 166 - "college/route.test.ts"
Cohesion: 0.29
Nodes (4): GET(), base, listResult, mocks

### Community 167 - "co-author-candidates/route.test.ts"
Cohesion: 0.33
Nodes (4): candidates, ctx, mocks, syllabus

### Community 169 - "stand-in-candidates/route.test.ts"
Cohesion: 0.29
Nodes (6): candidates, ctx, get(), HOLDERS, mocks, syllabus

### Community 170 - "export/form17/route.test.ts"
Cohesion: 0.33
Nodes (5): ctx, form17(), mocks, SYLLABUS, VERSION

### Community 171 - "forms/justification.ts"
Cohesion: 0.60
Nodes (4): buildJustificationLetter(), JUSTIFICATION_TEMPLATE, letterDate(), SEMESTERS

### Community 173 - "school-year/[id]/route.test.ts"
Cohesion: 0.33
Nodes (4): GET(), ctx, forbidden(), mocks

### Community 176 - "lead-candidates/route.test.ts"
Cohesion: 0.33
Nodes (5): candidates, ctx, get(), mocks, syllabus

### Community 191 - "[id]/review/page.tsx"
Cohesion: 0.50
Nodes (3): metadata, PageProps, SyllabusReviewPage()

## Knowledge Gaps
- **10 isolated node(s):** `RFC-4180`, `Org chain (campus, college, department, program)`, `Scoped list visibility (lib/org-visibility.ts)`, `Plain CRUD entities (campus, college, department, program, user)`, `Advisory PDF checks (informational only)` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1087 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **70 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `dashboard-scope.ts`, `react`, `ref_server_only`, `Route Test Helpers`, `validators/user.ts`, `course-modal.tsx`, `Package & Tooling Config`, `fdis-chair/route.ts`, `org-visibility.ts`, `mockAuth`, `Role Admin Pages`, `pocketbase`, `timeline/route.ts`, `campus/[id]/route.ts`, `resolveSyllabusAccess`, `Department UI`, `lib/prospectus-duplicate.ts`, `AppUser`, `lib/auth.ts`, `lib/dashboard.ts`, `department-head/route.test.ts`, `pocketbase.ts`, `dean-manager.tsx`, `Department Head API`, `Program Chair API`, `faculty/route.ts`, `getUserRoles`, `types/notification.ts`, `signed-copy/route.ts`, `Prospectus List Tests`, `types/dashboard.ts`, `types/syllabus.ts`, `syllabus/route.test.ts`, `Course List Tests`, `Duplicate Route Tests`, `export.ts`, `dashboard-manager.tsx`, `lib/review-queue.ts`, `vitest`, `citl-director/route.ts`, `campus-client.ts`, `handlePbError`, `school-year/[id]/route.ts`, `syllabus-detail.tsx`, `types/roles.ts`, `syllabus-manager.tsx`, `resubmit/route.ts`, `faculty/route.test.ts`, `users.ts`, `vpaa/route.ts`, `register/page.tsx`, `reference-manager.tsx`, `review-workspace.tsx`, `pocketbase`, `validators/term.ts`, `review-queue-manager.tsx`, `authorize`, `syllabus-reference/route.test.ts`, `revise-workspace.tsx`, `can`, `prospectus-item/[id]/route.ts`, `[pointId]/route.test.ts`, `program-reviewer/route.ts`, `types/user.ts`, `program-join-request/route.ts`, `[code]/page.tsx`, `[id]/form17/route.test.ts`, `vpaa/route.test.ts`, `term/route.test.ts`, `review/route.test.ts`, `prospectus-item/route.test.ts`, `dean/route.test.ts`, `canAnywhere`, `stand-in/route.test.ts`, `submit/route.test.ts`, `[id]/form18/route.test.ts`, `college/route.test.ts`, `co-author-candidates/route.test.ts`, `stand-in-candidates/route.test.ts`, `export/form17/route.test.ts`, `school-year/[id]/route.test.ts`, `lead-candidates/route.test.ts`, `[id]/review/page.tsx`?**
  _High betweenness centrality (0.152) - this node is a cross-community bridge._
- **Are the 78 inferred relationships involving `createAdminPb()` (e.g. with `register/route.test.ts` and `campus/[id]/route.test.ts`) actually correct?**
  _`createAdminPb()` has 78 INFERRED edges - model-reasoned connections that need verification._
- **What connects `RFC-4180`, `Org chain (campus, college, department, program)`, `Scoped list visibility (lib/org-visibility.ts)` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `prospectus-item-manager.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1361344537815126 - nodes in this community are weakly interconnected._
- **Why does `pocketbase` connect `pocketbase` to `prospectus-item-manager.tsx`, `dashboard-scope.ts`, `react`, `ref_server_only`, `authorize`, `can`, `validators/user.ts`, `course-modal.tsx`, `Package & Tooling Config`, `User Admin UI`, `fdis-chair/route.ts`, `CITL Director Module`, `pocketbase`, `form17-panel.tsx`, `pocketbase`, `timeline/route.ts`, `campus/[id]/route.ts`, `resolveSyllabusAccess`, `Department UI`, `Faculty UI`, `program-join-request/route.ts`, `lib/prospectus-duplicate.ts`, `AppUser`, `lib/auth.ts`, `lib/dashboard.ts`, `VPAA UI`, `form18-panel.tsx`, `Program Chair UI`, `pocketbase.ts`, `dean-manager.tsx`, `types/justification.ts`, `Department Head API`, `audit-phase-a.ts`, `faculty/route.ts`, `getUserRoles`, `types/notification.ts`, `syllabus-client.ts`, `signed-copy/route.ts`, `approval-verify.test.ts`, `program-reviewer-manager.tsx`, `Program Chair API`, `types/syllabus.ts`, `export.ts`, `dashboard-manager.tsx`, `lib/review-queue.ts`, `citl-director/route.ts`, `campus-client.ts`, `prospectus-client.ts`, `school-year/[id]/route.ts`, `syllabus-manager.tsx`, `program-reviewer/route.ts`, `resubmit/route.ts`, `term-manager.tsx`, `next`, `faculty/route.test.ts`, `vpaa/route.ts`, `reference-manager.tsx`, `review-workspace.tsx`, `index.ts`, `review-queue-manager.tsx`?**
  _High betweenness centrality (0.150) - this node is a cross-community bridge._
- **Are the 18 inferred relationships involving `handlePbError()` (e.g. with `Testing` and `Testing`) actually correct?**
  _`handlePbError()` has 18 INFERRED edges - model-reasoned connections that need verification._
- **Should `dashboard-scope.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05311871227364185 - nodes in this community are weakly interconnected._