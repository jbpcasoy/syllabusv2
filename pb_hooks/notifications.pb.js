/// <reference path="../pb_data/types.d.ts" />
// Phase 5 email outbox. Transitions write `notifications` rows in their own
// batch (lib/notifications.ts builds the title, body and link); this cron
// only sends them. Every minute it:
//   1. returns rows stuck in `sending` for over 10 minutes to `pending`,
//   2. fails unsent rows older than 24 hours, so old mail never goes out,
//   3. claims up to 50 `pending` or retryable `failed` rows (3 attempts),
//      one conditional UPDATE each, so overlapping runs never send twice,
//   4. sends each to the recipient, or skips unverified and email-less users.
// Links are absolute when APP_URL (the Next.js app's URL) is set.
// JavaScript, not TypeScript: PocketBase runs it. Handlers run isolated, so
// every helper lives inside the handler.
cronAdd("notifications-email", "* * * * *", () => {
  const MAX_ATTEMPTS = 3;
  const BATCH = 50;
  const STALE_MS = 10 * 60 * 1000;
  const EXPIRY_MS = 24 * 60 * 60 * 1000;

  const pbDate = (ms) => new Date(ms).toISOString().replace("T", " ");
  const escapeHtml = (text) =>
    text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const now = Date.now();
  const nowDate = pbDate(now);
  const cutoff = pbDate(now - EXPIRY_MS);
  const db = $app.db();

  db.newQuery(
    "UPDATE `notifications` SET `email_status` = 'pending', `updated` = {:now} " +
      "WHERE `email_status` = 'sending' AND `updated` < {:stale}",
  )
    .bind({ now: nowDate, stale: pbDate(now - STALE_MS) })
    .execute();

  db.newQuery(
    "UPDATE `notifications` SET `email_status` = 'failed', " +
      "`email_error` = 'Not sent within 24 hours.', `updated` = {:now} " +
      "WHERE `email_status` IN ('pending', 'failed') AND `created` < {:cutoff} " +
      "AND `email_attempts` < {:max} AND `email_error` != 'Not sent within 24 hours.'",
  )
    .bind({ now: nowDate, cutoff: cutoff, max: MAX_ATTEMPTS })
    .execute();

  const rows = $app.findRecordsByFilter(
    "notifications",
    "created >= {:cutoff} && (email_status = 'pending' || " +
      "(email_status = 'failed' && email_attempts < {:max}))",
    "created",
    BATCH,
    0,
    { cutoff: cutoff, max: MAX_ATTEMPTS },
  );
  if (rows.length === 0) return;

  const meta = $app.settings().meta;
  const baseUrl = ($os.getenv("APP_URL") || "").replace(/\/+$/, "");

  for (const row of rows) {
    const claimed = db
      .newQuery(
        "UPDATE `notifications` SET `email_status` = 'sending', `updated` = {:now} " +
          "WHERE `id` = {:id} AND `email_status` = {:status}",
      )
      .bind({ now: pbDate(Date.now()), id: row.id, status: row.getString("email_status") })
      .execute()
      .rowsAffected();
    if (claimed !== 1) continue;

    const finish = (status, error) => {
      row.set("email_status", status);
      row.set("email_error", (error || "").slice(0, 500));
      if (status !== "skipped") {
        row.set("email_attempts", row.getInt("email_attempts") + 1);
      }
      if (status === "sent") row.set("emailed_at", pbDate(Date.now()));
      $app.save(row);
    };

    let user;
    try {
      user = $app.findRecordById("users", row.getString("user"));
    } catch (error) {
      finish("skipped", `Recipient not found: ${error}`);
      continue;
    }
    if (!user.verified() || !user.email()) {
      finish("skipped", "Recipient has no verified email.");
      continue;
    }

    const title = row.getString("title");
    const body = row.getString("body");
    const url = baseUrl + row.getString("link");

    try {
      $app.newMailClient().send(
        new MailerMessage({
          from: { address: meta.senderAddress, name: meta.senderName },
          to: [{ address: user.email(), name: user.getString("name") }],
          subject: title,
          text: `${body}\n\nOpen: ${url}\n`,
          html:
            `<p>${escapeHtml(body)}</p>` +
            `<p><a href="${escapeHtml(url)}">Open in the syllabus system</a></p>`,
        }),
      );
      finish("sent", "");
    } catch (error) {
      finish("failed", String(error));
      $app.logger().warn(
        "Notification email failed",
        "notification",
        row.id,
        "error",
        String(error),
      );
    }
  }
});
