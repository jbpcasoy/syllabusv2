# Feature walkthrough

A hands-on script that uses every feature of the syllabus review system once, in an order where each step sets up the next. Allow about two to three hours. Tick the boxes as you go.

Use a fresh dev PocketBase. Some steps can't be undone: filed syllabi and audit rows are never deleted.

---

## 0. Before you start

1. Start PocketBase with `npm run pb`, then start the app with `npm run dev` in a second terminal.
2. Open the PocketBase dashboard at `http://127.0.0.1:8090/_/` and sign in as superuser.
3. **First admin:** in `users`, create one record with `verified = true` and `isAdmin = true`. Every other account is created in the app.
4. **Email (optional):** to receive real mail, set SMTP under PocketBase *Settings → Mail* and `APP_URL=http://localhost:3000` in PocketBase's environment. Without SMTP, notification rows end `failed` but the in-app bell still works. Self-registration verification (Part 3) then needs a manual flip of `verified` in the dashboard.
5. Prepare some PDFs: `syllabus-v1.pdf`, `syllabus-v2.pdf`, `signed.pdf`, `letter.pdf`. Any real PDF works. Also prepare one fake file, a `.txt` renamed to `.pdf`, for the rejection test.
6. Use one browser profile per person, or a private window, so you can stay signed in as two people at once.

## 1. Cast

Give every account the same password. All emails must be on `@buksu.edu.ph`.

| Key | Name | Will hold |
| --- | --- | --- |
| `admin` | Ada Admin | `isAdmin` (created in step 0) |
| `vpaa` | Vic VPAA | VPAA |
| `fdis` | Fe FDIS | FDIS Chair |
| `citl` | Cy CITL | CITL Director |
| `dean` | Dee Dean | Dean, College of Technologies |
| `head` | Hal Head | Department Head, Dept. of IT |
| `chair` | Cha Chair | Program Chair, BSIT |
| `rev` | Rae Reviewer | Program Reviewer, BSIT (also BSIT faculty, for the proxy test) |
| `carla` | Carla Prev | BSIT faculty, last year's author |
| `ana` | Ana Lead | BSIT faculty, this year's lead |
| `ben` | Ben Coauthor | BSIT faculty, co-author and proxy |
| `nchair` | Nia Nursing | Program Chair, BS Nursing |
| `newbie` | Nico New | Self-registers in Part 3 |
| `spam` | Sam Spam | Throwaway account for the upload-limit test |

---

## Part 1 — Admin setup (as `admin`)

- [ ] **Users** (`/user`): create everyone in the cast except `newbie`. Users created by an admin start verified.
- [ ] **Campus** (`/campus`): create *Main Campus*.
- [ ] **VPAA** (`/vpaa`): assign `vpaa`. Then try to assign a second active VPAA. You should get a **409** message (single-active rule).
- [ ] **School years and terms** (`/school-year`): create `2025-2026` and `2026-2027`. Give each a *First Semester* term, set to **open**. Leave review days at `0` for now.

## Part 2 — Org chain and roles

As `vpaa`:
- [ ] **College** (`/college`): create *College of Technologies* (COT) on Main Campus, plus *College of Nursing* (CON).
- [ ] **Dean** (`/dean`): assign `dean` to COT.
- [ ] **FDIS Chair** (`/fdis-chair`) and **CITL Director** (`/citl-director`): assign `fdis` and `citl`.
- [ ] Check that `vpaa` can't reach admin-only features: `/user` is hidden from the menu and refused, and `/course` opens read-only with no create, edit or delete controls.

As `dean`:
- [ ] **Department** (`/department`): create *Dept. of IT* under COT. Try to create one under CON. It should be refused, because a dean manages only their own college.
- [ ] **Department Head** (`/department-head`): assign `head` to Dept. of IT.

- [ ] **Programs** (`/program`): create *BS Information Technology* (BSIT) and *General Education* (GE) under Dept. of IT.

As `head`:
- [ ] Edit the Dept. of IT name (allowed: a department head edits their own department). Try to create a program. It should be refused.
- [ ] **Program Chair** (`/program-chair`): assign `chair` to BSIT.
- [ ] **Program Reviewer** (`/program-reviewer`): assign `rev` to BSIT. A second active reviewer for BSIT should get a 409.

As `vpaa` (or `admin`):
- [ ] Create a department and the *BS Nursing* (BSN) program under CON, then assign `nchair` as Program Chair of BSN.

As `admin`, set up the curriculum:
- [ ] **Courses** (`/course`): create `IT 101` and `IT 102` (owned by BSIT) and `GE 101` (owned by GE).
- [ ] **Prospectus** (`/prospectus`) and **Prospectus Items** (`/prospectus-item`): create the BSIT prospectus for `2025-2026` listing IT 101 and IT 102 (First Semester, First Year), then **publish** it.
- [ ] **Duplicate prospectus**: duplicate it into `2026-2027`, add GE 101, and publish.
- [ ] Create a BSN prospectus for `2026-2027` that lists GE 101, and publish it.

