/// <reference path="../pb_data/types.d.ts" />
// A returned syllabus keeps `stage` at the returning stage (see
// lib/syllabus-workflow.ts), so returned_stage only duplicated it.
migrate((app) => {
  const syllabi = app.findCollectionByNameOrId("pbc_1800000005");

  syllabi.fields.removeById("number1800000084");

  return app.save(syllabi);
}, (app) => {
  const syllabi = app.findCollectionByNameOrId("pbc_1800000005");

  syllabi.fields.add(new Field({
    "help": "",
    "hidden": false,
    "id": "number1800000084",
    "max": 6,
    "min": 0,
    "name": "returned_stage",
    "onlyInt": true,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }));

  return app.save(syllabi);
})
