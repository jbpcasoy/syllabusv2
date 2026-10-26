/// <reference path="../pb_data/types.d.ts" />
// One syllabus per course, term and target program. The target program's
// review chain reviews it (Phase 3). Status and stage change only through
// lib/syllabus-workflow.ts.
migrate((app) => {
  const relation = (id, name, collectionId, required, maxSelect = 1) => ({
    "cascadeDelete": false,
    "collectionId": collectionId,
    "help": "",
    "hidden": false,
    "id": id,
    "maxSelect": maxSelect,
    "minSelect": 0,
    "name": name,
    "presentable": false,
    "required": required,
    "system": false,
    "type": "relation"
  });

  const collection = new Collection({
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
      relation("relation1800000051", "course", "pbc_1800000003", true),
      relation("relation1800000052", "term", "pbc_1800000002", true),
      relation("relation1800000053", "program", "pbc_2970041692", true),
      relation("relation1800000054", "lead", "_pb_users_auth_", true),
      relation("relation1800000055", "co_authors", "_pb_users_auth_", false, 50),
      {
        "help": "",
        "hidden": false,
        "id": "select1800000056",
        "maxSelect": 1,
        "name": "status",
        "presentable": true,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "draft",
          "submitted"
        ]
      },
      {
        "help": "",
        "hidden": false,
        "id": "number1800000057",
        "max": 6,
        "min": 0,
        "name": "stage",
        "onlyInt": true,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "help": "",
        "hidden": false,
        "id": "date1800000058",
        "max": "",
        "min": "",
        "name": "submitted_at",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
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
    "id": "pbc_1800000005",
    "indexes": [
      "CREATE UNIQUE INDEX `idx_syllabi_course_term_program` ON `syllabi` (`course`, `term`, `program`)",
      "CREATE INDEX `idx_syllabi_lead` ON `syllabi` (`lead`)",
      "CREATE INDEX `idx_syllabi_term_status` ON `syllabi` (`term`, `status`)"
    ],
    "listRule": null,
    "name": "syllabi",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": null
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1800000005");

  return app.delete(collection);
})
