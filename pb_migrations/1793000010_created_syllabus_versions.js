/// <reference path="../pb_data/types.d.ts" />
// Append-only PDF versions. The file is protected, so it is only reachable
// through the scoped route app/api/syllabus/[id]/version/[versionId]/file.
// maxSize must match MAX_PDF_BYTES in types/syllabus-version.ts.
migrate((app) => {
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
      {
        "cascadeDelete": true,
        "collectionId": "pbc_1800000005",
        "help": "",
        "hidden": false,
        "id": "relation1800000061",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "syllabus",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "help": "",
        "hidden": false,
        "id": "number1800000062",
        "max": null,
        "min": 1,
        "name": "version_no",
        "onlyInt": true,
        "presentable": true,
        "required": true,
        "system": false,
        "type": "number"
      },
      {
        "help": "",
        "hidden": false,
        "id": "file1800000063",
        "maxSelect": 1,
        "maxSize": 20971520,
        "mimeTypes": [
          "application/pdf"
        ],
        "name": "file",
        "presentable": false,
        "protected": true,
        "required": true,
        "system": false,
        "thumbs": [],
        "type": "file"
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "help": "",
        "hidden": false,
        "id": "relation1800000064",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "uploaded_by",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "autogeneratePattern": "",
        "help": "",
        "hidden": false,
        "id": "text1800000065",
        "max": 1000,
        "min": 0,
        "name": "notes",
        "pattern": "",
        "presentable": false,
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
    "id": "pbc_1800000006",
    "indexes": [
      "CREATE UNIQUE INDEX `idx_syllabus_versions_syllabus_version` ON `syllabus_versions` (`syllabus`, `version_no`)"
    ],
    "listRule": null,
    "name": "syllabus_versions",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": null
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1800000006");

  return app.delete(collection);
})
