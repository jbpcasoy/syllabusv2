# End-to-end scenario catalog

Every user-facing scenario the Playwright suite must cover, grouped by the spec file it belongs in. Walkthrough part (`docs/feature-walkthrough.md`) in brackets. Plan: `docs/specs/e2e-coverage-plan.md`.

Tag each test with the IDs it covers, in its title: `test("return needs a point @REV-07", ...)`. `npm run test:e2e:coverage` lists the IDs with no test yet, and fails on a tag that isn't in this file. Add `--strict` to also fail on uncovered IDs.

Spec file names below are targets; the existing numbered specs (`01-full-chain.spec.ts`, ...) keep their names until their area is built out.

### `auth.spec.ts` [Part 3, Part 10]
- AUTH-01 Register with a non-institutional domain is refused with a message.
- AUTH-02 Register with `@buksu.edu.ph` succeeds and a verification email arrives; sign-in refused while unverified.
- AUTH-02b Signing in while unverified shows the "We sent a new link" message and a second email arrives.
- AUTH-02c Following the emailed link verifies the account (PocketBase's confirmation page); signing in through the app then works.
- AUTH-02d A tampered link doesn't verify.
- AUTH-03 Verified user signs in through the form, lands on the right page; `?next=` is honoured.
- AUTH-04 Wrong password shows an alert; no account enumeration in the message.
- AUTH-05 Sign out clears the session; protected pages redirect to `/login?next=…`.
- AUTH-06 Every protected page redirects when signed out (data-driven over `NAV_ITEMS` + syllabus subpages).

### `navigation.spec.ts` [Part 2, Part 9]
- NAV-01 For each role (admin, VPAA, FDIS, CITL, dean, head, chair, reviewer, faculty, unassigned, stand-in only), the nav shows exactly the expected items. One data-driven test per role, expected lists written out by hand (not derived from `getNavItems`, or the test proves nothing).
- NAV-02 A direct URL to a capability-gated page the role lacks is refused (`/user`, `/audit`, `/dashboard` for faculty).
- NAV-03 A stand-in-only user sees Review Queue.

### `managers.spec.ts` — shared UI conventions [AGENTS.md UI conventions]
Data-driven over every manager page (campus, college, dean, department, department head, program, program chair, program reviewer, school year and term, course, prospectus, prospectus item, VPAA, FDIS chair, CITL director, faculty, join requests, user, audit, syllabus, syllabus reference, review queue):
- MGR-01 Debounced search narrows the table (one request after typing stops).
- MGR-02 Changing a filter resets to page 1.
- MGR-03 Pagination at 10 rows per page. (School years and terms have no pagination bar.)
- MGR-04 A failed list request shows the Retry banner; Retry recovers.
- MGR-05 The table dims while loading.
- MGR-06 Create/edit modal: validation error shown as an alert; reopening after cancel shows a clean form (remount key).
- MGR-07 Modal and delete dialog can't be closed (Esc, backdrop, Cancel) while saving.
- MGR-08 Delete dialog removes the row; a delete the server refuses (the record is still referenced) shows the reason in the dialog and keeps the row.
- MGR-09 Large option lists use the server-searched Combobox (course pickers).

### `org-setup.spec.ts` [Parts 1–2]
- ORG-01 Admin creates campus; VPAA creates colleges; VPAA assigns dean, FDIS chair, CITL director.
- ORG-02 Second active VPAA / FDIS / CITL / program reviewer → 409 message (the spec restores the original holders afterwards).
- ORG-03 Dean creates a department in their college; refused in another college.
- ORG-04 Dean assigns a department head; creates programs.
- ORG-05 Department head edits own department name; parent select locked; can't create a program.
- ORG-06 Department head assigns program chair and program reviewer in their department only.
- ORG-07 VPAA can't reach admin pages; `/course` is read-only (no create/edit/delete controls).
- ORG-08 Scoped lists: dean, head, chair see their scope in assignment lists; org lists fully visible to an unassigned user.

### `curriculum.spec.ts` [Part 1–2]
- CUR-01 Admin creates school years and terms; opens and closes a term.
- CUR-02 Admin creates courses with an owning program; GE course owned by GE program.
- CUR-03 Prospectus create, add items, publish; unpublished prospectus doesn't offer courses.
- CUR-04 Duplicate prospectus into the next school year, add an item, publish.
- CUR-05 School year label and term semester locked once a syllabus there holds a `ref_seq` (message shown).
- CUR-06 Term review days and submission deadline editable by admin.

### `membership.spec.ts` [Part 2–3]
- MEM-01 Chair adds faculty to own program; refused for another program.
- MEM-02 User requests to join with a note; duplicate pending refused; withdraw; request again.
- MEM-03 Chair rejects with a reason (reason required); requester sees it.
- MEM-04 Chair approves; user appears in `/faculty` (reactivation of an inactive record too).
- MEM-05 Requester can't decide own request; department head who chairs the program can approve own, never reject.

### `syllabus-authoring.spec.ts` [Part 4–5, Part 10]
- SYL-01 Create draft via modal (term, program, course combobox).
- SYL-02 Course not in the published prospectus, or closed term, isn't offered / is refused.
- SYL-03 Non-faculty (e.g. FDIS chair) can't create.
- SYL-04 Duplicate (course, term, program) refused.
- SYL-05 Upload a version; fake PDF (wrong magic bytes) refused; oversize refused.
- SYL-06 Submit disabled with no PDF; submit dialog; status Submitted.
- SYL-07 Submit refused when a chain stage has no active holder (message names the gap).
- SYL-08 "Start from last year's syllabus" banner when `based_on` exists; creates a version from it.
- SYL-09 Co-authors: add active faculty; non-faculty refused; co-author view is read-only (no upload/submit).
- SYL-10 Co-authors editable only in draft or returned; while returned, a stand-in or decider can't be added.
- SYL-11 Delete a draft; delete not offered once submitted.
- SYL-12 Versions list, PDF opens in viewer through the scoped route.

### `review-chain.spec.ts` [Part 4–5]
- REV-01 Full chain: stages 1–5 approve from their queues (existing `01-full-chain`, rebuilt on a world).
- REV-02 Queue lists only syllabi at the user's stage; Review link opens the workspace.
- REV-03 Approving at a stage that isn't yours isn't offered; direct POST refused (one UI check).
- REV-04 Form 17: every criterion required; "No" requires remarks; "No" blocks Approve.
- REV-05 Form 17 edits by a later reviewer are logged and shown in history.
- REV-06 Form 18-1 Part A (stages 1–2) without legend; Part B (3–5) with legend code.
- REV-07 Return with no points refused; return with points works.
- REV-08 Approve dialog shows `SYL-…-S<n>` code.
- REV-09 Admin opening the workspace can't review.
- REV-10 Reviewer who leads or co-authors is refused in the workspace.

### `return-revise.spec.ts` [Part 5]
- RET-01 Returned syllabus: revise workspace; Resubmit disabled until a new version is uploaded and every open point answered.
- RET-02 Resubmit resumes at the returning stage (stage 1 case, stage 3 case).
- RET-03 Reviewer marks points resolved/unresolved; unresolved blocks Approve; return without a new point re-opens only unresolved points.
- RET-04 A return only re-opens points from the returning stage; earlier stages' points stay resolved.
- RET-05 Review points history shows every round.

### `stand-ins.spec.ts` [Part 6]
- STA-01 Conflicted reviewer: submit dialog warns; submit succeeds; page shows "Waiting for a proxy".
- STA-02 `/review` "Needs a proxy" panel for dean; limited view (header, co-authors, stand-ins only).
- STA-03 Conflicted reviewer is notified, workspace refuses and shows proxy picker.
- STA-04 Proxy must be active program faculty; lead/co-author refused; valid proxy accepted.
- STA-05 Proxy is notified, sees it "as proxy" in their queue and workspace, and approves; the conflicted reviewer's queue doesn't list it.
- STA-06 Later-stage holder designates a stand-in for a conflicted later stage.

### `approval-filing.spec.ts` [Part 5]
- FIL-01 Verify page: valid code shows course, stage, reviewer, date; fake code shows not found.
- FIL-02 Print view `/syllabus/[id]/forms` shows Form 17, Form 18-1, reference codes, signature lines.
- FIL-03 Timeline lists every submit, return, resubmit, approve; versions show decisions.
- FIL-04 Lead uploads signed scan → Filed.
- FIL-05 Each allowed role can return the scan as invalid with a reason (one in UI, e.g. dean) → Approved; returned scan still listed; non-allowed role sees no control.
- FIL-06 Re-upload → Filed again.
- FIL-07 Form data for the print views (Form 17, Form 18-1, justification) is served only to people with access. (Printing uses the browser; there are no file downloads.)
- FIL-08 Filing notifies every chain holder (`scan_filed`), and the dean reaches the filed syllabus from the notification and from the Review Queue's **Filed (check the scan)** status, not by URL.
- FIL-09 Returning the scan as invalid notifies the lead (`scan_returned`) with the reason and a link to the syllabus.

### `justification.spec.ts` [Part 5]
- JUS-01 Panel appears only when `based_on` exists and after approval.
- JUS-02 Entry needs a reason; save; letter preview addressed to the active CITL director.
- JUS-03 Upload signed letter locks entries.
- JUS-04 Reviewer or higher returns it with a reason; lead re-uploads.
- JUS-06 Each upload of the signed letter, the re-upload included, notifies every chain holder (`justification_submitted`) with a link to the syllabus; the authors are not notified.
- JUS-07 Returning the signed letter notifies only the lead (`justification_returned`) with the reason and a link to the syllabus.
- JUS-05 Never blocks filing; co-author can view; the program chair never sees it (the referencer case is REF-03).

### `references.spec.ts` [Part 7]
- REF-01 Chair requests a reference with a note; duplicate refused; withdraw; request again.
- REF-02 Source lead is notified and approves from the References panel (self-approval case too).
- REF-03 Referencing chair and faculty see the read-only banner, can view PDFs, no controls, no justification.
- REF-04 Source lead revokes with a reason; referencing chair notified with link to `/syllabus-reference`.
- REF-05 Admin rejects and revokes on the lead's behalf.
- REF-06 Referencing program can't also create its own syllabus for that course and term.
- REF-07 Withdraw-pending and stop-approved notify the source lead.

### `lead-transfer.spec.ts` [Part 8]
- LEAD-01 Chair transfers lead; only the new lead sees edit controls.
- LEAD-02 Admin (not chair) transfer requires a 10+ character reason; marked override in audit (existing `03-lead-override`).

### `notifications.spec.ts` [Part 5, 9]
- NOT-01 Bell badge count after submit, return, approve, resubmit (per recipient).
- NOT-02 `/notifications` list, open one (link target correct), mark one read, mark all read.
- NOT-03 Stand-in and proxy notifications only when their stage is waiting.
- NOT-04 After a return, the lead receives the email: subject and body name the course, the link is absolute and opens the syllabus. Row goes `pending → sending → sent`.
- NOT-05 A notification for an unverified recipient ends `skipped` and no email is sent.
- NOT-06 With the catcher refusing connections, rows end `failed` after retries while the in-app bell still shows them (may be left to a hook unit check if it proves slow).

### `dashboard.spec.ts` [Part 9]
- DSH-01 VPAA sees everything incl. justification panel; CSV export on each panel downloads and has the expected header row.
- DSH-02 Dean sees own college only; head and chair see own scope, no justification panel.
- DSH-03 Faculty: no Dashboard link, direct URL refused.
- DSH-04 Scope filters narrow counts.
- DSH-05 Review overdue badge after backdating `status_changed_at` past `review_days`.
- DSH-06 Submission overdue: no syllabus, draft only, or reference to a draft, after the deadline.

### `undo-approval.spec.ts`
- UND-01 Admin undoes the Dean's then the Program Reviewer's approval, one stage at a time, each with a 10+ character reason: timeline keeps each approval and adds "Approval undone" after it; audit rows marked override; lead and the stage's reviewer notified; undone code stops verifying; stage 1 re-approves with the same code.
- UND-02 Admin undoes the final VPAA approval (approved → waiting on VPAA); VPAA approves again.
- UND-03 VPAA, dean and lead see no undo control; a direct POST is refused (403).

### `audit.spec.ts` [Part 9]
- AUD-01 Admin filters by syllabus; status changes, uploads and override listed; override marked.
- AUD-02 VPAA refused.

### `limits-and-files.spec.ts` [Part 9–10]
- LIM-01 21st upload in an hour shows a 429 message with retry time (existing `04-upload-limit`, own world user).
- LIM-02 PDF route for a syllabus without access returns 404; no S3 or PocketBase file URL appears in any page HTML or network response for that page.

### `a11y.spec.ts` [Part 11]
- A11Y-01 axe (WCAG 2.2 AA, zero serious/critical) on **every** page, each opened by a role that can use it, in its main states (empty, with data, modal open, error banner).
- A11Y-02 Keyboard-only return and resubmit: Tab order, visible focus, arrows in comboboxes and radio groups, Esc closes dialogs except while saving.
- A11Y-03 Every error message is in a `role="alert"` region (checked as each form refuses).
- A11Y-04 200% zoom (1280×720 viewport at `deviceScaleFactor` 1 with CSS zoom, or 640px-wide viewport): no horizontal clipping on `/review`, review workspace, `/dashboard`.

Screen-reader announcement (NVDA/Narrator) stays manual; note it in the walkthrough.
