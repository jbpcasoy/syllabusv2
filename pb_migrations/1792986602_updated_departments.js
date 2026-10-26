/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3865025440")

  // update field
  collection.fields.addAt(2, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_998897896",
    "help": "",
    "hidden": false,
    "id": "relation2866448130",
    "maxSelect": 0,
    "minSelect": 0,
    "name": "college",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3865025440")

  // update field
  collection.fields.addAt(2, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_998897896",
    "help": "",
    "hidden": false,
    "id": "relation2866448130",
    "maxSelect": 0,
    "minSelect": 0,
    "name": "college",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
})
