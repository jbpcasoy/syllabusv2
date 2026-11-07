/// <reference path="../pb_data/types.d.ts" />
// notifications.kind gains justification_submitted: when the lead uploads
// the signed justification letter, every chain holder is asked to check it.
const BEFORE = ["review_requested", "approved", "final_approved", "returned", "reference_requested", "reference_approved", "reference_revoked", "reference_withdrawn", "reference_stopped", "approval_undone", "scan_filed", "scan_returned"]

const setValues = (app, values) => {
  const collection = app.findCollectionByNameOrId("pbc_1800000017")
  const field = collection.fields.getById("select1800000155")
  field.values = values
  app.save(collection)
}

migrate(
  (app) => setValues(app, BEFORE.concat(["justification_submitted"])),
  (app) => setValues(app, BEFORE),
)
