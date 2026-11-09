import { and, asc, eq, ne, sql, type SQL } from "drizzle-orm";
import type { ActivityInput, PlanInput } from "../lib/validation";
import type { Activity, ActivityFilter, Plan, Status } from "../lib/types";
import type { Db } from "./open";
import { activities, plans } from "./schema";

/*
 * Every query the app runs. Functions take the database as an argument so
 * tests can pass an in-memory one. better-sqlite3 is synchronous, so these
 * are too; src/lib/data.ts and the Server Actions wrap them.
 */

/** The database, or an open transaction on it. */
type Conn = Db | Parameters<Parameters<Db["transaction"]>[0]>[0];

// ---- reads -------------------------------------------------------------------

export function selectPlans(db: Conn): Plan[] {
  return db.select().from(plans).all();
}

export function selectPlan(db: Conn, id: number): Plan | null {
  return db.select().from(plans).where(eq(plans.id, id)).get() ?? null;
}

export function selectActivities(db: Conn, filter: ActivityFilter = {}): Activity[] {
  const where: SQL[] = [];
  if (filter.planId !== undefined) where.push(eq(activities.planId, filter.planId));
  if (filter.priority !== undefined) where.push(eq(activities.priority, filter.priority));
  if (filter.status !== undefined) where.push(eq(activities.status, filter.status));
  return db
    .select()
    .from(activities)
    .where(and(...where))
    .orderBy(asc(activities.startDate), asc(activities.endDate), asc(activities.id))
    .all();
}

export function selectActivity(db: Conn, id: number): Activity | null {
  return db.select().from(activities).where(eq(activities.id, id)).get() ?? null;
}

// ---- plan writes -------------------------------------------------------------

export function insertPlan(db: Db, input: PlanInput): number {
  return db.insert(plans).values(input).returning({ id: plans.id }).get().id;
}

/** False when the plan doesn't exist. */
export function updatePlan(db: Db, id: number, input: PlanInput): boolean {
  return db.update(plans).set(input).where(eq(plans.id, id)).run().changes > 0;
}

/** Deletes the plan and (by cascade) its activities. False when it doesn't exist. */
export function deletePlan(db: Db, id: number): boolean {
  return db.delete(plans).where(eq(plans.id, id)).run().changes > 0;
}

// ---- activity writes ---------------------------------------------------------

export type ActivityWriteError =
  | { reason: "not_found" }
  | { reason: "plan_missing" }
  /** The plan's other activities already take `100 - available` percent. */
  | { reason: "over_weight"; available: number };

export type ActivityWriteResult = { ok: true; id: number } | ({ ok: false } & ActivityWriteError);

/** Sum of the weights in a plan, leaving out one activity (the one being edited). */
function weightUsed(db: Conn, planId: number, exceptId?: number): number {
  const where = exceptId === undefined ? eq(activities.planId, planId) : and(eq(activities.planId, planId), ne(activities.id, exceptId));
  const row = db
    .select({ total: sql<number>`coalesce(sum(${activities.weight}), 0)` })
    .from(activities)
    .where(where)
    .get();
  return row?.total ?? 0;
}

/**
 * Insert or update an activity, keeping its plan's weights at 100% or less.
 * Runs in an immediate (write-locked) transaction, so the check and the write
 * see the same data.
 */
function writeActivity(db: Db, id: number | null, input: ActivityInput): ActivityWriteResult {
  return db.transaction(
    (tx): ActivityWriteResult => {
      if (id !== null && !selectActivity(tx, id)) return { ok: false, reason: "not_found" };
      if (!selectPlan(tx, input.planId)) return { ok: false, reason: "plan_missing" };

      const used = weightUsed(tx, input.planId, id ?? undefined);
      if (used + input.weight > 100) return { ok: false, reason: "over_weight", available: Math.max(0, 100 - used) };

      if (id === null) {
        const row = tx.insert(activities).values(input).returning({ id: activities.id }).get();
        return { ok: true, id: row.id };
      }
      tx.update(activities)
        .set({ ...input, updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))` })
        .where(eq(activities.id, id))
        .run();
      return { ok: true, id };
    },
    { behavior: "immediate" },
  );
}

export function insertActivity(db: Db, input: ActivityInput): ActivityWriteResult {
  return writeActivity(db, null, input);
}

export function updateActivity(db: Db, id: number, input: ActivityInput): ActivityWriteResult {
  return writeActivity(db, id, input);
}

/** False when the activity doesn't exist. */
export function deleteActivity(db: Db, id: number): boolean {
  return db.delete(activities).where(eq(activities.id, id)).run().changes > 0;
}

/** False when the activity doesn't exist. */
export function setActivityStatus(db: Db, id: number, status: Status): boolean {
  return (
    db
      .update(activities)
      .set({ status, updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))` })
      .where(eq(activities.id, id))
      .run().changes > 0
  );
}
