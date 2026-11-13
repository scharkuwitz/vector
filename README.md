# vector (Вектор)

A lightweight to-do app for long-term plans and activities, with a Gantt chart and Mongolian interface.

- **Plans** (төлөвлөгөө): long-term goals with dates and progress derived from their activities.
- **Activities** (ажил): title, description, parent plan, priority (low / medium / high), weight (% of the plan), status (to do / in progress / done), and start/end dates.
- **Progress:** the sum of completed activities' weights. Total weights cannot exceed 100%; plans with lower total weights are flagged.
- **Gantt chart:** Day, Week, Month and Quarter zoom; optional grouping by plan with progress summary bars and collapsible groups; details on hover or focus; and a today marker. Also shown on each plan's page.
- **Themes:** Light, Dark or System (follow the OS), selected in the header. Light mode uses warm gray / beige tones.
- **Editing:** create, edit and delete plans and activities, with status changes directly in the list. Plan deletion asks for confirmation, shows the affected activity count, and deletes those activities too.

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

SQLite uses `data/vector.db` by default; override it with `DATABASE_PATH`. The app creates the database and applies migrations on first use, or manually with `npm run db:migrate`.

| Script | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm run start` | Production build and server |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generates route types, then runs `tsc` |
| `npm test` | Unit/integration tests, including authentication and database tests with in-memory SQLite |
| `npm run test:e2e` | Browser tests against a production build with disposable SQLite |
| `npm run db:generate` | Generates a migration in `drizzle/` from changes to `src/db/schema.ts` |
| `npm run db:migrate` | Creates the database if needed and applies pending migrations |
| `npm run db:assign-owner -- --email owner@example.com` | Locally assigns legacy plans to a registered account |

## Pages

| URL | Page |
|---|---|
| `/login`, `/signup` | Email/password login and registration |
| `/` | Activities with plan, priority and status filters, and per-row status switches |
| `/plans`, `/plans/[id]` | Plans with progress; individual plans include their timeline and activities |
| `/gantt` | Gantt chart; URL retains `?zoom=day\|week\|month\|quarter` and `?group=plan` |
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

Deploy as one server/container with a SQLite file and multiple private accounts. Better Auth provides email/password authentication and database-backed sessions, which expire after seven days or are revoked on logout. Email verification, password recovery, and social login are not included.

Create `.env` with `BETTER_AUTH_SECRET` (generate with `openssl rand -hex 32`) and `BETTER_AUTH_URL=https://your-vector-domain.example`. Keep the secret stable across restarts. Next.js also reads `.env.local`; Compose reads `.env`. `DATABASE_PATH` is optional, defaulting to `data/vector.db` outside Docker.

```bash
docker compose up -d          # builds the image, serves on 127.0.0.1:3000
```

Or with plain Docker:

```bash
docker build -t vector .
docker run -d -p 127.0.0.1:3000:3000 --env-file .env -v vector-data:/app/data --name vector vector
```

- **Storage:** `/app/data/vector.db` in the `vector-data` volume. The image runs as the unprivileged `node` user.
- **HTTPS:** use Caddy or nginx, with `BETTER_AUTH_URL` matching the public origin to enable secure cookies. Have the proxy overwrite `X-Forwarded-For` with the real client IP. Login/signup limits are five attempts per minute per IP, stored in server memory.
- **Accounts:** public registration; all application pages, reads, and mutations require a valid session and access only the account's own plans and activities.
- **Backups:** SQLite uses WAL mode. Stop the container before copying the database, or use `sqlite3 /path/to/vector.db ".backup backup.db"` while running.
- **Without Docker:** run `npm run build`, copy `.next/static` into `.next/standalone/.next/` and `drizzle/` into `.next/standalone/`, then run `node .next/standalone/server.js` with `DATABASE_PATH` set.

## Assigning data created before authentication

The migration preserves existing plans and activities, hidden until locally assigned. Public registration never claims them. Register the intended owner, confirm the account is yours, then run on the server:

```bash
npm run db:assign-owner -- --email owner@example.com
```

The command reads `DATABASE_PATH` from the shell (default `data/vector.db`), not Next.js env files. It requires a registered email and assigns only unowned plans in one transaction; reruns preserve existing ownership. Back up the database before deploying the migration.

The production image includes the same command as a bundled script:

```bash
docker compose exec vector node scripts/assign-owner.cjs --email owner@example.com
```

## Browser tests

Run `npx playwright install chromium` once, then `npm run build && npm run test:e2e`. Tests start a production server on port 3100 with their own credentials and temporary database; `data/vector.db` is untouched. Screenshots and failure traces go in `test-results/`.
