import "server-only";
import { openDatabase, type Db } from "./open";

// One connection per server process. Kept on globalThis so dev-mode hot
// reloads reuse it instead of opening the file again on every edit.
const g = globalThis as typeof globalThis & { __vectorDb?: Db };

/** The app's database, opened and migrated on first use. */
export function getDb(): Db {
  g.__vectorDb ??= openDatabase();
  return g.__vectorDb;
}
