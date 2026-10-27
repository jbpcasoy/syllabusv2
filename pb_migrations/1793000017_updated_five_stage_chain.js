/// <reference path="../pb_data/types.d.ts" />
// The review chain has five stages. Stage 1 is the program review: the
// program chair for graduate programs, the department head for undergraduate
// ones (programs.level). Existing programs become undergraduate; mark the
// graduate ones by hand.
migrate((app) => {
  const levelField = (required) => new Field({
    "help": "",
    "hidden": false,
    "id": "select1800000097",
    "maxSelect": 1,
    "name": "level",
    "presentable": false,
    "required": required,
    "system": false,
    "type": "select",
    "values": [
      "undergraduate",
      "graduate"
    ]
  });

  const programs = app.findCollectionByNameOrId("pbc_2970041692");
  programs.fields.add(levelField(false));
  app.save(programs);

  for (const record of app.findAllRecords(programs)) {
    record.set("level", "undergraduate");
    app.save(record);
  }

  programs.fields.add(levelField(true));
  app.save(programs);

  for (const [collectionId, fieldId] of [
    ["pbc_1800000005", "number1800000057"],
    ["pbc_1800000008", "number1800000087"],
    ["pbc_1800000009", "number1800000092"],
  ]) {
    const collection = app.findCollectionByNameOrId(collectionId);
    collection.fields.getById(fieldId).max = 5;
    app.save(collection);
  }
}, (app) => {
  for (const [collectionId, fieldId] of [
    ["pbc_1800000005", "number1800000057"],
    ["pbc_1800000008", "number1800000087"],
    ["pbc_1800000009", "number1800000092"],
  ]) {
    const collection = app.findCollectionByNameOrId(collectionId);
    collection.fields.getById(fieldId).max = 6;
    app.save(collection);
  }

  const programs = app.findCollectionByNameOrId("pbc_2970041692");
  programs.fields.removeById("select1800000097");
  app.save(programs);
})
