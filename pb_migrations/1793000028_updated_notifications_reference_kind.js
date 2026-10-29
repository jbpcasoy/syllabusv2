/// <reference path="../pb_data/types.d.ts" />
// notifications gains the kind reference_requested: the source lead hears
// when a program chair asks to reference their syllabus. That message isn't
// about a review stage, so stage may now be 0.
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1800000017")

  const kind = collection.fields.getById("select1800000155")
  kind.values = ["review_requested", "approved", "final_approved", "returned", "reference_requested"]

  const stage = collection.fields.getById("number1800000156")
  stage.min = 0

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1800000017")

  const kind = collection.fields.getById("select1800000155")
  kind.values = ["review_requested", "approved", "final_approved", "returned"]

  const stage = collection.fields.getById("number1800000156")
  stage.min = 1

  return app.save(collection)
})
