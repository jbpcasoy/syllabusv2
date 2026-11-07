/// <reference path="../pb_data/types.d.ts" />
// Undo approval: an admin takes back a syllabus's latest approval, one stage
// at a time. syllabus_events.type and audit_log.action gain approval_undone
// (the timeline keeps the original "approved" row and adds this one after
// it), and notifications.kind gains approval_undone for the lead and the
// stage now waiting.
const CHANGES = [
  // [collection, field, values before]
  ["pbc_1800000016", "select1800000146", ["submitted", "approved", "returned", "resubmitted", "filed", "scan_returned"]],
  ["pbc_1800000018", "select1800000168", ["submitted", "approved", "returned", "resubmitted", "filed", "scan_returned", "lead.transferred", "file.uploaded"]],
  ["pbc_1800000017", "select1800000155", ["review_requested", "approved", "final_approved", "returned", "reference_requested", "reference_approved", "reference_revoked", "reference_withdrawn", "reference_stopped"]],
]

const setValues = (app, withUndo) => {
  for (const [collectionId, fieldId, before] of CHANGES) {
    const collection = app.findCollectionByNameOrId(collectionId)
    const field = collection.fields.getById(fieldId)
    field.values = withUndo ? before.concat(["approval_undone"]) : before
    app.save(collection)
  }
}

migrate((app) => setValues(app, true), (app) => setValues(app, false))
