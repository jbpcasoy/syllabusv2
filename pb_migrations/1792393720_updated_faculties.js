/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2125759099")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX `idx_faculty_user_program` ON `faculties` (\n  `user`,\n  `program`\n)"
    ]
  }, collection)

  // remove field
  collection.fields.removeById("relation3441287562")

  // add field
  collection.fields.addAt(3, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_2970041692",
    "help": "",
    "hidden": false,
    "id": "relation2465036164",
    "maxSelect": 0,
    "minSelect": 0,
    "name": "program",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2125759099")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX `idx_faculty_user_department` ON `faculties` (\n  `user`,\n  `department`\n)"
    ]
  }, collection)

  // add field
  collection.fields.addAt(2, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_3865025440",
    "help": "",
    "hidden": false,
    "id": "relation3441287562",
    "maxSelect": 0,
    "minSelect": 0,
    "name": "department",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  // remove field
  collection.fields.removeById("relation2465036164")

  return app.save(collection)
})
