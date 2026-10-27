/// <reference path="../pb_data/types.d.ts" />
// Justification Form: one per syllabus. Entries name the authors of last
// school year's syllabus (based_on) who can't sign, each with a reason.
// The lead creates it once the syllabus is approved and uploads the signed
// letter's scan (draft -> submitted); the program reviewer or any higher
// role, or an admin, may return it (submitted -> returned). Informational
// only: it never blocks the syllabus.
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

  return app.save(new Collection({
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
      relation("relation1800000137", "syllabus", "pbc_1800000005", true, true),
      {
        "help": "",
        "hidden": false,
        "id": "json1800000138",
        "maxSize": 100000,
        "name": "entries",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "json"
      },
      {
        "help": "",
        "hidden": false,
        "id": "select1800000139",
        "maxSelect": 1,
        "name": "status",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": ["draft", "submitted", "returned"]
      },
      {
        "help": "",
        "hidden": false,
        "id": "file1800000140",
        "maxSelect": 1,
        "maxSize": 20971520,
        "mimeTypes": ["application/pdf"],
        "name": "scan",
        "presentable": false,
        "protected": true,
        "required": false,
        "system": false,
        "thumbs": [],
        "type": "file"
      },
      date("date1800000141", "submitted_at"),
      {
        "autogeneratePattern": "",
        "help": "",
        "hidden": false,
        "id": "text1800000142",
        "max": 500,
        "min": 0,
        "name": "return_reason",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      relation("relation1800000143", "returned_by", "_pb_users_auth_", false),
      date("date1800000144", "returned_at"),
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
    "id": "pbc_1800000015",
    "indexes": [
      "CREATE UNIQUE INDEX `idx_syllabus_justifications_syllabus` ON `syllabus_justifications` (`syllabus`)"
    ],
    "listRule": null,
    "name": "syllabus_justifications",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": null
  }));
}, (app) => {
  return app.delete(app.findCollectionByNameOrId("pbc_1800000015"));
})
