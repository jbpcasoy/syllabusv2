/// <reference path="../pb_data/types.d.ts" />
// Phase 5 notifications. One row per recipient per transition, written in
// the transition's batch. The rows feed the in-app badge and are the email
// outbox drained by pb_hooks/notifications.pb.js. Title, body and link are
// built in TypeScript; the hook only sends them. terms gains review_days,
// the per-stage review limit (0 = none). No backfill.
migrate((app) => {
  const relation = (id, name, collectionId, required, cascadeDelete = false) => ({
    "cascadeDelete": cascadeDelete,
    "collectionId": collectionId,
    "help": "",
    "hidden": false,
    "id": id,
    "maxSelect": 1,
    "minSelect": 0,
    "name": name,
    "presentable": false,
    "required": required,
    "system": false,
    "type": "relation"
  });
  const text = (id, name, max, required = false) => ({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": id,
    "max": max,
    "min": 0,
    "name": name,
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": required,
    "system": false,
    "type": "text"
  });
  const select = (id, name, values, required) => ({
    "help": "",
    "hidden": false,
    "id": id,
    "maxSelect": 1,
    "name": name,
    "presentable": false,
    "required": required,
    "system": false,
    "type": "select",
    "values": values
  });
  const number = (id, name, min, max) => ({
    "help": "",
    "hidden": false,
    "id": id,
    "max": max,
    "min": min,
    "name": name,
    "onlyInt": true,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  });
  const date = (id, name) => ({
    "help": "",
    "hidden": false,
    "id": id,
    "max": "",
    "min": "",
    "name": name,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  });

  const notifications = new Collection({
    "createRule": null,
    "deleteRule": null,
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "help": "",
        "hidden": false,
        "id": "text3208210256",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      relation("relation1800000153", "user", "_pb_users_auth_", true, true),
      relation("relation1800000154", "syllabus", "pbc_1800000005", true, true),
      select("select1800000155", "kind", ["review_requested", "approved", "final_approved", "returned"], true),
      number("number1800000156", "stage", 1, 5),
      relation("relation1800000157", "actor", "_pb_users_auth_", true),
      text("text1800000158", "title", 200, true),
      text("text1800000159", "body", 1000),
      text("text1800000160", "link", 200, true),
      date("date1800000161", "read_at"),
      select("select1800000162", "email_status", ["pending", "sending", "sent", "failed", "skipped"], false),
      number("number1800000163", "email_attempts", 0, null),
      text("text1800000164", "email_error", 500),
      date("date1800000165", "emailed_at"),
      {
        "hidden": false,
        "id": "autodate2990389176",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate3332085495",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ],
    "id": "pbc_1800000017",
    "indexes": [
      "CREATE INDEX `idx_notifications_user_read` ON `notifications` (`user`, `read_at`, `created`)",
      "CREATE INDEX `idx_notifications_email` ON `notifications` (`email_status`, `created`)"
    ],
    "listRule": null,
    "name": "notifications",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": null
  });
  app.save(notifications);

  const terms = app.findCollectionByNameOrId("pbc_1800000002");
  terms.fields.add(new Field(number("number1800000166", "review_days", 0, 90)));
  app.save(terms);
}, (app) => {
  const terms = app.findCollectionByNameOrId("pbc_1800000002");
  terms.fields.removeById("number1800000166");
  app.save(terms);

  return app.delete(app.findCollectionByNameOrId("pbc_1800000017"));
})
