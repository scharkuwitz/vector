/*
 * npm run db:migrate: create the database file if needed and apply any
 * pending migrations from drizzle/. The app also does this on startup, so
 * running it by hand is optional (useful before a backup or to check a path).
 */
import { databasePath, openDatabase } from "../src/db/open";

const file = databasePath();
openDatabase(file).$client.close();
console.log(`Database is up to date: ${file}`);
