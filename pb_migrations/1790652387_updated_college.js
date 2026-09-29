/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_998897896")

  // update collection data
  unmarshal({
    "name": "colleges"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_998897896")

  // update collection data
  unmarshal({
    "name": "college"
  }, collection)

  return app.save(collection)
})
