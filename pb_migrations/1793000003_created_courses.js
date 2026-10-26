/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const number = (id, name, max) => ({
    "help": "",
    "hidden": false,
    "id": id,
    "max": max,
    "min": 0,
    "name": name,
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
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
      {
        "autogeneratePattern": "",
        "help": "",
        "hidden": false,
        "id": "text1800000003",
        "max": 20,
        "min": 1,
        "name": "code",
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
        "id": "text1800000004",
        "max": 255,
        "min": 1,
        "name": "title",
        "pattern": "",
        "presentable": true,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "cascadeDelete": false,
        "collectionId": "pbc_2970041692",
        "help": "",
        "hidden": false,
        "id": "relation1800000003",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "program",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      number("number1800000001", "credit_units", 30),
      number("number1800000002", "lec_units", 30),
      number("number1800000003", "lab_units", 30),
      number("number1800000004", "nominal_duration_hours", 1000),
      {
        "autogeneratePattern": "",
        "help": "",
        "hidden": false,
        "id": "text1800000005",
        "max": 255,
        "min": 0,
        "name": "prerequisite_note",
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
    "id": "pbc_1800000003",
    "indexes": [
      "CREATE UNIQUE INDEX `idx_courses_code` ON `courses` (`code`)"
    ],
    "listRule": null,
    "name": "courses",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": null
  });

  app.save(collection);

  // A self-relation can only point at a collection that already exists.
  collection.fields.addAt(9, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_1800000003",
    "help": "",
    "hidden": false,
    "id": "relation1800000004",
    "maxSelect": 20,
    "minSelect": 0,
    "name": "prerequisites",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }));

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1800000003");

  return app.delete(collection);
})
