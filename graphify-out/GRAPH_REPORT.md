# Graph Report - syllabusv2  (2026-10-28)

## Corpus Check
- 562 files · ~248,633 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 7 file(s) not represented in the graph (top: (none) 4, .ico 1, .css 1)

## Summary
- 2775 nodes · 8774 edges · 194 communities (126 shown, 68 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 209 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ac57336c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- prospectus-item-manager.tsx
- lib/roles.ts
- react
- [id]/justification/route.ts
- Route Test Helpers
- Project Docs & Domain Rules
- validators/user.ts
- course-modal.tsx
- Package & Tooling Config
- User Admin UI
- FDIS Chair Module
- Department/Program Scoping
- CITL Director Module
- pocketbase
- mockAuth
- Role Admin Pages
- pocketbase
- timeline/route.ts
- campus/[id]/route.ts
- [id]/form18/route.ts
- Department UI
- Faculty UI
- lib/prospectus-duplicate.ts
- capability-rules.ts
- syllabus/route.ts
- lib/auth.ts
- Department Head UI
- VPAA UI
- department-head/route.test.ts
- Program Chair UI
- pocketbase.ts
- dean-manager.tsx
- TypeScript Config
- Department Head API
- Program Chair API
- AppUser
- getUserRoles
- CITL Director List Tests
- syllabus-client.ts
- signed-copy/route.ts
- Prospectus List Tests
- program-reviewer-manager.tsx
- signed-copy/route.ts
- lead/route.ts
- syllabus/route.test.ts
- Course List Tests
- Duplicate Route Tests
- formatDate
- validators/course.ts
- Enhanced OBE Syllabus on `[FILL IN: course name]`
- School Year List Tests
- vitest
- citl-director/route.ts
- faculty/route.ts
- createAdminPb
- prospectus-client.ts
- school-year/[id]/route.ts
- syllabus-detail.tsx
- course/[id]/route.ts
- syllabus-modal.tsx
- PostCSS Config
- [pointId]/route.ts
- term-manager.tsx
- next
- faculty/route.test.ts
- users.ts
- vpaa/route.ts
- register/page.tsx
- reference-manager.tsx
- SyllabusResponse
- transition
- Syllabus Development Guidelines
- syllabus-workflow.ts
- prospectus-item/[id]/route.ts
- index.ts
- lib/review-queue.ts
- Phase 2: Syllabus submission
- export.ts
- syllabus-reference/route.test.ts
- co-authors-panel.tsx
- revise-workspace.tsx
- course/[id]/route.test.ts
- fdis-chair/route.test.ts
- Phase 3: Review engine and forms
- [pointId]/route.test.ts
- form17-panel.tsx
- Criteria
- lib/form17.ts
- form18-rules.ts
- 3. Letter Body (in order, top to bottom)
- program-join-request/route.test.ts
- CITL Syllabus Review Guide (Instructions for Part B)
- program-reviewer/route.ts
- types/user.ts
- form18-panel.tsx
- pocketbase
- types/form18.ts
- [code]/page.tsx
- [id]/form17/route.test.ts
- vpaa/route.test.ts
- review-points-history.tsx
- types/justification.ts
- review/route.test.ts
- prospectus-item/route.test.ts
- dean/route.test.ts
- validators/syllabus-stand-in.ts
- audit-phase-a.ts
- stand-in/route.test.ts
- [id]/justification/route.test.ts
- approval-code.ts
- [id]/form18/route.test.ts
- college/route.test.ts
- co-author-candidates/route.test.ts
- resubmit/route.test.ts
- stand-in-candidates/route.test.ts
- export/form17/route.test.ts
- justification-panel.tsx
- export/form18/route.test.ts
- school-year/[id]/route.test.ts
- program-chair/[id]/route.test.ts
- program/route.test.ts
- lead-candidates/route.test.ts
- term/[id]/route.test.ts
- [versionId]/file/route.test.ts
- forms/page.tsx
- [id]/review/page.tsx
- scope.test.ts

## God Nodes (most connected - your core abstractions)
1. `createAdminPb()` - 316 edges
2. `handlePbError()` - 216 edges
3. `requireUser()` - 201 edges
4. `next` - 196 edges
5. `vitest` - 126 edges
6. `mockAuth()` - 115 edges
7. `pocketbase` - 115 edges
8. `getUserRoles` - 109 edges
9. `react` - 99 edges
10. `@headlessui/react` - 87 edges

## Surprising Connections (you probably didn't know these)
- `Hub (`/syllabus/[id]`)` --references--> `SyllabusVersions()`  [INFERRED]
  docs/specs/phase-4-reviewer-experience.md → components/syllabus/syllabus-versions.tsx
- `Timeline` --references--> `resolveSyllabusAccess()`  [INFERRED]
  docs/specs/phase-4-reviewer-experience.md → lib/syllabus.ts
- `Definitions` --references--> `getSyllabusAccess()`  [INFERRED]
  docs/specs/phase-2-syllabus-submission.md → lib/syllabus.ts
- `Accepted 2026-10-27` --references--> `getSyllabusAccess()`  [INFERRED]
  docs/specs/phase-3-review-engine.md → lib/syllabus.ts
- `API` --references--> `requireUser()`  [INFERRED]
  docs/specs/phase-2-syllabus-submission.md → lib/auth.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Review engine flow (Phase 3)** — agents_syllabus_workflow_state_machine, agents_review_chain, syllabus_review_system_project_plan__v5__syllabus_statuses, syllabus_review_system_project_plan__v5__routing_readiness, agents_proxy_reviewer, agents_approval_reference [EXTRACTED 1.00]
- **University review forms supported by the system** — agents_form17, agents_form18_1, agents_justification_form, syllabus_review_system_project_plan__v5__enhanced_obe_syllabus, syllabus_review_system_project_plan__v5__form_definitions_versioning [EXTRACTED 1.00]
- **Phase A migration from role-based PERMISSIONS to derived-role capabilities** — project_context_users_role_field, project_context_permissions_map, agents_isadmin, agents_getuserroles, agents_capability_authorization [INFERRED 0.85]

## Communities (194 total, 68 thin omitted)

### Community 0 - "prospectus-item-manager.tsx"
Cohesion: 0.14
Nodes (29): DeleteProspectusItemDialog(), handleDelete(), DeleteProspectusItemDialogProps, itemProspectusLabel(), ModalState, ProspectusItemManager(), ProspectusItemManagerProps, prospectusLabel() (+21 more)

### Community 1 - "lib/roles.ts"
Cohesion: 0.13
Nodes (16): RouteContext, activeHolderName(), ensureBasedOn(), userNames(), CollegeRef, DepartmentRef, ProgramRef, unique() (+8 more)

### Community 2 - "react"
Cohesion: 0.13
Nodes (25): DeleteSchoolYearDialog(), handleDelete(), DeleteSchoolYearDialogProps, ModalState, SchoolYearManager(), SchoolYearManagerProps, SchoolYearModal(), handleSubmit() (+17 more)

### Community 3 - "[id]/justification/route.ts"
Cohesion: 0.15
Nodes (25): conflict(), GET(), load(), notFound(), PATCH(), PUT(), RouteContext, GET() (+17 more)

### Community 4 - "Route Test Helpers"
Cohesion: 0.06
Nodes (25): evaluateCapability(), listResult, mocks, base, listResult, mocks, approve, ctx (+17 more)

### Community 5 - "Project Docs & Domain Rules"
Cohesion: 0.06
Nodes (37): AGENTS.md (agent guidance), Approval reference code (SYL-<term>-<seq>-S<stage>), Capability-based authorization (can, requireUser, authorize, canSomewhere), Form 17 (OVPAA-F-INS-017) review checklist, Form 18-1 (CITL-F-018) review points, getUserRoles resolver (derived roles from assignment records), users.isAdmin (only stored role), Justification Form (missing lead signature) (+29 more)

### Community 6 - "validators/user.ts"
Cohesion: 0.11
Nodes (23): isDuplicateEmail(), POST(), metadata, RegisterPage(), RegisterPageProps, RegisterForm(), handleSubmit(), RegisterFormProps (+15 more)

### Community 7 - "course-modal.tsx"
Cohesion: 0.12
Nodes (25): CourseCombobox(), CourseComboboxProps, CourseOption, CourseManager(), CourseManagerProps, ModalState, CourseModal(), handleSubmit() (+17 more)

### Community 8 - "Package & Tooling Config"
Cohesion: 0.06
Nodes (39): eslintConfig, dependencies, @headlessui/react@^2.2.10, next@16.3.6, pocketbase@^0.28.1, react@19.2.8, react-dom@19.2.8, devDependencies (+31 more)

### Community 9 - "User Admin UI"
Cohesion: 0.15
Nodes (23): DeleteUserDialog(), handleDelete(), DeleteUserDialogProps, describeAccess(), KIND_LABELS, ModalState, UserManager(), UserManagerProps (+15 more)

### Community 10 - "FDIS Chair Module"
Cohesion: 0.12
Nodes (29): PATCH(), RouteContext, POST(), DeleteFdisChairDialog(), handleDelete(), DeleteFdisChairDialogProps, FdisChairManager(), toggleActive() (+21 more)

### Community 11 - "Department/Program Scoping"
Cohesion: 0.07
Nodes (39): DELETE(), GET(), PATCH(), RouteContext, GET(), POST(), DELETE(), GET() (+31 more)

### Community 12 - "CITL Director Module"
Cohesion: 0.18
Nodes (19): CitlDirectorManager(), toggleActive(), CitlDirectorManagerProps, CitlDirectorModal(), handleSubmit(), CitlDirectorModalProps, DeleteCitlDirectorDialog(), handleDelete() (+11 more)

### Community 13 - "pocketbase"
Cohesion: 0.11
Nodes (30): ProgramJoinRequestManager(), approve(), reloadAfterRowLeft(), ProgramJoinRequestManagerProps, RowDialog, STATUS_LABELS, STATUS_STYLES, ProgramJoinRequestModal() (+22 more)

### Community 14 - "mockAuth"
Cohesion: 0.05
Nodes (33): ctx, forbidden(), mocks, unauthorized(), ctx, forbidden(), mocks, unauthorized() (+25 more)

### Community 15 - "Role Admin Pages"
Cohesion: 0.07
Nodes (39): GET(), CitlDirectorPage(), metadata, CoursePage(), metadata, DeanPage(), metadata, DepartmentHeadPage() (+31 more)

### Community 16 - "pocketbase"
Cohesion: 0.16
Nodes (19): metadata, ProgramPage(), DeleteProgramDialog(), handleDelete(), DeleteProgramDialogProps, ModalState, ProgramManager(), Detail() (+11 more)

### Community 17 - "timeline/route.ts"
Cohesion: 0.16
Nodes (14): RouteContext, Batch, buildTimeline(), name(), Named, TimelineEvent, TimelineVersion, base (+6 more)

### Community 18 - "campus/[id]/route.ts"
Cohesion: 0.19
Nodes (11): DELETE(), GET(), PATCH(), RouteContext, GET(), POST(), parseCampusInput(), ParseResult (+3 more)

### Community 19 - "[id]/form18/route.ts"
Cohesion: 0.31
Nodes (9): RouteContext, listPoints(), loadForm18(), person(), POINT_EXPAND, toPointResponse(), CURRENT_FORM18, point (+1 more)

### Community 20 - "Department UI"
Cohesion: 0.14
Nodes (21): DepartmentPage(), metadata, DeleteDepartmentDialog(), handleDelete(), DeleteDepartmentDialogProps, DepartmentManager(), ModalState, DepartmentModal() (+13 more)

### Community 21 - "Faculty UI"
Cohesion: 0.19
Nodes (18): DeleteFacultyDialog(), handleDelete(), DeleteFacultyDialogProps, FacultyManager(), toggleActive(), FacultyManagerProps, FacultyModal(), handleSubmit() (+10 more)

### Community 22 - "lib/prospectus-duplicate.ts"
Cohesion: 0.11
Nodes (29): GET(), POST(), PATCH(), RouteContext, POST(), applyDuplicate(), batchSize(), DuplicatePlan (+21 more)

### Community 23 - "capability-rules.ts"
Cohesion: 0.06
Nodes (28): AppShell(), Sidebar(), SidebarProps, canAnywhere(), CAPABILITIES, Capability, Rule, RULES (+20 more)

### Community 24 - "syllabus/route.ts"
Cohesion: 0.07
Nodes (48): notDraft(), RouteContext, RouteContext, POST(), GET(), POST(), anyOf(), isListedForProgram() (+40 more)

### Community 25 - "lib/auth.ts"
Cohesion: 0.11
Nodes (18): POST(), POST(), metadata, PageProps, SyllabusDetailPage(), metadata, PageProps, SyllabusRevisePage() (+10 more)

### Community 26 - "Department Head UI"
Cohesion: 0.21
Nodes (17): DeleteDepartmentHeadDialog(), handleDelete(), DeleteDepartmentHeadDialogProps, DepartmentHeadManager(), toggleActive(), DepartmentHeadManagerProps, DepartmentHeadModal(), handleSubmit() (+9 more)

### Community 27 - "VPAA UI"
Cohesion: 0.18
Nodes (19): DeleteVpaaDialog(), handleDelete(), DeleteVpaaDialogProps, VpaaManager(), toggleActive(), VpaaManagerProps, VpaaModal(), handleSubmit() (+11 more)

### Community 28 - "department-head/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 29 - "Program Chair UI"
Cohesion: 0.17
Nodes (19): DeleteProgramChairDialog(), handleDelete(), DeleteProgramChairDialogProps, ProgramChairManager(), toggleActive(), ProgramChairManagerProps, ProgramChairModal(), handleSubmit() (+11 more)

### Community 30 - "pocketbase.ts"
Cohesion: 0.09
Nodes (29): DELETE(), GET(), PATCH(), RouteContext, GET(), POST(), DELETE(), PATCH() (+21 more)

### Community 31 - "dean-manager.tsx"
Cohesion: 0.06
Nodes (61): CampusPage(), metadata, CollegePage(), metadata, CampusManager(), formatDate(), ModalState, CampusModal() (+53 more)

### Community 32 - "TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 33 - "Department Head API"
Cohesion: 0.25
Nodes (13): PATCH(), RouteContext, POST(), departmentHasActiveHead(), isHeadOfDepartment(), listDepartmentsHeadedBy(), toDepartmentHeadResponse(), parseDepartmentHeadInput() (+5 more)

### Community 34 - "Program Chair API"
Cohesion: 0.26
Nodes (11): DELETE(), PATCH(), RouteContext, GET(), POST(), isChairOfProgram(), listProgramsChairedBy(), programHasActiveChair() (+3 more)

### Community 35 - "AppUser"
Cohesion: 0.12
Nodes (29): conflict(), notFound(), PUT(), RouteContext, Authors, canDesignate(), ChainHolders, holdersAt() (+21 more)

### Community 36 - "getUserRoles"
Cohesion: 0.11
Nodes (32): RouteContext, conflict(), POST(), RouteContext, notFound(), POST(), RouteContext, notFound() (+24 more)

### Community 37 - "CITL Director List Tests"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 38 - "syllabus-client.ts"
Cohesion: 0.10
Nodes (43): PrintableForms(), SignedCopyPanel(), handleReturn(), handleUpload(), run(), SignedCopyPanelProps, StandInPicker(), StandInPickerProps (+35 more)

### Community 39 - "signed-copy/route.ts"
Cohesion: 0.19
Nodes (14): notFound(), RouteContext, RouteContext, listSignedCopies(), SIGNED_COPY_EXPAND, signedCopyFileName(), toSignedCopyResponse(), ParseResult (+6 more)

### Community 40 - "Prospectus List Tests"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 41 - "program-reviewer-manager.tsx"
Cohesion: 0.16
Nodes (20): DeleteProgramReviewerDialog(), handleDelete(), DeleteProgramReviewerDialogProps, ProgramReviewerManager(), toggleActive(), ProgramReviewerManagerProps, ProgramReviewerModal(), handleSubmit() (+12 more)

### Community 42 - "signed-copy/route.ts"
Cohesion: 0.18
Nodes (10): notFound(), POST(), RouteContext, checkPdfUpload(), PdfCheck, ctx, mocks, pdf (+2 more)

### Community 43 - "lead/route.ts"
Cohesion: 0.28
Nodes (6): conflict(), RouteContext, parseLeadTransfer(), ParseResult, LeadTransferInput, MAX_CO_AUTHORS

### Community 44 - "syllabus/route.test.ts"
Cohesion: 0.33
Nodes (3): input, mocks, openTerm

### Community 45 - "Course List Tests"
Cohesion: 0.25
Nodes (5): base, forbidden(), listResult, mocks, rows

### Community 46 - "Duplicate Route Tests"
Cohesion: 0.25
Nodes (4): forbidden(), input, mocks, pb

### Community 47 - "formatDate"
Cohesion: 0.14
Nodes (23): Form17View(), Line(), Form181View(), PointsTable(), ACTING_AS, FormHeader(), SignatureLines(), by() (+15 more)

### Community 48 - "validators/course.ts"
Cohesion: 0.17
Nodes (15): FieldResult, MAX_CODE, MAX_HOURS, MAX_NOTE, MAX_TITLE, normalizeCourseCode(), NUMBER_FIELDS, parse() (+7 more)

### Community 49 - "Enhanced OBE Syllabus on `[FILL IN: course name]`"
Cohesion: 0.07
Nodes (27): About This File, BUKIDNON STATE UNIVERSITY, Course Information, Creating a syllabus, Differences between the two signatory blocks, Document Structure (in order), Enhanced OBE Syllabus on `[FILL IN: course name]`, Enhanced OBE Syllabus Template (BukSU) (+19 more)

### Community 50 - "School Year List Tests"
Cohesion: 0.29
Nodes (4): forbidden(), listResult, mocks, rows

### Community 51 - "vitest"
Cohesion: 0.07
Nodes (20): vitest, ctx, draft, mocks, ctx, get(), mocks, ctx (+12 more)

### Community 52 - "citl-director/route.ts"
Cohesion: 0.26
Nodes (12): DELETE(), PATCH(), RouteContext, GET(), POST(), getActiveCitlDirector(), hasActiveCitlDirector(), isCitlDirector() (+4 more)

### Community 53 - "faculty/route.ts"
Cohesion: 0.29
Nodes (9): DELETE(), PATCH(), RouteContext, GET(), POST(), toFacultyResponse(), parseFacultyInput(), parseFacultyUpdate() (+1 more)

### Community 54 - "createAdminPb"
Cohesion: 0.13
Nodes (50): DELETE(), GET(), DELETE(), GET(), DELETE(), notPending(), PATCH(), RouteContext (+42 more)

### Community 55 - "prospectus-client.ts"
Cohesion: 0.13
Nodes (28): DeleteProspectusDialog(), handleDelete(), DeleteProspectusDialogProps, DuplicateProspectusDialog(), handleConfirm(), DuplicateProspectusDialogProps, ItemList(), ModalState (+20 more)

### Community 56 - "school-year/[id]/route.ts"
Cohesion: 0.23
Nodes (11): DELETE(), GET(), PATCH(), RouteContext, GET(), POST(), DEPENDENTS, describeSchoolYearDependents() (+3 more)

### Community 57 - "syllabus-detail.tsx"
Cohesion: 0.11
Nodes (25): metadata, SyllabusPage(), SubmitSyllabusDialog(), handleSubmit(), SubmitSyllabusDialogProps, closed, decisionsByVersion(), DialogState (+17 more)

### Community 58 - "course/[id]/route.ts"
Cohesion: 0.25
Nodes (12): DELETE(), GET(), PATCH(), RouteContext, GET(), POST(), COURSE_EXPAND, DEPENDENTS (+4 more)

### Community 59 - "syllabus-modal.tsx"
Cohesion: 0.40
Nodes (3): AvailableCourseCombobox(), AvailableCourseComboboxProps, SyllabusModalProps

### Community 110 - "[pointId]/route.ts"
Cohesion: 0.10
Nodes (40): RouteContext, load(), Loaded, notFound(), RouteContext, POST(), RouteContext, conflict() (+32 more)

### Community 111 - "term-manager.tsx"
Cohesion: 0.19
Nodes (19): DeleteTermDialog(), handleDelete(), DeleteTermDialogProps, ModalState, TermManager(), toggleOpen(), TermManagerProps, TermModal() (+11 more)

### Community 112 - "next"
Cohesion: 0.07
Nodes (17): mocks, ctx, get(), mocks, ctx, draft, file, mocks (+9 more)

### Community 113 - "faculty/route.test.ts"
Cohesion: 0.05
Nodes (27): base, forbidden(), listResult, mocks, rows, unauthorized(), base, forbidden() (+19 more)

### Community 114 - "users.ts"
Cohesion: 0.12
Nodes (21): DELETE(), GET(), PATCH(), RouteContext, GET(), POST(), ASSIGNMENTS, hasOtherAdmin() (+13 more)

### Community 115 - "vpaa/route.ts"
Cohesion: 0.26
Nodes (12): DELETE(), PATCH(), RouteContext, GET(), POST(), parseVpaaInput(), parseVpaaUpdate(), getActiveVpaa() (+4 more)

### Community 118 - "register/page.tsx"
Cohesion: 0.29
Nodes (8): LoginPage(), LoginPageProps, metadata, LoginForm(), handleSubmit(), LoginFormProps, login(), safeRedirect()

### Community 119 - "reference-manager.tsx"
Cohesion: 0.11
Nodes (32): COPY, DialogAction, ReferenceActionDialog(), handleSubmit(), ReferenceActionDialogProps, ReferenceManager(), ReferenceManagerProps, ReferenceModal() (+24 more)

### Community 120 - "SyllabusResponse"
Cohesion: 0.24
Nodes (10): DeleteSyllabusDialog(), handleDelete(), DeleteSyllabusDialogProps, ReviewDecisionDialog(), handleConfirm(), ReviewDecisionDialogProps, deleteSyllabus(), reviewSyllabus() (+2 more)

### Community 121 - "transition"
Cohesion: 0.35
Nodes (11): API, Workflow (`lib/syllabus-workflow.ts`, pure), approve(), fail(), file(), giveBack(), rejectScan(), resubmit() (+3 more)

### Community 122 - "Syllabus Development Guidelines"
Cohesion: 0.08
Nodes (23): 10. Syllabus Table Format, 11. Writing Good Outcomes, 12. Syllabus Creation Workflow, 13. Institutional Review Process, 14. Validation Checklist, 15. Output Behavior for Claude, 1. Role and Scope, 2. Bloom's Taxonomy Reference (+15 more)

### Community 123 - "syllabus-workflow.ts"
Cohesion: 0.10
Nodes (22): ResubmitSyllabusDialogProps, ApproveEvent, CHAIN_ROLES, ChainRole, FileEvent, INITIAL_STATE, RejectScanEvent, ResubmitEvent (+14 more)

### Community 124 - "prospectus-item/[id]/route.ts"
Cohesion: 0.15
Nodes (26): PATCH(), RouteContext, GET(), POST(), PATCH(), RouteContext, GET(), POST() (+18 more)

### Community 125 - "index.ts"
Cohesion: 0.20
Nodes (14): FORM17_REV04, FORM18_REV01, CURRENT_FORM17, FORM17_REVISIONS, FORM18_REVISIONS, isLegendCode(), legendEntries(), ChecklistCriterion (+6 more)

### Community 126 - "lib/review-queue.ts"
Cohesion: 0.06
Nodes (56): GET(), ProgramFilterCombobox(), ProgramFilterComboboxProps, ProgramOption, age(), ReviewQueueManager(), stageLabel(), STATUS_OPTIONS (+48 more)

### Community 127 - "Phase 2: Syllabus submission"
Cohesion: 0.20
Nodes (9): API, Capabilities, Decisions (2026-10-26), Definitions, Out of scope, Phase 2: Syllabus submission, Schema changes (to apply to `pb_schema.json`), UI (+1 more)

### Community 128 - "export.ts"
Cohesion: 0.19
Nodes (15): Task plan (one reviewable change each, lint and tests green after each), VerifiedApproval, ApprovalStamp, buildForm17Export(), buildForm181Export(), ExportFormMeta, ExportSignature, ExportSyllabus (+7 more)

### Community 129 - "syllabus-reference/route.test.ts"
Cohesion: 0.25
Nodes (5): input, mocks, SCOPE, source, term

### Community 130 - "co-authors-panel.tsx"
Cohesion: 0.43
Nodes (6): CoAuthorPicker(), CoAuthorPickerProps, CoAuthorsPanel(), save(), CoAuthorsPanelProps, updateSyllabusCoAuthors()

### Community 131 - "revise-workspace.tsx"
Cohesion: 0.12
Nodes (25): PdfPane(), PdfPaneProps, ResubmitSyllabusDialog(), handleResubmit(), ReviewWorkspace(), Check(), lastReturnedVersionNo(), PointCard() (+17 more)

### Community 132 - "course/[id]/route.test.ts"
Cohesion: 0.33
Nodes (4): ctx, EXPAND, forbidden(), mocks

### Community 133 - "fdis-chair/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 134 - "Phase 3: Review engine and forms"
Cohesion: 0.14
Nodes (13): config, isTokenExpired(), proxy(), PUBLIC_PATHS, Accepted 2026-10-27, Capabilities, Decisions (2026-10-26), Justification (+5 more)

### Community 139 - "[pointId]/route.test.ts"
Cohesion: 0.17
Nodes (16): conflict(), DELETE(), PATCH(), reviewerCheck(), pointActionError(), ctx, EDIT, given() (+8 more)

### Community 140 - "form17-panel.tsx"
Cohesion: 0.15
Nodes (18): changed(), Draft, draftFrom(), Form17Panel(), handleSave(), Form17PanelProps, checklistCriteria(), saveForm17() (+10 more)

### Community 141 - "Criteria"
Cohesion: 0.12
Nodes (16): A. Preliminaries, B. Vision, Mission, Goals, Objectives, and Outcomes, C. Course Content, Closing Section, Criteria, D. Assessment, E. Learning Modality and Methods, F. Resources, Required Readings, and References (+8 more)

### Community 142 - "lib/form17.ts"
Cohesion: 0.16
Nodes (19): GET(), notFound(), RouteContext, Batch, copyForm17(), form17Facts(), listForm17Answers(), loadForm17() (+11 more)

### Community 143 - "form18-rules.ts"
Cohesion: 0.31
Nodes (6): Point, PointAction, pointFacts, Routed, inReview(), PointStatus

### Community 144 - "3. Letter Body (in order, top to bottom)"
Cohesion: 0.12
Nodes (15): 1. Document Overview, 2. Letterhead (fixed, centered at top), 3.1 Date — VARIABLE, 3.2 Recipient block — FIXED, 3.3 Salutation — FIXED, 3.4 Opening paragraph — PARTLY VARIABLE, 3.5 Table — VARIABLE (see Section 4), 3.6 Closing — FIXED (+7 more)

### Community 145 - "program-join-request/route.test.ts"
Cohesion: 0.22
Nodes (5): base, data, listResult, mocks, rows

### Community 146 - "CITL Syllabus Review Guide (Instructions for Part B)"
Cohesion: 0.14
Nodes (13): A. Format and House Style, B. Alignment (Coherence and Logical Connection Between Learning Plan Components), C. Use of Behavioral Verbs (Bloom's Taxonomy), CITL Syllabus Review Guide (Instructions for Part B), CITL Syllabus Review: Suggestions and Action Taken (Form 18-1), D. Gradation of COs and SLOs, E. Supplementary Documentation, F. Inclusion of Prescribed Institutional Forms (+5 more)

### Community 147 - "program-reviewer/route.ts"
Cohesion: 0.32
Nodes (10): DELETE(), PATCH(), RouteContext, GET(), POST(), programHasActiveReviewer(), toProgramReviewerResponse(), parseProgramReviewerInput() (+2 more)

### Community 148 - "types/user.ts"
Cohesion: 0.17
Nodes (14): metadata, RootLayout(), AppHeader(), getInitials(), HeaderAuth(), handleLogout(), HeaderAuthProps, LoginInput (+6 more)

### Community 149 - "form18-panel.tsx"
Cohesion: 0.21
Nodes (12): Form18Panel(), run(), Form18PanelProps, NewPointForm(), PointForm(), PointFormProps, PointRow(), PointRowProps (+4 more)

### Community 150 - "pocketbase"
Cohesion: 0.19
Nodes (19): ReviewWithExpand, isFacultyOfProgram(), applyJoinRequestDecision(), pocketbase, request, reviewed, Course, Faculty (+11 more)

### Community 151 - "types/form18.ts"
Cohesion: 0.26
Nodes (11): isObject(), parsePointInput(), parsePointUpdate(), ParseResult, text(), Form18Response, MAX_PAGE_NUMBER, MAX_POINT_TEXT (+3 more)

### Community 152 - "[code]/page.tsx"
Cohesion: 0.40
Nodes (5): ACTING_AS_LABELS, metadata, PageProps, Row(), VerifyApprovalPage()

### Community 153 - "[id]/form17/route.test.ts"
Cohesion: 0.18
Nodes (12): GET(), notFound(), PUT(), ctx, FORM, get(), HOLDERS, INPUT (+4 more)

### Community 154 - "vpaa/route.test.ts"
Cohesion: 0.22
Nodes (6): base, forbidden(), listResult, mocks, rows, unauthorized()

### Community 155 - "review-points-history.tsx"
Cohesion: 0.29
Nodes (7): Group, groupPoints(), ReviewPointsHistory(), ReviewPointsHistoryProps, STATUS_LABELS, STATUS_STYLES, Form18PointResponse

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

### Community 160 - "validators/syllabus-stand-in.ts"
Cohesion: 0.43
Nodes (5): FINAL_STAGE, isStage(), ParseResult, parseStandInInput(), StandInInput

### Community 161 - "audit-phase-a.ts"
Cohesion: 0.33
Nodes (6): AssignmentRow, ASSIGNMENTS, main(), requireEnv(), UNASSIGNED_FILTER, UserRow

### Community 162 - "stand-in/route.test.ts"
Cohesion: 0.22
Nodes (4): ctx, HOLDERS, ITEMS, mocks

### Community 163 - "[id]/justification/route.test.ts"
Cohesion: 0.29
Nodes (4): ctx, ENTRIES, mocks, RESPONSE

### Community 164 - "approval-code.ts"
Cohesion: 0.26
Nodes (9): approvalCode(), ApprovalCodeParts, parseApprovalCode(), SEMESTER_CODES, validStage(), findApproval(), fakePb(), filter() (+1 more)

### Community 165 - "[id]/form18/route.test.ts"
Cohesion: 0.20
Nodes (8): notFound(), POST(), pointCodeError(), ctx, HOLDERS, LATEST, mocks, post()

### Community 166 - "college/route.test.ts"
Cohesion: 0.33
Nodes (3): base, listResult, mocks

### Community 167 - "co-author-candidates/route.test.ts"
Cohesion: 0.33
Nodes (4): candidates, ctx, mocks, syllabus

### Community 168 - "resubmit/route.test.ts"
Cohesion: 0.29
Nodes (5): ctx, HOLDERS, mocks, resubmit(), returned

### Community 169 - "stand-in-candidates/route.test.ts"
Cohesion: 0.29
Nodes (6): candidates, ctx, get(), HOLDERS, mocks, syllabus

### Community 170 - "export/form17/route.test.ts"
Cohesion: 0.33
Nodes (5): ctx, form17(), mocks, SYLLABUS, VERSION

### Community 171 - "justification-panel.tsx"
Cohesion: 0.19
Nodes (15): JustificationLetterView(), JustificationPanel(), adopt(), handlePreview(), handleSave(), run(), STATUS_LABELS, buildJustificationLetter() (+7 more)

### Community 172 - "export/form18/route.test.ts"
Cohesion: 0.33
Nodes (5): ctx, form18(), mocks, SYLLABUS, VERSION

### Community 173 - "school-year/[id]/route.test.ts"
Cohesion: 0.40
Nodes (3): ctx, forbidden(), mocks

### Community 174 - "program-chair/[id]/route.test.ts"
Cohesion: 0.33
Nodes (4): ctx, forbidden(), mocks, unauthorized()

### Community 175 - "program/route.test.ts"
Cohesion: 0.33
Nodes (3): base, listResult, mocks

### Community 176 - "lead-candidates/route.test.ts"
Cohesion: 0.33
Nodes (5): candidates, ctx, get(), mocks, syllabus

### Community 177 - "term/[id]/route.test.ts"
Cohesion: 0.40
Nodes (3): ctx, forbidden(), mocks

### Community 178 - "[versionId]/file/route.test.ts"
Cohesion: 0.33
Nodes (4): ctx, mocks, syllabus, version

### Community 190 - "forms/page.tsx"
Cohesion: 0.50
Nodes (3): metadata, PageProps, SyllabusFormsPage()

### Community 191 - "[id]/review/page.tsx"
Cohesion: 0.50
Nodes (3): metadata, PageProps, SyllabusReviewPage()

### Community 192 - "scope.test.ts"
Cohesion: 0.50
Nodes (3): fullChain, mocks, records

## Knowledge Gaps
- **9 isolated node(s):** `Org chain (campus, college, department, program)`, `Scoped list visibility (lib/org-visibility.ts)`, `Plain CRUD entities (campus, college, department, program, user)`, `Advisory PDF checks (informational only)`, `Prospectus migration (free-text items to courses, school_year to relation)` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 983 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **68 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `pocketbase` connect `pocketbase` to `prospectus-item-manager.tsx`, `lib/roles.ts`, `react`, `revise-workspace.tsx`, `validators/user.ts`, `course-modal.tsx`, `Package & Tooling Config`, `User Admin UI`, `FDIS Chair Module`, `CITL Director Module`, `pocketbase`, `lib/form17.ts`, `form17-panel.tsx`, `pocketbase`, `timeline/route.ts`, `campus/[id]/route.ts`, `[id]/form18/route.ts`, `Department UI`, `Faculty UI`, `lib/prospectus-duplicate.ts`, `types/form18.ts`, `syllabus/route.ts`, `lib/auth.ts`, `Department Head UI`, `VPAA UI`, `types/justification.ts`, `Program Chair UI`, `pocketbase.ts`, `dean-manager.tsx`, `audit-phase-a.ts`, `Department Head API`, `AppUser`, `getUserRoles`, `approval-code.ts`, `syllabus-client.ts`, `signed-copy/route.ts`, `program-reviewer-manager.tsx`, `prospectus-client.ts`, `syllabus-detail.tsx`, `[pointId]/route.ts`, `term-manager.tsx`, `next`, `reference-manager.tsx`, `lib/review-queue.ts`?**
  _High betweenness centrality (0.156) - this node is a cross-community bridge._
- **Are the 70 inferred relationships involving `createAdminPb()` (e.g. with `register/route.test.ts` and `campus/[id]/route.test.ts`) actually correct?**
  _`createAdminPb()` has 70 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Org chain (campus, college, department, program)`, `Scoped list visibility (lib/org-visibility.ts)`, `Plain CRUD entities (campus, college, department, program, user)` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `prospectus-item-manager.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.1380952380952381 - nodes in this community are weakly interconnected._
- **Why does `next` connect `Role Admin Pages` to `lib/roles.ts`, `[id]/justification/route.ts`, `Route Test Helpers`, `validators/user.ts`, `Package & Tooling Config`, `FDIS Chair Module`, `Department/Program Scoping`, `mockAuth`, `pocketbase`, `timeline/route.ts`, `campus/[id]/route.ts`, `[id]/form18/route.ts`, `Department UI`, `lib/prospectus-duplicate.ts`, `capability-rules.ts`, `syllabus/route.ts`, `lib/auth.ts`, `department-head/route.test.ts`, `pocketbase.ts`, `dean-manager.tsx`, `Department Head API`, `Program Chair API`, `AppUser`, `getUserRoles`, `CITL Director List Tests`, `signed-copy/route.ts`, `Prospectus List Tests`, `signed-copy/route.ts`, `lead/route.ts`, `syllabus/route.test.ts`, `Course List Tests`, `Duplicate Route Tests`, `formatDate`, `School Year List Tests`, `vitest`, `citl-director/route.ts`, `faculty/route.ts`, `createAdminPb`, `school-year/[id]/route.ts`, `syllabus-detail.tsx`, `course/[id]/route.ts`, `[pointId]/route.ts`, `next`, `faculty/route.test.ts`, `users.ts`, `vpaa/route.ts`, `register/page.tsx`, `reference-manager.tsx`, `prospectus-item/[id]/route.ts`, `lib/review-queue.ts`, `syllabus-reference/route.test.ts`, `revise-workspace.tsx`, `course/[id]/route.test.ts`, `fdis-chair/route.test.ts`, `Phase 3: Review engine and forms`, `[pointId]/route.test.ts`, `lib/form17.ts`, `program-join-request/route.test.ts`, `program-reviewer/route.ts`, `types/user.ts`, `[code]/page.tsx`, `[id]/form17/route.test.ts`, `vpaa/route.test.ts`, `review/route.test.ts`, `prospectus-item/route.test.ts`, `dean/route.test.ts`, `stand-in/route.test.ts`, `[id]/justification/route.test.ts`, `[id]/form18/route.test.ts`, `college/route.test.ts`, `co-author-candidates/route.test.ts`, `resubmit/route.test.ts`, `stand-in-candidates/route.test.ts`, `export/form17/route.test.ts`, `export/form18/route.test.ts`, `school-year/[id]/route.test.ts`, `program-chair/[id]/route.test.ts`, `program/route.test.ts`, `lead-candidates/route.test.ts`, `term/[id]/route.test.ts`, `[versionId]/file/route.test.ts`, `forms/page.tsx`, `[id]/review/page.tsx`?**
  _High betweenness centrality (0.149) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `handlePbError()` (e.g. with `Testing` and `review-queue/route.test.ts`) actually correct?**
  _`handlePbError()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **Should `lib/roles.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12666666666666668 - nodes in this community are weakly interconnected._