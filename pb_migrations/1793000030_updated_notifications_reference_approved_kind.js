/// <reference path="../pb_data/types.d.ts" />
// notifications gains the kind reference_approved: the referencing program's
// active chairs hear when the source lead (or an admin) approves a reference
// request. Like the other reference kinds, it uses stage 0.
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1800000017")

  const kind = collection.fields.getById("select1800000155")
  kind.values = ["review_requested", "approved", "final_approved", "returned", "reference_requested", "reference_approved", "reference_revoked"]

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1800000017")

  const kind = collection.fields.getById("select1800000155")
  kind.values = ["review_requested", "approved", "final_approved", "returned", "reference_requested", "reference_revoked"]

  return app.save(collection)
})
