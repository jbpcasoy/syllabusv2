/// <reference path="../pb_data/types.d.ts" />
// Form 17 (OVPAA-F-INS-017): one shared Yes/No checklist per syllabus
// version. form_revision records the form revision the answer used (see
// lib/forms). Edits after stage 1 are logged in form17_changes. Suggestions
// for improvement live on the version.
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
  const idField = {
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
  };
  const created = {
    "hidden": false,
    "id": "autodate2990389176",
    "name": "created",
    "onCreate": true,
    "onUpdate": false,
    "presentable": false,
    "system": false,
    "type": "autodate"
  };
  const updated = {
    "hidden": false,
    "id": "autodate3332085495",
    "name": "updated",
    "onCreate": true,
    "onUpdate": true,
    "presentable": false,
    "system": false,
    "type": "autodate"
  };

  app.save(new Collection({
    "createRule": null,
    "deleteRule": null,
    "fields": [
      idField,
      relation("relation1800000101", "version", "pbc_1800000006", true, true),
      text("text1800000102", "criterion", 20, true),
      {
        "help": "",
        "hidden": false,
        "id": "select1800000103",
        "maxSelect": 1,
        "name": "answer",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": ["yes", "no"]
      },
      text("text1800000104", "remarks", 2000),
      text("text1800000105", "form_revision", 20, true),
      relation("relation1800000106", "last_edited_by", "_pb_users_auth_", true),
      created,
      updated
    ],
    "id": "pbc_1800000011",
    "indexes": [
      "CREATE UNIQUE INDEX `idx_form17_answers_version_criterion` ON `form17_answers` (`version`, `criterion`)"
    ],
    "listRule": null,
    "name": "form17_answers",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": null
  }));

  app.save(new Collection({
    "createRule": null,
    "deleteRule": null,
    "fields": [
      idField,
      relation("relation1800000107", "answer", "pbc_1800000011", true, true),
      {
        "help": "",
        "hidden": false,
        "id": "number1800000108",
        "max": 5,
        "min": 1,
        "name": "stage",
        "onlyInt": true,
        "presentable": false,
        "required": true,
        "system": false,
        "type": "number"
      },
      relation("relation1800000109", "by", "_pb_users_auth_", true),
      text("text1800000110", "from_answer", 3),
      text("text1800000111", "to_answer", 3),
      text("text1800000112", "from_remarks", 2000),
      text("text1800000113", "to_remarks", 2000),
      created
    ],
    "id": "pbc_1800000012",
    "indexes": [
      "CREATE INDEX `idx_form17_changes_answer` ON `form17_changes` (`answer`)"
    ],
    "listRule": null,
    "name": "form17_changes",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": null
  }));

  const versions = app.findCollectionByNameOrId("pbc_1800000006");
  versions.fields.add(new Field(text("text1800000114", "form17_suggestions", 5000)));
  return app.save(versions);
}, (app) => {
  const versions = app.findCollectionByNameOrId("pbc_1800000006");
  versions.fields.removeById("text1800000114");
  app.save(versions);

  app.delete(app.findCollectionByNameOrId("pbc_1800000012"));
  return app.delete(app.findCollectionByNameOrId("pbc_1800000011"));
})
