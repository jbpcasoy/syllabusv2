/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1521651236")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX `idx_prospectuses_program_school_year` ON `prospectuses` (\n  `program`,\n  `school_year`\n)"
    ],
    "name": "prospectuses"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1521651236")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX `idx_prospectuses_program_school_year` ON `prospectus` (\n  `program`,\n  `school_year`\n)"
    ],
    "name": "prospectus"
  }, collection)

  return app.save(collection)
})
