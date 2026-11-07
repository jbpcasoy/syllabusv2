/// <reference path="../pb_data/types.d.ts" />
// notifications.kind gains justification_returned: when a chain holder or
// admin returns the signed justification letter, the lead is told why.
const BEFORE = ["review_requested", "approved", "final_approved", "returned", "reference_requested", "reference_approved", "reference_revoked", "reference_withdrawn", "reference_stopped", "approval_undone", "scan_filed", "scan_returned", "justification_submitted"]

const setValues = (app, values) => {
  const collection = app.findCollectionByNameOrId("pbc_1800000017")
  const field = collection.fields.getById("select1800000155")
  field.values = values
  app.save(collection)
}

migrate(
  (app) => setValues(app, BEFORE.concat(["justification_returned"])),
  (app) => setValues(app, BEFORE),
)
