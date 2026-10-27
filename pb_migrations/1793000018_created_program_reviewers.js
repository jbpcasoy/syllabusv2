/// <reference path="../pb_data/types.d.ts" />
// Stage 1 of syllabus review is the program reviewer: an assignment per
// program, like program_chairs, with at most one active record per program.
// Replaces programs.level (chair for graduate, head for undergraduate), which
// is dropped. Chairs and department heads keep their other duties.
migrate((app) => {
  const programs = app.findCollectionByNameOrId("pbc_2970041692");
  programs.fields.removeById("select1800000097");
  app.save(programs);

  const relation = (id, name, collectionId) => ({
    "cascadeDelete": false,
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
      relation("relation1800000098", "user", "_pb_users_auth_"),
      relation("relation1800000099", "program", "pbc_2970041692"),
      {
        "help": "",
        "hidden": false,
        "id": "bool1800000100",
        "name": "active",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
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
    "id": "pbc_1800000010",
    "indexes": [
      "CREATE UNIQUE INDEX `idx_program_reviewers_user_program` ON `program_reviewers` (`user`, `program`)",
      "CREATE UNIQUE INDEX `idx_program_reviewers_active_program` ON `program_reviewers` (`program`) WHERE `active` = TRUE"
    ],
    "listRule": null,
    "name": "program_reviewers",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": null
  });

  return app.save(collection);
}, (app) => {
  app.delete(app.findCollectionByNameOrId("pbc_1800000010"));

  const programs = app.findCollectionByNameOrId("pbc_2970041692");
  programs.fields.add(new Field({
    "help": "",
    "hidden": false,
    "id": "select1800000097",
    "maxSelect": 1,
    "name": "level",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "undergraduate",
      "graduate"
    ]
  }));
  return app.save(programs);
})
