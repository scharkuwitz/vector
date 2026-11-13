import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ActivityInput } from "../lib/validation";
import { openDatabase, type Db } from "./open";
import {
  deleteActivity,
  deletePlan,
  insertActivity,
  insertPlan,
  selectActivities,
  selectActivity,
  selectPlan,
  selectPlans,
  setActivityStatus,
  updateActivity,
  updatePlan,
} from "./repo";

let db: Db;
let planId: number;
const userId = "test-owner";

const activity = (over: Partial<ActivityInput> = {}): ActivityInput => ({
  title: "Хийх ажил",
  description: null,
  planId,
  priority: "medium",
  status: "todo",
  weight: 10,
  startDate: "2026-11-01",
  endDate: "2026-11-10",
  ...over,
});

beforeEach(() => {
  db = openDatabase(":memory:");
  db.$client.prepare('insert into user (id, name, email, created_at, updated_at) values (?, ?, ?, 0, 0)')
    .run(userId, "Owner", "owner@example.com");
  planId = insertPlan(db, userId, { title: "Төлөвлөгөө", description: null });
});

afterEach(() => db.$client.close());

describe("plans", () => {
  it("starts empty apart from what the test adds", () => {
    const fresh = openDatabase(":memory:");
    expect(selectPlans(fresh, userId)).toEqual([]);
    expect(selectActivities(fresh, userId)).toEqual([]);
    fresh.$client.close();
  });

  it("creates, updates and reads a plan", () => {
    expect(updatePlan(db, userId, planId, { title: "Шинэ нэр", description: "Тайлбар" })).toBe(true);
    const plan = selectPlan(db, userId, planId);
    expect(plan).toMatchObject({ id: planId, title: "Шинэ нэр", description: "Тайлбар" });
    expect(plan?.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("reports a missing plan", () => {
    expect(updatePlan(db, userId, 999, { title: "x", description: null })).toBe(false);
    expect(deletePlan(db, userId, 999)).toBe(false);
    expect(selectPlan(db, userId, 999)).toBeNull();
  });

  it("deletes a plan together with its activities", () => {
    const other = insertPlan(db, userId, { title: "Өөр", description: null });
    insertActivity(db, userId, activity());
    insertActivity(db, userId, activity());
    insertActivity(db, userId, activity({ planId: other }));
    expect(deletePlan(db, userId, planId)).toBe(true);
    expect(selectActivities(db, userId).map((a) => a.planId)).toEqual([other]);
  });
});

describe("activities", () => {
  it("creates and reads an activity with defaults filled in", () => {
    const r = insertActivity(db, userId, activity({ title: "Гүйх" }));
    expect(r.ok).toBe(true);
    const a = r.ok ? selectActivity(db, userId, r.id) : null;
    expect(a).toMatchObject({ title: "Гүйх", planId, weight: 10, status: "todo", startDate: "2026-11-01" });
    expect(a?.updatedAt).toBeTruthy();
  });

  it("keeps a plan's weights at 100% or less", () => {
    expect(insertActivity(db, userId, activity({ weight: 60 })).ok).toBe(true);
    expect(insertActivity(db, userId, activity({ weight: 40 })).ok).toBe(true);
    expect(insertActivity(db, userId, activity({ weight: 1 }))).toEqual({ ok: false, reason: "over_weight", available: 0 });
    expect(selectActivities(db, userId)).toHaveLength(2);
  });

  it("reports how much weight is left when over", () => {
    insertActivity(db, userId, activity({ weight: 70 }));
    expect(insertActivity(db, userId, activity({ weight: 31 }))).toEqual({ ok: false, reason: "over_weight", available: 30 });
  });

  it("doesn't count an activity's own weight against itself when editing", () => {
    const r = insertActivity(db, userId, activity({ weight: 90 }));
    if (!r.ok) throw new Error("insert failed");
    insertActivity(db, userId, activity({ weight: 10 }));
    expect(updateActivity(db, userId, r.id, activity({ weight: 90, title: "Засвар" })).ok).toBe(true);
    expect(updateActivity(db, userId, r.id, activity({ weight: 91 }))).toEqual({ ok: false, reason: "over_weight", available: 90 });
  });

  it("checks the target plan's weights when moving an activity", () => {
    const other = insertPlan(db, userId, { title: "Өөр", description: null });
    insertActivity(db, userId, activity({ planId: other, weight: 95 }));
    const r = insertActivity(db, userId, activity({ weight: 10 }));
    if (!r.ok) throw new Error("insert failed");
    expect(updateActivity(db, userId, r.id, activity({ planId: other, weight: 10 }))).toEqual({
      ok: false,
      reason: "over_weight",
      available: 5,
    });
    expect(updateActivity(db, userId, r.id, activity({ planId: other, weight: 5 })).ok).toBe(true);
  });

  it("rejects a missing plan or activity", () => {
    expect(insertActivity(db, userId, activity({ planId: 999 }))).toEqual({ ok: false, reason: "plan_missing" });
    expect(updateActivity(db, userId, 999, activity())).toEqual({ ok: false, reason: "not_found" });
    expect(deleteActivity(db, userId, 999)).toBe(false);
    expect(setActivityStatus(db, userId, 999, "done")).toBe(false);
  });

  it("sets the status and deletes", () => {
    const r = insertActivity(db, userId, activity());
    if (!r.ok) throw new Error("insert failed");
    expect(setActivityStatus(db, userId, r.id, "done")).toBe(true);
    expect(selectActivity(db, userId, r.id)?.status).toBe("done");
    expect(deleteActivity(db, userId, r.id)).toBe(true);
    expect(selectActivity(db, userId, r.id)).toBeNull();
  });

  it("filters by plan, priority and status", () => {
    const other = insertPlan(db, userId, { title: "Өөр", description: null });
    insertActivity(db, userId, activity({ priority: "high" }));
    insertActivity(db, userId, activity({ priority: "low", status: "done" }));
    insertActivity(db, userId, activity({ planId: other, priority: "high" }));
    expect(selectActivities(db, userId, { planId })).toHaveLength(2);
    expect(selectActivities(db, userId, { priority: "high" })).toHaveLength(2);
    expect(selectActivities(db, userId, { planId, priority: "high" })).toHaveLength(1);
    expect(selectActivities(db, userId, { status: "done" })).toHaveLength(1);
  });

  it("enforces the rules in the database itself", () => {
    const raw = db.$client;
    const insert = (weight: number, start: string, end: string) =>
      raw
        .prepare("insert into activities (plan_id, title, weight, start_date, end_date) values (?, 'x', ?, ?, ?)")
        .run(planId, weight, start, end);
    expect(() => insert(0, "2026-11-01", "2026-11-01")).toThrow(/CHECK/);
    expect(() => insert(101, "2026-11-01", "2026-11-01")).toThrow(/CHECK/);
    expect(() => insert(10, "2026-11-02", "2026-11-01")).toThrow(/CHECK/);
    expect(() => insert(10, "11/01/2026", "2026-11-01")).toThrow(/CHECK/);
    expect(() =>
      raw.prepare("insert into activities (plan_id, title, weight, start_date, end_date) values (999, 'x', 1, '2026-11-01', '2026-11-01')").run(),
    ).toThrow(/FOREIGN KEY/);
  });
});

describe("account isolation", () => {
  const otherId = "other-account";
  let otherPlan: number;
  let otherActivity: number;

  beforeEach(() => {
    db.$client.prepare('insert into user (id, name, email, created_at, updated_at) values (?, ?, ?, 0, 0)')
      .run(otherId, "Other", "other@example.com");
    otherPlan = insertPlan(db, otherId, { title: "Private", description: "Secret" });
    const result = insertActivity(db, otherId, activity({ planId: otherPlan }));
    if (!result.ok) throw new Error("insert failed");
    otherActivity = result.id;
  });

  it("hides another account's plans, activities, and filtered results", () => {
    expect(selectPlans(db, userId).map((p) => p.id)).toEqual([planId]);
    expect(selectPlan(db, userId, otherPlan)).toBeNull();
    expect(selectActivities(db, userId)).toEqual([]);
    expect(selectActivities(db, userId, { planId: otherPlan })).toEqual([]);
    expect(selectActivity(db, userId, otherActivity)).toBeNull();
    expect(selectActivities(db, otherId)).toHaveLength(1);
  });

  it("prevents edits, deletes, and status changes using guessed IDs", () => {
    expect(updatePlan(db, userId, otherPlan, { title: "Changed", description: null })).toBe(false);
    expect(deletePlan(db, userId, otherPlan)).toBe(false);
    expect(updateActivity(db, userId, otherActivity, activity())).toEqual({ ok: false, reason: "not_found" });
    expect(deleteActivity(db, userId, otherActivity)).toBe(false);
    expect(setActivityStatus(db, userId, otherActivity, "done")).toBe(false);
    expect(selectPlan(db, otherId, otherPlan)?.title).toBe("Private");
    expect(selectActivity(db, otherId, otherActivity)?.status).toBe("todo");
  });

  it("prevents creating or moving an activity into another account's plan", () => {
    expect(insertActivity(db, userId, activity({ planId: otherPlan }))).toEqual({ ok: false, reason: "plan_missing" });
    const own = insertActivity(db, userId, activity());
    if (!own.ok) throw new Error("insert failed");
    expect(updateActivity(db, userId, own.id, activity({ planId: otherPlan }))).toEqual({ ok: false, reason: "plan_missing" });
    expect(selectActivity(db, userId, own.id)?.planId).toBe(planId);
    expect(selectActivities(db, otherId)).toHaveLength(1);
  });

  it("cascades deletes only within the current account", () => {
    insertActivity(db, userId, activity());
    expect(deletePlan(db, userId, planId)).toBe(true);
    expect(selectActivities(db, userId)).toEqual([]);
    expect(selectActivities(db, otherId)).toHaveLength(1);
  });
});
