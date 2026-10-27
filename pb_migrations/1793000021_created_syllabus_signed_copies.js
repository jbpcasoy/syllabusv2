/// <reference path="../pb_data/types.d.ts" />
// Scans of the wet-signed syllabus. The lead uploads one after VPAA approval,
// which files the syllabus. The program reviewer, dean, FDIS chair, CITL
// director, VPAA or an admin may return it as invalid (status "returned",
// with a reason); returned copies are kept. At most one valid copy per
// syllabus. The file is protected: served only through the scoped route.
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

  return app.save(new Collection({
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
      relation("relation1800000129", "syllabus", "pbc_1800000005", true, true),
      {
        "help": "",
        "hidden": false,
        "id": "file1800000130",
        "maxSelect": 1,
        "maxSize": 20971520,
        "mimeTypes": ["application/pdf"],
        "name": "file",
        "presentable": false,
        "protected": true,
        "required": true,
        "system": false,
        "thumbs": [],
        "type": "file"
      },
      relation("relation1800000131", "uploaded_by", "_pb_users_auth_", true),
      {
        "help": "",
        "hidden": false,
        "id": "select1800000132",
        "maxSelect": 1,
        "name": "status",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": ["valid", "returned"]
      },
      {
        "autogeneratePattern": "",
        "help": "",
        "hidden": false,
        "id": "text1800000133",
        "max": 500,
        "min": 0,
        "name": "reason",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      relation("relation1800000134", "returned_by", "_pb_users_auth_", false),
      {
        "help": "",
        "hidden": false,
        "id": "date1800000135",
        "max": "",
        "min": "",
        "name": "returned_at",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "date"
      },
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
    "id": "pbc_1800000014",
    "indexes": [
      "CREATE UNIQUE INDEX `idx_syllabus_signed_copies_valid` ON `syllabus_signed_copies` (`syllabus`) WHERE `status` = 'valid'"
    ],
    "listRule": null,
    "name": "syllabus_signed_copies",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": null
  }));
}, (app) => {
  return app.delete(app.findCollectionByNameOrId("pbc_1800000014"));
})
