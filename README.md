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
- **Editing:** create, edit and delete plans and activities. You can change an activity's status straight from the list. Deleting a plan asks first, says how many activities go with it, then deletes them too.

The app starts with an empty database: create a plan, then add activities to it.

## Running it

Requires Node.js 24.

```bash
npm install
npm run dev          # http://localhost:3000
```

The database is a single SQLite file, `data/vector.db` by default (set `DATABASE_PATH` to change it). The app creates it and applies the migrations on first use. `npm run db:migrate` does the same from the command line.

| Script | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm run start` | Production build and server |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generates route types, then runs `tsc` |
| `npm test` | Unit tests (Vitest), including the database layer on an in-memory SQLite |
| `npm run db:generate` | Writes a new migration to `drizzle/` after a change to `src/db/schema.ts` |
| `npm run db:migrate` | Creates the database if needed and applies pending migrations |

## Pages

| URL | |
|---|---|
| `/` | Activities: the to-do list, with plan, priority and status filters and a status switch on each row |
| `/plans`, `/plans/[id]` | Plans with progress. A plan's page shows its timeline and activities |
| `/gantt` | The Gantt chart. `?zoom=day\|week\|month\|quarter` and `?group=plan` are kept in the URL |
| `/activities/new`, `/activities/[id]/edit`, `/plans/new`, `/plans/[id]/edit` | Forms |

## Layout of the code

```
src/app/                 routes (each page renders a static shell; data loads inside <Suspense>)
src/app/actions.ts       Server Actions: every write
src/components/          UI pieces; gantt/ holds the chart
src/db/schema.ts         the two tables (Drizzle), with CHECK constraints
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

The app is built for one person on one server: a single container holding the database file.

```bash
docker compose up -d          # builds the image, serves on 127.0.0.1:3000
```

Or with plain Docker:

```bash
docker build -t vector .
docker run -d -p 127.0.0.1:3000:3000 -v vector-data:/app/data --name vector vector
```

- The database lives in the `vector-data` volume at `/app/data/vector.db`. The image runs as the unprivileged `node` user.
- **The app has no accounts.** Anyone who can reach it can change your data. Put it behind a reverse proxy such as Caddy or nginx with HTTPS and basic auth. With Caddy that's a `reverse_proxy 127.0.0.1:3000` plus a `basic_auth` block.
- **Backups:** the database runs in WAL mode, so don't copy the file while the app is running. Either stop the container first, or use `sqlite3 /path/to/vector.db ".backup backup.db"`.
- Without Docker: run `npm run build`, then copy `.next/static` into `.next/standalone/.next/` and `drizzle/` into `.next/standalone/`, and run `node .next/standalone/server.js` with `DATABASE_PATH` set.
