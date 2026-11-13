import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { afterEach, expect, it } from "vitest";
import { assignLegacyOwner } from "./assign-owner";
import { openDatabase, type Db } from "./open";
import { insertPlan, selectActivities, selectPlans } from "./repo";

let db: Db | undefined;
let temporary: string | undefined;
afterEach(() => {
  db?.$client.close();
  if (temporary) fs.rmSync(temporary, { recursive: true, force: true });
  db = undefined;
  temporary = undefined;
});

it("preserves a populated legacy database and assigns only unowned data, idempotently", () => {
  temporary = fs.mkdtempSync(path.join(os.tmpdir(), "vector-migration-"));
  const oldMigrations = path.join(temporary, "drizzle");
  fs.mkdirSync(path.join(oldMigrations, "meta"), { recursive: true });
  fs.copyFileSync("drizzle/0000_init.sql", path.join(oldMigrations, "0000_init.sql"));
  const journal = JSON.parse(fs.readFileSync("drizzle/meta/_journal.json", "utf8"));
  journal.entries = journal.entries.slice(0, 1);
  fs.writeFileSync(path.join(oldMigrations, "meta/_journal.json"), JSON.stringify(journal));
  const file = path.join(temporary, "legacy.db");
  const sqlite = new Database(file);
  migrate(drizzle(sqlite), { migrationsFolder: oldMigrations });
  sqlite.exec(`
    INSERT INTO plans (id, title) VALUES (1, 'Legacy plan');
    INSERT INTO activities (plan_id, title, weight, start_date, end_date)
      VALUES (1, 'Legacy activity', 40, '2026-11-01', '2026-11-02');
  `);
  sqlite.close();

  db = openDatabase(file);
  db.$client.prepare("INSERT INTO user (id, name, email, created_at, updated_at) VALUES (?, ?, ?, 0, 0)")
    .run("owner", "Owner", "owner@example.com");
  db.$client.prepare("INSERT INTO user (id, name, email, created_at, updated_at) VALUES (?, ?, ?, 0, 0)")
    .run("other", "Other", "other@example.com");
  const privatePlan = insertPlan(db, "other", { title: "Other's plan", description: null });
  expect(selectPlans(db, "owner")).toEqual([]);
  expect(selectActivities(db, "owner")).toEqual([]);
  expect(() => assignLegacyOwner(db!, "missing@example.com")).toThrow(/Account not found/);
  expect(assignLegacyOwner(db, " OWNER@EXAMPLE.COM ")).toBe(1);
  expect(assignLegacyOwner(db, "owner@example.com")).toBe(0);
  expect(assignLegacyOwner(db, "other@example.com")).toBe(0);
  expect(selectPlans(db, "owner")).toMatchObject([{ id: 1, title: "Legacy plan" }]);
  expect(selectActivities(db, "owner")).toMatchObject([{ planId: 1, title: "Legacy activity", weight: 40 }]);
  expect(selectPlans(db, "other").map((p) => p.id)).toEqual([privatePlan]);
  expect(db.$client.pragma("foreign_key_check")).toEqual([]);
  db.$client.close();
  db = openDatabase(file);
  expect(selectActivities(db, "owner")).toHaveLength(1);
});
