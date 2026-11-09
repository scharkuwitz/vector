@AGENTS.md

# vector

A lightweight to-do app for long-term **plans** and their **activities**, with a Gantt chart. One user, self-hosted, no accounts.

## Commands

```bash
npm run dev        # http://localhost:3000
npm run build      # production build (fails on Cache Components violations)
npm run start
npm run lint
npm run typecheck  # next typegen && tsc --noEmit (route types for PageProps<...>)
npm test           # vitest: src/**/*.test.ts (repo tests use an in-memory SQLite)
npm run db:generate  # drizzle-kit: new migration in drizzle/ after editing src/db/schema.ts
npm run db:migrate   # create/upgrade the database (the app also does this on first use)
```

## Stack

- Next.js 16.4.5, App Router, `src/`, Turbopack, with **Cache Components and Partial Prefetching on** (`next.config.ts`). Read `node_modules/next/dist/docs/` before using a Next API.
- React 19.3, TypeScript, Tailwind CSS v4 (CSS-first config in `src/app/globals.css`).
- Font: Inter via `next/font/google` with `latin`, `cyrillic` and `cyrillic-ext` subsets. Mongolian Ө ө Ү ү live in `cyrillic-ext`, so keep that subset. Don't switch to a font whose Ө/Ү don't match its other Cyrillic letters (Geist's didn't, #1).
- SQLite through Drizzle ORM + better-sqlite3 (prebuilt binaries; install scripts are denied in `package.json` `allowScripts`), zod for input.
- Vitest. No component library and no date library.

## Project phases

Work happens in scoped "runs". Keep each run to what it covers and don't pull later work forward.

- **Run 1 (done 2026-11-09):** skeleton, every page and a fully working Gantt chart on mock data.
- **Run 2 (done 2026-11-09):**
  - SQLite (Drizzle + better-sqlite3) with committed migrations. The database file is `data/vector.db` (gitignored), or `DATABASE_PATH`.
  - Server Actions for every write, a 100% weight cap enforced in a transaction, confirm dialogs, a status switch in the list.
  - The interface was translated into Mongolian.
  - The app starts empty: there is no seed and no sample data. The old mock data survives only as unit-test fixtures (`src/lib/test-fixtures.ts`).
  - `output: "standalone"`, a Dockerfile and `compose.yaml`.
- No run 3 is planned yet.

## Conventions

- **Language.** All user-facing text is Mongolian (Cyrillic), including validation messages, aria-labels and page titles. Code, comments and docs stay English.
  - Keep English where Mongolian would sound forced, e.g. "Gantt". The app's displayed name and wordmark are "Вектор". The repo and package stay `vector`.
  - Avoid attaching case suffixes to numbers or variables (they depend on how the number is pronounced). Prefer a "label: value" form, e.g. `Хуваарилагдаагүй: 20%`, `Дууссан: 3`.
  - Glossary: activity = ажил, plan = төлөвлөгөө, priority = ач холбогдол (Бага/Дунд/Өндөр), status = төлөв (Хийх/Хийгдэж буй/Дууссан), weight = эзлэх хувь, overdue = хугацаа хэтэрсэн, progress = явц.
- **Reads.** Pages read data only through `src/lib/data.ts`, which wraps the queries in `src/db/repo.ts`.
  - Every function in `data.ts` awaits `connection()` so it runs per request. Without it, a synchronous better-sqlite3 read would be prerendered at build time.
  - Callers render inside `<Suspense>`.
  - Nothing is cached (`use cache` isn't used), so after a write `revalidatePath("/", "layout")` is enough to refresh.
- **Writes.** Every write is a Server Action in `src/app/actions.ts`: `formFields` → zod (`src/lib/validation.ts`) → repo → `revalidatePath` → `redirect`.
  - Repo functions take the database as a parameter (tests pass `openDatabase(":memory:")`). The 100% weight cap is checked in an immediate transaction in `writeActivity`.
  - The database repeats the rules as CHECK constraints and a cascading foreign key. Schema changes: edit `src/db/schema.ts`, run `npm run db:generate`, commit the migration.
  - Forms use `useFormAction` (`src/components/use-form-action.ts`): they submit through `onSubmit` so React doesn't reset the fields when errors come back.
  - `src/db/open.ts` builds paths from `process.cwd()` with `/* turbopackIgnore: true */`. Without it, the build traces the local database file into `.next/standalone`.
- **Cache Components page shape.** The page component is synchronous and renders the static shell (header, title). An async child inside `<Suspense>` awaits `params`, `searchParams` and data.
  - `notFound()` inside that boundary streams a 200 with `noindex`; that's expected.
  - `usePathname()` in the header nav is wrapped in `<Suspense>` for dynamic routes.
- **Dates.**
  - `ISODate` strings (`"2026-11-09"`), with no time or time zone.
  - Do the math with day numbers from `src/lib/dates.ts` (UTC-based) and print with its formatters. They are hand-written, not `Intl`, so server and browser print the same text. Dates print as `2026.11.09`, months as `11-р сар`.
  - Sort titles with `compareText` (`src/lib/collate.ts`, Mongolian alphabet order), not `localeCompare`. The same sort runs in the browser, and a different order would break hydration.
  - Never parse `"YYYY-MM-DD"` with local-time `Date` methods.
  - "Today" comes from `getToday()` in `data.ts`.
- **Domain rules.**
  - Weight is an integer from 1 to 100 (% of the plan).
  - Plan progress = the sum of the weights of done activities.
  - Overdue means `endDate < today` and status ≠ done.
  - Date ranges are inclusive, and `end >= start` (a single day is allowed).
  - A plan's dates and progress are derived from its activities, never stored.
- **Gantt.**
  - Layout math is pure, in `src/lib/gantt.ts`, with unit tests.
  - Components live in `src/components/gantt/`.
  - Tooltip text is rendered by React, never as HTML strings. The tooltip is positioned by mutating `style.transform` from refs, not by state on every pointer move.
  - On `/gantt`, the view state lives in the URL (`?zoom=week&group=plan`).
- **Design rules.**
  - Tailwind's default palette is switched off (`--color-*: initial`); only the tokens in `globals.css` exist.
  - **Blue means priority and nothing else.** It is a validated ordinal ramp, lighter = low in light mode and reversed in dark mode.
  - Progress bars, buttons and links are neutral ink.
  - Status colors (critical = overdue and form errors, warning = weights ≠ 100%) always come with an icon and a word.
  - Hairline borders, a 4px radius, no shadows or gradients.
  - Logo: `LogoMark` in `icons.tsx` shows three vectors as 3D axes (red x, green y, blue z, of different lengths) on a dark tile with fixed colors. The user asked for this. The logo is the only exception to "blue means priority", so don't reuse its colors in the UI. `src/app/icon.svg` is the same image.
  - **Themes.** Each token in `globals.css` is written once as `light-dark(<light>, <dark>)` and follows the root's `color-scheme`. Light mode is deliberately warm gray / beige, not white (the user found white too bright), so don't lighten `--page` / `--surface` back toward `#fff`.
    - The header's `ThemeSwitch` (`src/components/theme-switch.tsx`) offers Цайвар / Бараан / Системийн. On phones it is one button that cycles through them. The choice is saved in `localStorage` (`vector-theme`) and set as `data-theme` on `<html>`. "System" removes the attribute, so `prefers-color-scheme` decides.
    - `THEME_SCRIPT` (`src/lib/theme.ts`) runs inline in `<head>` and applies the saved choice before first paint. It lives outside the `"use client"` file because a client module's exports reach the server layout as references, not strings.
    - When changing a light value, re-check contrast: muted text (`--ink-3`) needs 4.5:1 on `--surface-2`, and `--prio-low` needs 2:1 on `--surface`.
- **Git.** Local only, on `main`, one commit per milestone, never pushed.

## Checking the UI

- Snap Firefox can't read `/tmp`. Write screenshots under `~/snap/firefox/common/` and copy them out.
- `firefox --screenshot` captures **before hydration**, so effects (such as scroll-to-today) and hover won't show.
- For interaction, use `puppeteer-core` with `browser: "firefox"` and `executablePath: "/snap/bin/firefox"` (WebDriver BiDi), run with `TMPDIR` under `~/snap/firefox/common/`.
  - Dark mode: `extraPrefsFirefox: { "layout.css.prefers-color-scheme.content-override": 0 }`. `emulateMediaFeatures` isn't supported over BiDi.
- Test against a throwaway database, never `data/vector.db` (that's the user's real data). For example, run the standalone build with `DATABASE_PATH` set to a scratch path and `PORT=3001`.
- A server-action redirect is a client navigation followed by a Suspense fallback ("Ачаалж байна…"). Wait for `main [role=status]` to disappear before reading the page.
- The hidden delete `<dialog>` holds its own `<form>`, so select the edit form's submit button as `form:has(#title) button[type=submit]`.
- Docker: this account can't reach the Docker socket. To check the image steps without Docker, do `npm ci --ignore-scripts` and `npm run build` in a clean copy.
