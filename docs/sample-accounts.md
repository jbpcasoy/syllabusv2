# Sample accounts

There are two sets of sample accounts. The **walkthrough cast** is made by hand on a dev PocketBase when you follow `docs/feature-walkthrough.md`. The **end-to-end accounts** are seeded automatically by `npm run test:e2e` on a throwaway PocketBase that is deleted at teardown.

All accounts must use an `@buksu.edu.ph` email, because self-registration only accepts `ALLOWED_EMAIL_DOMAINS`. Accounts an admin creates start verified.

---

## 1. Walkthrough cast (dev PocketBase)

Source: `docs/feature-walkthrough.md` § 1. The walkthrough doesn't fix the emails or the password. Every account uses the same password, which you choose. The emails below follow a suggested `<key>@buksu.edu.ph` convention.

| Key | Name | Suggested email | Roles | Created by |
| --- | --- | --- | --- | --- |
| `admin` | Ada Admin | `admin@buksu.edu.ph` | `isAdmin` | Superuser, in the PocketBase dashboard (`verified = true`, `isAdmin = true`) |
| `vpaa` | Vic VPAA | `vpaa@buksu.edu.ph` | VPAA (stage 5) | Admin |
| `fdis` | Fe FDIS | `fdis@buksu.edu.ph` | FDIS Chair (stage 3) | Admin |
| `citl` | Cy CITL | `citl@buksu.edu.ph` | CITL Director (stage 4) | Admin |
| `dean` | Dee Dean | `dean@buksu.edu.ph` | Dean, College of Technologies (stage 2) | Admin |
| `head` | Hal Head | `head@buksu.edu.ph` | Department Head, Dept. of IT | Admin |
| `chair` | Cha Chair | `chair@buksu.edu.ph` | Program Chair, BSIT | Admin |
| `rev` | Rae Reviewer | `rev@buksu.edu.ph` | Program Reviewer, BSIT (stage 1), and BSIT faculty for the proxy test | Admin |
| `carla` | Carla Prev | `carla@buksu.edu.ph` | BSIT faculty, last year's author | Admin |
| `ana` | Ana Lead | `ana@buksu.edu.ph` | BSIT faculty, this year's lead | Admin |
| `ben` | Ben Coauthor | `ben@buksu.edu.ph` | BSIT faculty, co-author and proxy | Admin |
| `nchair` | Nia Nursing | `nchair@buksu.edu.ph` | Program Chair, BS Nursing | Admin |
| `newbie` | Nico New | `newbie@buksu.edu.ph` | None. Self-registers in Part 3 and asks to join a program | Self-registration |
| `spam` | Sam Spam | `spam@buksu.edu.ph` | None. Throwaway account for the upload-limit test | Admin |

The roles aren't stored on the user (only `isAdmin` is). They come from the assignment records you create in Parts 1 and 2 of the walkthrough.

---

## 2. End-to-end accounts (`npm run test:e2e`)

Source: `e2e/env.ts`, `e2e/seed.ts`, `e2e/world.ts`. PocketBase runs on `127.0.0.1:8099` and the app on `localhost:3099`.

### Credentials

| Account | Email | Password |
| --- | --- | --- |
| PocketBase superuser | `e2e-superuser@example.com` | `e2e-superuser-password` |
| Every seeded app user | (see below) | `e2e-password-123` |

### Global accounts (seeded once by global setup)

VPAA, FDIS Chair and CITL Director allow only one active holder system-wide, so every world shares these.

| Key | Name | Email | Roles |
| --- | --- | --- | --- |
| `admin` | E2E Admin | `e2e.admin@buksu.edu.ph` | `isAdmin` |
| `fdis` | E2E Fdis | `e2e.fdis@buksu.edu.ph` | FDIS Chair |
| `citl` | E2E Citl | `e2e.citl@buksu.edu.ph` | CITL Director |
| `vpaa` | E2E Vpaa | `e2e.vpaa@buksu.edu.ph` | VPAA |

Also seeded: *E2E Campus*, school year `2026-2027` and its open *First Semester* term (`review_days = 0`).

### Per-world accounts (one world per spec file)

`createWorld(name)` builds a college, department and program with a published prospectus and four courses, plus six users:

| Key | Name | Email | Roles |
| --- | --- | --- | --- |
| `head` | `<Title> Head` | `e2e.<tag>.<name>.head@buksu.edu.ph` | Department Head |
| `chair` | `<Title> Chair` | `e2e.<tag>.<name>.chair@buksu.edu.ph` | Program Chair |
| `lead` | `<Title> Lead` | `e2e.<tag>.<name>.lead@buksu.edu.ph` | Faculty (writes the syllabus) |
| `coAuthor` | `<Title> Coauthor` | `e2e.<tag>.<name>.coauthor@buksu.edu.ph` | Faculty |
| `reviewer` | `<Title> Reviewer` | `e2e.<tag>.<name>.reviewer@buksu.edu.ph` | Program Reviewer and Faculty |
| `dean` | `<Title> Dean` | `e2e.<tag>.<name>.dean@buksu.edu.ph` | Dean |

- `<name>` is the spec file name without its number prefix or `.spec.ts`, for example `01-full-chain.spec.ts` gives `full-chain`. A few specs also build a second world: `dsh-other`, `mem-other`, `org-other` and `ref-user`.
- `<Title>` is `<name>` in title case (`full-chain` gives `Full Chain`).
- `<tag>` is `w1`, `w2` and so on, from the number of colleges at creation time. It depends on run order, so it isn't fixed. Example: `e2e.w1.full-chain.lead@buksu.edu.ph`.

### One-off accounts made inside specs

Some specs create extra users for a single test, such as an unassigned user (`navigation.spec.ts`), a bounced-mail lead (`notifications.spec.ts`), join requesters (`membership.spec.ts`, `org-setup.spec.ts`), a colleague (`justification.spec.ts`) and an accessibility user (`05-a11y.spec.ts`). Their emails carry a timestamp, so they differ on every run. All of them use `e2e-password-123`.
