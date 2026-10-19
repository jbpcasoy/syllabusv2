/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3890012683")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX idx_department_heads_user_department ON department_heads (user, department)"
    ]
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3890012683")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX `idx_department_chairs_user_dept` ON `department_heads` (\n  `user`,\n  `department`\n)"
    ]
  }, collection)

  return app.save(collection)
})
