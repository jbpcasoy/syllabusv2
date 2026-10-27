/// <reference path="../pb_data/types.d.ts" />
// Phase 3 review states. `submitted` keeps meaning "in review at `stage`".
// ref_seq is assigned at first submit and prefixes every approval code of the
// syllabus (SYL-<yy><yy>-<sem>-<seq>-S<stage>); 0 means not yet assigned.
// returned_stage is the stage a returned syllabus resumes at; 0 otherwise.
migrate((app) => {
  const syllabi = app.findCollectionByNameOrId("pbc_1800000005");

  syllabi.fields.add(new Field({
    "help": "",
    "hidden": false,
    "id": "select1800000056",
    "maxSelect": 1,
    "name": "status",
    "presentable": true,
    "required": true,
    "system": false,
    "type": "select",
    "values": [
      "draft",
      "submitted",
      "returned",
      "approved",
      "filed"
    ]
  }));
  syllabi.fields.add(new Field({
    "help": "",
    "hidden": false,
    "id": "number1800000083",
    "max": null,
    "min": 0,
    "name": "ref_seq",
    "onlyInt": true,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }));
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
  syllabi.fields.add(new Field({
    "help": "",
    "hidden": false,
    "id": "date1800000085",
    "max": "",
    "min": "",
    "name": "returned_at",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }));
  syllabi.indexes.push(
    "CREATE UNIQUE INDEX `idx_syllabi_term_ref_seq` ON `syllabi` (`term`, `ref_seq`) WHERE `ref_seq` > 0"
  );

  return app.save(syllabi);
}, (app) => {
  const syllabi = app.findCollectionByNameOrId("pbc_1800000005");

  syllabi.indexes = syllabi.indexes.filter(
    (index) => !index.includes("idx_syllabi_term_ref_seq")
  );
  syllabi.fields.removeById("number1800000083");
  syllabi.fields.removeById("number1800000084");
  syllabi.fields.removeById("date1800000085");
  syllabi.fields.add(new Field({
    "help": "",
    "hidden": false,
    "id": "select1800000056",
    "maxSelect": 1,
    "name": "status",
    "presentable": true,
    "required": true,
    "system": false,
    "type": "select",
    "values": [
      "draft",
      "submitted"
    ]
  }));

  return app.save(syllabi);
})
