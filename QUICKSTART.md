# Loom Campus — Team Quick Start

This guide explains how your team imports a session into its shared repository and how each member runs Loom locally.

It works with any Git host: GitHub, Azure DevOps, GitLab or similar. Where this guide says **pull request**, use your host's equivalent (merge request on GitLab).

Before Session 1, every member completes `PREREQUISITES.md`.

Session 1 packages with `QUICKSTART-SQLITE.md` offer a container-free route. Members using it follow that guide (Spanish: `QUICKSTART-SQLITE.es.md`) and skip sections 4 and 5 below. Later sessions retain the PostgreSQL route.

Windows instructions will be added separately.

---

## 1. How sessions arrive

Before each session your facilitator shares one zip in the team chat: `session-01.zip`, `session-02.zip`, and so on.

Each zip contains:

| Content | Purpose |
|---|---|
| The Loom application | A complete, runnable starting point for the session |
| `docs/course/session-NN/` | `THEORY.md`, `WORKSHOP.md`, `SELF-STUDY.md`, `VALIDATION.md` and other session material |
| `examples/session-NN/` | Source documents and data used in the session |
| `QUICKSTART.md` | This guide |

Every zip is a **fresh baseline**: it does not depend on how far your team got in the previous session. Your earlier work stays in your repository's history, and you may bring your own improvements forward (section 7).

---

## 2. Roles in the team

One member acts as **integrator** for each session import. The integrator imports the zip; everyone else pulls the result. Rotate the role between sessions if you like.

All team work goes through short-lived branches and pull requests into `main`.

---

## 3. Import a session (integrator)

Replace `NN` with the session number, for example `01`.

### 3.1 First session: empty repository

```bash
git clone <TEAM_REPOSITORY_URL> loom
cd loom
git switch -c import/session-NN

unzip -q ~/Downloads/session-NN.zip -d .
git add --all
git commit -m "Import session-NN baseline"
git push --set-upstream origin import/session-NN
```

Open a pull request from `import/session-NN` into `main` and merge it.

If the repository was created with an initial commit (for example a README), the import still works; resolve the conflict in that file if the host reports one.

### 3.2 Later sessions: replace the previous baseline

First mark where your team finished the previous session, so it stays easy to find:

```bash
cd loom
git switch main
git pull
git tag team/session-MM-final        # MM = previous session, for example 01
git push origin team/session-MM-final
```

Then import the new baseline. `git rm` removes the previous files from the new branch only; nothing is lost from history:

```bash
git switch -c import/session-NN
git rm -r -q .
unzip -q ~/Downloads/session-NN.zip -d .
git add --all
git commit -m "Import session-NN baseline"
git push --set-upstream origin import/session-NN
```

Open a pull request into `main`. Its diff shows exactly how the new baseline differs from your team's work. Merge it.

Tell the team the import is merged.

---

## 4. Start PostgreSQL (each member, once)

Every member runs PostgreSQL locally in Podman.

On macOS, start the Podman machine first:

```bash
podman machine start
```

Create the container once:

```bash
podman volume create loom-postgres-data
podman run --name loom-postgres \
  --detach \
  --publish 5432:5432 \
  --env POSTGRES_USER=loom \
  --env POSTGRES_PASSWORD=loom-dev \
  --env POSTGRES_DB=loom \
  --volume loom-postgres-data:/var/lib/postgresql/data \
  docker.io/library/postgres:17
```

Verify:

```bash
podman exec loom-postgres pg_isready -U loom
```

These credentials are for local development only.

Later, start and stop it without losing data:

```bash
podman start loom-postgres
podman stop loom-postgres
```

---

## 5. Run a session locally (each member)

### 5.1 Get the baseline

```bash
cd loom            # clone the team repository first if you have not
git switch main
git pull
```

### 5.2 Create the session database

Each session uses its own database, because sessions add migrations:

```bash
podman exec loom-postgres createdb -U loom loom_sessionNN
```

### 5.3 Configure

```bash
cp .env.example .env.local
```

Set at least:

```dotenv
DATABASE_URL=postgresql://loom:loom-dev@localhost:5432/loom_sessionNN
```

Copilot uses your `copilot login`; no token is needed in `.env.local`. Never commit `.env.local`.

### 5.4 Install and start

```bash
bun install --frozen-lockfile
bun run preflight
bun run db:migrate
bun run db:seed
bun run dev
```

`bun run preflight` checks the pinned Bun runtime/package-manager version, the database connection and your Copilot sign-in, and tells you how to fix what is missing. Use `bun run test` for the configured tests; plain `bun test` bypasses the Vitest project configuration and database setup.

Other commands:

```bash
bun run test
bun run lint
bun run build
```

---

## 6. Work as a team

For each piece of work:

```bash
git switch main
git pull
git switch -c <your-name>/<topic>
# work, test, commit
git push --set-upstream origin <your-name>/<topic>
```

Open a pull request into `main`, ask a teammate to review, and merge.

Keep branches small and merge often: several members work on the same code during a four-hour session.

After a teammate's merge that changes migrations or dependencies:

```bash
git pull
bun install --frozen-lockfile
bun run db:migrate
```

---

## 7. Bring your own improvements forward (optional)

The course never requires this. When your team built something in a previous session that you want to keep:

Compare your final state with the new baseline:

```bash
git diff team/session-MM-final main -- <path>
```

Copy a specific commit onto a branch:

```bash
git switch -c <your-name>/carry-forward
git cherry-pick <commit>
```

Keep the previous session running next to the current one with a worktree:

```bash
git worktree add ../loom-session-MM team/session-MM-final
```

Use its own database (`loom_sessionMM`) in that worktree's `.env.local`.

---

## 8. Rules

- Import each session only from the zip your facilitator shared.
- Do not regenerate `bun.lock` or upgrade Bun, PostgreSQL, the Copilot SDK, Excalidraw or other core dependencies during a session.
- Every member uses their own `.env.local` and their own local database per session.
- Never commit credentials, tokens or `.env.local`.
- Merge into `main` through pull requests only.

---

## 9. Troubleshooting

| Problem | Fix |
|---|---|
| `No authentication information found` or `No GitHub OAuth token` | Run `copilot login`, then check with `copilot -p "Reply with the single word OK."` |
| macOS: `copilot -p` works but `bun run preflight` says not signed in | Add the line `bun run preflight` prints to `.env.local`, for example `LOOM_COPILOT_CLI_PATH=/opt/homebrew/bin/copilot` |
| `bun run preflight` warns the Copilot CLI is older than tested | `copilot update` |
| `bun: command not found` | Install Bun 1.4.0 and ensure its executable is on PATH |
| Wrong Bun version | Install the exact version in `.bun-version`; verify with `bun --version` |
| Database connection refused | `podman start loom-postgres` (on macOS first `podman machine start`) |
| Port 5432 already in use | Stop the other PostgreSQL server, or publish the container on another port and update `DATABASE_URL` |
| `database "loom_sessionNN" does not exist` | Run the `createdb` command from section 5.2 |
| Migrations fail after importing a new session | Use a new database for the new session (section 5.2) |
| `bun run test` cannot reach the test database | Start PostgreSQL; the test database (`loom_sessionNN_test`) is created automatically |
| `bun install --frozen-lockfile` fails | Do not remove the flag; tell your facilitator |

### Reset your local database completely

This deletes all local Loom data for every session:

```bash
podman rm --force loom-postgres
podman volume rm loom-postgres-data
```

Then repeat section 4.
