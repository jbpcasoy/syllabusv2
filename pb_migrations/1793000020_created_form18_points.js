/// <reference path="../pb_data/types.d.ts" />
// Form 18-1 (CITL-F-018) review points. A point belongs to the syllabus and
// the stage that raised it and records the version it was raised on. Part A
// (stages 1 and 2) is free text; Part B (stages 3 to 5) carries a legend
// code. Status: open -> responded (lead) -> resolved | unresolved
// (reviewer); a later return re-opens unresolved points.
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
      relation("relation1800000115", "syllabus", "pbc_1800000005", true, true),
      relation("relation1800000116", "version", "pbc_1800000006", true),
      select("select1800000117", "part", ["A", "B"]),
      {
        "help": "",
        "hidden": false,
        "id": "number1800000118",
        "max": 5,
        "min": 1,
        "name": "stage",
        "onlyInt": true,
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number"
      },
      text("text1800000119", "code", 10),
      text("text1800000120", "review_point", 2000, true),
      text("text1800000121", "action_taken", 2000),
      text("text1800000122", "page_number", 50),
      text("text1800000123", "remarks", 2000),
      select("select1800000124", "status", ["open", "responded", "resolved", "unresolved"]),
      text("text1800000125", "form_revision", 20, true),
      relation("relation1800000126", "raised_by", "_pb_users_auth_", true),
      relation("relation1800000127", "responded_by", "_pb_users_auth_", false),
      relation("relation1800000128", "judged_by", "_pb_users_auth_", false),
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
    "id": "pbc_1800000013",
    "indexes": [
      "CREATE INDEX `idx_form18_points_syllabus_stage_status` ON `form18_points` (`syllabus`, `stage`, `status`)"
    ],
    "listRule": null,
    "name": "form18_points",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": null
  }));
}, (app) => {
  return app.delete(app.findCollectionByNameOrId("pbc_1800000013"));
})
