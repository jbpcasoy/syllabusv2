/// <reference path="../pb_data/types.d.ts" />
// notifications gains the kinds reference_withdrawn and reference_stopped:
// the source syllabus's lead hears when the referencing program withdraws a
// pending request or stops an approved reference. Like the other reference
// kinds, they use stage 0.
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1800000017")

  const kind = collection.fields.getById("select1800000155")
  kind.values = ["review_requested", "approved", "final_approved", "returned", "reference_requested", "reference_approved", "reference_revoked", "reference_withdrawn", "reference_stopped"]

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1800000017")

  const kind = collection.fields.getById("select1800000155")
  kind.values = ["review_requested", "approved", "final_approved", "returned", "reference_requested", "reference_approved", "reference_revoked"]

  return app.save(collection)
})
