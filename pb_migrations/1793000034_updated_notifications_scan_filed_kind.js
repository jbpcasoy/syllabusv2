/// <reference path="../pb_data/types.d.ts" />
// notifications.kind gains scan_filed: when the lead files the signed scan,
// every chain holder (who may return it as invalid) is told.
const BEFORE = ["review_requested", "approved", "final_approved", "returned", "reference_requested", "reference_approved", "reference_revoked", "reference_withdrawn", "reference_stopped", "approval_undone"]

const setValues = (app, values) => {
  const collection = app.findCollectionByNameOrId("pbc_1800000017")
  const field = collection.fields.getById("select1800000155")
  field.values = values
  app.save(collection)
}

migrate(
  (app) => setValues(app, BEFORE.concat(["scan_filed"])),
  (app) => setValues(app, BEFORE),
)
