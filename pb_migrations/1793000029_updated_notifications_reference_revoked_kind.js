/// <reference path="../pb_data/types.d.ts" />
// notifications gains the kind reference_revoked: the referencing program's
// active chairs hear when the source lead (or an admin) revokes an approved
// reference. Like reference_requested, it uses stage 0.
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1800000017")

  const kind = collection.fields.getById("select1800000155")
  kind.values = ["review_requested", "approved", "final_approved", "returned", "reference_requested", "reference_revoked"]

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1800000017")

  const kind = collection.fields.getById("select1800000155")
  kind.values = ["review_requested", "approved", "final_approved", "returned", "reference_requested"]

  return app.save(collection)
})
