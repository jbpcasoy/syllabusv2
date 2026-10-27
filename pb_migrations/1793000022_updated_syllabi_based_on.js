/// <reference path="../pb_data/types.d.ts" />
// The previous school year's approved or filed syllabus for the same
// course, program and semester (lib/syllabus-previous.ts). Set automatically
// on create, never by hand; its authors are acknowledged by the current one.
migrate((app) => {
  const syllabi = app.findCollectionByNameOrId("pbc_1800000005");
  syllabi.fields.add(new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_1800000005",
    "help": "",
    "hidden": false,
    "id": "relation1800000136",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "based_on",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }));
  return app.save(syllabi);
}, (app) => {
  const syllabi = app.findCollectionByNameOrId("pbc_1800000005");
  syllabi.fields.removeById("relation1800000136");
  return app.save(syllabi);
})
