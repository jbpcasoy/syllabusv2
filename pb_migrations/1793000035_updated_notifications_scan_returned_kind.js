/// <reference path="../pb_data/types.d.ts" />
// notifications.kind gains scan_returned: when a reviewer returns the signed
// scan as invalid, the lead is told why and asked to upload a new one.
const BEFORE = ["review_requested", "approved", "final_approved", "returned", "reference_requested", "reference_approved", "reference_revoked", "reference_withdrawn", "reference_stopped", "approval_undone", "scan_filed"]

const setValues = (app, values) => {
  const collection = app.findCollectionByNameOrId("pbc_1800000017")
  const field = collection.fields.getById("select1800000155")
  field.values = values
  app.save(collection)
}

migrate(
  (app) => setValues(app, BEFORE.concat(["scan_returned"])),
  (app) => setValues(app, BEFORE),
)
