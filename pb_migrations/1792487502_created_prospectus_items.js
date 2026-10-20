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
        "collectionId": "pbc_1521651236",
        "help": "",
        "hidden": false,
        "id": "relation2751643316",
        "maxSelect": 0,
        "minSelect": 0,
        "name": "prospectus",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "help": "",
        "hidden": false,
        "id": "select4147678957",
        "maxSelect": 0,
        "name": "semester",
        "presentable": false,
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
        "id": "select965010116",
        "maxSelect": 0,
        "name": "year_level",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "First Year",
          "Second Year",
          "Third Year",
          "Fourth Year",
          "Masteral",
          "Doctoral"
        ]
      },
      {
        "autogeneratePattern": "",
        "help": "",
        "hidden": false,
        "id": "text3856643139",
        "max": 10,
        "min": 1,
        "name": "subject_code",
        "pattern": "",
        "presentable": true,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "autogeneratePattern": "",
        "help": "",
        "hidden": false,
        "id": "text724990059",
        "max": 255,
        "min": 1,
        "name": "title",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
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
    "id": "pbc_798843253",
    "indexes": [
      "CREATE UNIQUE INDEX `idx_prospectus_items_unique` ON `prospectus_items` (`prospectus`, `subject_code`, `year_level`, `semester`)"
    ],
    "listRule": null,
    "name": "prospectus_items",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": null
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_798843253");

  return app.delete(collection);
})
