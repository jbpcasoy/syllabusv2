/// <reference path="../pb_data/types.d.ts" />
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
        "cascadeDelete": false,
        "collectionId": "pbc_1800000001",
        "help": "",
        "hidden": false,
        "id": "relation1800000002",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "school_year",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "help": "",
        "hidden": false,
        "id": "select1800000002",
        "maxSelect": 1,
        "name": "semester",
        "presentable": true,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "First Semester",
          "Second Semester",
          "Summer"
        ]
      },
      {
        "help": "",
        "hidden": false,
        "id": "bool1800000002",
        "name": "open",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      },
      {
        "help": "",
        "hidden": false,
        "id": "date1800000002",
        "max": "",
        "min": "",
        "name": "submission_deadline",
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
    "id": "pbc_1800000002",
    "indexes": [
      "CREATE UNIQUE INDEX `idx_terms_school_year_semester` ON `terms` (`school_year`, `semester`)"
    ],
    "listRule": null,
    "name": "terms",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": null
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1800000002");

  return app.delete(collection);
})
