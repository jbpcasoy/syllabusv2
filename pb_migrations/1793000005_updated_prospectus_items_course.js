/// <reference path="../pb_data/types.d.ts" />
// Converts prospectus_items.subject_code / title into a relation to courses.
// A course is created for each distinct code; its owning program is the
// program of the first prospectus that lists it (fix GE courses by hand after).
migrate((app) => {
  const items = app.findCollectionByNameOrId("pbc_798843253");
  const prospectuses = app.findCollectionByNameOrId("pbc_1521651236");
  const courses = app.findCollectionByNameOrId("pbc_1800000003");

  // 1. The old index references subject_code; drop it and add the relation.
  items.indexes = [];
  items.fields.addAt(2, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_1800000003",
    "help": "",
    "hidden": false,
    "id": "relation1800000006",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "course",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }));
  app.save(items);

  // 2. Fill it, oldest first so the "first prospectus" owner is stable.
  const seen = {};
  const duplicates = [];
  const records = app.findRecordsByFilter(items, "id != ''", "created", 0, 0);
  for (const record of records) {
    const code = record.getString("subject_code").trim().replace(/\s+/g, " ");
    const title = record.getString("title").trim();
    const prospectusId = record.getString("prospectus");

    let course;
    try {
      course = app.findFirstRecordByData(courses, "code", code);
      if (course.getString("title") !== title) {
        console.log(`[courses] ${code}: kept title "${course.getString("title")}", item ${record.id} said "${title}"`);
      }
    } catch {
      const prospectus = app.findRecordById(prospectuses, prospectusId);
      course = new Record(courses);
      course.set("code", code);
      course.set("title", title);
      course.set("program", prospectus.getString("program"));
      app.save(course);
    }

    const key = `${prospectusId}/${course.id}`;
    if (seen[key]) {
      duplicates.push(`${code} in prospectus ${prospectusId} (items ${seen[key]} and ${record.id})`);
      continue;
    }
    seen[key] = record.id;

    record.set("course", course.id);
    app.save(record);
  }

  // The new unique key is (prospectus, course). Refuse to guess which row wins.
  if (duplicates.length > 0) {
    throw new Error(
      "A course is listed more than once in the same prospectus. " +
      "Delete one of each pair, then run the migration again:\n" +
      duplicates.join("\n")
    );
  }

  // 3. Require it, drop the free-text fields and add the new unique index.
  items.fields.addAt(2, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_1800000003",
    "help": "",
    "hidden": false,
    "id": "relation1800000006",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "course",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }));
  items.fields.removeById("text3856643139"); // subject_code
  items.fields.removeById("text724990059"); // title
  items.indexes = [
    "CREATE UNIQUE INDEX `idx_prospectus_items_prospectus_course` ON `prospectus_items` (`prospectus`, `course`)"
  ];

  return app.save(items);
}, (app) => {
  const items = app.findCollectionByNameOrId("pbc_798843253");
  const courses = app.findCollectionByNameOrId("pbc_1800000003");

  const text = (id, name, max, required) => new Field({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": id,
    "max": max,
    "min": required ? 1 : 0,
    "name": name,
    "pattern": "",
    "presentable": name === "subject_code",
    "primaryKey": false,
    "required": required,
    "system": false,
    "type": "text"
  });

  items.indexes = [];
  items.fields.add(text("text3856643139", "subject_code", 20, false));
  items.fields.add(text("text724990059", "title", 255, false));
  app.save(items);

  for (const record of app.findAllRecords(items)) {
    const course = app.findRecordById(courses, record.getString("course"));
    record.set("subject_code", course.getString("code"));
    record.set("title", course.getString("title"));
    app.save(record);
  }

  items.fields.removeById("relation1800000006");
  items.fields.add(text("text3856643139", "subject_code", 20, true));
  items.fields.add(text("text724990059", "title", 255, true));
  items.indexes = [
    "CREATE UNIQUE INDEX `idx_prospectus_items_unique` ON `prospectus_items` (`prospectus`, `subject_code`, `year_level`, `semester`)"
  ];

  return app.save(items);
})
