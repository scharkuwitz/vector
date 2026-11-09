import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";

export type Db = BetterSQLite3Database<typeof schema> & { $client: Database.Database };

/** Where the database file lives: $DATABASE_PATH, else data/vector.db under the working directory. */
export function databasePath(): string {
  // turbopackIgnore: keep the build from tracing (and copying) the local database file.
  return process.env.DATABASE_PATH || path.join(/* turbopackIgnore: true */ process.cwd(), "data", "vector.db");
}

/** The committed drizzle-kit migrations, next to server.js in the Docker image. */
export function migrationsFolder(): string {
  return path.join(/* turbopackIgnore: true */ process.cwd(), "drizzle");
}

/**
 * Open (creating if needed) a SQLite database and bring its schema up to
 * date. Pass ":memory:" for a throwaway database in tests.
 */
export function openDatabase(file: string = databasePath()): Db {
  if (file !== ":memory:") fs.mkdirSync(path.dirname(file), { recursive: true });
  const sqlite = new Database(file);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");
  const db = drizzle({ client: sqlite, schema });
  migrate(db, { migrationsFolder: migrationsFolder() });
  return db;
}
