import { describe, expect, it } from "vitest";
import { fromDay, toDay } from "./dates";
import { barGeometry, buildRows, buildTicks, computeRange, dateX, MIN_BAR_WIDTH, rangeWidth } from "./gantt";
import { activities, plans } from "./test-fixtures";
import { summarizePlan } from "./plan-stats";

const TODAY = "2026-11-09";
const summaries = plans.map((p) => summarizePlan(p, activities));

describe("computeRange", () => {
  it("pads by one unit and snaps to unit boundaries", () => {
    const one = [{ startDate: "2026-11-10", endDate: "2026-11-20" }];
    const month = computeRange(one, TODAY, "month");
    expect([fromDay(month.start), fromDay(month.end)]).toEqual(["2026-10-01", "2027-01-01"]);

    const week = computeRange(one, TODAY, "week");
    expect([fromDay(week.start), fromDay(week.end)]).toEqual(["2026-11-02", "2026-11-30"]);

    const quarter = computeRange(one, TODAY, "quarter");
    expect([fromDay(quarter.start), fromDay(quarter.end)]).toEqual(["2026-07-01", "2027-04-01"]);
  });

  it("always includes today", () => {
    const later = [{ startDate: "2027-05-01", endDate: "2027-05-10" }];
    const r = computeRange(later, TODAY, "month");
    expect(r.start).toBeLessThanOrEqual(toDay(TODAY));
    expect(fromDay(r.start)).toBe("2026-10-01");
    expect(computeRange([], TODAY, "day").end).toBeGreaterThan(toDay(TODAY));
  });
});

describe("buildTicks", () => {
  const range = computeRange(activities, TODAY, "month");

  it("tiles the full width with minor ticks, without gaps", () => {
    for (const zoom of ["day", "week", "month", "quarter"] as const) {
      const r = computeRange(activities, TODAY, zoom);
      const { major, minor } = buildTicks(r, zoom);
      const total = rangeWidth(r, zoom);
      for (const ticks of [major, minor]) {
        expect(ticks[0].x).toBe(0);
        const sum = ticks.reduce((n, t) => n + t.width, 0);
        expect(sum).toBeCloseTo(total, 6);
      }
    }
  });

  it("labels months and years at month zoom", () => {
    const { major, minor } = buildTicks(range, "month");
    expect(minor[0].label).toBe("8-р сар");
    expect(minor[0].title).toBe("2026 оны 8-р сар");
    expect(major.map((t) => t.label)).toEqual(["2026", "2027"]);
  });

  it("marks weekends at day zoom", () => {
    const r = computeRange([], TODAY, "day");
    const { minor } = buildTicks(r, "day");
    const weekends = minor.filter((t) => t.weekend).map((t) => t.title);
    expect(weekends).toContain("2026.11.14, Бямба");
    expect(weekends).toContain("2026.11.15, Ням");
    expect(weekends).not.toContain("2026.11.09, Даваа");
  });

  it("labels quarters", () => {
    const r = computeRange([{ startDate: "2027-01-05", endDate: "2027-02-01" }], TODAY, "quarter");
    expect(buildTicks(r, "quarter").minor.map((t) => t.label)).toEqual(["3-р улирал", "4-р улирал", "1-р улирал", "2-р улирал"]);
  });
});

describe("geometry", () => {
  it("places bars on day columns, inclusive of the end day", () => {
    const r = computeRange(activities, TODAY, "day");
    const g = barGeometry("2026-11-09", "2026-11-15", r, "day");
    expect(g.left).toBe(dateX("2026-11-09", r, "day"));
    expect(g.width).toBe(7 * 28);
  });

  it("keeps single-day bars visible at coarse zoom", () => {
    const r = computeRange(activities, TODAY, "quarter");
    expect(barGeometry("2026-09-12", "2026-09-12", r, "quarter").width).toBe(MIN_BAR_WIDTH);
  });
});

describe("buildRows", () => {
  it("lists activities by start date when flat", () => {
    const rows = buildRows(activities, summaries, { grouped: false });
    expect(rows).toHaveLength(activities.length);
    expect(rows.every((r) => r.kind === "activity" && !r.nested)).toBe(true);
    const starts = rows.map((r) => (r.kind === "activity" ? r.activity.startDate : ""));
    expect(starts).toEqual([...starts].sort());
    expect(rows[0].kind === "activity" && rows[0].planTitle).toBe("Run a half marathon");
  });

  it("groups under plan headers, earliest plan first", () => {
    const rows = buildRows(activities, summaries, { grouped: true });
    const headers = rows.filter((r) => r.kind === "plan").map((r) => (r.kind === "plan" ? r.plan.id : 0));
    expect(headers).toEqual([1, 4, 2, 3]);
    expect(rows).toHaveLength(activities.length + plans.length);
    expect(rows[1].kind === "activity" && rows[1].activity.planId).toBe(1);
  });

  it("hides the activities of collapsed plans", () => {
    const rows = buildRows(activities, summaries, { grouped: true, collapsed: new Set([1]) });
    expect(rows[0]).toMatchObject({ kind: "plan", collapsed: true });
    expect(rows[1]).toMatchObject({ kind: "plan" });
    expect(rows).toHaveLength(activities.length - 6 + plans.length);
  });

  it("keeps activities whose plan is missing", () => {
    const rows = buildRows(activities, summaries.slice(0, 1), { grouped: true });
    expect(rows).toHaveLength(activities.length + 1);
  });
});
