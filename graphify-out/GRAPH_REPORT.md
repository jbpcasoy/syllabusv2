# Graph Report - syllabusv2  (2026-10-29)

## Corpus Check
- 662 files · ~306,830 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 4, .ico 1, .css 1)

## Summary
- 3384 nodes · 10650 edges · 196 communities (122 shown, 74 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 330 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1be8b0a5`
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
- createAdminPb
- program-join-request/[id]/route.ts
- getCurrentUser
- global-setup.ts
- next
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
- types/audit.ts
- program-reviewer-manager.tsx
- types/dashboard.ts
- types/syllabus.ts
- types/course.ts
- course/route.test.ts
- helpers.ts
- fdis-chair/route.ts
- dashboard-manager.tsx
- Enhanced OBE Syllabus on `[FILL IN: course name]`
- lib/review-queue.ts
- signed-copy/route.test.ts
- citl-director/route.ts
- course/[id]/route.ts
- pocketbase
- prospectus-client.ts
- prospectus-item/[id]/route.ts
- syllabus-detail.tsx
- UserCombobox
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
- stand-ins-panel.tsx
- pocketbase
- Syllabus Development Guidelines
- syllabus-workflow.ts
- types/prospectus-item.ts
- 05-a11y.spec.ts
- SyllabusResponse
- dean-manager.tsx
- Program
- scripts
- justifications/route.test.ts
- dependencies
- AppUser
- react
- Phase 6: Hardening
- Retention policy
- course-manager.tsx
- Criteria
- campus/[id]/route.ts
- user/[id]/route.ts
- 3. Letter Body (in order, top to bottom)
- README.md
- CITL Syllabus Review Guide (Instructions for Part B)
- Phase 4: Reviewer experience
- [id]/form18/route.ts
- overdue-badge.tsx
- program-join-request-manager.tsx
- capabilities.ts
- app-shell.tsx
- term/[id]/route.ts
- review/route.test.ts
- form17-panel.tsx
- [pointId]/route.ts
- [pointId]/route.ts
- types/form18.ts
- validators/term.ts
- audit/page.tsx
- revise/page.tsx
- [copyId]/route.test.ts
- approval-verify.ts
- audit-log.ts
- Feature walkthrough
- types/justification.ts
- syllabus/page.tsx
- syllabus-client.ts
- form17-view.tsx
- citl-director/route.ts
- upload-version-modal.tsx
- register/page.tsx
- audit-phase-a.ts
- program-join-request/route.test.ts
- summary/route.ts
- Schema changes (to apply to `pb_schema.json`)
- options/route.test.ts
- lead-candidates/route.test.ts

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
- `Definitions` --references--> `getSyllabusAccess()`  [INFERRED]
  docs/specs/phase-2-syllabus-submission.md → lib/syllabus.ts
- `Timeline` --references--> `resolveSyllabusAccess()`  [INFERRED]
  docs/specs/phase-4-reviewer-experience.md → lib/syllabus.ts
- `Deadlines` --references--> `ReviewQueueItem`  [INFERRED]
  docs/specs/phase-5-visibility.md → types/review-queue.ts
- `Proposals (accept or amend before task 1)` --references--> `justificationScope()`  [INFERRED]
  docs/specs/phase-5-visibility.md → lib/dashboard-scope.ts
- `Hub (`/syllabus/[id]`)` --references--> `SyllabusVersions()`  [INFERRED]
  docs/specs/phase-4-reviewer-experience.md → components/syllabus/syllabus-versions.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Review engine flow (Phase 3)** — agents_syllabus_workflow_state_machine, agents_review_chain, syllabus_review_system_project_plan__v5__syllabus_statuses, syllabus_review_system_project_plan__v5__routing_readiness, agents_proxy_reviewer, agents_approval_reference [EXTRACTED 1.00]
- **University review forms supported by the system** — agents_form17, agents_form18_1, agents_justification_form, syllabus_review_system_project_plan__v5__enhanced_obe_syllabus, syllabus_review_system_project_plan__v5__form_definitions_versioning [EXTRACTED 1.00]
- **Phase A migration from role-based PERMISSIONS to derived-role capabilities** — project_context_users_role_field, project_context_permissions_map, agents_isadmin, agents_getuserroles, agents_capability_authorization [INFERRED 0.85]

## Communities (196 total, 74 thin omitted)

### Community 0 - "reference-manager.tsx"
Cohesion: 0.09
Nodes (38): metadata, SyllabusReferencePage(), ACTION_LABELS, COPY, DialogAction, ReferenceActionDialog(), handleSubmit(), ReferenceActionDialogProps (+30 more)

### Community 1 - "dashboard-scope.ts"
Cohesion: 0.07
Nodes (27): Testing, anyOf(), Bind, filterInScope(), programInScope(), programMatches(), programScopeFilter(), ScopedPrograms (+19 more)

### Community 2 - "react"
Cohesion: 0.13
Nodes (24): DeleteSchoolYearDialog(), handleDelete(), DeleteSchoolYearDialogProps, ModalState, SchoolYearManager(), changed(), SchoolYearManagerProps, SchoolYearModal() (+16 more)

### Community 3 - "college-manager.tsx"
Cohesion: 0.16
Nodes (20): CollegePage(), metadata, CollegeManager(), ModalState, CollegeModal(), handleSubmit(), CollegeModalMode, CollegeModalProps (+12 more)

### Community 4 - "lib/syllabus-review.ts"
Cohesion: 0.07
Nodes (40): API, Capabilities, Decisions (2026-10-26), Definitions, Out of scope, Phase 2: Syllabus submission, Schema changes (to apply to `pb_schema.json`), UI (+32 more)

### Community 5 - "Project Docs & Domain Rules"
Cohesion: 0.06
Nodes (37): AGENTS.md (agent guidance), Approval reference code (SYL-<term>-<seq>-S<stage>), Capability-based authorization (can, requireUser, authorize, canSomewhere), Form 17 (OVPAA-F-INS-017) review checklist, Form 18-1 (CITL-F-018) review points, getUserRoles resolver (derived roles from assignment records), users.isAdmin (only stored role), Justification Form (missing lead signature) (+29 more)

### Community 6 - "validators/user.ts"
Cohesion: 0.22
Nodes (11): RegisterFormProps, DEFAULT_EMAIL_DOMAINS, ParsedRegistration, parseRegisterInput(), ParseResult, EMAIL, MAX_NAME, MAX_PASSWORD (+3 more)

### Community 7 - "course-modal.tsx"
Cohesion: 0.15
Nodes (19): CourseModalProps, NUMBER_FIELDS, NumberKey, TITLES, FieldResult, MAX_CODE, MAX_HOURS, MAX_NOTE (+11 more)

### Community 8 - "Package & Tooling Config"
Cohesion: 0.09
Nodes (27): eslintConfig, devDependencies, @axe-core/playwright@^4.14.0, eslint@^9, eslint-config-next@16.3.6, @playwright/test@^1.64.1, tailwindcss@^4, @tailwindcss/postcss@^4 (+19 more)

### Community 9 - "export/form18/route.ts"
Cohesion: 0.13
Nodes (20): GET(), RouteContext, ApprovalStamp, buildForm17Export(), buildForm181Export(), ExportFormMeta, ExportSyllabus, INSTITUTION (+12 more)

### Community 10 - "createAdminPb"
Cohesion: 0.06
Nodes (94): DELETE(), GET(), GET(), POST(), DELETE(), GET(), DELETE(), GET() (+86 more)

### Community 11 - "program-join-request/[id]/route.ts"
Cohesion: 0.16
Nodes (20): DELETE(), notPending(), PATCH(), RouteContext, POST(), applyJoinRequestDecision(), JOIN_REQUEST_EXPAND, toProgramJoinRequestResponse() (+12 more)

### Community 12 - "getCurrentUser"
Cohesion: 0.09
Nodes (26): FacultyPage(), metadata, FdisChairPage(), metadata, metadata, NotificationsPage(), metadata, ProgramChairPage() (+18 more)

### Community 13 - "global-setup.ts"
Cohesion: 0.15
Nodes (22): APP_PORT, APP_URL, DIST_DIR, LOCAL_PB, PB_BIN, PB_PORT, PB_URL, ROOT (+14 more)

### Community 14 - "next"
Cohesion: 0.01
Nodes (163): POST(), nextConfig, next, vitest, mocks, ctx, forbidden(), mocks (+155 more)

### Community 15 - "resolveSyllabusAccess"
Cohesion: 0.14
Nodes (22): PATCH(), RouteContext, GET(), notFound(), POST(), RouteContext, listSignedCopies(), SIGNED_COPY_EXPAND (+14 more)

### Community 16 - "pocketbase"
Cohesion: 0.13
Nodes (23): metadata, ProgramPage(), DeleteProgramDialog(), handleDelete(), DeleteProgramDialogProps, ModalState, ProgramManager(), Detail() (+15 more)

### Community 17 - "timeline/route.ts"
Cohesion: 0.11
Nodes (16): Tasks, addAudit(), Batch, Batch, buildTimeline(), name(), Named, TimelineEvent (+8 more)

### Community 18 - "vpaa/route.ts"
Cohesion: 0.11
Nodes (20): PATCH(), RouteContext, POST(), parseVpaaInput(), parseVpaaUpdate(), getActiveVpaa(), hasActiveVpaa(), isVpaa() (+12 more)

### Community 19 - "department-head-manager.tsx"
Cohesion: 0.17
Nodes (18): DepartmentHeadPage(), metadata, DeleteDepartmentHeadDialog(), handleDelete(), DeleteDepartmentHeadDialogProps, DepartmentHeadManager(), toggleActive(), DepartmentHeadManagerProps (+10 more)

### Community 20 - "react"
Cohesion: 0.16
Nodes (20): DepartmentPage(), metadata, DeleteDepartmentDialog(), handleDelete(), DeleteDepartmentDialogProps, DepartmentManager(), ModalState, DepartmentModal() (+12 more)

### Community 21 - "Faculty UI"
Cohesion: 0.16
Nodes (19): DeleteFacultyDialog(), handleDelete(), DeleteFacultyDialogProps, FacultyManager(), toggleActive(), FacultyManagerProps, FacultyModal(), handleSubmit() (+11 more)

### Community 22 - "lib/prospectus-duplicate.ts"
Cohesion: 0.16
Nodes (19): GET(), POST(), applyDuplicate(), batchSize(), DuplicatePlan, MAX_BATCH_REQUESTS, newRecordId(), planDuplicate() (+11 more)

### Community 23 - "capability-rules.ts"
Cohesion: 0.09
Nodes (18): DashboardPage(), metadata, canAnywhere(), CAPABILITIES, evaluateCapability(), Rule, RULES, admin (+10 more)

### Community 24 - "index.ts"
Cohesion: 0.19
Nodes (14): FORM17_REV04, FORM18_REV01, FORM17_REVISIONS, FORM18_REVISIONS, isLegendCode(), legendEntries(), ChecklistCriterion, ChecklistDefinition (+6 more)

### Community 25 - "next"
Cohesion: 0.06
Nodes (35): GET(), POST(), POST(), GET(), isDuplicateEmail(), POST(), GET(), RouteContext (+27 more)

### Community 26 - "export/route.ts"
Cohesion: 0.17
Nodes (26): cap(), GET(), GET(), GET(), GET(), RFC-4180, csvCell, fileSlug() (+18 more)

### Community 27 - "VPAA UI"
Cohesion: 0.17
Nodes (17): metadata, VpaaPage(), DeleteVpaaDialog(), handleDelete(), DeleteVpaaDialogProps, VpaaManager(), toggleActive(), VpaaManagerProps (+9 more)

### Community 28 - "capabilities.ts"
Cohesion: 0.23
Nodes (15): GET(), PATCH(), RouteContext, GET(), POST(), can(), PROSPECTUS_EXPAND, toProspectusResponse() (+7 more)

### Community 29 - "Program Chair UI"
Cohesion: 0.16
Nodes (19): DeleteProgramChairDialog(), handleDelete(), DeleteProgramChairDialogProps, ProgramChairManager(), toggleActive(), ProgramChairManagerProps, ProgramChairModal(), handleSubmit() (+11 more)

### Community 30 - "auth-client.ts"
Cohesion: 0.22
Nodes (12): getInitials(), HeaderAuth(), handleLogout(), HeaderAuthProps, LoginInput, logout(), request(), RegisterResponse (+4 more)

### Community 31 - "dean-manager.tsx"
Cohesion: 0.15
Nodes (22): CampusPage(), metadata, CampusManager(), formatDate(), ModalState, CampusModal(), handleSubmit(), CampusModalMode (+14 more)

### Community 32 - "TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 33 - "resubmit/route.ts"
Cohesion: 0.10
Nodes (45): POST(), RouteContext, conflict(), conflictMessage(), POST(), RouteContext, POST(), RouteContext (+37 more)

### Community 34 - "authorize"
Cohesion: 0.13
Nodes (21): PATCH(), RouteContext, POST(), departmentHasActiveHead(), isHeadOfDepartment(), listDepartmentsHeadedBy(), toDepartmentHeadResponse(), parseDepartmentHeadInput() (+13 more)

### Community 35 - "school-year/[id]/route.ts"
Cohesion: 0.13
Nodes (17): DELETE(), GET(), PATCH(), RouteContext, POST(), DEPENDENTS, describeSchoolYearDependents(), schoolYearHasRefSeqs() (+9 more)

### Community 36 - "signed-copy/route.ts"
Cohesion: 0.14
Nodes (20): notFound(), POST(), RouteContext, notFound(), POST(), RouteContext, checkPdfUpload(), PdfCheck (+12 more)

### Community 37 - "types/notification.ts"
Cohesion: 0.09
Nodes (40): PATCH(), RouteContext, GET(), BellIcon(), BellPanel(), markAll(), open(), NotificationBell() (+32 more)

### Community 38 - "lib/dashboard.ts"
Cohesion: 0.14
Nodes (25): Task plan (one reviewable change each, lint and tests green after each), allAwaitingSignedCopy(), awaitingSignedCopyQuery(), emptyList(), justificationRows(), listAwaitingSignedCopy(), listJustifications(), loadFilteredPrograms() (+17 more)

### Community 39 - "[id]/justification/route.ts"
Cohesion: 0.15
Nodes (22): conflict(), GET(), load(), notFound(), PATCH(), PUT(), RouteContext, findJustification() (+14 more)

### Community 40 - "types/audit.ts"
Cohesion: 0.18
Nodes (15): Audit module, AuditListResponse, AuditParams, listAudit(), request(), parseAuditQuery(), ParseResult, phtMidnight() (+7 more)

### Community 41 - "program-reviewer-manager.tsx"
Cohesion: 0.14
Nodes (21): metadata, ProgramReviewerPage(), DeleteProgramReviewerDialog(), handleDelete(), DeleteProgramReviewerDialogProps, ProgramReviewerManager(), toggleActive(), ProgramReviewerManagerProps (+13 more)

### Community 42 - "types/dashboard.ts"
Cohesion: 0.12
Nodes (21): JUSTIFICATION_LABELS, LEVEL_LABELS, stageLabel(), TermDeadlines, DashboardQuery, ParseResult, SyllabusExportFilters, names (+13 more)

### Community 43 - "types/syllabus.ts"
Cohesion: 0.07
Nodes (58): conflict(), PUT(), RouteContext, DELETE(), GET(), leadOnly(), notEditable(), notFound() (+50 more)

### Community 44 - "types/course.ts"
Cohesion: 0.21
Nodes (13): CourseCombobox(), CourseComboboxProps, CourseOption, CourseModal(), handleSubmit(), CourseListParams, createCourse(), listCourses() (+5 more)

### Community 45 - "course/route.test.ts"
Cohesion: 0.25
Nodes (5): base, forbidden(), listResult, mocks, rows

### Community 46 - "helpers.ts"
Cohesion: 0.34
Nodes (13): adminPb(), answerForm17AllYes(), approveInUi(), auditFor(), createDraft(), getSyllabus(), loadSeed(), ok() (+5 more)

### Community 47 - "fdis-chair/route.ts"
Cohesion: 0.23
Nodes (14): PATCH(), RouteContext, POST(), getActiveFdisChair(), hasActiveFdisChair(), isFdisChair(), toFdisChairResponse(), parseFdisChairInput() (+6 more)

### Community 48 - "dashboard-manager.tsx"
Cohesion: 0.12
Nodes (30): DashboardManager(), defaultTerm(), JustificationsPanel(), STATE_STYLES, STATES, daysSince(), ErrorBanner(), ExportLink() (+22 more)

### Community 49 - "Enhanced OBE Syllabus on `[FILL IN: course name]`"
Cohesion: 0.07
Nodes (27): About This File, BUKIDNON STATE UNIVERSITY, Course Information, Creating a syllabus, Differences between the two signatory blocks, Document Structure (in order), Enhanced OBE Syllabus on `[FILL IN: course name]`, Enhanced OBE Syllabus Template (BukSU) (+19 more)

### Community 50 - "lib/review-queue.ts"
Cohesion: 0.11
Nodes (34): GET(), Review queue, Testing, ReviewQueueParams, Cover, heldStages(), holdsStageFor(), listAwaitingReviewIds() (+26 more)

### Community 51 - "signed-copy/route.test.ts"
Cohesion: 0.13
Nodes (12): GET(), ctx, download(), mocks, pdf, upload(), ctx, draft (+4 more)

### Community 52 - "citl-director/route.ts"
Cohesion: 0.17
Nodes (17): CitlDirectorPage(), metadata, CitlDirectorManager(), toggleActive(), CitlDirectorManagerProps, DeleteCitlDirectorDialog(), handleDelete(), DeleteCitlDirectorDialogProps (+9 more)

### Community 53 - "course/[id]/route.ts"
Cohesion: 0.14
Nodes (18): DELETE(), GET(), PATCH(), RouteContext, GET(), POST(), COURSE_EXPAND, DEPENDENTS (+10 more)

### Community 54 - "pocketbase"
Cohesion: 0.16
Nodes (20): conflict(), GET(), notFound(), PUT(), RouteContext, hasNotUniqueError(), listStandInCandidates(), listStandIns() (+12 more)

### Community 55 - "prospectus-client.ts"
Cohesion: 0.12
Nodes (27): metadata, ProspectusPage(), DeleteProspectusDialog(), handleDelete(), DeleteProspectusDialogProps, DuplicateProspectusDialog(), handleConfirm(), DuplicateProspectusDialogProps (+19 more)

### Community 56 - "prospectus-item/[id]/route.ts"
Cohesion: 0.17
Nodes (17): GET(), PATCH(), RouteContext, GET(), POST(), PROSPECTUS_ITEM_EXPAND, toProspectusItemResponse(), isYearLevel() (+9 more)

### Community 57 - "syllabus-detail.tsx"
Cohesion: 0.11
Nodes (25): CoAuthorPicker(), CoAuthorPickerProps, CoAuthorsPanel(), save(), CoAuthorsPanelProps, SubmitSyllabusDialog(), handleSubmit(), SubmitSyllabusDialogProps (+17 more)

### Community 58 - "UserCombobox"
Cohesion: 0.22
Nodes (12): CitlDirectorModal(), handleSubmit(), CitlDirectorModalProps, UserCombobox(), UserComboboxProps, VpaaModal(), handleSubmit(), VpaaModalProps (+4 more)

### Community 59 - "syllabus-manager.tsx"
Cohesion: 0.09
Nodes (26): metadata, ReviewQueuePage(), NeedsProxyPanel(), age(), ReviewQueueManager(), stageLabel(), STATUS_OPTIONS, AvailableCourseCombobox() (+18 more)

### Community 110 - "lib/justification.test.ts"
Cohesion: 0.20
Nodes (12): canViewJustification(), ensureBasedOn(), userNames(), findPreviousSyllabus(), previousSchoolYearLabel(), pocketbase, fakePb(), filter() (+4 more)

### Community 111 - "types/term.ts"
Cohesion: 0.13
Nodes (26): DeleteTermDialog(), handleDelete(), DeleteTermDialogProps, ModalState, TermManager(), toggleOpen(), TermManagerProps, TermModal() (+18 more)

### Community 112 - "user-manager.tsx"
Cohesion: 0.12
Nodes (25): metadata, UserPage(), DeleteUserDialog(), handleDelete(), DeleteUserDialogProps, describeAccess(), KIND_LABELS, ModalState (+17 more)

### Community 113 - "program-chair/route.ts"
Cohesion: 0.11
Nodes (20): PATCH(), RouteContext, POST(), isChairOfProgram(), listProgramsChairedBy(), programHasActiveChair(), toProgramChairResponse(), parseProgramChairInput() (+12 more)

### Community 114 - "users.ts"
Cohesion: 0.18
Nodes (13): GET(), POST(), ASSIGNMENTS, listActiveAssignments(), Named, toUserResponse(), userKindFilter(), isUserKind() (+5 more)

### Community 115 - "[code]/page.tsx"
Cohesion: 0.22
Nodes (9): ACTING_AS_LABELS, metadata, PageProps, Row(), VerifyApprovalPage(), metadata, VerifyPage(), VerifyForm() (+1 more)

### Community 118 - "dean/route.ts"
Cohesion: 0.06
Nodes (38): GET(), PATCH(), RouteContext, POST(), PATCH(), RouteContext, POST(), collegeHasActiveDean() (+30 more)

### Community 119 - "lib/syllabus-reference.ts"
Cohesion: 0.11
Nodes (31): PATCH(), RouteContext, POST(), findLiveReference(), listReferenceSources(), LIVE_REFERENCE_FILTER, REFERENCE_EXPAND, ReferenceActor (+23 more)

### Community 120 - "stand-ins-panel.tsx"
Cohesion: 0.27
Nodes (8): StandInPicker(), StandInPickerProps, StandInsPanel(), save(), StandInsPanelProps, listStandInCandidates(), listStandIns(), setStandIn()

### Community 121 - "pocketbase"
Cohesion: 0.19
Nodes (15): DeleteFdisChairDialog(), handleDelete(), DeleteFdisChairDialogProps, FdisChairManager(), toggleActive(), FdisChairManagerProps, FdisChairModal(), handleSubmit() (+7 more)

### Community 122 - "Syllabus Development Guidelines"
Cohesion: 0.08
Nodes (23): 10. Syllabus Table Format, 11. Writing Good Outcomes, 12. Syllabus Creation Workflow, 13. Institutional Review Process, 14. Validation Checklist, 15. Output Behavior for Claude, 1. Role and Scope, 2. Bloom's Taxonomy Reference (+15 more)

### Community 123 - "syllabus-workflow.ts"
Cohesion: 0.09
Nodes (29): StatusChange, approve(), ApproveEvent, ChainRole, fail(), FileEvent, FINAL_STAGE, giveBack() (+21 more)

### Community 124 - "types/prospectus-item.ts"
Cohesion: 0.12
Nodes (29): DeleteProspectusItemDialog(), handleDelete(), DeleteProspectusItemDialogProps, itemProspectusLabel(), ModalState, ProspectusItemManager(), ProspectusItemManagerProps, prospectusLabel() (+21 more)

### Community 125 - "05-a11y.spec.ts"
Cohesion: 0.25
Nodes (6): PAGES, TAGS, PASSWORD, findSyllabusId(), PEOPLE, Person

### Community 126 - "SyllabusResponse"
Cohesion: 0.19
Nodes (13): DeleteSyllabusDialog(), handleDelete(), DeleteSyllabusDialogProps, by(), currentLine(), describeEntry(), DOT, stageName() (+5 more)

### Community 127 - "dean-manager.tsx"
Cohesion: 0.18
Nodes (17): DeanPage(), metadata, DeanManager(), toggleActive(), DeanManagerProps, DeanModal(), handleSubmit(), DeanModalProps (+9 more)

### Community 128 - "Program"
Cohesion: 0.31
Nodes (6): isFacultyOfProgram(), parseRequiredString(), ParseResult, Faculty, Program, ProgramInput

### Community 129 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, audit:phase-a, build, dev, lint, pb, start, test (+1 more)

### Community 130 - "justifications/route.test.ts"
Cohesion: 0.22
Nodes (6): EMC, get(), IT, LIST, mocks, N

### Community 131 - "dependencies"
Cohesion: 0.29
Nodes (7): dependencies, @headlessui/react@^2.2.10, next@16.3.6, pocketbase@^0.28.1, react@19.2.8, react-dom@19.2.8, react-dom

### Community 132 - "AppUser"
Cohesion: 0.06
Nodes (58): GET(), notFound(), RouteContext, GET(), notFound(), PUT(), RouteContext, conflict() (+50 more)

### Community 133 - "react"
Cohesion: 0.07
Nodes (50): Form18Panel(), run(), Form18PanelProps, NewPointForm(), PointForm(), PointFormProps, PointRow(), PointRowProps (+42 more)

### Community 134 - "Phase 6: Hardening"
Cohesion: 0.14
Nodes (15): version(), Schema changes (to apply to `pb_schema.json`), Schema changes (to apply to `pb_schema.json`), Accessibility pass, Decisions (2026-10-28), End-to-end tests, Lead reassignment, Objective (+7 more)

### Community 139 - "Retention policy"
Cohesion: 0.33
Nodes (5): Changing this policy, Removing records, Retention policy, Rule, Storage growth

### Community 140 - "course-manager.tsx"
Cohesion: 0.19
Nodes (10): CoursePage(), metadata, CourseManager(), CourseManagerProps, ModalState, CourseModalMode, DeleteCourseDialog(), handleDelete() (+2 more)

### Community 141 - "Criteria"
Cohesion: 0.12
Nodes (16): A. Preliminaries, B. Vision, Mission, Goals, Objectives, and Outcomes, C. Course Content, Closing Section, Criteria, D. Assessment, E. Learning Modality and Methods, F. Resources, Required Readings, and References (+8 more)

### Community 142 - "campus/[id]/route.ts"
Cohesion: 0.16
Nodes (10): PATCH(), RouteContext, parseCampusInput(), ParseResult, ctx, mocks, listResult, mocks (+2 more)

### Community 143 - "user/[id]/route.ts"
Cohesion: 0.24
Nodes (7): DELETE(), PATCH(), RouteContext, hasOtherAdmin(), parseUserInput(), mocks, base

### Community 144 - "3. Letter Body (in order, top to bottom)"
Cohesion: 0.12
Nodes (15): 1. Document Overview, 2. Letterhead (fixed, centered at top), 3.1 Date — VARIABLE, 3.2 Recipient block — FIXED, 3.3 Salutation — FIXED, 3.4 Opening paragraph — PARTLY VARIABLE, 3.5 Table — VARIABLE (see Section 4), 3.6 Closing — FIXED (+7 more)

### Community 146 - "CITL Syllabus Review Guide (Instructions for Part B)"
Cohesion: 0.14
Nodes (13): A. Format and House Style, B. Alignment (Coherence and Logical Connection Between Learning Plan Components), C. Use of Behavioral Verbs (Bloom's Taxonomy), CITL Syllabus Review Guide (Instructions for Part B), CITL Syllabus Review: Suggestions and Action Taken (Form 18-1), D. Gradation of COs and SLOs, E. Supplementary Documentation, F. Inclusion of Prescribed Institutional Forms (+5 more)

### Community 147 - "Phase 4: Reviewer experience"
Cohesion: 0.18
Nodes (10): Boundaries, Decisions (2026-10-27), Events (`lib/syllabus-events.ts`, server-only), Hub (`/syllabus/[id]`), Objective, Out of scope, Phase 4: Reviewer experience, Proposals (accept or amend before task 1) (+2 more)

### Community 148 - "[id]/form18/route.ts"
Cohesion: 0.14
Nodes (19): GET(), notFound(), POST(), RouteContext, listPoints(), loadForm18(), person(), POINT_EXPAND (+11 more)

### Community 149 - "overdue-badge.tsx"
Cohesion: 0.13
Nodes (25): Badge(), plural(), ReviewOverdueBadge(), reviewOverdueDays(), SubmissionOverdueBadge(), submissionOverdueDays(), TermDeadlines, Boundaries (+17 more)

### Community 150 - "program-join-request-manager.tsx"
Cohesion: 0.14
Nodes (23): ProgramJoinRequestManager(), approve(), reloadAfterRowLeft(), ProgramJoinRequestManagerProps, RowDialog, STATUS_LABELS, STATUS_STYLES, ProgramJoinRequestModal() (+15 more)

### Community 151 - "capabilities.ts"
Cohesion: 0.29
Nodes (6): ScopeChain, resolveScope(), ScopeTarget, fullChain, mocks, records

### Community 152 - "app-shell.tsx"
Cohesion: 0.18
Nodes (10): metadata, RootLayout(), AppShell(), Sidebar(), SidebarProps, Capability, APP_NAME, getNavItems() (+2 more)

### Community 153 - "term/[id]/route.ts"
Cohesion: 0.13
Nodes (15): GET(), PATCH(), RouteContext, POST(), termHasRefSeqs(), toTermRecord(), toTermResponse(), ctx (+7 more)

### Community 155 - "review/route.test.ts"
Cohesion: 0.20
Nodes (7): BY_STAGE, ctx, decide(), HOLDERS, mocks, NO_POINTS, VERSION

### Community 156 - "form17-panel.tsx"
Cohesion: 0.33
Nodes (6): Draft, draftFrom(), Form17Panel(), handleSave(), Form17PanelProps, saveForm17()

### Community 157 - "[pointId]/route.ts"
Cohesion: 0.16
Nodes (20): conflict(), DELETE(), load(), Loaded, notFound(), PATCH(), reviewerCheck(), RouteContext (+12 more)

### Community 158 - "[pointId]/route.ts"
Cohesion: 0.31
Nodes (6): Point, PointAction, pointFacts, Routed, inReview(), PointStatus

### Community 159 - "types/form18.ts"
Cohesion: 0.29
Nodes (10): isObject(), parsePointInput(), parsePointUpdate(), ParseResult, text(), MAX_PAGE_NUMBER, MAX_POINT_TEXT, POINT_STATUSES (+2 more)

### Community 160 - "validators/term.ts"
Cohesion: 0.44
Nodes (7): isReviewDays(), isValidDate(), parseDeadline(), ParseResult, parseTermInput(), parseTermUpdate(), SEMESTER_ERROR

### Community 161 - "audit/page.tsx"
Cohesion: 0.50
Nodes (3): AuditPage(), metadata, AuditManager()

### Community 162 - "revise/page.tsx"
Cohesion: 0.50
Nodes (3): metadata, PageProps, SyllabusRevisePage()

### Community 163 - "[copyId]/route.test.ts"
Cohesion: 0.29
Nodes (4): ctx, mocks, patch(), SCOPE

### Community 164 - "approval-verify.ts"
Cohesion: 0.14
Nodes (18): approvalCode(), ApprovalCodeParts, parseApprovalCode(), SEMESTER_CODES, validStage(), findApproval(), ReviewWithExpand, VerifiedApproval (+10 more)

### Community 165 - "audit-log.ts"
Cohesion: 0.15
Nodes (18): Boundaries, anyOf(), auditDetail(), auditFilter(), AuditNames, listAudit(), stateLabel(), STATUS_LABELS (+10 more)

### Community 166 - "Feature walkthrough"
Cohesion: 0.20
Nodes (18): 0. Before you start, 1. Cast, Feature walkthrough, Part 10 — Negative checks, Part 11 — Keyboard and accessibility pass, Part 1 — Admin setup (as `admin`), Part 2 — Org chain and roles, Part 3 — Registration and joining a program (+10 more)

### Community 167 - "types/justification.ts"
Cohesion: 0.31
Nodes (8): ParseResult, Justification, JUSTIFICATION_STATUSES, JustificationEntry, JustificationInput, JustificationReturnInput, MAX_JUSTIFICATION_REASON, MAX_JUSTIFICATION_RETURN_REASON

### Community 169 - "syllabus/page.tsx"
Cohesion: 0.67
Nodes (3): metadata, SyllabusPage(), listProgramsOfUser()

### Community 171 - "syllabus-client.ts"
Cohesion: 0.10
Nodes (38): metadata, PageProps, SyllabusJustificationLetterPage(), JustificationLetterView(), PrintableJustificationLetter(), JustificationPanel(), adopt(), handlePreview() (+30 more)

### Community 174 - "form17-view.tsx"
Cohesion: 0.22
Nodes (15): Form17View(), Line(), Form181View(), PointsTable(), PrintableForms(), ACTING_AS, FormHeader(), SignatureLines() (+7 more)

### Community 175 - "citl-director/route.ts"
Cohesion: 0.11
Nodes (20): PATCH(), RouteContext, POST(), getActiveCitlDirector(), hasActiveCitlDirector(), isCitlDirector(), toCitlDirectorResponse(), parseCitlDirectorInput() (+12 more)

### Community 192 - "upload-version-modal.tsx"
Cohesion: 0.47
Nodes (5): UploadVersionModal(), handleSubmit(), UploadVersionModalProps, uploadSyllabusVersion(), MAX_PDF_BYTES

### Community 200 - "register/page.tsx"
Cohesion: 0.17
Nodes (15): LoginPage(), LoginPageProps, metadata, metadata, RegisterPage(), RegisterPageProps, LoginForm(), handleSubmit() (+7 more)

### Community 201 - "audit-phase-a.ts"
Cohesion: 0.33
Nodes (6): AssignmentRow, ASSIGNMENTS, main(), requireEnv(), UNASSIGNED_FILTER, UserRow

### Community 202 - "program-join-request/route.test.ts"
Cohesion: 0.22
Nodes (5): base, data, listResult, mocks, rows

### Community 203 - "summary/route.ts"
Cohesion: 0.10
Nodes (22): GET(), addTally(), aggregate(), blankTally(), byName(), completionRows(), row(), Tally (+14 more)

### Community 207 - "Schema changes (to apply to `pb_schema.json`)"
Cohesion: 0.50
Nodes (4): config, isTokenExpired(), proxy(), PUBLIC_PATHS

### Community 208 - "options/route.test.ts"
Cohesion: 0.32
Nodes (5): GET(), toUserOption(), base, mocks, users

### Community 214 - "lead-candidates/route.test.ts"
Cohesion: 0.27
Nodes (8): GET(), RouteContext, listCoAuthorCandidates(), candidates, ctx, get(), mocks, syllabus

## Knowledge Gaps
- **10 isolated node(s):** `RFC-4180`, `Org chain (campus, college, department, program)`, `Scoped list visibility (lib/org-visibility.ts)`, `Plain CRUD entities (campus, college, department, program, user)`, `Advisory PDF checks (informational only)` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1190 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **74 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `pocketbase` connect `lib/justification.test.ts` to `reference-manager.tsx`, `Program`, `react`, `college-manager.tsx`, `AppUser`, `react`, `dependencies`, `Package & Tooling Config`, `export/form18/route.ts`, `program-join-request/[id]/route.ts`, `course-manager.tsx`, `next`, `resolveSyllabusAccess`, `pocketbase`, `timeline/route.ts`, `campus/[id]/route.ts`, `department-head-manager.tsx`, `react`, `Faculty UI`, `program-join-request-manager.tsx`, `[id]/form18/route.ts`, `lib/prospectus-duplicate.ts`, `next`, `auth-client.ts`, `VPAA UI`, `capabilities.ts`, `Program Chair UI`, `[pointId]/route.ts`, `dean-manager.tsx`, `types/form18.ts`, `resubmit/route.ts`, `authorize`, `school-year/[id]/route.ts`, `approval-verify.ts`, `audit-log.ts`, `lib/dashboard.ts`, `types/notification.ts`, `signed-copy/route.ts`, `program-reviewer-manager.tsx`, `types/audit.ts`, `types/syllabus.ts`, `types/course.ts`, `syllabus-client.ts`, `helpers.ts`, `fdis-chair/route.ts`, `dashboard-manager.tsx`, `lib/review-queue.ts`, `signed-copy/route.test.ts`, `citl-director/route.ts`, `pocketbase`, `prospectus-client.ts`, `syllabus-manager.tsx`, `audit-phase-a.ts`, `types/justification.ts`, `types/term.ts`, `user-manager.tsx`, `dean/route.ts`, `lib/syllabus-reference.ts`, `pocketbase`, `types/prospectus-item.ts`, `05-a11y.spec.ts`, `dean-manager.tsx`?**
  _High betweenness centrality (0.186) - this node is a cross-community bridge._
- **Are the 80 inferred relationships involving `createAdminPb()` (e.g. with `audit/route.test.ts` and `register/route.test.ts`) actually correct?**
  _`createAdminPb()` has 80 INFERRED edges - model-reasoned connections that need verification._
- **What connects `RFC-4180`, `Org chain (campus, college, department, program)`, `Scoped list visibility (lib/org-visibility.ts)` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `reference-manager.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08521870286576169 - nodes in this community are weakly interconnected._
- **Why does `next` connect `next` to `reference-manager.tsx`, `dashboard-scope.ts`, `justifications/route.test.ts`, `college-manager.tsx`, `AppUser`, `react`, `validators/user.ts`, `dependencies`, `Package & Tooling Config`, `export/form18/route.ts`, `createAdminPb`, `program-join-request/[id]/route.ts`, `course-manager.tsx`, `getCurrentUser`, `campus/[id]/route.ts`, `resolveSyllabusAccess`, `user/[id]/route.ts`, `pocketbase`, `vpaa/route.ts`, `department-head-manager.tsx`, `[id]/form18/route.ts`, `react`, `lib/prospectus-duplicate.ts`, `capability-rules.ts`, `app-shell.tsx`, `next`, `export/route.ts`, `term/[id]/route.ts`, `capabilities.ts`, `[pointId]/route.ts`, `VPAA UI`, `dean-manager.tsx`, `auth-client.ts`, `resubmit/route.ts`, `authorize`, `school-year/[id]/route.ts`, `signed-copy/route.ts`, `types/notification.ts`, `audit/page.tsx`, `[id]/justification/route.ts`, `revise/page.tsx`, `program-reviewer-manager.tsx`, `syllabus/page.tsx`, `types/syllabus.ts`, `syllabus-client.ts`, `course/route.test.ts`, `form17-view.tsx`, `citl-director/route.ts`, `fdis-chair/route.ts`, `dashboard-manager.tsx`, `lib/review-queue.ts`, `signed-copy/route.test.ts`, `citl-director/route.ts`, `course/[id]/route.ts`, `pocketbase`, `prospectus-client.ts`, `prospectus-item/[id]/route.ts`, `syllabus-detail.tsx`, `[copyId]/route.test.ts`, `syllabus-manager.tsx`, `review/route.test.ts`, `register/page.tsx`, `program-join-request/route.test.ts`, `summary/route.ts`, `Schema changes (to apply to `pb_schema.json`)`, `options/route.test.ts`, `lead-candidates/route.test.ts`, `user-manager.tsx`, `program-chair/route.ts`, `users.ts`, `[code]/page.tsx`, `dean/route.ts`, `lib/syllabus-reference.ts`, `dean-manager.tsx`?**
  _High betweenness centrality (0.140) - this node is a cross-community bridge._
- **Are the 21 inferred relationships involving `handlePbError()` (e.g. with `Testing` and `Testing`) actually correct?**
  _`handlePbError()` has 21 INFERRED edges - model-reasoned connections that need verification._
- **Should `dashboard-scope.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07307692307692308 - nodes in this community are weakly interconnected._