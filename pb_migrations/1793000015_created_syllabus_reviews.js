/// <reference path="../pb_data/types.d.ts" />
// One decision per version and stage. The review route writes this row and
// the syllabus update in one batch, so UNIQUE (version, stage) rejects the
// second of two simultaneous decisions. A return always needs a new version
// before the stage decides again, so the index never blocks a legitimate one.
// approval_code is empty on return.
migrate((app) => {
  const relation = (id, name, collectionId, cascadeDelete = false) => ({
    "cascadeDelete": cascadeDelete,
    "collectionId": collectionId,
    "help": "",
    "hidden": false,
    "id": id,
    "maxSelect": 1,
    "minSelect": 0,
    "name": name,
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  });
  const select = (id, name, values) => ({
    "help": "",
    "hidden": false,
    "id": id,
    "maxSelect": 1,
    "name": name,
    "presentable": false,
    "required": true,
    "system": false,
    "type": "select",
    "values": values
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
      relation("relation1800000090", "syllabus", "pbc_1800000005", true),
      relation("relation1800000091", "version", "pbc_1800000006", true),
      {
        "help": "",
        "hidden": false,
        "id": "number1800000092",
        "max": 6,
        "min": 1,
        "name": "stage",
        "onlyInt": true,
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number"
      },
      relation("relation1800000093", "reviewer", "_pb_users_auth_"),
      select("select1800000094", "acting_as", ["holder", "proxy", "standIn"]),
      select("select1800000095", "decision", ["approve", "return"]),
      {
        "autogeneratePattern": "",
        "help": "",
        "hidden": false,
        "id": "text1800000096",
        "max": 40,
        "min": 0,
        "name": "approval_code",
        "pattern": "",
        "presentable": true,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
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
    "id": "pbc_1800000009",
    "indexes": [
      "CREATE UNIQUE INDEX `idx_syllabus_reviews_version_stage` ON `syllabus_reviews` (`version`, `stage`)",
      "CREATE UNIQUE INDEX `idx_syllabus_reviews_approval_code` ON `syllabus_reviews` (`approval_code`) WHERE `approval_code` != ''",
      "CREATE INDEX `idx_syllabus_reviews_syllabus_stage` ON `syllabus_reviews` (`syllabus`, `stage`)"
    ],
    "listRule": null,
    "name": "syllabus_reviews",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": null
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1800000009");

  return app.delete(collection);
})
