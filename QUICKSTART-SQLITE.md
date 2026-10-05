# Session 1 — SQLite setup

Use this route when Podman, Docker or a PostgreSQL server is unavailable. Bun 1.4.0 includes the SQLite driver; no separate database installation is needed. Each member uses their own local files.

## 1. Prepare

Import the session ZIP into the team repository as described in `QUICKSTART.md`. Install Git, Bun 1.4.0 and Copilot CLI, and sign in with `copilot login`. Skip the PostgreSQL/container steps for this Session 1 route.

## 2. Configure

From the application root:

```bash
cp .env.example .env.local
```

Replace the active `DATABASE_URL` line with:

```dotenv
DATABASE_URL=sqlite:./.loom/session-01.sqlite
```

Leave `DATABASE_URL_TEST` unset to derive `.loom/session-01_test.sqlite`. If setting it explicitly, use a different SQLite file. Never use the application file for tests. Paths are resolved from the application root. On macOS, follow the CLI path advice from preflight if needed.

## 3. Install and start

```bash
bun install --frozen-lockfile
bun run db:migrate
bun run db:seed
bun run preflight
bun run typecheck
bun run lint
bun run test
bun run dev
```

The starter has exactly 13 expected test failures listed in `docs/course/session-01/workshop-tests.json`. Complete the three workshop TODOs to make them pass. The development console normally opens at `http://localhost:5173`.

## 4. Keep the data

Runs and stored analysis persist in `.loom/session-01.sqlite` after restarting the API. SQLite may also create `-wal` and `-shm` files. These files and `.env.local` are ignored by Git and excluded from handover archives. Do not delete application data to fix a test failure.

## 5. Scope and recovery

SQLite is a Session 1 fallback. Later sessions retain their PostgreSQL requirements and provide a fresh baseline. Selecting a PostgreSQL URL keeps the PostgreSQL route; connection failures are reported without automatically switching storage. For SQLite permission errors, use a directory you can write to, then rerun migration and preflight.
