/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2970041692")

  // add field
  collection.fields.addAt(3, new Field({
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

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2970041692")

  // remove field
  collection.fields.removeById("relation3441287562")

  return app.save(collection)
})
