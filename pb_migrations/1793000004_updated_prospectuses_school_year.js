/// <reference path="../pb_data/types.d.ts" />
// Converts prospectuses.school_year from "2026-2027" text into a relation to
// school_years, creating any school year that doesn't exist yet.
migrate((app) => {
  const prospectuses = app.findCollectionByNameOrId("pbc_1521651236");
  const schoolYears = app.findCollectionByNameOrId("pbc_1800000001");

  // 1. Free the name: the index references school_year, so drop it first.
  prospectuses.indexes = [];
  prospectuses.fields.addAt(2, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "text4205489370",
    "max": 9,
    "min": 9,
    "name": "school_year_label",
    "pattern": "^\\d{4}-\\d{4}$",
    "presentable": false,
    "primaryKey": false,
    "required": true,
    "system": false,
    "type": "text"
  }));
  app.save(prospectuses);

  // 2. Add the relation, optional until every row is filled.
  prospectuses.fields.addAt(3, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_1800000001",
    "help": "",
    "hidden": false,
    "id": "relation1800000005",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "school_year",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }));
  app.save(prospectuses);

  // 3. Fill it.
  for (const record of app.findAllRecords(prospectuses)) {
    const label = record.getString("school_year_label");
    let schoolYear;
    try {
      schoolYear = app.findFirstRecordByData(schoolYears, "label", label);
    } catch {
      schoolYear = new Record(schoolYears);
      schoolYear.set("label", label);
      app.save(schoolYear);
    }
    record.set("school_year", schoolYear.id);
    app.save(record);
  }

  // 4. Require it, drop the text field and restore the unique index.
  prospectuses.fields.addAt(3, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_1800000001",
    "help": "",
    "hidden": false,
    "id": "relation1800000005",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "school_year",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }));
  prospectuses.fields.removeById("text4205489370");
  prospectuses.indexes = [
    "CREATE UNIQUE INDEX `idx_prospectuses_program_school_year` ON `prospectuses` (`program`, `school_year`)"
  ];

  return app.save(prospectuses);
}, (app) => {
  const prospectuses = app.findCollectionByNameOrId("pbc_1521651236");
  const schoolYears = app.findCollectionByNameOrId("pbc_1800000001");

  prospectuses.indexes = [];
  prospectuses.fields.addAt(2, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_1800000001",
    "help": "",
    "hidden": false,
    "id": "relation1800000005",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "school_year_ref",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }));
  app.save(prospectuses);

  prospectuses.fields.addAt(3, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "text4205489370",
    "max": 9,
    "min": 0,
    "name": "school_year",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }));
  app.save(prospectuses);

  for (const record of app.findAllRecords(prospectuses)) {
    const schoolYear = app.findRecordById(schoolYears, record.getString("school_year_ref"));
    record.set("school_year", schoolYear.getString("label"));
    app.save(record);
  }

  prospectuses.fields.removeById("relation1800000005");
  prospectuses.fields.addAt(2, new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": "text4205489370",
    "max": 9,
    "min": 9,
    "name": "school_year",
    "pattern": "^\\d{4}-\\d{4}$",
    "presentable": false,
    "primaryKey": false,
    "required": true,
    "system": false,
    "type": "text"
  }));
  prospectuses.indexes = [
    "CREATE UNIQUE INDEX `idx_prospectuses_program_school_year` ON `prospectuses` (\n  `program`,\n  `school_year`\n)"
  ];

  return app.save(prospectuses);
})
