/// <reference path="../pb_data/types.d.ts" />
// Sign-in now requires a verified email. Accounts that existed before that
// rule are trusted, so they are marked verified to avoid locking anyone out.
migrate((app) => {
  app.db().newQuery("UPDATE `users` SET `verified` = TRUE").execute()
}, (app) => {
  // Irreversible: the previous per-user values are not known.
})
