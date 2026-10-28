/// <reference path="../pb_data/types.d.ts" />
// Phase 6 audit trail. One row per status change, lead transfer and PDF
// upload, written in the same batch as the change. Append-only: API rules
// are null and no route updates or deletes it. `syllabus` and `target_id`
// are plain ids, not relations, so rows outlive a deleted record. Upload
// rows also feed the upload rate limit. No backfill: earlier history stays
// in syllabus_events.
migrate((app) => {
  const text = (id, name, min, max, required = false) => ({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": id,
    "max": max,
    "min": min,
    "name": name,
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": required,
    "system": false,
    "type": "text"
  });

  const auditLog = new Collection({
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
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "help": "",
        "hidden": false,
        "id": "relation1800000167",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "actor",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "help": "",
        "hidden": false,
        "id": "select1800000168",
        "maxSelect": 1,
        "name": "action",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "submitted",
          "approved",
          "returned",
          "resubmitted",
          "filed",
          "scan_returned",
          "lead.transferred",
          "file.uploaded"
        ]
      },
      text("text1800000169", "target_collection", 0, 50, true),
      text("text1800000170", "target_id", 15, 15, true),
      text("text1800000171", "syllabus", 0, 15),
      {
        "help": "",
        "hidden": false,
        "id": "bool1800000172",
        "name": "override",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      },
      text("text1800000173", "reason", 0, 500),
      {
        "help": "",
        "hidden": false,
        "id": "json1800000174",
        "maxSize": 2048,
        "name": "data",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "json"
      },
      {
        "hidden": false,
        "id": "autodate2990389176",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ],
    "id": "pbc_1800000018",
    "indexes": [
      "CREATE INDEX `idx_audit_log_actor` ON `audit_log` (`actor`, `action`, `created`)",
      "CREATE INDEX `idx_audit_log_syllabus` ON `audit_log` (`syllabus`, `created`)",
      "CREATE INDEX `idx_audit_log_action` ON `audit_log` (`action`, `created`)",
      "CREATE INDEX `idx_audit_log_created` ON `audit_log` (`created`)"
    ],
    "listRule": null,
    "name": "audit_log",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": null
  });
  return app.save(auditLog);
}, (app) => {
  return app.delete(app.findCollectionByNameOrId("pbc_1800000018"));
})