As `chair`:
- [ ] **Faculty** (`/faculty`): add `carla`, `ana`, `ben` and `rev` to BSIT.
- [ ] Check that `chair` can't add faculty to BSN.

## Part 3 — Registration and joining a program

- [ ] Sign out, then go to `/register` and try `nico@gmail.com`. It should be refused (only the institutional domain is allowed).
- [ ] Register `newbie` with a `@buksu.edu.ph` address. Sign-in is refused until the email is verified: use the link in the email, or flip `verified` in the dashboard.
- [ ] As `newbie`, use **Request to join a program**, choose BSIT and add a note. A second request for BSIT should be refused (one pending request per program).
- [ ] Withdraw the request, then file it again.
- [ ] As `chair` (`/program-join-request`), **Reject** it with a reason. Have `newbie` request again, then approve. `newbie` now appears in `/faculty`.

---

## Part 4 — Last year's syllabus (sets up later tests)

This round gives Part 5 a previous approved syllabus to build on.

- [ ] As `carla`, go to `/syllabus` and click **New syllabus**. Choose term *2025-2026 · First Semester*, program BSIT and course IT 101, then click **Create draft**.
- [ ] **Upload new version**: first try the fake `.txt` PDF. It should be rejected by the magic-byte check. Then upload `syllabus-v1.pdf` and click **Submit for review**.
- [ ] Approve it at all five stages: `rev`, then `dean`, `fdis`, `citl` and `vpaa`. Each one opens `/review`, clicks **Review**, and approves. At stage 1, answer every Form 17 item **Yes** and click **Save checklist** first.
- [ ] As `carla`, upload `signed.pdf` under *Signed copy* and click **Upload and file**. The status becomes **Filed**.
- [ ] As `admin`, close the 2025-2026 term.

## Part 5 — The main review cycle (IT 101, this year)

**Create and prepare** (as `ana`):
- [ ] Create a draft for IT 101 in *2026-2027 · First Semester*. A banner offers **Start from last year's syllabus** (this is `based_on`). Click it, then also upload `syllabus-v2.pdf` so you have two versions.
- [ ] **Co-authors**: add `ben`. Try to add someone who isn't BSIT faculty, such as `nchair`. It should be refused.
- [ ] As `ben`, open the syllabus. It's view-only: there are no upload or submit buttons.
- [ ] Try to create a second IT 101 syllabus for the same term and program. It should be refused as a duplicate.
- [ ] Back as `ana`, click **Submit for review**.

**Stage 1 returns the syllabus** (as `rev`):
- [ ] `/review` shows the syllabus. Click **Review** to open the workspace (PDF pane, Form 17, Form 18-1 and timeline).
- [ ] **Form 17**: answer one item **No** and leave its remarks empty. Saving should demand remarks. Add remarks and save. **Approve** should now be blocked.
- [ ] **Form 18-1** tab: try **Return for revision** with no points. It should be refused. Then add two review points (Part A, no legend code) and click **Return**.

**The lead revises** (as `ana`):
- [ ] Check the bell icon. There should be a "returned" notification. Open `/notifications` and try **Mark all read**.
- [ ] Open the syllabus and click **Open revision workspace**. **Resubmit** stays disabled until you have done both of the following:
  - **Upload revision**, and
  - filled in **Action taken** and **Page number**, then clicked **Save answer** for *every* open point.
- [ ] Resubmit. The syllabus goes back to **stage 1**, not to the start of the chain.

**Stages 1 to 5:**
- [ ] As `rev`: mark one point resolved and one unresolved, fix the Form 17 "No" to Yes, and approve. The approve dialog shows a code like `SYL-…-S1`. **Copy it.**
- [ ] As `dean`: change one Form 17 answer and save. The change is logged, so look for it in the Form 17 history. Then approve.
- [ ] As `fdis`: add a **Part B** point with a legend code (for example `B.2`) and return.
- [ ] As `ana`: answer the point and resubmit. The syllabus resumes at **stage 3**. Check that the unresolved point from stage 1 was re-opened if it was still unresolved.
- [ ] As `fdis`, then `citl`, then `vpaa`: approve. The status becomes **Approved**.

**After approval:**
- [ ] **Verify** (any signed-in user): open `/verify/<the code you copied>`. It shows course, stage, reviewer and date. Try `/verify/SYL-FAKE`. It should say the code wasn't found.
- [ ] **Review forms (print view)** (`/syllabus/<id>/forms`): Form 17 and Form 18-1, with reference codes and signature lines. Print to PDF.
- [ ] **Timeline** on the syllabus page: every submit, return, resubmit and approve is listed, and each version shows its decisions ("S1 returned", "S2 approved").

**Signed copy:**
- [ ] As `ana`: upload the signed scan. The status becomes **Filed**.
- [ ] As `dean`: return the scan as invalid, with a reason. The status goes back to **Approved**, and the returned scan is still listed.
- [ ] As `ana`: upload a new scan. The status becomes **Filed** again.

