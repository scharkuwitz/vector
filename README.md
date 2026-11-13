# vector (Вектор)

A lightweight to-do app for long-term plans and the activities that make them up, with a Gantt chart. The interface is in Mongolian.

- **Plans** (төлөвлөгөө): long-term goals. A plan's dates and progress are worked out from its activities.
- **Activities** (ажил): each one has a title, a description, its plan, a priority (low / medium / high), its weight (the share of the plan it represents, in %), a status (to do / in progress / done), and start and end dates.
- **Progress:** a plan's progress is the sum of the weights of its done activities. A plan's weights can't add up to more than 100%. A plan whose weights add up to less than 100% is flagged.
- **Gantt chart:**
  - Four zoom levels: Day, Week, Month and Quarter.
  - A "Group by plan" toggle. Each plan gets a summary bar showing its progress, and plans can be collapsed.
  - Hovering or focusing a bar shows its details.
  - A line marks today.
  - The chart is also shown on each plan's page.
- **Light and dark mode:** a switch in the header picks Light, Dark or System (follow the OS). Light mode uses warm gray / beige tones rather than white.
- **Editing:** create, edit and delete plans and activities. You can change an activity's status straight from the list. Deleting a plan asks first, says how many activities go with it, then deletes them too.

Each account has private plans and activities. Register, create a plan, then add activities to it.

## Running it

Requires Node.js 24.

```bash
npm install
cp .env.example .env.local
# Set BETTER_AUTH_SECRET to a random secret (at least 32 characters).
# Generate one with: openssl rand -hex 32
npm run dev          # http://localhost:3000
```

The database is a single SQLite file, `data/vector.db` by default (set `DATABASE_PATH` to change it). The app creates it and applies the migrations on first use. `npm run db:migrate` does the same from the command line.

| Script | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm run start` | Production build and server |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generates route types, then runs `tsc` |
| `npm test` | Unit and integration tests, including authentication and the database layer on an in-memory SQLite |
| `npm run test:e2e` | Browser tests against a production build, using a disposable SQLite database |
| `npm run db:generate` | Writes a new migration to `drizzle/` after a change to `src/db/schema.ts` |
| `npm run db:migrate` | Creates the database if needed and applies pending migrations |
| `npm run db:assign-owner -- --email owner@example.com` | Locally assigns legacy plans to a registered account |

## Pages

| URL | |
|---|---|
| `/login`, `/signup` | Email/password login and registration |
| `/` | Activities: the to-do list, with plan, priority and status filters and a status switch on each row |
| `/plans`, `/plans/[id]` | Plans with progress. A plan's page shows its timeline and activities |
| `/gantt` | The Gantt chart. `?zoom=day\|week\|month\|quarter` and `?group=plan` are kept in the URL |
| `/activities/new`, `/activities/[id]/edit`, `/plans/new`, `/plans/[id]/edit` | Forms |

## Layout of the code

```
src/app/                 routes (each page renders a static shell; data loads inside <Suspense>)
src/app/actions.ts       authenticated Server Actions for plan/activity writes
src/components/          UI pieces; gantt/ holds the chart
src/db/schema.ts         plans, activities, and Better Auth tables (Drizzle)
src/db/repo.ts           every query; the 100% weight cap is checked in a transaction
src/db/open.ts           opens the SQLite file and applies migrations
src/lib/data.ts          what pages read through
src/lib/validation.ts    zod rules and the Mongolian error messages
src/lib/dates.ts         date-only math on UTC day numbers, Mongolian formatting
src/lib/plan-stats.ts    progress, weight totals, overdue
src/lib/gantt.ts         chart layout math (range, ticks, rows, bars)
drizzle/                 committed migrations
```

## Deploying

The app supports multiple private accounts on one server: a single container holding the database file. Authentication uses Better Auth with email/password and database-backed sessions. Sessions expire after seven days; logging out revokes the current session. Email verification, password recovery, and social login are not included.

Before deploying, create a `.env` file with `BETTER_AUTH_SECRET` (generate with `openssl rand -hex 32`) and `BETTER_AUTH_URL=https://your-vector-domain.example`. The secret must remain stable across restarts. For local development, `.env.local` works with Next.js; Compose reads `.env`. `DATABASE_PATH` remains optional and defaults to `data/vector.db` outside Docker.

```bash
docker compose up -d          # builds the image, serves on 127.0.0.1:3000
```

Or with plain Docker:

```bash
docker build -t vector .
docker run -d -p 127.0.0.1:3000:3000 --env-file .env -v vector-data:/app/data --name vector vector
```

- The database lives in the `vector-data` volume at `/app/data/vector.db`. The image runs as the unprivileged `node` user.
- **HTTPS:** put the server behind Caddy or nginx with HTTPS. `BETTER_AUTH_URL` must match the public origin; HTTPS enables secure session cookies. Configure the proxy to overwrite `X-Forwarded-For` with the real client IP, rather than trusting a client-supplied value, so authentication rate limiting uses the correct address. Login and signup allow five attempts per minute per IP; limits are held in memory for this single-server deployment.
- **Accounts:** registration is public. All application pages, data reads, and mutations require a valid session. Each account can access only its own plans and activities.
- **Backups:** the database runs in WAL mode, so don't copy the file while the app is running. Either stop the container first, or use `sqlite3 /path/to/vector.db ".backup backup.db"`.
- Without Docker: run `npm run build`, then copy `.next/static` into `.next/standalone/.next/` and `drizzle/` into `.next/standalone/`, and run `node .next/standalone/server.js` with `DATABASE_PATH` set.

## Assigning data created before authentication

Existing plans and their activities are preserved by the migration but stay hidden until locally assigned. Public registration never claims legacy data. Register the intended owner, confirm that account is yours, then run on the server:

```bash
npm run db:assign-owner -- --email owner@example.com
```

The command uses `DATABASE_PATH` from the shell, or the default `data/vector.db`; it does not load Next.js env files. It fails if the email is not registered. It assigns only unowned plans in one transaction and can be rerun without moving anyone else's data. Back up the database before deploying the migration.

For Docker Compose, the production image includes a bundled administration script:

```bash
docker compose exec vector node scripts/assign-owner.cjs --email owner@example.com
```

## Browser tests

Run `npx playwright install chromium` once, then `npm run build && npm run test:e2e`. Tests start a production server on port 3100 with their own credentials and temporary database; they never open `data/vector.db`. Screenshots and failure traces are saved under `test-results/`.

## Contributors

- [scharkuwitz](https://github.com/scharkuwitz) — project maintainer.
- OpenAI Codex — AI assistance with authentication, private account data, migrations, and testing ([PR #6](https://github.com/scharkuwitz/vector/pull/6)).
