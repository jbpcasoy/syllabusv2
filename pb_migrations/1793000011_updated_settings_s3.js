/// <reference path="../pb_data/types.d.ts" />
// Moves file storage to S3 when S3_BUCKET is set in PocketBase's environment.
// With it unset (local dev) this does nothing and files stay on disk.
// Credentials live only in the environment, never in the repo.
migrate((app) => {
  const bucket = $os.getenv("S3_BUCKET");
  if (!bucket) return;

  const settings = app.settings();
  settings.s3.enabled = true;
  settings.s3.bucket = bucket;
  settings.s3.region = $os.getenv("S3_REGION");
  settings.s3.endpoint = $os.getenv("S3_ENDPOINT");
  settings.s3.accessKey = $os.getenv("S3_ACCESS_KEY");
  settings.s3.secret = $os.getenv("S3_SECRET");
  settings.s3.forcePathStyle = $os.getenv("S3_FORCE_PATH_STYLE") === "true";

  return app.save(settings);
}, (app) => {
  const bucket = $os.getenv("S3_BUCKET");
  const settings = app.settings();
  // Only undo what the up migration set.
  if (!bucket || settings.s3.bucket !== bucket) return;

  settings.s3.enabled = false;

  return app.save(settings);
})
