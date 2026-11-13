import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
// Relative import: drizzle-kit loads this file without the "@/" alias.
import { PRIORITIES, STATUSES } from "../lib/types";

/*
 * A plan's dates, progress and weight total are derived from its
 * activities when read (src/lib/plan-stats.ts), never stored.
 *
 * Dates are "YYYY-MM-DD" text; timestamps are ISO 8601 UTC text.
 * The CHECK constraints repeat the zod rules so bad rows can't get in even
 * from outside the app. "Weights total at most 100%" spans rows, so it is
 * enforced in a transaction instead (src/db/repo.ts).
 */

const now = sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;

// Better Auth owns password hashing and session lifecycle. Timestamps use
// milliseconds, matching its Drizzle adapter's Date representation.
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  token: text("token").notNull().unique(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
}, (t) => [index("session_user_id_idx").on(t.userId)]);

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp_ms" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp_ms" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
}, (t) => [index("account_user_id_idx").on(t.userId)]);

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
}, (t) => [index("verification_identifier_idx").on(t.identifier)]);

export const plans = sqliteTable(
  "plans",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    // Nullable only for legacy rows awaiting local owner assignment.
    userId: text("user_id").references(() => user.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    description: text("description"),
    createdAt: text("created_at").notNull().default(now),
  },
  (t) => [index("plans_user_id_idx").on(t.userId), check("plans_title_not_blank", sql`length(trim(${t.title})) > 0`)],
);

export const activities = sqliteTable(
  "activities",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    planId: integer("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    priority: text("priority", { enum: PRIORITIES }).notNull().default("medium"),
    status: text("status", { enum: STATUSES }).notNull().default("todo"),
    weight: integer("weight").notNull(),
    startDate: text("start_date").notNull(),
    endDate: text("end_date").notNull(),
    createdAt: text("created_at").notNull().default(now),
    updatedAt: text("updated_at").notNull().default(now),
  },
  (t) => [
    index("activities_plan_id_idx").on(t.planId),
    check("activities_title_not_blank", sql`length(trim(${t.title})) > 0`),
    check("activities_priority", sql`${t.priority} in ('low', 'medium', 'high')`),
    check("activities_status", sql`${t.status} in ('todo', 'in_progress', 'done')`),
    check("activities_weight", sql`${t.weight} between 1 and 100`),
    check("activities_start_date", sql`${t.startDate} glob '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'`),
    check("activities_end_date", sql`${t.endDate} glob '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'`),
    check("activities_dates", sql`${t.endDate} >= ${t.startDate}`),
  ],
);
