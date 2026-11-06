/// <reference path="../pb_data/types.d.ts" />
// Verification emails used PocketBase's defaults: "Acme" as the app name and a
// link to PocketBase's own admin page, which users cannot reach. Name the app,
// point {APP_URL} at the Next.js app (APP_URL in PocketBase's environment) and
// send the link to its /confirm-email page instead.
migrate((app) => {
  const settings = app.settings()
  settings.meta.appName = "BukSU Syllabus Review System"
  const appUrl = ($os.getenv("APP_URL") || "").replace(/\/+$/, "")
  if (appUrl) settings.meta.appURL = appUrl
  app.save(settings)

  const users = app.findCollectionByNameOrId("users")
  users.verificationTemplate.subject = "Verify your {APP_NAME} email"
  users.verificationTemplate.body = [
    "<p>Hello,</p>",
    "<p>Thank you for registering for the {APP_NAME}.</p>",
    "<p>Click the button below to verify your email address.</p>",
    "<p>",
    '  <a class="btn" href="{APP_URL}/confirm-email/{TOKEN}" target="_blank" rel="noopener">Verify email</a>',
    "</p>",
    "<p><i>If you didn't register, you can ignore this email.</i></p>",
    "<p>",
    "  Thanks,<br/>",
    "  {APP_NAME}",
    "</p>",
  ].join("\n")
  app.save(users)
}, (app) => {
  const settings = app.settings()
  settings.meta.appName = "Acme"
  settings.meta.appURL = "http://localhost:8090"
  app.save(settings)

  const users = app.findCollectionByNameOrId("users")
  users.verificationTemplate.subject = "Verify your {APP_NAME} email"
  users.verificationTemplate.body = [
    "<p>Hello,</p>",
    "<p>Thank you for joining us at {APP_NAME}.</p>",
    "<p>Click on the button below to verify your email address.</p>",
    "<p>",
    '  <a class="btn" href="{APP_URL}/_/#/auth/confirm-verification/{TOKEN}" target="_blank" rel="noopener">Verify</a>',
    "</p>",
    "<p>",
    "  Thanks,<br/>",
    "  {APP_NAME} team",
    "</p>",
  ].join("\n")
  app.save(users)
})
