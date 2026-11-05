import type { Page } from "@playwright/test";
import { PASSWORD } from "./env";
import { expect, test } from "./fixtures";
import { adminPb, alerts, expectSignInFor, signIn } from "./helpers";
import { inbox, linkIn, waitForMail } from "./mail";
import type { PersonRecord } from "./seed";

// Registration, verification by the real emailed link, sign-in, sign-out
// and the signed-out redirect on every protected page.

const VERIFY_LINK = /\/auth\/confirm-verification\//;
const VERIFY_SUBJECT = /verif/i;

async function register(page: Page, name: string, email: string) {
  await page.goto("/register");
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Confirm password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
}

async function signInWithForm(page: Page, email: string, password = PASSWORD) {
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

async function isVerified(email: string) {
  const pb = await adminPb();
  const user = await pb.collection("users").getFirstListItem(pb.filter("email = {:email}", { email }));
  return user.verified as boolean;
}

/** A fresh, unverified address no other test uses. */
const newEmail = (slug: string) => `e2e.auth.${slug}.${Date.now()}@buksu.edu.ph`;

test("register with a non-institutional email is refused @AUTH-01", async ({ page }) => {
  await register(page, "Outside Person", "outside.person@gmail.com");
  await expect(alerts(page)).toHaveText(/Use your institutional email \(.*buksu\.edu\.ph.*\)/);

  // The server refuses it too, not only the form.
  const res = await page.request.post("/api/auth/register", {
    data: { name: "Outside", email: "outside.person@gmail.com", password: PASSWORD, passwordConfirm: PASSWORD },
  });
  expect(res.status()).toBe(400);
});

test("register, get refused until verified, then verify by the emailed link @AUTH-02 @AUTH-02c", async ({
  page,
}) => {
  const email = newEmail("verify");
  await register(page, "Verify Me", email);
  await expect(page.getByRole("status")).toContainText(`We sent a verification link to ${email}`);
  const mail = await waitForMail(email, { subject: VERIFY_SUBJECT });

  await page.goto("/login");
  await signInWithForm(page, email);
  await expect(alerts(page)).toContainText("Verify your email before signing in.");
  expect(await isVerified(email)).toBe(false);

  // The link opens PocketBase's own confirmation page.
  await page.goto(linkIn(mail, VERIFY_LINK));
  await expect(page.getByText(/verified/i)).toBeVisible();
  await expect.poll(() => isVerified(email)).toBe(true);

  // An unassigned user has no dashboard, so home sends them to My Syllabi.
  await page.goto("/login");
  await signInWithForm(page, email);
  await expect(page).toHaveURL(/\/syllabus$/);
});

// Its own account: PocketBase doesn't send a second verification email to
// an address it emailed moments ago, so this can't follow registration.
test("signing in while unverified sends a new link @AUTH-02b", async ({ page }) => {
  const email = newEmail("resend");
  const pb = await adminPb();
  await pb.collection("users").create({
    name: "Resend Me",
    email,
    password: PASSWORD,
    passwordConfirm: PASSWORD,
    verified: false,
  });

  await page.goto("/login");
  await signInWithForm(page, email);
  await expect(alerts(page)).toHaveText(
    `Verify your email before signing in. We sent a new link to ${email}.`,
  );
  const mail = await waitForMail(email, { subject: VERIFY_SUBJECT });
  linkIn(mail, VERIFY_LINK);
});

test("a tampered verification link doesn't verify @AUTH-02d", async ({ page }) => {
  const email = newEmail("tamper");
  await register(page, "Tamper Proof", email);
  const mail = await waitForMail(email, { subject: VERIFY_SUBJECT });
  const link = linkIn(mail, VERIFY_LINK);

  // Flip the last characters of the token's signature.
  const tampered = link.slice(0, -4) + (link.endsWith("AAAA") ? "BBBB" : "AAAA");
  await page.goto(tampered);
  await expect(page.getByText(/invalid|expired|failed/i).first()).toBeVisible();
  expect(await isVerified(email)).toBe(false);
  expect(inbox(email)).toHaveLength(1);
});

test("sign-in lands where the user's work is and honours a safe next @AUTH-03", async ({ page, world }) => {
  const go = async (person: PersonRecord, next?: string) => {
    await page.context().clearCookies();
    await page.goto(next === undefined ? "/login" : `/login?next=${encodeURIComponent(next)}`);
    await signInWithForm(page, person.email);
  };

  // Faculty only: My Syllabi. A dean: the dashboard.
  await go(world.people.lead);
  await expect(page).toHaveURL(/\/syllabus$/);
  await go(world.people.dean);
  await expect(page).toHaveURL(/\/dashboard$/);

  await go(world.people.lead, "/notifications");
  await expect(page).toHaveURL(/\/notifications$/);

  // An off-site next is ignored.
  await go(world.people.lead, "//evil.example.com/");
  await expect(page).toHaveURL(/localhost:\d+\/syllabus$/);
});

test("a wrong password or unknown email gets the same message @AUTH-04", async ({ page, world }) => {
  await page.goto("/login");
  await signInWithForm(page, world.people.lead.email, "not-the-password");
  await expect(alerts(page)).toHaveText("Invalid email or password");

  await signInWithForm(page, "nobody.here@buksu.edu.ph", "not-the-password");
  await expect(alerts(page)).toHaveText("Invalid email or password");
  await expect(page).toHaveURL(/\/login/);
});

test("sign out ends the session @AUTH-05", async ({ page, world }) => {
  await signIn(page, world.people.lead);
  await page.goto("/syllabus");
  await page.getByRole("button", { name: world.people.lead.name }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.goto("/syllabus");
  await expectSignInFor(page, "/syllabus");
});

/** Every page behind sign-in; ids are well-formed but don't exist. */
const PROTECTED = [
  "/dashboard",
  "/syllabus",
  "/notifications",
  "/verify",
  "/review",
  "/syllabus-reference",
  "/campus",
  "/college",
  "/dean",
  "/department",
  "/department-head",
  "/program",
  "/program-chair",
  "/program-reviewer",
  "/school-year",
  "/course",
  "/prospectus",
  "/prospectus-item",
  "/vpaa",
  "/fdis-chair",
  "/citl-director",
  "/faculty",
  "/program-join-request",
  "/user",
  "/audit",
  "/syllabus/aaaaaaaaaaaaaaa",
  "/syllabus/aaaaaaaaaaaaaaa/review",
  "/syllabus/aaaaaaaaaaaaaaa/revise",
  "/syllabus/aaaaaaaaaaaaaaa/forms",
  "/syllabus/aaaaaaaaaaaaaaa/forms/justification",
];

test("every protected page sends a signed-out visitor to sign in @AUTH-06", async ({ page }) => {
  for (const path of PROTECTED) {
    await page.goto(path);
    await expectSignInFor(page, path);
  }
});
