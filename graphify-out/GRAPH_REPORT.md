# Graph Report - syllabusv2  (2026-10-28)

## Corpus Check
- 649 files · ~295,696 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 4, .ico 1, .css 1)

## Summary
- 3313 nodes · 10410 edges · 173 communities (101 shown, 72 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 299 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f84e89b9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- prospectus-item-manager.tsx
- dashboard-scope.ts
- react
- ref_server_only
- lib/syllabus-review.ts
- Project Docs & Domain Rules
- validators/user.ts
- course-modal.tsx
- Package & Tooling Config
- User Admin UI
- fdis-chair/route.ts
- capability-rules.ts
- CITL Director Module
- global-setup.ts
- next
- getUserRoles
- pocketbase
- timeline/route.ts
- pocketbase.ts
- resolveSyllabusAccess
- Department UI
- Faculty UI
- lib/prospectus-duplicate.ts
- capability-rules.ts
- Syllabus
- lib/auth.test.ts
- dashboard-export.ts
- VPAA UI
- export/route.ts
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
- lib/dashboard.ts
- program-reviewer-manager.tsx
- types/dashboard.ts
- types/syllabus.ts
- canSomewhere
- course/route.test.ts
- helpers.ts
- index.ts
- dashboard-manager.tsx
- Enhanced OBE Syllabus on `[FILL IN: course name]`
- lib/review-queue.ts
- signed-copy/route.test.ts
- citl-director/route.ts
- form17-view.tsx
- stand-in/route.ts
- prospectus-client.ts
- lib/auth.ts
- syllabus-detail.tsx
- types/roles.ts
- react
- PostCSS Config
- resubmit/route.ts
- term-manager.tsx
- review-queue/route.test.ts
- transfer-lead-dialog.tsx
- AppUser
- org-visibility.ts
- register/page.tsx
- reference-manager.tsx
- revise-workspace.tsx
- pocketbase
- Syllabus Development Guidelines
- syllabus-workflow.ts
- types/review-queue.ts
- 05-a11y.spec.ts
- Phase 4: Reviewer experience
- Phase 2: Syllabus submission
- createAdminPb
- scripts
- signed-copies/route.test.ts
- dependencies
- can
- summary/route.test.ts
- Phase 5: Visibility and communication
- Retention policy
- lib/form17.ts
- Criteria
- audit-log.ts
- proxy.ts
- 3. Letter Body (in order, top to bottom)
- README.md
- CITL Syllabus Review Guide (Instructions for Part B)
- program-reviewer/route.ts
- auth-client.ts
- overdue-badge.tsx
- program-join-request/route.ts
- form18-panel.tsx
- getCurrentUser
- [id]/form17/route.test.ts
- types/justification.ts
- stand-in/route.test.ts
- approval-verify.ts
- forms/justification.ts

## God Nodes (most connected - your core abstractions)
1. `createAdminPb()` - 344 edges
2. `handlePbError()` - 244 edges
3. `next` - 224 edges
4. `requireUser()` - 219 edges
5. `vitest` - 152 edges
6. `pocketbase` - 135 edges
7. `mockAuth()` - 124 edges
8. `getUserRoles` - 123 edges
9. `react` - 108 edges
10. `@headlessui/react` - 93 edges

## Surprising Connections (you probably didn't know these)
- `Hub (`/syllabus/[id]`)` --references--> `SyllabusVersions()`  [INFERRED]
  docs/specs/phase-4-reviewer-experience.md → components/syllabus/syllabus-versions.tsx
- `Deadlines` --references--> `ReviewQueueItem`  [INFERRED]
  docs/specs/phase-5-visibility.md → types/review-queue.ts
- `Proposals (accept or amend before task 1)` --references--> `justificationScope()`  [INFERRED]
  docs/specs/phase-5-visibility.md → lib/dashboard-scope.ts
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

## Communities (173 total, 72 thin omitted)

### Community 0 - "prospectus-item-manager.tsx"
Cohesion: 0.09
Nodes (38): GET(), POST(), metadata, ProspectusItemPage(), DeleteProspectusItemDialog(), handleDelete(), DeleteProspectusItemDialogProps, itemProspectusLabel() (+30 more)

### Community 1 - "dashboard-scope.ts"
Cohesion: 0.10
Nodes (20): anyOf(), Bind, filterInScope(), programInScope(), programMatches(), programScopeFilter(), ScopedPrograms, scopePrograms() (+12 more)

### Community 2 - "react"
Cohesion: 0.11
Nodes (27): metadata, SchoolYearPage(), DeleteSchoolYearDialog(), handleDelete(), DeleteSchoolYearDialogProps, ModalState, SchoolYearManager(), SchoolYearManagerProps (+19 more)

### Community 3 - "ref_server_only"
Cohesion: 0.10
Nodes (38): GET(), notFound(), RouteContext, GET(), RouteContext, GET(), RouteContext, conflict() (+30 more)

### Community 4 - "lib/syllabus-review.ts"
Cohesion: 0.11
Nodes (29): Authors, Batch, clip(), notificationRecipients(), notificationText(), NOTIFY_EXPAND, NotifyEvent, stageActors() (+21 more)

### Community 5 - "Project Docs & Domain Rules"
Cohesion: 0.06
Nodes (37): AGENTS.md (agent guidance), Approval reference code (SYL-<term>-<seq>-S<stage>), Capability-based authorization (can, requireUser, authorize, canSomewhere), Form 17 (OVPAA-F-INS-017) review checklist, Form 18-1 (CITL-F-018) review points, getUserRoles resolver (derived roles from assignment records), users.isAdmin (only stored role), Justification Form (missing lead signature) (+29 more)

### Community 6 - "validators/user.ts"
Cohesion: 0.13
Nodes (19): isDuplicateEmail(), POST(), metadata, RegisterPage(), RegisterPageProps, RegisterFormProps, DEFAULT_EMAIL_DOMAINS, parseDomainList() (+11 more)

### Community 7 - "course-modal.tsx"
Cohesion: 0.07
Nodes (42): CoursePage(), metadata, CourseCombobox(), CourseComboboxProps, CourseOption, CourseManager(), CourseManagerProps, ModalState (+34 more)

### Community 8 - "Package & Tooling Config"
Cohesion: 0.09
Nodes (27): eslintConfig, devDependencies, @axe-core/playwright@^4.14.0, eslint@^9, eslint-config-next@16.3.6, @playwright/test@^1.64.1, tailwindcss@^4, @tailwindcss/postcss@^4 (+19 more)

### Community 9 - "User Admin UI"
Cohesion: 0.12
Nodes (24): metadata, UserPage(), DeleteUserDialog(), handleDelete(), DeleteUserDialogProps, describeAccess(), KIND_LABELS, ModalState (+16 more)

### Community 10 - "fdis-chair/route.ts"
Cohesion: 0.11
Nodes (21): PATCH(), RouteContext, GET(), POST(), getActiveFdisChair(), hasActiveFdisChair(), isFdisChair(), toFdisChairResponse() (+13 more)

### Community 11 - "capability-rules.ts"
Cohesion: 0.14
Nodes (4): Rule, RULES, QueueQuery, UserRoles

### Community 12 - "CITL Director Module"
Cohesion: 0.17
Nodes (18): CitlDirectorPage(), metadata, CitlDirectorManager(), toggleActive(), CitlDirectorManagerProps, CitlDirectorModal(), handleSubmit(), CitlDirectorModalProps (+10 more)

### Community 13 - "global-setup.ts"
Cohesion: 0.15
Nodes (22): APP_PORT, APP_URL, DIST_DIR, LOCAL_PB, PB_BIN, PB_PORT, PB_URL, ROOT (+14 more)

### Community 14 - "next"
Cohesion: 0.01
Nodes (164): POST(), nextConfig, next, vitest, mocks, ctx, forbidden(), mocks (+156 more)

### Community 15 - "getUserRoles"
Cohesion: 0.08
Nodes (37): GET(), GET(), RouteContext, GET(), RouteContext, conflict(), PUT(), RouteContext (+29 more)

### Community 16 - "pocketbase"
Cohesion: 0.16
Nodes (20): metadata, ProgramPage(), DeleteProgramDialog(), handleDelete(), DeleteProgramDialogProps, ModalState, ProgramManager(), Detail() (+12 more)

### Community 17 - "timeline/route.ts"
Cohesion: 0.16
Nodes (13): buildTimeline(), name(), Named, TimelineEvent, TimelineVersion, base, SYLLABUS_EVENT_TYPES, SyllabusEvent (+5 more)

### Community 18 - "pocketbase.ts"
Cohesion: 0.06
Nodes (33): GET(), PATCH(), RouteContext, POST(), PATCH(), RouteContext, POST(), requireEnv() (+25 more)

### Community 19 - "resolveSyllabusAccess"
Cohesion: 0.08
Nodes (41): conflict(), DELETE(), load(), Loaded, notFound(), PATCH(), reviewerCheck(), RouteContext (+33 more)

### Community 20 - "Department UI"
Cohesion: 0.14
Nodes (23): DepartmentPage(), metadata, DeleteDepartmentDialog(), handleDelete(), DeleteDepartmentDialogProps, DepartmentManager(), ModalState, DepartmentModal() (+15 more)

### Community 21 - "Faculty UI"
Cohesion: 0.17
Nodes (18): FacultyPage(), metadata, DeleteFacultyDialog(), handleDelete(), DeleteFacultyDialogProps, FacultyManager(), toggleActive(), FacultyManagerProps (+10 more)

### Community 22 - "lib/prospectus-duplicate.ts"
Cohesion: 0.16
Nodes (19): GET(), POST(), applyDuplicate(), batchSize(), DuplicatePlan, MAX_BATCH_REQUESTS, newRecordId(), planDuplicate() (+11 more)

### Community 23 - "capability-rules.ts"
Cohesion: 0.14
Nodes (12): CAPABILITIES, admin, ADMIN_ONLY, chair, dean, facultyOnly, head, multiRole (+4 more)

### Community 24 - "Syllabus"
Cohesion: 0.11
Nodes (34): PATCH(), RouteContext, GET(), listReferenceSources(), LIVE_REFERENCE_FILTER, REFERENCE_EXPAND, ReferenceActor, referenceTransition (+26 more)

### Community 25 - "lib/auth.test.ts"
Cohesion: 0.31
Nodes (7): POST(), avatarUrl(), requestEmailVerification(), setSessionCookie(), toSessionUser(), createPb(), mocks

### Community 26 - "dashboard-export.ts"
Cohesion: 0.16
Nodes (17): RFC-4180, csvCell, fileSlug(), toCsv(), completionCsv(), filterOverdue(), JUSTIFICATION_LABELS, justificationsCsv() (+9 more)

### Community 27 - "VPAA UI"
Cohesion: 0.14
Nodes (21): metadata, VpaaPage(), DeleteVpaaDialog(), handleDelete(), DeleteVpaaDialogProps, VpaaManager(), toggleActive(), VpaaManagerProps (+13 more)

### Community 28 - "export/route.ts"
Cohesion: 0.24
Nodes (20): cap(), GET(), GET(), GET(), GET(), GET(), loadTermSlots(), paging() (+12 more)

### Community 29 - "Program Chair UI"
Cohesion: 0.18
Nodes (17): metadata, ProgramChairPage(), DeleteProgramChairDialog(), handleDelete(), DeleteProgramChairDialogProps, ProgramChairManager(), toggleActive(), ProgramChairManagerProps (+9 more)

### Community 30 - "pocketbase.ts"
Cohesion: 0.13
Nodes (21): PATCH(), RouteContext, GET(), POST(), collegeHasActiveDean(), isDeanOfCollege(), listCollegesDeanedBy(), toDeanResponse() (+13 more)

### Community 31 - "dean-manager.tsx"
Cohesion: 0.06
Nodes (59): CampusPage(), metadata, CollegePage(), metadata, DeanPage(), metadata, CampusManager(), formatDate() (+51 more)

### Community 32 - "TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 33 - "Department Head API"
Cohesion: 0.13
Nodes (21): PATCH(), RouteContext, GET(), POST(), departmentHasActiveHead(), isHeadOfDepartment(), listDepartmentsHeadedBy(), toDepartmentHeadResponse() (+13 more)

### Community 34 - "Program Chair API"
Cohesion: 0.13
Nodes (22): PATCH(), RouteContext, GET(), POST(), isChairOfProgram(), listProgramsChairedBy(), programHasActiveChair(), toProgramChairResponse() (+14 more)

### Community 35 - "faculty/route.ts"
Cohesion: 0.10
Nodes (21): PATCH(), RouteContext, GET(), isFacultyOfProgram(), toFacultyResponse(), parseFacultyInput(), parseFacultyUpdate(), ParseResult (+13 more)

### Community 36 - "getUserRoles"
Cohesion: 0.15
Nodes (24): conflict(), POST(), RouteContext, GET(), notFound(), POST(), RouteContext, GET() (+16 more)

### Community 37 - "types/notification.ts"
Cohesion: 0.06
Nodes (52): PATCH(), RouteContext, GET(), metadata, RootLayout(), metadata, NotificationsPage(), AppHeader() (+44 more)

### Community 38 - "syllabus-client.ts"
Cohesion: 0.08
Nodes (51): metadata, PageProps, SyllabusFormsPage(), JustificationLetterView(), PrintableForms(), JustificationPanel(), adopt(), handlePreview() (+43 more)

### Community 39 - "signed-copy/route.ts"
Cohesion: 0.10
Nodes (30): GET(), notFound(), RouteContext, RouteContext, GET(), notFound(), POST(), RouteContext (+22 more)

### Community 40 - "lib/dashboard.ts"
Cohesion: 0.15
Nodes (22): allAwaitingSignedCopy(), awaitingSignedCopyQuery(), emptyList(), justificationRows(), listAwaitingSignedCopy(), listJustifications(), loadFilteredPrograms(), programClause() (+14 more)

### Community 41 - "program-reviewer-manager.tsx"
Cohesion: 0.17
Nodes (17): metadata, ProgramReviewerPage(), DeleteProgramReviewerDialog(), handleDelete(), DeleteProgramReviewerDialogProps, ProgramReviewerManager(), toggleActive(), ProgramReviewerManagerProps (+9 more)

### Community 42 - "types/dashboard.ts"
Cohesion: 0.09
Nodes (32): addTally(), aggregate(), blankTally(), byName(), completionRows(), row(), Tally, withRate() (+24 more)

### Community 43 - "types/syllabus.ts"
Cohesion: 0.09
Nodes (36): RouteContext, POST(), GET(), POST(), Task plan (one reviewable change each, lint and tests green after each), anyOf(), AvailableList, AvailableQuery (+28 more)

### Community 44 - "canSomewhere"
Cohesion: 0.16
Nodes (18): DepartmentHeadPage(), metadata, DeleteDepartmentHeadDialog(), handleDelete(), DeleteDepartmentHeadDialogProps, DepartmentHeadManager(), toggleActive(), DepartmentHeadModal() (+10 more)

### Community 45 - "course/route.test.ts"
Cohesion: 0.18
Nodes (11): GET(), POST(), COURSE_EXPAND, DEPENDENTS, toCourseResponse(), parseCourseInput(), base, forbidden() (+3 more)

### Community 46 - "helpers.ts"
Cohesion: 0.34
Nodes (13): adminPb(), answerForm17AllYes(), approveInUi(), auditFor(), createDraft(), getSyllabus(), loadSeed(), ok() (+5 more)

### Community 47 - "index.ts"
Cohesion: 0.13
Nodes (22): Task plan (one reviewable change each, lint and tests green after each), buildForm17Export(), buildForm181Export(), ExportFormMeta, ExportSyllabus, INSTITUTION, JustificationState, meta() (+14 more)

### Community 48 - "dashboard-manager.tsx"
Cohesion: 0.12
Nodes (29): DashboardManager(), defaultTerm(), JustificationsPanel(), STATE_STYLES, STATES, daysSince(), ErrorBanner(), ExportLink() (+21 more)

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
Cohesion: 0.13
Nodes (21): PATCH(), RouteContext, GET(), POST(), getActiveCitlDirector(), hasActiveCitlDirector(), isCitlDirector(), toCitlDirectorResponse() (+13 more)

### Community 53 - "form17-view.tsx"
Cohesion: 0.32
Nodes (9): Form17View(), Line(), Form181View(), PointsTable(), ACTING_AS, FormHeader(), SignatureLines(), ExportPoint (+1 more)

### Community 54 - "stand-in/route.ts"
Cohesion: 0.11
Nodes (27): GET(), RouteContext, conflict(), GET(), notFound(), PUT(), RouteContext, listStandInCandidates() (+19 more)

### Community 55 - "prospectus-client.ts"
Cohesion: 0.10
Nodes (31): metadata, ProspectusPage(), DeleteProspectusDialog(), handleDelete(), DeleteProspectusDialogProps, DuplicateProspectusDialog(), handleConfirm(), DuplicateProspectusDialogProps (+23 more)

### Community 56 - "lib/auth.ts"
Cohesion: 0.09
Nodes (21): POST(), DELETE(), PATCH(), RouteContext, GET(), POST(), AUTH_COOKIE, AuthResult (+13 more)

### Community 57 - "syllabus-detail.tsx"
Cohesion: 0.08
Nodes (34): metadata, PageProps, SyllabusDetailPage(), CoAuthorPicker(), CoAuthorPickerProps, CoAuthorsPanel(), save(), CoAuthorsPanelProps (+26 more)

### Community 58 - "types/roles.ts"
Cohesion: 0.15
Nodes (13): AppShell(), Sidebar(), SidebarProps, Capability, getNavItems(), NAV_ITEMS, NavItem, mocks (+5 more)

### Community 59 - "react"
Cohesion: 0.07
Nodes (30): metadata, ReviewQueuePage(), metadata, SyllabusPage(), ProgramFilterCombobox(), ProgramFilterComboboxProps, ProgramOption, age() (+22 more)

### Community 110 - "resubmit/route.ts"
Cohesion: 0.12
Nodes (35): POST(), RouteContext, conflict(), POST(), RouteContext, POST(), RouteContext, Notifications (+27 more)

### Community 111 - "term-manager.tsx"
Cohesion: 0.10
Nodes (38): PATCH(), RouteContext, GET(), POST(), DeleteTermDialog(), handleDelete(), DeleteTermDialogProps, ModalState (+30 more)

### Community 112 - "review-queue/route.test.ts"
Cohesion: 0.33
Nodes (5): COVERS, get(), mocks, STAND_INS, VERSIONS

### Community 113 - "transfer-lead-dialog.tsx"
Cohesion: 0.27
Nodes (6): TransferLeadDialogProps, LEAD_REASON_MAX, LEAD_REASON_MIN, parseLeadTransfer(), ParseResult, LeadTransferInput

### Community 114 - "AppUser"
Cohesion: 0.17
Nodes (15): GET(), ASSIGNMENTS, listActiveAssignments(), Named, toUserResponse(), userKindFilter(), isUserKind(), base (+7 more)

### Community 115 - "org-visibility.ts"
Cohesion: 0.10
Nodes (25): PATCH(), RouteContext, GET(), POST(), AssignmentPaths, assignmentScopeFilter(), Bind, clauses() (+17 more)

### Community 118 - "register/page.tsx"
Cohesion: 0.29
Nodes (8): LoginPage(), LoginPageProps, metadata, LoginForm(), handleSubmit(), LoginFormProps, login(), safeRedirect()

### Community 119 - "reference-manager.tsx"
Cohesion: 0.10
Nodes (38): COPY, DialogAction, ReferenceActionDialog(), handleSubmit(), ReferenceActionDialogProps, ReferenceManager(), ReferenceManagerProps, ReferenceModal() (+30 more)

### Community 120 - "revise-workspace.tsx"
Cohesion: 0.08
Nodes (36): metadata, PageProps, SyllabusReviewPage(), metadata, PageProps, SyllabusRevisePage(), changed(), draftFrom() (+28 more)

### Community 121 - "pocketbase"
Cohesion: 0.14
Nodes (21): FdisChairPage(), metadata, DeleteFdisChairDialog(), handleDelete(), DeleteFdisChairDialogProps, FdisChairManager(), toggleActive(), FdisChairManagerProps (+13 more)

### Community 122 - "Syllabus Development Guidelines"
Cohesion: 0.08
Nodes (23): 10. Syllabus Table Format, 11. Writing Good Outcomes, 12. Syllabus Creation Workflow, 13. Institutional Review Process, 14. Validation Checklist, 15. Output Behavior for Claude, 1. Role and Scope, 2. Bloom's Taxonomy Reference (+15 more)

### Community 123 - "syllabus-workflow.ts"
Cohesion: 0.07
Nodes (40): Accepted 2026-10-27, API, Capabilities, Decisions (2026-10-26), Justification, Out of scope, Phase 3: Review engine and forms, Schema changes (to apply to `pb_schema.json`) (+32 more)

### Community 124 - "types/review-queue.ts"
Cohesion: 0.33
Nodes (8): Review queue, listReviewQueue(), request(), ReviewQueueParams, QUEUE_STATUSES, QueueStatus, ReviewQueueItem, ReviewQueueResponse

### Community 125 - "05-a11y.spec.ts"
Cohesion: 0.25
Nodes (6): PAGES, TAGS, PASSWORD, findSyllabusId(), PEOPLE, Person

### Community 126 - "Phase 4: Reviewer experience"
Cohesion: 0.18
Nodes (10): Boundaries, Decisions (2026-10-27), Events (`lib/syllabus-events.ts`, server-only), Hub (`/syllabus/[id]`), Objective, Out of scope, Phase 4: Reviewer experience, Proposals (accept or amend before task 1) (+2 more)

### Community 127 - "Phase 2: Syllabus submission"
Cohesion: 0.20
Nodes (9): API, Capabilities, Decisions (2026-10-26), Definitions, Out of scope, Phase 2: Syllabus submission, Schema changes (to apply to `pb_schema.json`), UI (+1 more)

### Community 128 - "createAdminPb"
Cohesion: 0.06
Nodes (75): GET(), DELETE(), GET(), DELETE(), DELETE(), GET(), GET(), DELETE() (+67 more)

### Community 129 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, audit:phase-a, build, dev, lint, pb, start, test (+1 more)

### Community 130 - "signed-copies/route.test.ts"
Cohesion: 0.25
Nodes (5): get(), IT, LIST, mocks, N

### Community 131 - "dependencies"
Cohesion: 0.29
Nodes (7): dependencies, @headlessui/react@^2.2.10, next@16.3.6, pocketbase@^0.28.1, react@19.2.8, react-dom@19.2.8, react-dom

### Community 132 - "can"
Cohesion: 0.31
Nodes (10): GET(), PATCH(), RouteContext, GET(), POST(), PROSPECTUS_EXPAND, toProspectusResponse(), parseProspectusInput() (+2 more)

### Community 133 - "summary/route.test.ts"
Cohesion: 0.29
Nodes (5): get(), IT, mocks, N, TERM_RECORD

### Community 134 - "Phase 5: Visibility and communication"
Cohesion: 0.10
Nodes (17): Boundaries, Dashboards, Deadlines, Decisions (2026-10-28), Objective, Out of scope, Phase 5: Visibility and communication, Proposals (accept or amend before task 1) (+9 more)

### Community 139 - "Retention policy"
Cohesion: 0.33
Nodes (5): Changing this policy, Removing records, Retention policy, Rule, Storage growth

### Community 140 - "lib/form17.ts"
Cohesion: 0.12
Nodes (28): Draft, Form17PanelProps, Batch, form17Facts(), listForm17Answers(), loadForm17(), newRecordId(), saveForm17 (+20 more)

### Community 141 - "Criteria"
Cohesion: 0.12
Nodes (16): A. Preliminaries, B. Vision, Mission, Goals, Objectives, and Outcomes, C. Course Content, Closing Section, Criteria, D. Assessment, E. Learning Modality and Methods, F. Resources, Required Readings, and References (+8 more)

### Community 142 - "audit-log.ts"
Cohesion: 0.05
Nodes (52): AuditPage(), metadata, ACTION_LABELS, AuditManager(), version(), Schema changes (to apply to `pb_schema.json`), Accessibility pass, Audit module (+44 more)

### Community 143 - "proxy.ts"
Cohesion: 0.50
Nodes (4): config, isTokenExpired(), proxy(), PUBLIC_PATHS

### Community 144 - "3. Letter Body (in order, top to bottom)"
Cohesion: 0.12
Nodes (15): 1. Document Overview, 2. Letterhead (fixed, centered at top), 3.1 Date — VARIABLE, 3.2 Recipient block — FIXED, 3.3 Salutation — FIXED, 3.4 Opening paragraph — PARTLY VARIABLE, 3.5 Table — VARIABLE (see Section 4), 3.6 Closing — FIXED (+7 more)

### Community 146 - "CITL Syllabus Review Guide (Instructions for Part B)"
Cohesion: 0.14
Nodes (13): A. Format and House Style, B. Alignment (Coherence and Logical Connection Between Learning Plan Components), C. Use of Behavioral Verbs (Bloom's Taxonomy), CITL Syllabus Review Guide (Instructions for Part B), CITL Syllabus Review: Suggestions and Action Taken (Form 18-1), D. Gradation of COs and SLOs, E. Supplementary Documentation, F. Inclusion of Prescribed Institutional Forms (+5 more)

### Community 147 - "program-reviewer/route.ts"
Cohesion: 0.11
Nodes (23): PATCH(), RouteContext, GET(), POST(), programHasActiveReviewer(), toProgramReviewerResponse(), parseProgramReviewerInput(), parseProgramReviewerUpdate() (+15 more)

### Community 148 - "auth-client.ts"
Cohesion: 0.21
Nodes (13): RegisterForm(), handleSubmit(), getInitials(), HeaderAuth(), handleLogout(), HeaderAuthProps, LoginInput, logout() (+5 more)

### Community 149 - "overdue-badge.tsx"
Cohesion: 0.31
Nodes (12): reviewOverdueDays(), submissionOverdueDays(), TermDeadlines, syllabusOverdue(), daysOverdue(), deadlineEnd(), isReviewOverdue(), isSubmissionOverdue() (+4 more)

### Community 150 - "program-join-request/route.ts"
Cohesion: 0.05
Nodes (57): notPending(), PATCH(), RouteContext, GET(), POST(), metadata, ProgramJoinRequestPage(), ProgramJoinRequestManager() (+49 more)

### Community 151 - "form18-panel.tsx"
Cohesion: 0.08
Nodes (33): Form18Panel(), run(), Form18PanelProps, NewPointForm(), PointForm(), PointFormProps, PointRow(), PointRowProps (+25 more)

### Community 152 - "getCurrentUser"
Cohesion: 0.24
Nodes (10): DashboardPage(), metadata, Home(), ACTING_AS_LABELS, metadata, PageProps, Row(), VerifyApprovalPage() (+2 more)

### Community 153 - "[id]/form17/route.test.ts"
Cohesion: 0.18
Nodes (14): GET(), notFound(), PUT(), RouteContext, latestVersion(), ctx, FORM, get() (+6 more)

### Community 156 - "types/justification.ts"
Cohesion: 0.24
Nodes (11): isObject(), parseJustificationInput(), parseJustificationReturn(), ParseResult, Justification, JUSTIFICATION_STATUSES, JustificationEntry, JustificationInput (+3 more)

### Community 162 - "stand-in/route.test.ts"
Cohesion: 0.11
Nodes (9): ctx, HOLDERS, LATEST, mocks, post(), ctx, HOLDERS, ITEMS (+1 more)

### Community 164 - "approval-verify.ts"
Cohesion: 0.12
Nodes (21): Task plan (one reviewable change each, lint and tests green after each), approvalCode(), ApprovalCodeParts, parseApprovalCode(), SEMESTER_CODES, validStage(), findApproval(), ReviewWithExpand (+13 more)

### Community 171 - "forms/justification.ts"
Cohesion: 0.60
Nodes (4): buildJustificationLetter(), JUSTIFICATION_TEMPLATE, letterDate(), SEMESTERS

## Knowledge Gaps
- **10 isolated node(s):** `RFC-4180`, `Org chain (campus, college, department, program)`, `Scoped list visibility (lib/org-visibility.ts)`, `Plain CRUD entities (campus, college, department, program, user)`, `Advisory PDF checks (informational only)` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1170 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **72 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `pocketbase` connect `program-join-request/route.ts` to `prospectus-item-manager.tsx`, `react`, `ref_server_only`, `lib/syllabus-review.ts`, `dependencies`, `validators/user.ts`, `course-modal.tsx`, `Package & Tooling Config`, `User Admin UI`, `CITL Director Module`, `lib/form17.ts`, `audit-log.ts`, `getUserRoles`, `pocketbase`, `next`, `pocketbase.ts`, `resolveSyllabusAccess`, `Department UI`, `Faculty UI`, `lib/prospectus-duplicate.ts`, `form18-panel.tsx`, `Syllabus`, `lib/auth.test.ts`, `program-reviewer/route.ts`, `VPAA UI`, `types/justification.ts`, `Program Chair UI`, `pocketbase.ts`, `dean-manager.tsx`, `Department Head API`, `Program Chair API`, `faculty/route.ts`, `approval-verify.ts`, `types/notification.ts`, `syllabus-client.ts`, `signed-copy/route.ts`, `lib/dashboard.ts`, `program-reviewer-manager.tsx`, `types/dashboard.ts`, `types/syllabus.ts`, `canSomewhere`, `getUserRoles`, `helpers.ts`, `dashboard-manager.tsx`, `lib/review-queue.ts`, `signed-copy/route.test.ts`, `citl-director/route.ts`, `stand-in/route.ts`, `prospectus-client.ts`, `react`, `timeline/route.ts`, `resubmit/route.ts`, `term-manager.tsx`, `AppUser`, `reference-manager.tsx`, `revise-workspace.tsx`, `pocketbase`, `types/review-queue.ts`, `05-a11y.spec.ts`?**
  _High betweenness centrality (0.185) - this node is a cross-community bridge._
- **Are the 78 inferred relationships involving `createAdminPb()` (e.g. with `audit/route.test.ts` and `register/route.test.ts`) actually correct?**
  _`createAdminPb()` has 78 INFERRED edges - model-reasoned connections that need verification._
- **What connects `RFC-4180`, `Org chain (campus, college, department, program)`, `Scoped list visibility (lib/org-visibility.ts)` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `prospectus-item-manager.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0889894419306184 - nodes in this community are weakly interconnected._
- **Why does `next` connect `next` to `createAdminPb`, `prospectus-item-manager.tsx`, `react`, `ref_server_only`, `can`, `dependencies`, `validators/user.ts`, `course-modal.tsx`, `VPAA UI`, `User Admin UI`, `fdis-chair/route.ts`, `Package & Tooling Config`, `CITL Director Module`, `Phase 5: Visibility and communication`, `audit-log.ts`, `getUserRoles`, `pocketbase`, `proxy.ts`, `pocketbase.ts`, `program-reviewer/route.ts`, `resolveSyllabusAccess`, `Department UI`, `program-join-request/route.ts`, `lib/prospectus-duplicate.ts`, `Syllabus`, `lib/auth.test.ts`, `[id]/form17/route.test.ts`, `getCurrentUser`, `export/route.ts`, `Faculty UI`, `pocketbase.ts`, `dean-manager.tsx`, `Program Chair UI`, `Department Head API`, `Program Chair API`, `faculty/route.ts`, `getUserRoles`, `types/notification.ts`, `syllabus-client.ts`, `signed-copy/route.ts`, `dashboard-scope.ts`, `program-reviewer-manager.tsx`, `stand-in/route.test.ts`, `types/syllabus.ts`, `canSomewhere`, `course/route.test.ts`, `dashboard-manager.tsx`, `lib/review-queue.ts`, `signed-copy/route.test.ts`, `citl-director/route.ts`, `stand-in/route.ts`, `prospectus-client.ts`, `lib/auth.ts`, `syllabus-detail.tsx`, `types/roles.ts`, `react`, `signed-copies/route.test.ts`, `auth-client.ts`, `resubmit/route.ts`, `term-manager.tsx`, `review-queue/route.test.ts`, `AppUser`, `org-visibility.ts`, `summary/route.test.ts`, `register/page.tsx`, `reference-manager.tsx`, `revise-workspace.tsx`, `pocketbase`?**
  _High betweenness centrality (0.160) - this node is a cross-community bridge._
- **Are the 19 inferred relationships involving `handlePbError()` (e.g. with `Testing` and `Testing`) actually correct?**
  _`handlePbError()` has 19 INFERRED edges - model-reasoned connections that need verification._
- **Should `dashboard-scope.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09655172413793103 - nodes in this community are weakly interconnected._