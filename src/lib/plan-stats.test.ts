import { describe, expect, it } from "vitest";
import { activities, plans } from "./test-fixtures";
import { comparePlans, isOverdue, summarizePlan, unassignedWeight } from "./plan-stats";
import type { Plan } from "./types";

const plan = (id: number) => plans.find((p) => p.id === id)!;

describe("summarizePlan", () => {
  it("adds up weights, done weights, counts and the date range", () => {
    const s = summarizePlan(plan(1), activities);
    expect(s.activityCount).toBe(6);
    expect(s.weightTotal).toBe(100);
    expect(s.progress).toBe(25); // 5 + 20 done
    expect(s.counts).toEqual({ todo: 3, in_progress: 1, done: 2 });
    expect(s.startDate).toBe("2026-09-12");
    expect(s.endDate).toBe("2027-04-18");
  });

  it("reports unassigned weight for a plan under 100%", () => {
    const s = summarizePlan(plan(2), activities);
    expect(s.weightTotal).toBe(80);
    expect(unassignedWeight(s)).toBe(20);
    expect(unassignedWeight({ weightTotal: 120 })).toBe(0);
  });

  it("handles a plan with no activities", () => {
    const empty: Plan = { id: 99, title: "Empty", description: null, createdAt: "" };
    const s = summarizePlan(empty, activities);
    expect(s).toMatchObject({ activityCount: 0, weightTotal: 0, progress: 0, startDate: null, endDate: null });
  });
});

describe("isOverdue", () => {
  it("is true only for unfinished activities that ended before today", () => {
    expect(isOverdue({ endDate: "2026-11-06", status: "in_progress" }, "2026-11-09")).toBe(true);
    expect(isOverdue({ endDate: "2026-11-06", status: "done" }, "2026-11-09")).toBe(false);
    expect(isOverdue({ endDate: "2026-11-09", status: "todo" }, "2026-11-09")).toBe(false);
  });
});

describe("comparePlans", () => {
  it("orders by start date and puts empty plans last", () => {
    const empty = summarizePlan({ id: 99, title: "A empty", description: null, createdAt: "" }, []);
    const sorted = [empty, ...plans.map((p) => summarizePlan(p, activities))].sort(comparePlans);
    expect(sorted.map((p) => p.id)).toEqual([1, 4, 2, 3, 99]);
  });
});
