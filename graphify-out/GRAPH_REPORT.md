# Graph Report - syllabusv2  (2026-11-06)

## Corpus Check
- 698 files · ~336,020 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 4, .ico 1, .css 1)

## Summary
- 3580 nodes · 11520 edges · 231 communities (149 shown, 82 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 379 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ae162359`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- lib/syllabus.ts
- SyllabusResponse
- overdue-badge.tsx
- program-join-request/[id]/route.ts
- createAdminPb
- Project Docs & Domain Rules
- Plan: automated frontend (end-to-end) coverage
- course-modal.tsx
- scripts
- reference-row-actions.tsx
- capabilities.ts
- export/form18/route.ts
- lib/justification.ts
- global-setup.ts
- mockAuth
- types/audit.ts
- school-year/page.tsx
- types/notification.ts
- program-join-request-manager.tsx
- users.ts
- syllabus-detail.tsx
- pocketbase
- lib/prospectus-duplicate.ts
- Feature walkthrough
- forms/justification.ts
- arrange.ts
- campus-client.ts
- program-chair-manager.tsx
- fdis-chair/route.ts
- End-to-end scenario catalog
- form18-panel.tsx
- faculty/route.ts
- TypeScript Config
- AppUser
- notification/[id]/route.ts
- transfer-lead-dialog.tsx
- reference-manager.tsx
- lib/auth.ts
- lib/dashboard.ts
- getUserRoles
- printable-forms.tsx
- export/form17/route.ts
- [code]/page.tsx
- pocketbase
- college-manager.tsx
- audit-log.ts
- next
- types/syllabus-reference.ts
- dashboard-manager.tsx
- Enhanced OBE Syllabus on `[FILL IN: course name]`
- lib/review-queue.ts
- syllabus-workflow.ts
- dashboard-export.ts
- signed-copy/route.test.ts
- types/term.ts
- prospectus-manager.tsx
- capability-rules.test.ts
- transition
- vpaa/route.ts
- formatDate
- PostCSS Config
- types/user.ts
- org-setup.spec.ts
- user-manager.tsx
- form18-panel.tsx
- [id]/form17/route.test.ts
- lib/upload-limit.ts
- dean/route.ts
- prospectus-item/[id]/route.ts
- department-head/route.ts
- index.ts
- Syllabus Development Guidelines
- syllabus-workflow.test.ts
- types/prospectus-item.ts
- program-reviewer-manager.tsx
- review/route.ts
- term/[id]/route.ts
- school-year/[id]/route.ts
- app-shell.tsx
- package.json
- mock-auth.ts
- Phase 2: Syllabus submission
- types/form18.ts
- Phase 5: Visibility and communication
- Retention policy
- capability-rules.ts
- Criteria
- types/justification.ts
- proxy.ts
- 3. Letter Body (in order, top to bottom)
- managers.spec.ts
- CITL Syllabus Review Guide (Instructions for Part B)
- approval-verify.ts
- term/route.test.ts
- dean/route.test.ts
- dependencies
- fdis-chair/route.test.ts
- SyllabusStatus
- form17-panel.tsx
- helpers.ts
- stand-in/route.test.ts
- eslint.config.mjs
- justifications/route.test.ts
- prospectus/route.test.ts
- register/page.tsx
- validators/user.ts
- duplicate/route.test.ts
- Phase 3: Review engine and forms
- types/term.ts
- next
- vite-tsconfig-paths
- citl-director-manager.tsx
- @axe-core/playwright
- department-manager.tsx
- syllabus-client.ts
- tailwindcss@^4
- devDependencies
- @types/mailparser@^3.9.0
- formatDate
- @types/react-dom@^19
- capabilities.ts
- app-header.tsx
- review/route.test.ts
- syllabus-timeline.tsx
- program-reviewer/route.test.ts
- vitest
- Phase 6: Hardening
- co-authors-panel.tsx
- citl-director/route.test.ts
- department-head/route.test.ts
- program-chair/route.test.ts
- syllabus-justification.ts
- dashboard-aggregate.ts
- [id]/form18/route.test.ts
- lib/audit.ts
- audit-phase-a.ts
- types/signed-copy.ts
- course/route.test.ts
- requireUserMock
- [id]/justification/route.ts
- syllabus-reference/route.test.ts
- validators/syllabus-stand-in.ts
- lib/syllabus-reference.ts
- resubmit/route.test.ts
- stand-in-candidates/route.test.ts
- notification/[id]/route.test.ts
- user/route.test.ts
- 2. End-to-end accounts (`npm run test:e2e`)
- curriculum.spec.ts
- audit/page.tsx
- course/page.tsx
- co-author-candidates/route.test.ts
- export/form17/route.test.ts
- [versionId]/file/route.test.ts
- school-year/[id]/route.test.ts

## God Nodes (most connected - your core abstractions)
1. `createAdminPb()` - 350 edges
2. `handlePbError()` - 250 edges
3. `next` - 235 edges
4. `requireUser()` - 223 edges
5. `vitest` - 154 edges
6. `pocketbase` - 136 edges
7. `getUserRoles` - 131 edges
8. `mockAuth()` - 126 edges
9. `react` - 112 edges
10. `@headlessui/react` - 95 edges

## Surprising Connections (you probably didn't know these)
- `Definitions` --references--> `getSyllabusAccess()`  [INFERRED]
  docs/specs/phase-2-syllabus-submission.md → lib/syllabus.ts
- `5. Delivery order` --references--> `createWorld()`  [INFERRED]
  docs/specs/e2e-coverage-plan.md → e2e/world.ts
- `Timeline` --references--> `resolveSyllabusAccess()`  [INFERRED]
  docs/specs/phase-4-reviewer-experience.md → lib/syllabus.ts
- `Upload rate limit` --references--> `version()`  [INFERRED]
  docs/specs/phase-6-hardening.md → components/syllabus/syllabus-timeline.tsx
- `Hub (`/syllabus/[id]`)` --references--> `SyllabusVersions()`  [INFERRED]
  docs/specs/phase-4-reviewer-experience.md → components/syllabus/syllabus-versions.tsx

## Import Cycles
- 2-file cycle: `components/campus/campus-manager.tsx -> components/campus/campus-modal.tsx -> components/campus/campus-manager.tsx`

## Hyperedges (group relationships)
- **Review engine flow (Phase 3)** — agents_syllabus_workflow_state_machine, agents_review_chain, syllabus_review_system_project_plan__v5__syllabus_statuses, syllabus_review_system_project_plan__v5__routing_readiness, agents_proxy_reviewer, agents_approval_reference [EXTRACTED 1.00]
- **University review forms supported by the system** — agents_form17, agents_form18_1, agents_justification_form, syllabus_review_system_project_plan__v5__enhanced_obe_syllabus, syllabus_review_system_project_plan__v5__form_definitions_versioning [EXTRACTED 1.00]
- **Phase A migration from role-based PERMISSIONS to derived-role capabilities** — project_context_users_role_field, project_context_permissions_map, agents_isadmin, agents_getuserroles, agents_capability_authorization [INFERRED 0.85]

## Communities (231 total, 82 thin omitted)

### Community 0 - "lib/syllabus.ts"
Cohesion: 0.08
Nodes (53): conflict(), PUT(), RouteContext, DELETE(), leadOnly(), notEditable(), notFound(), PATCH() (+45 more)

### Community 1 - "SyllabusResponse"
Cohesion: 0.18
Nodes (14): ReviewDecisionDialog(), handleConfirm(), ReviewDecisionDialogProps, reviewSyllabus(), DecisionInput, ActingAs, ParseResult, parseReviewInput() (+6 more)

### Community 2 - "overdue-badge.tsx"
Cohesion: 0.25
Nodes (15): Badge(), plural(), ReviewOverdueBadge(), reviewOverdueDays(), SubmissionOverdueBadge(), submissionOverdueDays(), TermDeadlines, daysOverdue() (+7 more)

### Community 3 - "program-join-request/[id]/route.ts"
Cohesion: 0.11
Nodes (26): DELETE(), notPending(), PATCH(), RouteContext, GET(), POST(), applyJoinRequestDecision(), JOIN_REQUEST_EXPAND (+18 more)

### Community 4 - "createAdminPb"
Cohesion: 0.04
Nodes (120): GET(), DELETE(), PATCH(), RouteContext, GET(), POST(), DELETE(), GET() (+112 more)

### Community 5 - "Project Docs & Domain Rules"
Cohesion: 0.06
Nodes (37): AGENTS.md (agent guidance), Approval reference code (SYL-<term>-<seq>-S<stage>), Capability-based authorization (can, requireUser, authorize, canSomewhere), Form 17 (OVPAA-F-INS-017) review checklist, Form 18-1 (CITL-F-018) review points, getUserRoles resolver (derived roles from assignment records), users.isAdmin (only stored role), Justification Form (missing lead signature) (+29 more)

### Community 6 - "Plan: automated frontend (end-to-end) coverage"
Cohesion: 0.25
Nodes (7): 1. Goal and boundaries, 2. What exists today, 4. Scenario catalog, 5. Delivery order, 6. Risks, 7. Decisions, Plan: automated frontend (end-to-end) coverage

### Community 7 - "course-modal.tsx"
Cohesion: 0.08
Nodes (38): CourseCombobox(), CourseComboboxProps, CourseOption, CourseModal(), handleSubmit(), CourseModalMode, CourseModalProps, NUMBER_FIELDS (+30 more)

### Community 8 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, audit:phase-a, build, dev, lint, pb, start, test (+2 more)

### Community 9 - "reference-row-actions.tsx"
Cohesion: 0.20
Nodes (15): COPY, DialogAction, ReferenceActionDialog(), handleSubmit(), ReferenceActionDialogProps, STOP_REFERENCING_COPY, ACTION_LABELS, actionLabel() (+7 more)

### Community 10 - "capabilities.ts"
Cohesion: 0.08
Nodes (30): CampusPage(), metadata, CitlDirectorPage(), metadata, CollegePage(), metadata, DeanPage(), metadata (+22 more)

### Community 11 - "export/form18/route.ts"
Cohesion: 0.22
Nodes (10): GET(), RouteContext, listApprovals(), loadExportSyllabus(), getForm18(), ctx, form18(), mocks (+2 more)

### Community 12 - "lib/justification.ts"
Cohesion: 0.20
Nodes (11): activeHolderName(), canViewJustification(), ensureBasedOn(), userNames(), findPreviousSyllabus(), previousSchoolYearLabel(), fakePb(), filter() (+3 more)

### Community 13 - "global-setup.ts"
Cohesion: 0.07
Nodes (40): isVerified(), PROTECTED, catalog, covered, missing, strict, unknown, APP_PORT (+32 more)

### Community 14 - "mockAuth"
Cohesion: 0.04
Nodes (43): ctx, forbidden(), mocks, unauthorized(), ctx, forbidden(), mocks, unauthorized() (+35 more)

### Community 15 - "types/audit.ts"
Cohesion: 0.21
Nodes (12): AuditListResponse, AuditParams, listAudit(), request(), parseAuditQuery(), ParseResult, phtMidnight(), parse() (+4 more)

### Community 16 - "school-year/page.tsx"
Cohesion: 0.36
Nodes (5): metadata, SchoolYearPage(), SchoolYearManager(), SchoolYearsAndTerms(), SchoolYearsAndTermsProps

### Community 17 - "types/notification.ts"
Cohesion: 0.21
Nodes (10): Notifications, parseNotificationUpdateInput(), ParseResult, EMAIL_STATUSES, EmailStatus, Notification, NOTIFICATION_KINDS, NotificationKind (+2 more)

### Community 18 - "program-join-request-manager.tsx"
Cohesion: 0.16
Nodes (23): ProgramJoinRequestManager(), approve(), reloadAfterRowLeft(), ProgramJoinRequestManagerProps, RowDialog, STATUS_LABELS, STATUS_STYLES, ProgramJoinRequestModal() (+15 more)

### Community 19 - "users.ts"
Cohesion: 0.22
Nodes (15): DELETE(), PATCH(), RouteContext, GET(), POST(), avatarUrl(), ASSIGNMENTS, hasOtherAdmin() (+7 more)

### Community 20 - "syllabus-detail.tsx"
Cohesion: 0.13
Nodes (17): metadata, PageProps, SyllabusDetailPage(), DeleteSyllabusDialog(), handleDelete(), DeleteSyllabusDialogProps, SubmitSyllabusDialog(), handleSubmit() (+9 more)

### Community 21 - "pocketbase"
Cohesion: 0.23
Nodes (16): DeleteFacultyDialog(), handleDelete(), DeleteFacultyDialogProps, FacultyManager(), toggleActive(), FacultyManagerProps, FacultyModal(), handleSubmit() (+8 more)

### Community 22 - "lib/prospectus-duplicate.ts"
Cohesion: 0.12
Nodes (24): GET(), POST(), applyDuplicate(), batchSize(), DuplicatePlan, MAX_BATCH_REQUESTS, newRecordId(), planDuplicate() (+16 more)

### Community 23 - "Feature walkthrough"
Cohesion: 0.20
Nodes (20): 0. Before you start, 1. Cast, Feature walkthrough, Part 10 — Negative checks, Part 11 — Keyboard and accessibility pass, Part 1 — Admin setup (as `admin`), Part 2 — Org chain and roles, Part 3 — Registration and joining a program (+12 more)

### Community 24 - "forms/justification.ts"
Cohesion: 0.24
Nodes (10): metadata, PageProps, SyllabusJustificationLetterPage(), JustificationLetterView(), PrintableJustificationLetter(), buildJustificationLetter(), JUSTIFICATION_TEMPLATE, JustificationLetterData (+2 more)

### Community 25 - "arrange.ts"
Cohesion: 0.12
Nodes (39): Schema changes (to apply to `pb_schema.json`), Schema changes (to apply to `pb_schema.json`), Proposals (accept or amend before task 1), Schema changes (to apply to `pb_schema.json`), Ids, KNOWN, PAGES, STATES (+31 more)

### Community 26 - "campus-client.ts"
Cohesion: 0.17
Nodes (21): CampusManager(), CampusManagerProps, formatDate(), ModalState, CampusModal(), handleSubmit(), CampusModalMode, CampusModalProps (+13 more)

### Community 27 - "program-chair-manager.tsx"
Cohesion: 0.18
Nodes (19): DeleteProgramChairDialog(), handleDelete(), DeleteProgramChairDialogProps, ProgramChairManager(), toggleActive(), ProgramChairManagerProps, ProgramChairModal(), handleSubmit() (+11 more)

### Community 28 - "fdis-chair/route.ts"
Cohesion: 0.18
Nodes (19): DeleteFdisChairDialog(), handleDelete(), DeleteFdisChairDialogProps, FdisChairManager(), toggleActive(), FdisChairManagerProps, FdisChairModal(), handleSubmit() (+11 more)

### Community 29 - "End-to-end scenario catalog"
Cohesion: 0.10
Nodes (19): `a11y.spec.ts` [Part 11], `approval-filing.spec.ts` [Part 5], `audit.spec.ts` [Part 9], `auth.spec.ts` [Part 3, Part 10], `curriculum.spec.ts` [Part 1–2], `dashboard.spec.ts` [Part 9], End-to-end scenario catalog, `justification.spec.ts` [Part 5] (+11 more)

### Community 30 - "form18-panel.tsx"
Cohesion: 0.08
Nodes (34): metadata, PageProps, SyllabusRevisePage(), ResubmitSyllabusDialog(), handleResubmit(), ResubmitSyllabusDialogProps, Group, groupPoints() (+26 more)

### Community 31 - "faculty/route.ts"
Cohesion: 0.17
Nodes (15): PATCH(), RouteContext, isFacultyOfProgram(), toFacultyResponse(), parseFacultyUpdate(), ParseResult, parseRequiredString(), ParseResult (+7 more)

### Community 32 - "TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 33 - "AppUser"
Cohesion: 0.29
Nodes (10): listStandIns(), STAND_IN_EXPAND, toStandInResponse(), fakePb(), filter(), record, StandInCandidate, StandInResponse (+2 more)

### Community 34 - "notification/[id]/route.ts"
Cohesion: 0.21
Nodes (13): RouteContext, GET(), markAllRead(), NOTIFICATION_EXPAND, ownFilter(), toNotificationResponse(), get(), listResult (+5 more)

### Community 35 - "transfer-lead-dialog.tsx"
Cohesion: 0.24
Nodes (9): TransferLeadDialog(), handleTransfer(), TransferLeadDialogProps, transferLead(), LEAD_REASON_MAX, LEAD_REASON_MIN, parseLeadTransfer(), ParseResult (+1 more)

### Community 36 - "reference-manager.tsx"
Cohesion: 0.15
Nodes (21): ReferenceManager(), ReferenceManagerProps, ReferenceModal(), handleSubmit(), ReferenceModalProps, ReferenceViewer, ReferenceSourceCombobox(), ReferenceSourceComboboxProps (+13 more)

### Community 37 - "lib/auth.ts"
Cohesion: 0.09
Nodes (21): POST(), isDuplicateEmail(), POST(), ConfirmEmailPage(), ConfirmEmailPageProps, metadata, confirmEmailVerification(), requestEmailVerification() (+13 more)

### Community 38 - "lib/dashboard.ts"
Cohesion: 0.12
Nodes (42): cap(), GET(), GET(), GET(), GET(), GET(), Task plan (one reviewable change each, lint and tests green after each), allAwaitingSignedCopy() (+34 more)

### Community 39 - "getUserRoles"
Cohesion: 0.06
Nodes (69): GET(), GET(), GET(), RouteContext, GET(), notFound(), RouteContext, GET() (+61 more)

### Community 40 - "printable-forms.tsx"
Cohesion: 0.31
Nodes (7): metadata, PageProps, SyllabusFormsPage(), PrintableForms(), Forms and export, Form17ExportData, Form181ExportData

### Community 41 - "export/form17/route.ts"
Cohesion: 0.24
Nodes (11): ApprovalStamp, buildForm17Export(), buildForm181Export(), ExportFormMeta, ExportSignature, ExportSyllabus, INSTITUTION, JustificationState (+3 more)

### Community 42 - "[code]/page.tsx"
Cohesion: 0.21
Nodes (10): ACTING_AS_LABELS, metadata, PageProps, Row(), VerifyApprovalPage(), metadata, VerifyPage(), VerifyForm() (+2 more)

### Community 43 - "pocketbase"
Cohesion: 0.12
Nodes (27): CitlDirectorModalProps, CourseManagerProps, ModalState, DeleteCourseDialogProps, StandInPickerProps, StandInsPanelProps, UserCombobox(), UserComboboxProps (+19 more)

### Community 44 - "college-manager.tsx"
Cohesion: 0.10
Nodes (35): CollegeManager(), CollegeManagerProps, ModalState, CollegeModal(), handleSubmit(), CollegeModalMode, CollegeModalProps, Detail() (+27 more)

### Community 45 - "audit-log.ts"
Cohesion: 0.15
Nodes (18): Boundaries, anyOf(), auditDetail(), auditFilter(), AuditNames, listAudit(), stateLabel(), STATUS_LABELS (+10 more)

### Community 46 - "next"
Cohesion: 0.07
Nodes (28): POST(), DELETE(), GET(), PATCH(), RouteContext, GET(), POST(), POST() (+20 more)

### Community 47 - "types/syllabus-reference.ts"
Cohesion: 0.27
Nodes (10): isObject(), parseReferenceActionInput(), ParseResult, parseSyllabusReferenceInput(), MAX_REFERENCE_TEXT, REFERENCE_ACTIONS, REFERENCE_STATUSES, ReferenceActionInput (+2 more)

### Community 48 - "dashboard-manager.tsx"
Cohesion: 0.14
Nodes (34): DashboardPage(), metadata, DashboardManager(), defaultTerm(), JustificationsPanel(), STATE_STYLES, STATES, daysSince() (+26 more)

### Community 49 - "Enhanced OBE Syllabus on `[FILL IN: course name]`"
Cohesion: 0.07
Nodes (27): About This File, BUKIDNON STATE UNIVERSITY, Course Information, Creating a syllabus, Differences between the two signatory blocks, Document Structure (in order), Enhanced OBE Syllabus on `[FILL IN: course name]`, Enhanced OBE Syllabus Template (BukSU) (+19 more)

### Community 50 - "lib/review-queue.ts"
Cohesion: 0.05
Nodes (59): GET(), Boundaries, Decisions (2026-10-27), Events (`lib/syllabus-events.ts`, server-only), Hub (`/syllabus/[id]`), Objective, Out of scope, Phase 4: Reviewer experience (+51 more)

### Community 51 - "syllabus-workflow.ts"
Cohesion: 0.20
Nodes (11): ApproveEvent, ChainRole, FileEvent, RejectScanEvent, ResubmitEvent, ReturnEvent, RoutingFacts, SubmitEvent (+3 more)

### Community 52 - "dashboard-export.ts"
Cohesion: 0.15
Nodes (20): RFC-4180, CsvCell, csvCell(), fileSlug(), toCsv(), completionCsv(), filterOverdue(), JUSTIFICATION_LABELS (+12 more)

### Community 53 - "signed-copy/route.test.ts"
Cohesion: 0.10
Nodes (15): ctx, download(), mocks, pdf, upload(), ctx, mocks, pdf (+7 more)

### Community 54 - "types/term.ts"
Cohesion: 0.11
Nodes (28): metadata, ReviewQueuePage(), metadata, SyllabusPage(), NeedsProxyPanel(), ProgramFilterCombobox(), ProgramOption, age() (+20 more)

### Community 55 - "prospectus-manager.tsx"
Cohesion: 0.09
Nodes (42): DeleteProspectusDialog(), handleDelete(), DeleteProspectusDialogProps, DuplicateProspectusDialog(), handleConfirm(), DuplicateProspectusDialogProps, ItemList(), ModalState (+34 more)

### Community 56 - "capability-rules.test.ts"
Cohesion: 0.15
Nodes (11): admin, ADMIN_ONLY, chair, dean, facultyOnly, head, multiRole, OTHER (+3 more)

### Community 57 - "transition"
Cohesion: 0.33
Nodes (11): API, Workflow (`lib/syllabus-workflow.ts`, pure), approve(), fail(), file(), giveBack(), rejectScan(), resubmit() (+3 more)

### Community 58 - "vpaa/route.ts"
Cohesion: 0.25
Nodes (13): PATCH(), RouteContext, POST(), ParseResult, parseVpaaInput(), parseVpaaUpdate(), getActiveVpaa(), hasActiveVpaa() (+5 more)

### Community 59 - "formatDate"
Cohesion: 0.09
Nodes (32): ACTION_LABELS, Form17View(), Line(), Form181View(), PointsTable(), ACTING_AS, FormHeader(), SignatureLines() (+24 more)

### Community 110 - "types/user.ts"
Cohesion: 0.16
Nodes (18): LoginForm(), handleSubmit(), LoginFormProps, RegisterForm(), handleSubmit(), getInitials(), HeaderAuth(), handleLogout() (+10 more)

### Community 111 - "org-setup.spec.ts"
Cohesion: 0.08
Nodes (38): completion(), HEADERS, namesOf(), openDashboard(), otherWorld(), escapeRegExp(), pickUser(), rowWith() (+30 more)

### Community 112 - "user-manager.tsx"
Cohesion: 0.14
Nodes (25): DeleteUserDialog(), handleDelete(), DeleteUserDialogProps, describeAccess(), KIND_LABELS, ModalState, UserManager(), UserManagerProps (+17 more)

### Community 113 - "form18-panel.tsx"
Cohesion: 0.10
Nodes (27): metadata, PageProps, SyllabusReviewPage(), Form18Panel(), Form18PanelProps, NewPointForm(), PointForm(), PointFormProps (+19 more)

### Community 114 - "[id]/form17/route.test.ts"
Cohesion: 0.18
Nodes (9): ctx, FORM, get(), HOLDERS, INPUT, LATEST, mocks, put() (+1 more)

### Community 115 - "lib/upload-limit.ts"
Cohesion: 0.22
Nodes (8): TARGET, UPLOAD_LIMIT, UPLOAD_WINDOW_MS, UploadKind, UploadRate, getList, NOW, pb

### Community 118 - "dean/route.ts"
Cohesion: 0.10
Nodes (29): DELETE(), GET(), PATCH(), RouteContext, GET(), POST(), DELETE(), PATCH() (+21 more)

### Community 119 - "prospectus-item/[id]/route.ts"
Cohesion: 0.33
Nodes (11): PATCH(), RouteContext, GET(), POST(), PROSPECTUS_ITEM_EXPAND, toProspectusItemResponse(), isYearLevel(), parseProspectusItemInput() (+3 more)

### Community 120 - "department-head/route.ts"
Cohesion: 0.21
Nodes (16): DELETE(), PATCH(), RouteContext, GET(), POST(), departmentHasActiveHead(), isHeadOfDepartment(), listDepartmentsHeadedBy() (+8 more)

### Community 121 - "index.ts"
Cohesion: 0.09
Nodes (40): Batch, copyForm17(), form17Facts(), listForm17Answers(), loadForm17(), newRecordId(), SaveForm17, saveForm17() (+32 more)

### Community 122 - "Syllabus Development Guidelines"
Cohesion: 0.08
Nodes (23): 10. Syllabus Table Format, 11. Writing Good Outcomes, 12. Syllabus Creation Workflow, 13. Institutional Review Process, 14. Validation Checklist, 15. Output Behavior for Claude, 1. Role and Scope, 2. Bloom's Taxonomy Reference (+15 more)

### Community 123 - "syllabus-workflow.test.ts"
Cohesion: 0.12
Nodes (12): StatusChange, INITIAL_STATE, WorkflowState, APPROVED, DRAFT, FILE, FILED, inReview() (+4 more)

### Community 124 - "types/prospectus-item.ts"
Cohesion: 0.13
Nodes (30): DeleteProspectusItemDialog(), handleDelete(), DeleteProspectusItemDialogProps, itemProspectusLabel(), ModalState, ProspectusItemManager(), ProspectusItemManagerProps, prospectusLabel() (+22 more)

### Community 125 - "program-reviewer-manager.tsx"
Cohesion: 0.17
Nodes (20): DeleteProgramReviewerDialog(), handleDelete(), DeleteProgramReviewerDialogProps, ProgramReviewerManager(), toggleActive(), ProgramReviewerManagerProps, ProgramReviewerModal(), handleSubmit() (+12 more)

### Community 126 - "review/route.ts"
Cohesion: 0.06
Nodes (83): DELETE(), load(), Loaded, notFound(), RouteContext, GET(), notFound(), POST() (+75 more)

### Community 127 - "term/[id]/route.ts"
Cohesion: 0.40
Nodes (7): GET(), PATCH(), RouteContext, termHasRefSeqs(), toTermRecord(), toTermResponse(), record

### Community 128 - "school-year/[id]/route.ts"
Cohesion: 0.19
Nodes (15): DELETE(), PATCH(), RouteContext, GET(), POST(), DEPENDENTS, describeSchoolYearDependents(), schoolYearHasRefSeqs() (+7 more)

### Community 129 - "app-shell.tsx"
Cohesion: 0.24
Nodes (9): AppShell(), Sidebar(), SidebarProps, `navigation.spec.ts` [Part 2, Part 9], Capability, getNavItems(), NAV_ITEMS, NavItem (+1 more)

### Community 130 - "package.json"
Cohesion: 0.20
Nodes (9): @tailwindcss/postcss@^4, @types/react@^19, @types/smtp-server@^3.5.13, name, private, version, @tailwindcss/postcss, @types/react (+1 more)

### Community 131 - "mock-auth.ts"
Cohesion: 0.05
Nodes (24): base, listResult, mocks, approve, ctx, mocks, pending, SCOPE (+16 more)

### Community 132 - "Phase 2: Syllabus submission"
Cohesion: 0.22
Nodes (8): API, Capabilities, Decisions (2026-10-26), Definitions, Out of scope, Phase 2: Syllabus submission, UI, Workflow (`lib/syllabus-workflow.ts`, pure)

### Community 133 - "types/form18.ts"
Cohesion: 0.07
Nodes (39): conflict(), PATCH(), reviewerCheck(), listPoints(), loadForm18(), person(), Point, PointAction (+31 more)

### Community 134 - "Phase 5: Visibility and communication"
Cohesion: 0.17
Nodes (11): Boundaries, Dashboards, Deadlines, Decisions (2026-10-28), Objective, Out of scope, Phase 5: Visibility and communication, Proposals (accept or amend before task 1) (+3 more)

### Community 139 - "Retention policy"
Cohesion: 0.33
Nodes (5): Changing this policy, Removing records, Retention policy, Rule, Storage growth

### Community 140 - "capability-rules.ts"
Cohesion: 0.22
Nodes (3): CAPABILITIES, Rule, RULES

### Community 141 - "Criteria"
Cohesion: 0.12
Nodes (16): A. Preliminaries, B. Vision, Mission, Goals, Objectives, and Outcomes, C. Course Content, Closing Section, Criteria, D. Assessment, E. Learning Modality and Methods, F. Resources, Required Readings, and References (+8 more)

### Community 142 - "types/justification.ts"
Cohesion: 0.31
Nodes (8): ParseResult, Justification, JUSTIFICATION_STATUSES, JustificationEntry, JustificationInput, JustificationReturnInput, MAX_JUSTIFICATION_REASON, MAX_JUSTIFICATION_RETURN_REASON

### Community 143 - "proxy.ts"
Cohesion: 0.40
Nodes (5): config, isTokenExpired(), proxy(), PUBLIC_PATHS, PUBLIC_PREFIXES

### Community 144 - "3. Letter Body (in order, top to bottom)"
Cohesion: 0.12
Nodes (15): 1. Document Overview, 2. Letterhead (fixed, centered at top), 3.1 Date — VARIABLE, 3.2 Recipient block — FIXED, 3.3 Salutation — FIXED, 3.4 Opening paragraph — PARTLY VARIABLE, 3.5 Table — VARIABLE (see Section 4), 3.6 Closing — FIXED (+7 more)

### Community 145 - "managers.spec.ts"
Cohesion: 0.12
Nodes (19): expectNoSeriousViolations(), TAGS, Api, at(), failNext(), hold(), pretendTwoPages(), ListPage (+11 more)

### Community 146 - "CITL Syllabus Review Guide (Instructions for Part B)"
Cohesion: 0.14
Nodes (13): A. Format and House Style, B. Alignment (Coherence and Logical Connection Between Learning Plan Components), C. Use of Behavioral Verbs (Bloom's Taxonomy), CITL Syllabus Review Guide (Instructions for Part B), CITL Syllabus Review: Suggestions and Action Taken (Form 18-1), D. Gradation of COs and SLOs, E. Supplementary Documentation, F. Inclusion of Prescribed Institutional Forms (+5 more)

### Community 147 - "approval-verify.ts"
Cohesion: 0.22
Nodes (10): approvalCode(), ApprovalCodeParts, parseApprovalCode(), SEMESTER_CODES, validStage(), ReviewWithExpand, VerifiedApproval, fakePb() (+2 more)

### Community 148 - "term/route.test.ts"
Cohesion: 0.25
Nodes (5): base, forbidden(), listResult, mocks, rows

### Community 149 - "dean/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 150 - "dependencies"
Cohesion: 0.29
Nodes (7): dependencies, @headlessui/react@^2.2.10, next@16.3.6, pocketbase@^0.28.1, react@19.2.8, react-dom@19.2.8, react-dom

### Community 151 - "fdis-chair/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 152 - "SyllabusStatus"
Cohesion: 0.27
Nodes (8): AvailableCourseCombobox(), AvailableCourseComboboxProps, SyllabusModal(), handleSubmit(), SyllabusModalProps, AvailableList, createSyllabus(), AvailableSyllabusRow

### Community 153 - "form17-panel.tsx"
Cohesion: 0.25
Nodes (9): changed(), Draft, draftFrom(), Form17Panel(), handleSave(), Form17PanelProps, saveForm17(), Form17Answer (+1 more)

### Community 155 - "helpers.ts"
Cohesion: 0.13
Nodes (23): CRITERIA, focusIsVisible(), tabTo(), approveStageOne(), dialogOf(), test, worlds, alerts() (+15 more)

### Community 156 - "stand-in/route.test.ts"
Cohesion: 0.22
Nodes (4): ctx, HOLDERS, ITEMS, mocks

### Community 157 - "eslint.config.mjs"
Cohesion: 0.33
Nodes (5): eslintConfig, eslint@^9, eslint-config-next@16.3.6, eslint, eslint-config-next

### Community 158 - "justifications/route.test.ts"
Cohesion: 0.05
Nodes (36): anyOf(), Bind, filterInScope(), programInScope(), programMatches(), programScopeFilter(), ScopedPrograms, scopePrograms() (+28 more)

### Community 159 - "prospectus/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 160 - "register/page.tsx"
Cohesion: 0.29
Nodes (7): LoginPage(), LoginPageProps, metadata, metadata, RegisterPage(), RegisterPageProps, safeRedirect()

### Community 161 - "validators/user.ts"
Cohesion: 0.20
Nodes (11): RegisterFormProps, DEFAULT_EMAIL_DOMAINS, ParsedRegistration, ParseResult, EMAIL, MAX_NAME, MAX_PASSWORD, MIN_PASSWORD (+3 more)

### Community 162 - "duplicate/route.test.ts"
Cohesion: 0.25
Nodes (4): forbidden(), input, mocks, pb

### Community 163 - "Phase 3: Review engine and forms"
Cohesion: 0.25
Nodes (7): Accepted 2026-10-27, Capabilities, Decisions (2026-10-26), Justification, Out of scope, Phase 3: Review engine and forms, UI (minimal; Phase 4 polishes)

### Community 164 - "types/term.ts"
Cohesion: 0.13
Nodes (29): DeleteTermDialog(), handleDelete(), DeleteTermDialogProps, ModalState, TermManager(), toggleOpen(), TermManagerProps, TermModal() (+21 more)

### Community 165 - "next"
Cohesion: 0.06
Nodes (19): mocks, base, listResult, mocks, ctx, EXPAND, forbidden(), mocks (+11 more)

### Community 167 - "citl-director-manager.tsx"
Cohesion: 0.18
Nodes (19): CitlDirectorManager(), toggleActive(), CitlDirectorManagerProps, CitlDirectorModal(), handleSubmit(), DeleteCitlDirectorDialog(), handleDelete(), DeleteCitlDirectorDialogProps (+11 more)

### Community 170 - "department-manager.tsx"
Cohesion: 0.09
Nodes (39): DeleteDepartmentDialog(), handleDelete(), DeleteDepartmentDialogProps, DepartmentManager(), DepartmentManagerProps, departmentScope(), ModalState, DepartmentModal() (+31 more)

### Community 171 - "syllabus-client.ts"
Cohesion: 0.14
Nodes (38): JustificationPanel(), adopt(), handlePreview(), handleSave(), run(), STATUS_LABELS, SignedCopyPanel(), handleReturn() (+30 more)

### Community 174 - "devDependencies"
Cohesion: 0.18
Nodes (11): devDependencies, mailparser@^3.14.2, @playwright/test@^1.64.1, smtp-server@^3.21.3, @types/node@^24.19.0, typescript@^5, vitest@^5.0.2, mailparser (+3 more)

### Community 176 - "formatDate"
Cohesion: 0.21
Nodes (17): metadata, NotificationsPage(), BellPanel(), markAll(), open(), NotificationsManager(), follow(), markAll() (+9 more)

### Community 178 - "capabilities.ts"
Cohesion: 0.23
Nodes (7): DepartmentHeadPage(), metadata, resolveScope(), ScopeTarget, fullChain, mocks, records

### Community 190 - "app-header.tsx"
Cohesion: 0.29
Nodes (8): metadata, RootLayout(), AppHeader(), unreadFor(), BellIcon(), NotificationBell(), APP_NAME, countUnread()

### Community 191 - "review/route.test.ts"
Cohesion: 0.20
Nodes (7): BY_STAGE, ctx, decide(), HOLDERS, mocks, NO_POINTS, VERSION

### Community 192 - "syllabus-timeline.tsx"
Cohesion: 0.19
Nodes (13): by(), currentLine(), describeEntry(), DOT, stageName(), SyllabusTimeline(), SyllabusTimelineProps, version() (+5 more)

### Community 194 - "program-reviewer/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 195 - "vitest"
Cohesion: 0.07
Nodes (20): vitest, ctx, get(), mocks, candidates, ctx, get(), mocks (+12 more)

### Community 197 - "Phase 6: Hardening"
Cohesion: 0.20
Nodes (9): Accessibility pass, Decisions (2026-10-28), End-to-end tests, Lead reassignment, Objective, Out of scope, Phase 6: Hardening, Retention policy (+1 more)

### Community 198 - "co-authors-panel.tsx"
Cohesion: 0.36
Nodes (7): CoAuthorPicker(), CoAuthorPickerProps, CoAuthorsPanel(), save(), CoAuthorsPanelProps, updateSyllabusCoAuthors(), CoAuthorCandidate

### Community 199 - "citl-director/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 200 - "department-head/route.test.ts"
Cohesion: 0.05
Nodes (24): base, forbidden(), listResult, mocks, rows, unauthorized(), base, forbidden() (+16 more)

### Community 201 - "program-chair/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 202 - "syllabus-justification.ts"
Cohesion: 0.43
Nodes (6): Current, editError(), eligibleAuthors(), returnError(), submitScanError(), JustificationStatus

### Community 203 - "dashboard-aggregate.ts"
Cohesion: 0.10
Nodes (28): addTally(), aggregate(), blankTally(), byName(), completionRows(), row(), Tally, withRate() (+20 more)

### Community 204 - "[id]/form18/route.test.ts"
Cohesion: 0.25
Nodes (5): ctx, HOLDERS, LATEST, mocks, post()

### Community 208 - "lib/audit.ts"
Cohesion: 0.29
Nodes (4): Audit module, Batch, AuditEntry, AuditInput

### Community 209 - "audit-phase-a.ts"
Cohesion: 0.33
Nodes (6): AssignmentRow, ASSIGNMENTS, main(), requireEnv(), UNASSIGNED_FILTER, UserRow

### Community 210 - "types/signed-copy.ts"
Cohesion: 0.24
Nodes (10): listSignedCopies(), signedCopyFileName(), toSignedCopyResponse(), ParseResult, parseSignedCopyReturn(), copy, MAX_SIGNED_COPY_REASON, SignedCopy (+2 more)

### Community 211 - "course/route.test.ts"
Cohesion: 0.25
Nodes (5): base, forbidden(), listResult, mocks, rows

### Community 212 - "requireUserMock"
Cohesion: 0.05
Nodes (23): get(), mocks, page, listResult, mocks, base, forbidden(), listResult (+15 more)

### Community 213 - "[id]/justification/route.ts"
Cohesion: 0.20
Nodes (16): conflict(), GET(), load(), notFound(), PATCH(), PUT(), RouteContext, findJustification() (+8 more)

### Community 214 - "syllabus-reference/route.test.ts"
Cohesion: 0.25
Nodes (5): input, mocks, SCOPE, source, term

### Community 215 - "validators/syllabus-stand-in.ts"
Cohesion: 0.43
Nodes (5): FINAL_STAGE, isStage(), ParseResult, parseStandInInput(), StandInInput

### Community 216 - "lib/syllabus-reference.ts"
Cohesion: 0.15
Nodes (16): hasLiveReferenceTo(), listReferenceSources(), LIVE_REFERENCE_FILTER, ReferenceActor, ReferenceTransition, referenceTransition(), RULES, SourceQuery (+8 more)

### Community 217 - "resubmit/route.test.ts"
Cohesion: 0.29
Nodes (5): ctx, HOLDERS, mocks, resubmit(), returned

### Community 218 - "stand-in-candidates/route.test.ts"
Cohesion: 0.29
Nodes (6): candidates, ctx, get(), HOLDERS, mocks, syllabus

### Community 220 - "notification/[id]/route.test.ts"
Cohesion: 0.40
Nodes (4): PATCH(), ctx, mocks, patch()

### Community 221 - "user/route.test.ts"
Cohesion: 0.29
Nodes (4): base, listResult, mocks, users

### Community 222 - "2. End-to-end accounts (`npm run test:e2e`)"
Cohesion: 0.33
Nodes (5): 2. End-to-end accounts (`npm run test:e2e`), Credentials, Global accounts (seeded once by global setup), One-off accounts made inside specs, Sample accounts

### Community 223 - "curriculum.spec.ts"
Cohesion: 0.47
Nodes (4): freshYearLabel(), dialogOf(), offered(), submitDialog()

### Community 224 - "audit/page.tsx"
Cohesion: 0.50
Nodes (3): AuditPage(), metadata, AuditManager()

### Community 225 - "course/page.tsx"
Cohesion: 0.50
Nodes (3): CoursePage(), metadata, CourseManager()

### Community 226 - "co-author-candidates/route.test.ts"
Cohesion: 0.33
Nodes (4): candidates, ctx, mocks, syllabus

### Community 227 - "export/form17/route.test.ts"
Cohesion: 0.33
Nodes (5): ctx, form17(), mocks, SYLLABUS, VERSION

### Community 228 - "[versionId]/file/route.test.ts"
Cohesion: 0.33
Nodes (4): ctx, mocks, syllabus, version

### Community 229 - "school-year/[id]/route.test.ts"
Cohesion: 0.40
Nodes (3): ctx, forbidden(), mocks

## Knowledge Gaps
- **10 isolated node(s):** `RFC-4180`, `Org chain (campus, college, department, program)`, `Scoped list visibility (lib/org-visibility.ts)`, `Plain CRUD entities (campus, college, department, program, user)`, `Advisory PDF checks (informational only)` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1240 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **82 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `pocketbase` connect `citl-director-manager.tsx` to `school-year/[id]/route.ts`, `lib/syllabus.ts`, `package.json`, `program-join-request/[id]/route.ts`, `createAdminPb`, `types/form18.ts`, `SyllabusResponse`, `course-modal.tsx`, `export/form18/route.ts`, `lib/justification.ts`, `global-setup.ts`, `types/justification.ts`, `types/audit.ts`, `types/notification.ts`, `program-join-request-manager.tsx`, `approval-verify.ts`, `pocketbase`, `lib/prospectus-duplicate.ts`, `dependencies`, `campus-client.ts`, `program-chair-manager.tsx`, `fdis-chair/route.ts`, `faculty/route.ts`, `AppUser`, `notification/[id]/route.ts`, `reference-manager.tsx`, `lib/auth.ts`, `types/term.ts`, `lib/dashboard.ts`, `getUserRoles`, `next`, `department-manager.tsx`, `pocketbase`, `college-manager.tsx`, `audit-log.ts`, `next`, `syllabus-client.ts`, `dashboard-manager.tsx`, `types/syllabus-reference.ts`, `lib/review-queue.ts`, `signed-copy/route.test.ts`, `types/term.ts`, `prospectus-manager.tsx`, `vpaa/route.ts`, `formatDate`, `lib/audit.ts`, `audit-phase-a.ts`, `types/signed-copy.ts`, `lib/syllabus-reference.ts`, `types/user.ts`, `user-manager.tsx`, `lib/upload-limit.ts`, `dean/route.ts`, `department-head/route.ts`, `index.ts`, `types/prospectus-item.ts`, `program-reviewer-manager.tsx`, `review/route.ts`, `term/[id]/route.ts`?**
  _High betweenness centrality (0.183) - this node is a cross-community bridge._
- **Are the 80 inferred relationships involving `createAdminPb()` (e.g. with `audit/route.test.ts` and `register/route.test.ts`) actually correct?**
  _`createAdminPb()` has 80 INFERRED edges - model-reasoned connections that need verification._
- **What connects `RFC-4180`, `Org chain (campus, college, department, program)`, `Scoped list visibility (lib/org-visibility.ts)` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `lib/syllabus.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07704918032786885 - nodes in this community are weakly interconnected._
- **Why does `next` connect `next` to `lib/syllabus.ts`, `program-join-request/[id]/route.ts`, `createAdminPb`, `capabilities.ts`, `export/form18/route.ts`, `mockAuth`, `school-year/page.tsx`, `users.ts`, `syllabus-detail.tsx`, `lib/prospectus-duplicate.ts`, `forms/justification.ts`, `form18-panel.tsx`, `faculty/route.ts`, `notification/[id]/route.ts`, `reference-manager.tsx`, `lib/auth.ts`, `lib/dashboard.ts`, `getUserRoles`, `printable-forms.tsx`, `[code]/page.tsx`, `dashboard-manager.tsx`, `lib/review-queue.ts`, `signed-copy/route.test.ts`, `types/term.ts`, `vpaa/route.ts`, `formatDate`, `types/user.ts`, `form18-panel.tsx`, `[id]/form17/route.test.ts`, `lib/upload-limit.ts`, `dean/route.ts`, `prospectus-item/[id]/route.ts`, `department-head/route.ts`, `review/route.ts`, `term/[id]/route.ts`, `school-year/[id]/route.ts`, `app-shell.tsx`, `package.json`, `mock-auth.ts`, `types/form18.ts`, `proxy.ts`, `term/route.test.ts`, `dean/route.test.ts`, `dependencies`, `fdis-chair/route.test.ts`, `stand-in/route.test.ts`, `justifications/route.test.ts`, `prospectus/route.test.ts`, `register/page.tsx`, `validators/user.ts`, `duplicate/route.test.ts`, `next`, `syllabus-client.ts`, `formatDate`, `capabilities.ts`, `app-header.tsx`, `review/route.test.ts`, `program-reviewer/route.test.ts`, `vitest`, `citl-director/route.test.ts`, `department-head/route.test.ts`, `program-chair/route.test.ts`, `[id]/form18/route.test.ts`, `course/route.test.ts`, `requireUserMock`, `[id]/justification/route.ts`, `syllabus-reference/route.test.ts`, `resubmit/route.test.ts`, `stand-in-candidates/route.test.ts`, `notification/[id]/route.test.ts`, `user/route.test.ts`, `audit/page.tsx`, `course/page.tsx`, `co-author-candidates/route.test.ts`, `export/form17/route.test.ts`, `[versionId]/file/route.test.ts`, `school-year/[id]/route.test.ts`?**
  _High betweenness centrality (0.151) - this node is a cross-community bridge._
- **Are the 21 inferred relationships involving `handlePbError()` (e.g. with `Testing` and `Testing`) actually correct?**
  _`handlePbError()` has 21 INFERRED edges - model-reasoned connections that need verification._
- **Should `program-join-request/[id]/route.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10953058321479374 - nodes in this community are weakly interconnected._