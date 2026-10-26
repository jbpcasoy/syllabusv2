/// <reference path="../pb_data/types.d.ts" />
// A program's chair asks to use another program's syllabus for the same
// course and term instead of writing its own. The source lead decides.
// course and term are copied from the source so the partial unique index
// can allow only one live (pending or approved) reference per program.
//
// Deleting a source draft cascades to its references. The delete route
// refuses while any reference is pending or approved, so only ended ones
// (rejected, withdrawn, revoked) are ever removed this way.
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
  const text = (id, name) => ({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": id,
    "max": 500,
    "min": 0,
    "name": name,
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
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
      relation("relation1800000071", "syllabus", "pbc_1800000005", true, true),
      relation("relation1800000072", "program", "pbc_2970041692", true),
      relation("relation1800000073", "course", "pbc_1800000003", true),
      relation("relation1800000074", "term", "pbc_1800000002", true),
      relation("relation1800000075", "requested_by", "_pb_users_auth_", true),
      text("text1800000076", "note"),
      {
        "help": "",
        "hidden": false,
        "id": "select1800000077",
        "maxSelect": 1,
        "name": "status",
        "presentable": true,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "pending",
          "approved",
          "rejected",
          "withdrawn",
          "revoked"
        ]
      },
      text("text1800000078", "reason"),
      relation("relation1800000079", "decided_by", "_pb_users_auth_", false),
      date("date1800000080", "decided_at"),
      relation("relation1800000081", "ended_by", "_pb_users_auth_", false),
      date("date1800000082", "ended_at"),
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
    "id": "pbc_1800000007",
    "indexes": [
      "CREATE UNIQUE INDEX `idx_syllabus_references_live` ON `syllabus_references` (`program`, `course`, `term`) WHERE `status` IN ('pending', 'approved')",
      "CREATE INDEX `idx_syllabus_references_syllabus_status` ON `syllabus_references` (`syllabus`, `status`)"
    ],
    "listRule": null,
    "name": "syllabus_references",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": null
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1800000007");

  return app.delete(collection);
})
