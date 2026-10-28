/// <reference path="../pb_data/types.d.ts" />
// Phase 4 timeline. syllabus_events is append-only: one row per workflow
// transition, written in the same batch as the transition. syllabi gains
// status_changed_at so queues can sort by how long a syllabus has waited.
// Existing syllabi are backfilled from submitted_at, syllabus_reviews and
// syllabus_signed_copies; resubmits from before this migration left no
// trace and are not recovered.
migrate((app) => {
  const relation = (id, name, collectionId, required, cascadeDelete = false) => ({
    "cascadeDelete": cascadeDelete,
    "collectionId": collectionId,
    "help": "",
    "hidden": false,
    "id": id,
    "maxSelect": 1,
    "minSelect": 0,
    "name": name,
    "presentable": false,
    "required": required,
    "system": false,
    "type": "relation"
  });
  const text = (id, name, max) => ({
    "autogeneratePattern": "",
    "help": "",
    "hidden": false,
    "id": id,
    "max": max,
    "min": 0,
    "name": name,
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  });

  const events = new Collection({
    "createRule": null,
    "deleteRule": null,
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "help": "",
        "hidden": false,
        "id": "text3208210256",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      relation("relation1800000145", "syllabus", "pbc_1800000005", true, true),
      {
        "help": "",
        "hidden": false,
        "id": "select1800000146",
        "maxSelect": 1,
        "name": "type",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": ["submitted", "approved", "returned", "resubmitted", "filed", "scan_returned"]
      },
      {
        "help": "",
        "hidden": false,
        "id": "number1800000147",
        "max": 5,
        "min": 0,
        "name": "stage",
        "onlyInt": true,
        "presentable": false,
        "required": false,
        "system": false,
        "type": "number"
      },
      relation("relation1800000148", "version", "pbc_1800000006", false),
      relation("relation1800000149", "actor", "_pb_users_auth_", true),
      text("text1800000150", "approval_code", 40),
      text("text1800000151", "reason", 500),
      {
        "hidden": false,
        "id": "autodate2990389176",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ],
    "id": "pbc_1800000016",
    "indexes": [
      "CREATE INDEX `idx_syllabus_events_syllabus_created` ON `syllabus_events` (`syllabus`, `created`)"
    ],
    "listRule": null,
    "name": "syllabus_events",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": null
  });
  app.save(events);

  const syllabi = app.findCollectionByNameOrId("pbc_1800000005");
  syllabi.fields.add(new Field({
    "help": "",
    "hidden": false,
    "id": "date1800000152",
    "max": "",
    "min": "",
    "name": "status_changed_at",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }));
  syllabi.indexes.push(
    "CREATE INDEX `idx_syllabi_queue` ON `syllabi` (`status`, `stage`, `status_changed_at`)"
  );
  app.save(syllabi);

  // Backfill. `created` is an autodate, so it is overwritten afterwards.
  const latest = {};
  const add = (syllabusId, at, fields) => {
    if (!at || !fields.actor) return;
    const record = new Record(events);
    record.set("syllabus", syllabusId);
    for (const [key, value] of Object.entries(fields)) record.set(key, value);
    app.save(record);
    app.db()
      .newQuery("UPDATE `syllabus_events` SET `created` = {:at} WHERE `id` = {:id}")
      .bind({ at: at, id: record.id })
      .execute();
    if (!latest[syllabusId] || latest[syllabusId] < at) latest[syllabusId] = at;
  };

  for (const s of app.findRecordsByFilter("syllabi", "submitted_at != ''", "", 0, 0)) {
    add(s.id, s.getString("submitted_at"), {
      type: "submitted",
      stage: 1,
      actor: s.getString("lead"),
    });
  }
  for (const r of app.findAllRecords("syllabus_reviews")) {
    const approved = r.getString("decision") === "approve";
    add(r.getString("syllabus"), r.getString("created"), {
      type: approved ? "approved" : "returned",
      stage: r.getInt("stage"),
      version: r.getString("version"),
      actor: r.getString("reviewer"),
      approval_code: approved ? r.getString("approval_code") : "",
    });
  }
  for (const c of app.findAllRecords("syllabus_signed_copies")) {
    const syllabusId = c.getString("syllabus");
    add(syllabusId, c.getString("created"), {
      type: "filed",
      stage: 0,
      actor: c.getString("uploaded_by"),
    });
    if (c.getString("status") === "returned") {
      add(syllabusId, c.getString("returned_at"), {
        type: "scan_returned",
        stage: 0,
        actor: c.getString("returned_by"),
        reason: c.getString("reason"),
      });
    }
  }

  for (const [syllabusId, at] of Object.entries(latest)) {
    app.db()
      .newQuery("UPDATE `syllabi` SET `status_changed_at` = {:at} WHERE `id` = {:id}")
      .bind({ at: at, id: syllabusId })
      .execute();
  }
}, (app) => {
  const syllabi = app.findCollectionByNameOrId("pbc_1800000005");
  syllabi.indexes = syllabi.indexes.filter((index) => !index.includes("idx_syllabi_queue"));
  syllabi.fields.removeById("date1800000152");
  app.save(syllabi);

  return app.delete(app.findCollectionByNameOrId("pbc_1800000016"));
})
