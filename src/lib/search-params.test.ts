import { describe, expect, it } from "vitest";
import { parseActivityFilter, parseGanttView, parseId } from "./search-params";

describe("search params", () => {
  it("parses ids strictly", () => {
    expect(parseId("12")).toBe(12);
    expect(parseId(["3", "4"])).toBe(3);
    expect(parseId("0")).toBeUndefined();
    expect(parseId("1e3")).toBeUndefined();
    expect(parseId("-1")).toBeUndefined();
    expect(parseId(undefined)).toBeUndefined();
  });

  it("keeps only known filter values", () => {
    expect(parseActivityFilter({ plan: "2", priority: "high", status: "done" })).toEqual({
      planId: 2,
      priority: "high",
      status: "done",
    });
    expect(parseActivityFilter({ priority: "urgent", status: "later" })).toEqual({
      planId: undefined,
      priority: undefined,
      status: undefined,
    });
  });

  it("defaults the Gantt view to month, ungrouped", () => {
    expect(parseGanttView({})).toEqual({ zoom: "month", grouped: false });
    expect(parseGanttView({ zoom: "week", group: "plan" })).toEqual({ zoom: "week", grouped: true });
    expect(parseGanttView({ zoom: "decade" }).zoom).toBe("month");
  });
});
