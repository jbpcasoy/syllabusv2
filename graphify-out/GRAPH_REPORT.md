# Graph Report - syllabusv2  (2026-10-29)

## Corpus Check
- 665 files · ~308,722 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 4, .ico 1, .css 1)

## Summary
- 3388 nodes · 10658 edges · 210 communities (133 shown, 77 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 332 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `55495339`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- reference-manager.tsx
- dashboard-scope.ts
- react
- college-manager.tsx
- lib/syllabus-review.ts
- Project Docs & Domain Rules
- authorize
- course-modal.tsx
- Package & Tooling Config
- export/form18/route.ts
- createAdminPb
- program-join-request/[id]/route.ts
- getCurrentUser
- global-setup.ts
- mockAuth
- signed-copy/route.ts
- react
- timeline/route.ts
- vpaa/route.test.ts
- mock-auth.ts
- org-visibility.ts
- Faculty UI
- lib/prospectus-duplicate.ts
- capability-rules.test.ts
- index.ts
- next
- export/route.ts
- VPAA UI
- academic.test.ts
- Program Chair UI
- notification-bell.tsx
- dean-manager.tsx
- TypeScript Config
- getUserRoles
- department-head/route.ts
- transfer-lead-dialog.tsx
- pocketbase
- types/notification.ts
- lib/dashboard.ts
- types/syllabus.ts
- syllabus-decision.ts
- program-reviewer-manager.tsx
- types/dashboard.ts
- syllabus-reference/route.ts
- notifications.ts
- course/route.test.ts
- helpers.ts
- fdis-chair/route.ts
- dashboard-manager.tsx
- Enhanced OBE Syllabus on `[FILL IN: course name]`
- lib/review-queue.ts
- signed-copy/route.test.ts
- citl-director/route.ts
- vitest
- AppUser
- prospectus-client.ts
- types/prospectus-item.ts
- syllabus-detail.tsx
- program-reviewer/route.ts
- syllabus-manager.tsx
- PostCSS Config
- lib/form17.ts
- types/term.ts
- user-manager.tsx
- Program
- users.ts
- [code]/page.tsx
- dean/[id]/route.ts
- forms/justification.ts
- stand-ins-panel.tsx
- types/form17.ts
- Syllabus Development Guidelines
- syllabus-workflow.ts
- types/prospectus-item.ts
- 05-a11y.spec.ts
- capability-rules.ts
- dean-manager.tsx
- types/college.ts
- scripts
- justifications/route.test.ts
- dependencies
- version/route.ts
- react
- export/route.test.ts
- Retention policy
- [id]/form17/route.test.ts
- Criteria
- next
- app-header.tsx
- 3. Letter Body (in order, top to bottom)
- README.md
- CITL Syllabus Review Guide (Instructions for Part B)
- syllabus-timeline.tsx
- lib/form18.ts
- overdue-badge.tsx
- program-join-request-manager.tsx
- capabilities.ts
- app-shell.tsx
- types/term.ts
- review/route.test.ts
- form17-panel.tsx
- [pointId]/route.test.ts
- [pointId]/route.ts
- types/form18.ts
- dean/route.test.ts
- faculty/route.test.ts
- fdis-chair/route.test.ts
- program-chair/route.test.ts
- approval-verify.ts
- audit-log.ts
- Feature walkthrough
- types/justification.ts
- types/faculty.ts
- stand-in/route.test.ts
- syllabus-client.ts
- prospectus-item/route.test.ts
- form17-view.tsx
- [id]/form18/route.test.ts
- syllabus-reference/route.test.ts
- term/route.test.ts
- types/signed-copy.ts
- resubmit/route.test.ts
- stand-in-candidates/route.test.ts
- upload-version-modal.tsx
- user/route.test.ts
- validators/syllabus-stand-in.ts
- college/route.test.ts
- export/form18/route.test.ts
- submit/route.test.ts
- validators/user.ts
- audit-phase-a.ts
- [versionId]/file/route.test.ts
- summary/route.ts
- syllabus/route.test.ts
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
- `Hub (`/syllabus/[id]`)` --references--> `SyllabusVersions()`  [INFERRED]
  docs/specs/phase-4-reviewer-experience.md → components/syllabus/syllabus-versions.tsx
- `Proposals (accept or amend before task 1)` --references--> `justificationScope()`  [INFERRED]
  docs/specs/phase-5-visibility.md → lib/dashboard-scope.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Review engine flow (Phase 3)** — agents_syllabus_workflow_state_machine, agents_review_chain, syllabus_review_system_project_plan__v5__syllabus_statuses, syllabus_review_system_project_plan__v5__routing_readiness, agents_proxy_reviewer, agents_approval_reference [EXTRACTED 1.00]
- **University review forms supported by the system** — agents_form17, agents_form18_1, agents_justification_form, syllabus_review_system_project_plan__v5__enhanced_obe_syllabus, syllabus_review_system_project_plan__v5__form_definitions_versioning [EXTRACTED 1.00]
- **Phase A migration from role-based PERMISSIONS to derived-role capabilities** — project_context_users_role_field, project_context_permissions_map, agents_isadmin, agents_getuserroles, agents_capability_authorization [INFERRED 0.85]

## Communities (210 total, 77 thin omitted)

### Community 0 - "reference-manager.tsx"
Cohesion: 0.06
Nodes (52): COPY, DialogAction, ReferenceActionDialog(), handleSubmit(), ReferenceActionDialogProps, STOP_REFERENCING_COPY, ReferenceManagerProps, ReferenceModal() (+44 more)

### Community 1 - "dashboard-scope.ts"
Cohesion: 0.08
Nodes (27): anyOf(), Bind, filterInScope(), programInScope(), programMatches(), programScopeFilter(), ScopedPrograms, scopePrograms() (+19 more)

### Community 2 - "react"
Cohesion: 0.07
Nodes (41): DELETE(), PATCH(), RouteContext, GET(), POST(), DeleteSchoolYearDialog(), handleDelete(), DeleteSchoolYearDialogProps (+33 more)

### Community 3 - "college-manager.tsx"
Cohesion: 0.16
Nodes (20): CollegePage(), metadata, CollegeManager(), ModalState, CollegeModal(), handleSubmit(), CollegeModalMode, CollegeModalProps (+12 more)

### Community 4 - "lib/syllabus-review.ts"
Cohesion: 0.08
Nodes (25): config, isTokenExpired(), proxy(), PUBLIC_PATHS, API, Capabilities, Decisions (2026-10-26), Definitions (+17 more)

### Community 5 - "Project Docs & Domain Rules"
Cohesion: 0.06
Nodes (37): AGENTS.md (agent guidance), Approval reference code (SYL-<term>-<seq>-S<stage>), Capability-based authorization (can, requireUser, authorize, canSomewhere), Form 17 (OVPAA-F-INS-017) review checklist, Form 18-1 (CITL-F-018) review points, getUserRoles resolver (derived roles from assignment records), users.isAdmin (only stored role), Justification Form (missing lead signature) (+29 more)

### Community 6 - "authorize"
Cohesion: 0.08
Nodes (31): DELETE(), GET(), PATCH(), RouteContext, DELETE(), GET(), PATCH(), RouteContext (+23 more)

### Community 7 - "course-modal.tsx"
Cohesion: 0.08
Nodes (39): CourseCombobox(), CourseComboboxProps, CourseOption, CourseModal(), handleSubmit(), CourseModalMode, CourseModalProps, NUMBER_FIELDS (+31 more)

### Community 8 - "Package & Tooling Config"
Cohesion: 0.09
Nodes (27): eslintConfig, devDependencies, @axe-core/playwright@^4.14.0, eslint@^9, eslint-config-next@16.3.6, @playwright/test@^1.64.1, tailwindcss@^4, @tailwindcss/postcss@^4 (+19 more)

### Community 9 - "export/form18/route.ts"
Cohesion: 0.22
Nodes (10): ApprovalStamp, buildForm17Export(), buildForm181Export(), ExportFormMeta, ExportSyllabus, INSTITUTION, JustificationState, meta() (+2 more)

### Community 10 - "createAdminPb"
Cohesion: 0.06
Nodes (81): DELETE(), GET(), PATCH(), RouteContext, GET(), POST(), DELETE(), PATCH() (+73 more)

### Community 11 - "program-join-request/[id]/route.ts"
Cohesion: 0.08
Nodes (33): DELETE(), notPending(), PATCH(), RouteContext, GET(), POST(), RejectProgramJoinRequestDialogProps, applyJoinRequestDecision() (+25 more)

### Community 12 - "getCurrentUser"
Cohesion: 0.09
Nodes (32): CitlDirectorPage(), metadata, CoursePage(), metadata, DepartmentHeadPage(), metadata, FacultyPage(), metadata (+24 more)

### Community 13 - "global-setup.ts"
Cohesion: 0.15
Nodes (22): APP_PORT, APP_URL, DIST_DIR, LOCAL_PB, PB_BIN, PB_PORT, PB_URL, ROOT (+14 more)

### Community 14 - "mockAuth"
Cohesion: 0.04
Nodes (53): ctx, forbidden(), mocks, unauthorized(), base, forbidden(), listResult, mocks (+45 more)

### Community 15 - "signed-copy/route.ts"
Cohesion: 0.22
Nodes (14): GET(), notFound(), RouteContext, PATCH(), RouteContext, GET(), notFound(), RouteContext (+6 more)

### Community 16 - "react"
Cohesion: 0.08
Nodes (40): metadata, ProgramPage(), CourseManagerProps, ModalState, DeanModalProps, DepartmentHeadModalProps, FacultyManagerProps, FacultyModalProps (+32 more)

### Community 17 - "timeline/route.ts"
Cohesion: 0.17
Nodes (12): buildTimeline(), name(), Named, TimelineEvent, TimelineVersion, base, SYLLABUS_EVENT_TYPES, SyllabusEvent (+4 more)

### Community 18 - "vpaa/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 19 - "mock-auth.ts"
Cohesion: 0.07
Nodes (20): evaluateCapability(), base, listResult, mocks, ctx, forbidden(), mocks, ctx (+12 more)

### Community 20 - "org-visibility.ts"
Cohesion: 0.12
Nodes (14): AssignmentPaths, Bind, clauses(), departmentScopeFilter(), departmentVisible(), programScopeFilter(), programVisible(), mocks (+6 more)

### Community 21 - "Faculty UI"
Cohesion: 0.23
Nodes (14): DeleteFacultyDialog(), handleDelete(), DeleteFacultyDialogProps, FacultyManager(), toggleActive(), FacultyModal(), handleSubmit(), createFaculty() (+6 more)

### Community 22 - "lib/prospectus-duplicate.ts"
Cohesion: 0.11
Nodes (24): GET(), POST(), applyDuplicate(), batchSize(), DuplicatePlan, MAX_BATCH_REQUESTS, newRecordId(), planDuplicate() (+16 more)

### Community 23 - "capability-rules.test.ts"
Cohesion: 0.15
Nodes (11): admin, ADMIN_ONLY, chair, dean, facultyOnly, head, multiRole, OTHER (+3 more)

### Community 24 - "index.ts"
Cohesion: 0.16
Nodes (18): pointCodeError(), FORM17_REV04, FORM18_REV01, CURRENT_FORM18, FORM17_REVISIONS, FORM18_REVISIONS, getForm18(), isLegendCode() (+10 more)

### Community 25 - "next"
Cohesion: 0.07
Nodes (38): GET(), POST(), POST(), GET(), GET(), GET(), GET(), POST() (+30 more)

### Community 26 - "export/route.ts"
Cohesion: 0.12
Nodes (31): cap(), GET(), GET(), RFC-4180, csvCell, fileSlug(), toCsv(), completionCsv() (+23 more)

### Community 27 - "VPAA UI"
Cohesion: 0.16
Nodes (19): DeleteVpaaDialog(), handleDelete(), DeleteVpaaDialogProps, VpaaManager(), toggleActive(), VpaaManagerProps, VpaaModal(), handleSubmit() (+11 more)

### Community 28 - "academic.test.ts"
Cohesion: 0.26
Nodes (8): PROSPECTUS_EXPAND, parseProspectusInput(), ParseResult, Prospectus, ProspectusInput, ProspectusResponse, ProspectusUpdateInput, SchoolYear

### Community 29 - "Program Chair UI"
Cohesion: 0.24
Nodes (14): DeleteProgramChairDialog(), handleDelete(), DeleteProgramChairDialogProps, ProgramChairManager(), toggleActive(), ProgramChairManagerProps, ProgramChairModal(), handleSubmit() (+6 more)

### Community 30 - "notification-bell.tsx"
Cohesion: 0.18
Nodes (21): metadata, NotificationsPage(), BellIcon(), BellPanel(), markAll(), open(), NotificationBell(), NotificationBellProps (+13 more)

### Community 31 - "dean-manager.tsx"
Cohesion: 0.15
Nodes (21): CampusPage(), metadata, CampusManager(), formatDate(), ModalState, CampusModal(), handleSubmit(), CampusModalMode (+13 more)

### Community 32 - "TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 33 - "getUserRoles"
Cohesion: 0.07
Nodes (76): DELETE(), load(), Loaded, notFound(), RouteContext, GET(), notFound(), POST() (+68 more)

### Community 34 - "department-head/route.ts"
Cohesion: 0.06
Nodes (56): PATCH(), RouteContext, GET(), POST(), DepartmentPage(), metadata, DeleteDepartmentDialog(), handleDelete() (+48 more)

### Community 35 - "transfer-lead-dialog.tsx"
Cohesion: 0.14
Nodes (15): CoAuthorPicker(), CoAuthorPickerProps, CoAuthorsPanel(), save(), CoAuthorsPanelProps, TransferLeadDialog(), handleTransfer(), TransferLeadDialogProps (+7 more)

### Community 36 - "pocketbase"
Cohesion: 0.13
Nodes (16): Tasks, addAudit(), Batch, addSyllabusEvent(), Batch, StatusChange, WorkflowState, TARGET (+8 more)

### Community 37 - "types/notification.ts"
Cohesion: 0.12
Nodes (25): PATCH(), RouteContext, GET(), countUnread(), markAllRead(), NOTIFICATION_EXPAND, ownFilter(), toNotificationResponse() (+17 more)

### Community 38 - "lib/dashboard.ts"
Cohesion: 0.15
Nodes (24): Task plan (one reviewable change each, lint and tests green after each), allAwaitingSignedCopy(), awaitingSignedCopyQuery(), emptyList(), justificationRows(), listAwaitingSignedCopy(), listJustifications(), loadFilteredPrograms() (+16 more)

### Community 39 - "types/syllabus.ts"
Cohesion: 0.08
Nodes (51): GET(), RouteContext, GET(), RouteContext, GET(), RouteContext, conflict(), GET() (+43 more)

### Community 40 - "syllabus-decision.ts"
Cohesion: 0.16
Nodes (15): Notifications, addNotifications(), DecisionConflict, DecisionInput, ensureRefSeq(), explainConflict(), FormFacts, lastReturnedVersionId() (+7 more)

### Community 41 - "program-reviewer-manager.tsx"
Cohesion: 0.25
Nodes (13): DeleteProgramReviewerDialog(), handleDelete(), DeleteProgramReviewerDialogProps, ProgramReviewerManager(), toggleActive(), ProgramReviewerModal(), handleSubmit(), createProgramReviewer() (+5 more)

### Community 42 - "types/dashboard.ts"
Cohesion: 0.25
Nodes (12): SyllabusStatus, DashboardQuery, ParseResult, SyllabusExportFilters, DashboardFilters, EXPORT_ROW_LIMIT, EXPORT_VIEWS, ExportView (+4 more)

### Community 43 - "syllabus-reference/route.ts"
Cohesion: 0.11
Nodes (30): PATCH(), RouteContext, GET(), POST(), GET(), GET(), POST(), anyOf() (+22 more)

### Community 44 - "notifications.ts"
Cohesion: 0.18
Nodes (15): Testing, Authors, Batch, clip(), notificationRecipients(), notificationText(), NotifyEvent, stageActors() (+7 more)

### Community 45 - "course/route.test.ts"
Cohesion: 0.25
Nodes (5): base, forbidden(), listResult, mocks, rows

### Community 46 - "helpers.ts"
Cohesion: 0.34
Nodes (13): adminPb(), answerForm17AllYes(), approveInUi(), auditFor(), createDraft(), getSyllabus(), loadSeed(), ok() (+5 more)

### Community 47 - "fdis-chair/route.ts"
Cohesion: 0.12
Nodes (29): PATCH(), RouteContext, POST(), DeleteFdisChairDialog(), handleDelete(), DeleteFdisChairDialogProps, FdisChairManager(), toggleActive() (+21 more)

### Community 48 - "dashboard-manager.tsx"
Cohesion: 0.12
Nodes (30): DashboardManager(), defaultTerm(), JustificationsPanel(), STATE_STYLES, STATES, daysSince(), ErrorBanner(), ExportLink() (+22 more)

### Community 49 - "Enhanced OBE Syllabus on `[FILL IN: course name]`"
Cohesion: 0.07
Nodes (27): About This File, BUKIDNON STATE UNIVERSITY, Course Information, Creating a syllabus, Differences between the two signatory blocks, Document Structure (in order), Enhanced OBE Syllabus on `[FILL IN: course name]`, Enhanced OBE Syllabus Template (BukSU) (+19 more)

### Community 50 - "lib/review-queue.ts"
Cohesion: 0.09
Nodes (40): GET(), Review queue, Testing, ReviewQueueParams, Cover, heldStages(), holdsStageFor(), listAwaitingReviewIds() (+32 more)

### Community 51 - "signed-copy/route.test.ts"
Cohesion: 0.10
Nodes (15): ctx, download(), mocks, pdf, upload(), ctx, mocks, pdf (+7 more)

### Community 52 - "citl-director/route.ts"
Cohesion: 0.16
Nodes (19): CitlDirectorManager(), toggleActive(), CitlDirectorManagerProps, CitlDirectorModal(), handleSubmit(), CitlDirectorModalProps, DeleteCitlDirectorDialog(), handleDelete() (+11 more)

### Community 53 - "vitest"
Cohesion: 0.06
Nodes (22): vitest, ctx, EXPAND, forbidden(), mocks, ctx, form17(), mocks (+14 more)

### Community 54 - "AppUser"
Cohesion: 0.23
Nodes (13): listStandInCandidates(), listStandIns(), STAND_IN_EXPAND, toStandInResponse(), fakePb(), filter(), record, Faculty (+5 more)

### Community 55 - "prospectus-client.ts"
Cohesion: 0.12
Nodes (26): metadata, ProspectusPage(), DeleteProspectusDialog(), handleDelete(), DeleteProspectusDialogProps, DuplicateProspectusDialog(), handleConfirm(), DuplicateProspectusDialogProps (+18 more)

### Community 56 - "types/prospectus-item.ts"
Cohesion: 0.21
Nodes (18): GET(), POST(), ProspectusItemListParams, PROSPECTUS_ITEM_EXPAND, toProspectusItemResponse(), isYearLevel(), parseProspectusItemInput(), parseProspectusItemUpdate() (+10 more)

### Community 57 - "syllabus-detail.tsx"
Cohesion: 0.10
Nodes (27): DeleteSyllabusDialog(), handleDelete(), DeleteSyllabusDialogProps, Group, groupPoints(), ReviewPointsHistory(), ReviewPointsHistoryProps, STATUS_LABELS (+19 more)

### Community 58 - "program-reviewer/route.ts"
Cohesion: 0.28
Nodes (12): PATCH(), RouteContext, POST(), programHasActiveReviewer(), toProgramReviewerResponse(), parseProgramReviewerInput(), parseProgramReviewerUpdate(), ParseResult (+4 more)

### Community 59 - "syllabus-manager.tsx"
Cohesion: 0.09
Nodes (29): metadata, ReviewQueuePage(), NeedsProxyPanel(), age(), ReviewQueueManager(), stageLabel(), STATUS_OPTIONS, AvailableCourseCombobox() (+21 more)

### Community 110 - "lib/form17.ts"
Cohesion: 0.26
Nodes (14): Batch, copyForm17(), form17Facts(), listForm17Answers(), loadForm17(), newRecordId(), saveForm17, Version (+6 more)

### Community 111 - "types/term.ts"
Cohesion: 0.18
Nodes (19): DeleteTermDialog(), handleDelete(), DeleteTermDialogProps, ModalState, TermManager(), toggleOpen(), TermManagerProps, TermModal() (+11 more)

### Community 112 - "user-manager.tsx"
Cohesion: 0.11
Nodes (26): metadata, UserPage(), DeleteUserDialog(), handleDelete(), DeleteUserDialogProps, describeAccess(), KIND_LABELS, ModalState (+18 more)

### Community 113 - "Program"
Cohesion: 0.17
Nodes (16): PATCH(), RouteContext, isChairOfProgram(), listProgramsChairedBy(), programHasActiveChair(), toProgramChairResponse(), parseProgramChairUpdate(), ParseResult (+8 more)

### Community 114 - "users.ts"
Cohesion: 0.17
Nodes (17): DELETE(), GET(), PATCH(), RouteContext, GET(), POST(), ASSIGNMENTS, hasOtherAdmin() (+9 more)

### Community 115 - "[code]/page.tsx"
Cohesion: 0.22
Nodes (9): ACTING_AS_LABELS, metadata, PageProps, Row(), VerifyApprovalPage(), metadata, VerifyPage(), VerifyForm() (+1 more)

### Community 118 - "dean/[id]/route.ts"
Cohesion: 0.24
Nodes (12): PATCH(), RouteContext, collegeHasActiveDean(), isDeanOfCollege(), listCollegesDeanedBy(), toDeanResponse(), parseDeanUpdate(), ParseResult (+4 more)

### Community 119 - "forms/justification.ts"
Cohesion: 0.24
Nodes (10): metadata, PageProps, SyllabusJustificationLetterPage(), JustificationLetterView(), PrintableJustificationLetter(), buildJustificationLetter(), JUSTIFICATION_TEMPLATE, JustificationLetterData (+2 more)

### Community 120 - "stand-ins-panel.tsx"
Cohesion: 0.31
Nodes (6): StandInPicker(), StandInPickerProps, StandInsPanel(), save(), StandInsPanelProps, setStandIn()

### Community 121 - "types/form17.ts"
Cohesion: 0.19
Nodes (12): CRITERIA, parseForm17Input(), ParseResult, FORM17_ANSWERS, Form17Answer, Form17AnswerInput, Form17AnswerRecord, Form17ChangeRecord (+4 more)

### Community 122 - "Syllabus Development Guidelines"
Cohesion: 0.08
Nodes (23): 10. Syllabus Table Format, 11. Writing Good Outcomes, 12. Syllabus Creation Workflow, 13. Institutional Review Process, 14. Validation Checklist, 15. Output Behavior for Claude, 1. Role and Scope, 2. Bloom's Taxonomy Reference (+15 more)

### Community 123 - "syllabus-workflow.ts"
Cohesion: 0.09
Nodes (27): approve(), ApproveEvent, ChainRole, fail(), FileEvent, FINAL_STAGE, giveBack(), INITIAL_STATE (+19 more)

### Community 124 - "types/prospectus-item.ts"
Cohesion: 0.13
Nodes (19): DeleteProspectusItemDialog(), handleDelete(), DeleteProspectusItemDialogProps, itemProspectusLabel(), ModalState, ProspectusItemManager(), ProspectusItemManagerProps, prospectusLabel() (+11 more)

### Community 125 - "05-a11y.spec.ts"
Cohesion: 0.25
Nodes (6): PAGES, TAGS, PASSWORD, findSyllabusId(), PEOPLE, Person

### Community 126 - "capability-rules.ts"
Cohesion: 0.18
Nodes (6): DashboardPage(), Home(), canAnywhere(), CAPABILITIES, Rule, RULES

### Community 127 - "dean-manager.tsx"
Cohesion: 0.16
Nodes (17): DeanPage(), metadata, DeanManager(), toggleActive(), DeanManagerProps, DeanModal(), handleSubmit(), DeleteDeanDialog() (+9 more)

### Community 128 - "types/college.ts"
Cohesion: 0.23
Nodes (8): ParseResult, parseCollegeInput(), parseRequiredString(), ParseResult, Campus, CampusInput, College, CollegeInput

### Community 129 - "scripts"
Cohesion: 0.22
Nodes (9): scripts, audit:phase-a, build, dev, lint, pb, start, test (+1 more)

### Community 130 - "justifications/route.test.ts"
Cohesion: 0.22
Nodes (6): EMC, get(), IT, LIST, mocks, N

### Community 131 - "dependencies"
Cohesion: 0.29
Nodes (7): dependencies, @headlessui/react@^2.2.10, next@16.3.6, pocketbase@^0.28.1, react@19.2.8, react-dom@19.2.8, react-dom

### Community 132 - "version/route.ts"
Cohesion: 0.11
Nodes (34): GET(), notFound(), RouteContext, GET(), notFound(), PUT(), RouteContext, POST() (+26 more)

### Community 133 - "react"
Cohesion: 0.07
Nodes (44): metadata, PageProps, SyllabusReviewPage(), metadata, PageProps, SyllabusRevisePage(), Form18Panel(), run() (+36 more)

### Community 134 - "export/route.test.ts"
Cohesion: 0.10
Nodes (16): Boundaries, Dashboards, Deadlines, Decisions (2026-10-28), Objective, Out of scope, Phase 5: Visibility and communication, Proposals (accept or amend before task 1) (+8 more)

### Community 139 - "Retention policy"
Cohesion: 0.33
Nodes (5): Changing this policy, Removing records, Retention policy, Rule, Storage growth

### Community 140 - "[id]/form17/route.test.ts"
Cohesion: 0.18
Nodes (9): ctx, FORM, get(), HOLDERS, INPUT, LATEST, mocks, put() (+1 more)

### Community 141 - "Criteria"
Cohesion: 0.12
Nodes (16): A. Preliminaries, B. Vision, Mission, Goals, Objectives, and Outcomes, C. Course Content, Closing Section, Criteria, D. Assessment, E. Learning Modality and Methods, F. Resources, Required Readings, and References (+8 more)

### Community 142 - "next"
Cohesion: 0.06
Nodes (20): mocks, listResult, mocks, candidates, ctx, mocks, syllabus, ctx (+12 more)

### Community 143 - "app-header.tsx"
Cohesion: 0.39
Nodes (5): metadata, RootLayout(), AppHeader(), unreadFor(), APP_NAME

### Community 144 - "3. Letter Body (in order, top to bottom)"
Cohesion: 0.12
Nodes (15): 1. Document Overview, 2. Letterhead (fixed, centered at top), 3.1 Date — VARIABLE, 3.2 Recipient block — FIXED, 3.3 Salutation — FIXED, 3.4 Opening paragraph — PARTLY VARIABLE, 3.5 Table — VARIABLE (see Section 4), 3.6 Closing — FIXED (+7 more)

### Community 146 - "CITL Syllabus Review Guide (Instructions for Part B)"
Cohesion: 0.14
Nodes (13): A. Format and House Style, B. Alignment (Coherence and Logical Connection Between Learning Plan Components), C. Use of Behavioral Verbs (Bloom's Taxonomy), CITL Syllabus Review Guide (Instructions for Part B), CITL Syllabus Review: Suggestions and Action Taken (Form 18-1), D. Gradation of COs and SLOs, E. Supplementary Documentation, F. Inclusion of Prescribed Institutional Forms (+5 more)

### Community 147 - "syllabus-timeline.tsx"
Cohesion: 0.11
Nodes (21): by(), currentLine(), describeEntry(), DOT, stageName(), SyllabusTimeline(), SyllabusTimelineProps, version() (+13 more)

### Community 148 - "lib/form18.ts"
Cohesion: 0.42
Nodes (6): listPoints(), loadForm18(), person(), toPointResponse(), point, Form18Point

### Community 149 - "overdue-badge.tsx"
Cohesion: 0.23
Nodes (17): Badge(), plural(), ReviewOverdueBadge(), reviewOverdueDays(), SubmissionOverdueBadge(), submissionOverdueDays(), TermDeadlines, syllabusOverdue() (+9 more)

### Community 150 - "program-join-request-manager.tsx"
Cohesion: 0.14
Nodes (20): ProgramJoinRequestManager(), approve(), reloadAfterRowLeft(), ProgramJoinRequestManagerProps, RowDialog, STATUS_LABELS, STATUS_STYLES, ProgramJoinRequestModal() (+12 more)

### Community 151 - "capabilities.ts"
Cohesion: 0.29
Nodes (6): ScopeChain, resolveScope(), ScopeTarget, fullChain, mocks, records

### Community 152 - "app-shell.tsx"
Cohesion: 0.27
Nodes (8): AppShell(), Sidebar(), SidebarProps, Capability, getNavItems(), NAV_ITEMS, NavItem, hasAnyRole()

### Community 153 - "types/term.ts"
Cohesion: 0.15
Nodes (22): GET(), PATCH(), RouteContext, GET(), POST(), termHasRefSeqs(), toTermRecord(), toTermResponse() (+14 more)

### Community 155 - "review/route.test.ts"
Cohesion: 0.20
Nodes (7): BY_STAGE, ctx, decide(), HOLDERS, mocks, NO_POINTS, VERSION

### Community 156 - "form17-panel.tsx"
Cohesion: 0.33
Nodes (6): Draft, draftFrom(), Form17Panel(), handleSave(), Form17PanelProps, saveForm17()

### Community 157 - "[pointId]/route.test.ts"
Cohesion: 0.22
Nodes (10): ctx, EDIT, given(), HOLDERS, mocks, point(), remove(), RESOLVE (+2 more)

### Community 158 - "[pointId]/route.ts"
Cohesion: 0.19
Nodes (13): conflict(), PATCH(), reviewerCheck(), Task plan (one reviewable change each, lint and tests green after each), Point, PointAction, pointActionError(), pointFacts (+5 more)

### Community 159 - "types/form18.ts"
Cohesion: 0.29
Nodes (10): isObject(), parsePointInput(), parsePointUpdate(), ParseResult, text(), MAX_PAGE_NUMBER, MAX_POINT_TEXT, POINT_STATUSES (+2 more)

### Community 160 - "dean/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 161 - "faculty/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 162 - "fdis-chair/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 163 - "program-chair/route.test.ts"
Cohesion: 0.05
Nodes (24): base, forbidden(), listResult, mocks, rows, unauthorized(), base, forbidden() (+16 more)

### Community 164 - "approval-verify.ts"
Cohesion: 0.13
Nodes (19): approvalCode(), ApprovalCodeParts, parseApprovalCode(), SEMESTER_CODES, validStage(), findApproval(), ReviewWithExpand, VerifiedApproval (+11 more)

### Community 165 - "audit-log.ts"
Cohesion: 0.06
Nodes (48): AuditPage(), metadata, ACTION_LABELS, AuditManager(), Accessibility pass, Audit module, Boundaries, Decisions (2026-10-28) (+40 more)

### Community 166 - "Feature walkthrough"
Cohesion: 0.20
Nodes (18): 0. Before you start, 1. Cast, Feature walkthrough, Part 10 — Negative checks, Part 11 — Keyboard and accessibility pass, Part 1 — Admin setup (as `admin`), Part 2 — Org chain and roles, Part 3 — Registration and joining a program (+10 more)

### Community 167 - "types/justification.ts"
Cohesion: 0.24
Nodes (11): isObject(), parseJustificationInput(), parseJustificationReturn(), ParseResult, JUSTIFICATION_STATUSES, JustificationEntry, JustificationInput, JustificationReturnInput (+3 more)

### Community 169 - "types/faculty.ts"
Cohesion: 0.21
Nodes (11): PATCH(), RouteContext, metadata, SyllabusPage(), isFacultyOfProgram(), listProgramsOfUser(), toFacultyResponse(), parseFacultyUpdate() (+3 more)

### Community 170 - "stand-in/route.test.ts"
Cohesion: 0.22
Nodes (4): ctx, HOLDERS, ITEMS, mocks

### Community 171 - "syllabus-client.ts"
Cohesion: 0.12
Nodes (38): JustificationPanel(), adopt(), handlePreview(), handleSave(), run(), STATUS_LABELS, SignedCopyPanel(), handleReturn() (+30 more)

### Community 173 - "prospectus-item/route.test.ts"
Cohesion: 0.25
Nodes (5): base, forbidden(), listResult, mocks, rows

### Community 174 - "form17-view.tsx"
Cohesion: 0.20
Nodes (16): metadata, PageProps, SyllabusFormsPage(), Form17View(), Line(), Form181View(), PointsTable(), PrintableForms() (+8 more)

### Community 175 - "[id]/form18/route.test.ts"
Cohesion: 0.25
Nodes (5): ctx, HOLDERS, LATEST, mocks, post()

### Community 176 - "syllabus-reference/route.test.ts"
Cohesion: 0.25
Nodes (5): input, mocks, SCOPE, source, term

### Community 177 - "term/route.test.ts"
Cohesion: 0.25
Nodes (5): base, forbidden(), listResult, mocks, rows

### Community 178 - "types/signed-copy.ts"
Cohesion: 0.43
Nodes (4): ParseResult, parseSignedCopyReturn(), MAX_SIGNED_COPY_REASON, SignedCopyReturnInput

### Community 190 - "resubmit/route.test.ts"
Cohesion: 0.29
Nodes (5): ctx, HOLDERS, mocks, resubmit(), returned

### Community 191 - "stand-in-candidates/route.test.ts"
Cohesion: 0.29
Nodes (6): candidates, ctx, get(), HOLDERS, mocks, syllabus

### Community 192 - "upload-version-modal.tsx"
Cohesion: 0.47
Nodes (5): UploadVersionModal(), handleSubmit(), UploadVersionModalProps, uploadSyllabusVersion(), MAX_PDF_BYTES

### Community 194 - "user/route.test.ts"
Cohesion: 0.29
Nodes (4): base, listResult, mocks, users

### Community 195 - "validators/syllabus-stand-in.ts"
Cohesion: 0.53
Nodes (4): isStage(), ParseResult, parseStandInInput(), StandInInput

### Community 197 - "college/route.test.ts"
Cohesion: 0.33
Nodes (3): base, listResult, mocks

### Community 198 - "export/form18/route.test.ts"
Cohesion: 0.33
Nodes (5): ctx, form18(), mocks, SYLLABUS, VERSION

### Community 199 - "submit/route.test.ts"
Cohesion: 0.33
Nodes (4): ctx, draft, HOLDERS, mocks

### Community 200 - "validators/user.ts"
Cohesion: 0.07
Nodes (41): isDuplicateEmail(), POST(), LoginPage(), LoginPageProps, metadata, metadata, RegisterPage(), RegisterPageProps (+33 more)

### Community 201 - "audit-phase-a.ts"
Cohesion: 0.33
Nodes (6): AssignmentRow, ASSIGNMENTS, main(), requireEnv(), UNASSIGNED_FILTER, UserRow

### Community 202 - "[versionId]/file/route.test.ts"
Cohesion: 0.33
Nodes (4): ctx, mocks, syllabus, version

### Community 203 - "summary/route.ts"
Cohesion: 0.13
Nodes (16): addTally(), aggregate(), blankTally(), byName(), completionRows(), row(), Tally, withRate() (+8 more)

### Community 204 - "syllabus/route.test.ts"
Cohesion: 0.33
Nodes (3): input, mocks, openTerm

### Community 214 - "lead-candidates/route.test.ts"
Cohesion: 0.33
Nodes (5): candidates, ctx, get(), mocks, syllabus

## Knowledge Gaps
- **10 isolated node(s):** `RFC-4180`, `Org chain (campus, college, department, program)`, `Scoped list visibility (lib/org-visibility.ts)`, `Plain CRUD entities (campus, college, department, program, user)`, `Advisory PDF checks (informational only)` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1193 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **77 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `pocketbase` connect `pocketbase` to `reference-manager.tsx`, `types/college.ts`, `react`, `college-manager.tsx`, `version/route.ts`, `react`, `dependencies`, `course-modal.tsx`, `Package & Tooling Config`, `export/form18/route.ts`, `program-join-request/[id]/route.ts`, `next`, `signed-copy/route.ts`, `react`, `timeline/route.ts`, `lib/form18.ts`, `Faculty UI`, `program-join-request-manager.tsx`, `lib/prospectus-duplicate.ts`, `next`, `types/term.ts`, `VPAA UI`, `academic.test.ts`, `Program Chair UI`, `dean-manager.tsx`, `types/form18.ts`, `getUserRoles`, `department-head/route.ts`, `approval-verify.ts`, `audit-log.ts`, `lib/dashboard.ts`, `types/syllabus.ts`, `types/notification.ts`, `program-reviewer-manager.tsx`, `syllabus-decision.ts`, `syllabus-client.ts`, `notifications.ts`, `syllabus-reference/route.ts`, `helpers.ts`, `fdis-chair/route.ts`, `dashboard-manager.tsx`, `types/faculty.ts`, `lib/review-queue.ts`, `signed-copy/route.test.ts`, `citl-director/route.ts`, `types/signed-copy.ts`, `AppUser`, `prospectus-client.ts`, `types/prospectus-item.ts`, `program-reviewer/route.ts`, `syllabus-manager.tsx`, `validators/user.ts`, `audit-phase-a.ts`, `types/justification.ts`, `lib/form17.ts`, `types/term.ts`, `user-manager.tsx`, `Program`, `dean/[id]/route.ts`, `types/form17.ts`, `types/prospectus-item.ts`, `05-a11y.spec.ts`, `dean-manager.tsx`?**
  _High betweenness centrality (0.175) - this node is a cross-community bridge._
- **Are the 80 inferred relationships involving `createAdminPb()` (e.g. with `audit/route.test.ts` and `register/route.test.ts`) actually correct?**
  _`createAdminPb()` has 80 INFERRED edges - model-reasoned connections that need verification._
- **What connects `RFC-4180`, `Org chain (campus, college, department, program)`, `Scoped list visibility (lib/org-visibility.ts)` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `reference-manager.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05970149253731343 - nodes in this community are weakly interconnected._
- **Why does `next` connect `next` to `reference-manager.tsx`, `dashboard-scope.ts`, `react`, `college-manager.tsx`, `lib/syllabus-review.ts`, `authorize`, `Package & Tooling Config`, `createAdminPb`, `program-join-request/[id]/route.ts`, `getCurrentUser`, `mockAuth`, `signed-copy/route.ts`, `react`, `vpaa/route.test.ts`, `mock-auth.ts`, `org-visibility.ts`, `lib/prospectus-duplicate.ts`, `export/route.ts`, `notification-bell.tsx`, `dean-manager.tsx`, `getUserRoles`, `department-head/route.ts`, `pocketbase`, `types/notification.ts`, `types/syllabus.ts`, `syllabus-reference/route.ts`, `course/route.test.ts`, `fdis-chair/route.ts`, `dashboard-manager.tsx`, `lib/review-queue.ts`, `signed-copy/route.test.ts`, `vitest`, `prospectus-client.ts`, `types/prospectus-item.ts`, `syllabus-detail.tsx`, `program-reviewer/route.ts`, `syllabus-manager.tsx`, `user-manager.tsx`, `Program`, `users.ts`, `[code]/page.tsx`, `dean/[id]/route.ts`, `forms/justification.ts`, `capability-rules.ts`, `dean-manager.tsx`, `justifications/route.test.ts`, `dependencies`, `version/route.ts`, `react`, `export/route.test.ts`, `[id]/form17/route.test.ts`, `next`, `app-header.tsx`, `app-shell.tsx`, `types/term.ts`, `review/route.test.ts`, `[pointId]/route.test.ts`, `dean/route.test.ts`, `faculty/route.test.ts`, `fdis-chair/route.test.ts`, `program-chair/route.test.ts`, `audit-log.ts`, `types/faculty.ts`, `stand-in/route.test.ts`, `syllabus-client.ts`, `prospectus-item/route.test.ts`, `form17-view.tsx`, `[id]/form18/route.test.ts`, `syllabus-reference/route.test.ts`, `term/route.test.ts`, `resubmit/route.test.ts`, `stand-in-candidates/route.test.ts`, `user/route.test.ts`, `college/route.test.ts`, `export/form18/route.test.ts`, `submit/route.test.ts`, `validators/user.ts`, `[versionId]/file/route.test.ts`, `syllabus/route.test.ts`, `lead-candidates/route.test.ts`?**
  _High betweenness centrality (0.140) - this node is a cross-community bridge._
- **Are the 21 inferred relationships involving `handlePbError()` (e.g. with `Testing` and `Testing`) actually correct?**
  _`handlePbError()` has 21 INFERRED edges - model-reasoned connections that need verification._
- **Should `dashboard-scope.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07557354925775979 - nodes in this community are weakly interconnected._