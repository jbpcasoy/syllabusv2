/// <reference path="../pb_data/types.d.ts" />
// Who acts at a stage in place of its conflicted holder, per syllabus. The
// stage-1 stand-in is the proxy. Designated by an admin or any active holder
// of a later stage (the chair also names their own proxy); see
// lib/syllabus-review.ts. Who and when are assigned_by and updated.
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
      relation("relation1800000086", "syllabus", "pbc_1800000005", true),
      {
        "help": "",
        "hidden": false,
        "id": "number1800000087",
        "max": 6,
        "min": 1,
        "name": "stage",
        "onlyInt": true,
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number"
      },
      relation("relation1800000088", "user", "_pb_users_auth_"),
      relation("relation1800000089", "assigned_by", "_pb_users_auth_"),
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
    "id": "pbc_1800000008",
    "indexes": [
      "CREATE UNIQUE INDEX `idx_syllabus_stand_ins_syllabus_stage` ON `syllabus_stand_ins` (`syllabus`, `stage`)",
      "CREATE INDEX `idx_syllabus_stand_ins_user` ON `syllabus_stand_ins` (`user`)"
    ],
    "listRule": null,
    "name": "syllabus_stand_ins",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": null
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1800000008");

  return app.delete(collection);
})
