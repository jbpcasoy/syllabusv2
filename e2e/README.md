# End-to-end tests

Playwright drives Chromium against the production build of the app and a throwaway PocketBase. Vitest never reads this folder.

```sh
npx playwright install chromium   # once
npm run test:e2e                  # build, start, seed, run, tear down
```

What `npm run test:e2e` does (`global-setup.ts`):

1. Creates a temporary data folder and runs every migration from `pb_migrations/` into it, with `pb_hooks/` loaded and S3 switched off.
2. Starts PocketBase on `127.0.0.1:8099` and seeds it (`seed.ts`): one college chain with every role filled, an open term, a published prospectus with four courses, and verified users who all sign in with `PASSWORD` from `env.ts`.
3. Builds the app into `.next-e2e/` (never `.next/`, so a running `next dev` is safe) and starts it on `localhost:3099`.

Teardown stops both processes (the whole process tree, on Windows) and deletes the data folder.

The specs share one database and run in one worker, in file order.

| Variable | Effect |
| --- | --- |
| `E2E_SKIP_BUILD=1` | Reuse the last `.next-e2e` build. Only safe when nothing under `app/`, `components/` or `lib/` changed. |
| `E2E_VERBOSE=1` | Print PocketBase and app stdout. |
| `E2E_KEEP_DATA=1` | Keep the temporary PocketBase folder for inspection. |
| `PB_BIN` | PocketBase binary (default `pocketbase`, as `npm run pb`). |

If a run says port 8099 or 3099 is already answering, a previous run left a process behind. On Windows, use `netstat -ano | findstr :3099` and then `taskkill /PID <pid> /T /F`.
