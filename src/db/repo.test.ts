import { beforeEach, describe, expect, it } from "vitest";
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
  planId = insertPlan(db, { title: "Төлөвлөгөө", description: null });
});

describe("plans", () => {
  it("starts empty apart from what the test adds", () => {
    const fresh = openDatabase(":memory:");
    expect(selectPlans(fresh)).toEqual([]);
    expect(selectActivities(fresh)).toEqual([]);
  });

  it("creates, updates and reads a plan", () => {
    expect(updatePlan(db, planId, { title: "Шинэ нэр", description: "Тайлбар" })).toBe(true);
    const plan = selectPlan(db, planId);
    expect(plan).toMatchObject({ id: planId, title: "Шинэ нэр", description: "Тайлбар" });
    expect(plan?.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("reports a missing plan", () => {
    expect(updatePlan(db, 999, { title: "x", description: null })).toBe(false);
    expect(deletePlan(db, 999)).toBe(false);
    expect(selectPlan(db, 999)).toBeNull();
  });

  it("deletes a plan together with its activities", () => {
    const other = insertPlan(db, { title: "Өөр", description: null });
    insertActivity(db, activity());
    insertActivity(db, activity());
    insertActivity(db, activity({ planId: other }));
    expect(deletePlan(db, planId)).toBe(true);
    expect(selectActivities(db).map((a) => a.planId)).toEqual([other]);
  });
});

describe("activities", () => {
  it("creates and reads an activity with defaults filled in", () => {
    const r = insertActivity(db, activity({ title: "Гүйх" }));
    expect(r.ok).toBe(true);
    const a = r.ok ? selectActivity(db, r.id) : null;
    expect(a).toMatchObject({ title: "Гүйх", planId, weight: 10, status: "todo", startDate: "2026-11-01" });
    expect(a?.updatedAt).toBeTruthy();
  });

  it("keeps a plan's weights at 100% or less", () => {
    expect(insertActivity(db, activity({ weight: 60 })).ok).toBe(true);
    expect(insertActivity(db, activity({ weight: 40 })).ok).toBe(true);
    expect(insertActivity(db, activity({ weight: 1 }))).toEqual({ ok: false, reason: "over_weight", available: 0 });
    expect(selectActivities(db)).toHaveLength(2);
  });

  it("reports how much weight is left when over", () => {
    insertActivity(db, activity({ weight: 70 }));
    expect(insertActivity(db, activity({ weight: 31 }))).toEqual({ ok: false, reason: "over_weight", available: 30 });
  });

  it("doesn't count an activity's own weight against itself when editing", () => {
    const r = insertActivity(db, activity({ weight: 90 }));
    if (!r.ok) throw new Error("insert failed");
    insertActivity(db, activity({ weight: 10 }));
    expect(updateActivity(db, r.id, activity({ weight: 90, title: "Засвар" })).ok).toBe(true);
    expect(updateActivity(db, r.id, activity({ weight: 91 }))).toEqual({ ok: false, reason: "over_weight", available: 90 });
  });

  it("checks the target plan's weights when moving an activity", () => {
    const other = insertPlan(db, { title: "Өөр", description: null });
    insertActivity(db, activity({ planId: other, weight: 95 }));
    const r = insertActivity(db, activity({ weight: 10 }));
    if (!r.ok) throw new Error("insert failed");
    expect(updateActivity(db, r.id, activity({ planId: other, weight: 10 }))).toEqual({
      ok: false,
      reason: "over_weight",
      available: 5,
    });
    expect(updateActivity(db, r.id, activity({ planId: other, weight: 5 })).ok).toBe(true);
  });

  it("rejects a missing plan or activity", () => {
    expect(insertActivity(db, activity({ planId: 999 }))).toEqual({ ok: false, reason: "plan_missing" });
    expect(updateActivity(db, 999, activity())).toEqual({ ok: false, reason: "not_found" });
    expect(deleteActivity(db, 999)).toBe(false);
    expect(setActivityStatus(db, 999, "done")).toBe(false);
  });

  it("sets the status and deletes", () => {
    const r = insertActivity(db, activity());
    if (!r.ok) throw new Error("insert failed");
    expect(setActivityStatus(db, r.id, "done")).toBe(true);
    expect(selectActivity(db, r.id)?.status).toBe("done");
    expect(deleteActivity(db, r.id)).toBe(true);
    expect(selectActivity(db, r.id)).toBeNull();
  });

  it("filters by plan, priority and status", () => {
    const other = insertPlan(db, { title: "Өөр", description: null });
    insertActivity(db, activity({ priority: "high" }));
    insertActivity(db, activity({ priority: "low", status: "done" }));
    insertActivity(db, activity({ planId: other, priority: "high" }));
    expect(selectActivities(db, { planId })).toHaveLength(2);
    expect(selectActivities(db, { priority: "high" })).toHaveLength(2);
    expect(selectActivities(db, { planId, priority: "high" })).toHaveLength(1);
    expect(selectActivities(db, { status: "done" })).toHaveLength(1);
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