**Justification Form** (shown because Carla wrote last year's syllabus and isn't an author this year):
- [ ] As `ana`: tick *Carla Prev can't sign* and leave the reason empty. Saving should refuse. Add a reason, click **Save justification**, then **Preview the letter**. The letter shows the course and entry and is addressed to `citl`.
- [ ] Upload `letter.pdf` with **Upload and submit**. The entries are now locked.
- [ ] As `rev` (or anyone higher in the chain): **Return for revision** with a reason. As `ana`, re-upload.
- [ ] Check that the justification never blocked anything, and that `nchair` (a referencer in Part 7) never sees it.

## Part 6 — Proxy and stand-ins (IT 102)

- [ ] As `ana`: create an IT 102 draft, upload a PDF, and add **`rev`** as co-author. The program reviewer is now conflicted.
- [ ] Click **Submit for review**. It should be **blocked**, because no proxy is set.
- [ ] As `rev` (who can name their own proxy), or as `dean` or `admin`: under *Proxy and stand-ins*, designate a proxy for stage 1. Try `nchair` first. It should be refused, because a proxy must be active BSIT faculty. Then try `ana`. It should be refused, because a stand-in can't lead or co-author. Then pick `ben`.
- [ ] As `ana`: submit. As `ben`: the syllabus appears in `ben`'s `/review` queue as *"as proxy"*. Approve it.
- [ ] As `rev`: the queue doesn't offer it, because nobody reviews their own syllabus.
- [ ] (Optional) Have `admin` act on the review workspace. Admin never reviews.

## Part 7 — References (GE 101)

- [ ] As `ana`: create GE 101 for target program **BSIT** (2026-2027), then upload and submit. Any status can be referenced.
- [ ] As `nchair`: go to `/syllabus-reference`, request a reference to that syllabus for BSN, and add a note.
- [ ] Request again. It should be refused (one pending or approved reference per program, course and term).
- [ ] Withdraw the request and request again.
- [ ] As `ana` (the source lead): approve it from the syllabus's *References* panel.
- [ ] As `nchair`: open the syllabus. A green banner says "Your program references this syllabus". The PDFs can be viewed, but there are no controls and no justification panel.
- [ ] As `ana`: revoke the reference. As `nchair`: request again. As `admin`: reject it on the lead's behalf.

## Part 8 — Lead transfer and admin override

- [ ] As `chair`: on IT 102, click **Transfer lead** and move it from `ana` to `ben`. Now only `ben` can edit it.
- [ ] As `admin` (not the chair): transfer it back. A reason is **required**. The transfer is recorded as an override.

## Part 9 — Visibility, deadlines, audit and limits

**Deadlines:**
- [ ] As `admin`: set *2026-2027 First Semester* **review days** to `1`. Submit something and leave it overnight. The next day, overdue badges appear on the syllabus, in the queue and on the dashboard. Overdue never blocks anything.

**Dashboard** (`/dashboard`):
- [ ] As `vpaa`: you see everything, including the justification panel. Click **Export CSV** on each panel.
- [ ] As `dean`: you see COT only. As `head` and `chair`: you see your own scope and **no justification panel**.
- [ ] As `ana`: the Dashboard link isn't shown.

**Scoped lists:**
- [ ] As `nchair`: org lists (programs, colleges) are fully visible, but assignment lists such as `/faculty` show only BSN.

**Audit** (`/audit`, admin only):
- [ ] Filter by the IT 101 syllabus. Every status change, each PDF upload and the override transfer are listed, and the override is marked.
- [ ] As `vpaa`: `/audit` is refused.

**Upload limit:**
- [ ] As `spam`: become BSIT faculty (chair adds them), create a draft and upload 21 versions. Upload 21 returns **429** with a retry time. This uses up `spam`'s uploads for an hour, which is why it comes last.

**Email:**
- [ ] With SMTP set, check the inboxes after a submit, return and approve. In the dashboard's `notifications` collection, rows go `pending → sending → sent`.

---

## Part 10 — Negative checks

Each of these should fail with a clear message:

- [ ] Signing in with an unverified account.
- [ ] Creating a syllabus for a course that isn't in the target program's published prospectus, or in a closed term.
- [ ] Creating a syllabus as a non-faculty user, such as `fdis`.
- [ ] Submitting a draft with no PDF (the button is disabled).
- [ ] Approving at a stage that isn't yours, or skipping a stage.
- [ ] Opening a PDF URL from a syllabus you have no access to. It should return 404, and no raw S3 URLs ever appear.
- [ ] Deleting a submitted syllabus (only drafts can be deleted).

## Part 11 — Keyboard and accessibility pass

This is the manual check still marked pending for Phase 6.

- [ ] Do Part 5's return-and-resubmit with the **keyboard only**: Tab, Shift+Tab, Enter, Space and the arrow keys in comboboxes and radio groups. Focus should stay visible, and Esc should close dialogs except while saving.
- [ ] Check that error messages are announced (`role="alert"`). Use NVDA or Narrator on one form.
- [ ] Zoom to 200%. Nothing should be cut off on `/review`, the review workspace or `/dashboard`.

When every box is ticked, every feature has been used at least once. Record anything that broke as an issue, with the step number.
