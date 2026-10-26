/// <reference path="../pb_data/types.d.ts" />
// The prospectus duplicate action writes the new prospectus and its items in
// one atomic batch request. maxRequests must stay >= MAX_BATCH_REQUESTS in
// lib/prospectus-duplicate.ts.
migrate((app) => {
  const settings = app.settings();
  settings.batch.enabled = true;
  settings.batch.maxRequests = 500;
  settings.batch.timeout = 10;

  return app.save(settings);
}, (app) => {
  const settings = app.settings();
  settings.batch.enabled = false;

  return app.save(settings);
})
