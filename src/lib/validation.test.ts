import { describe, expect, it } from "vitest";
import { formFields, parseActivity, parsePlan } from "./validation";

const valid = {
  title: "  Гүйх  ",
  description: "",
  planId: "3",
  priority: "high",
  status: "in_progress",
  weight: "25",
  startDate: "2026-11-09",
  endDate: "2026-11-09",
};

describe("parsePlan", () => {
  it("trims the title and turns a blank description into null", () => {
    expect(parsePlan({ title: " Төсөл ", description: "  " })).toEqual({
      ok: true,
      data: { title: "Төсөл", description: null },
    });
  });

  it("requires a title", () => {
    const r = parsePlan({ title: "   " });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.title).toBe("Нэрээ бичнэ үү.");
  });

  it("limits the title length", () => {
    const r = parsePlan({ title: "x".repeat(201) });
    expect(r.ok ? null : r.errors.title).toMatch(/200/);
  });
});

describe("parseActivity", () => {
  it("coerces form strings into a typed activity", () => {
    expect(parseActivity(valid)).toEqual({
      ok: true,
      data: {
        title: "Гүйх",
        description: null,
        planId: 3,
        priority: "high",
        status: "in_progress",
        weight: 25,
        startDate: "2026-11-09",
        endDate: "2026-11-09",
      },
    });
  });

  it("reports one message per field", () => {
    const r = parseActivity({ ...valid, title: "", planId: "", priority: "urgent", weight: "0", startDate: "2026-02-30" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(Object.keys(r.errors).sort()).toEqual(["planId", "priority", "startDate", "title", "weight"]);
  });

  it("rejects fractional and out-of-range weights", () => {
    for (const weight of ["2.5", "101", "-1", "abc"]) {
      const r = parseActivity({ ...valid, weight });
      expect(r.ok ? null : r.errors.weight, weight).toMatch(/1-ээс 100/);
    }
  });

  it("rejects an end date before the start", () => {
    const r = parseActivity({ ...valid, startDate: "2026-11-10", endDate: "2026-11-09" });
    expect(r.ok ? null : r.errors.endDate).toMatch(/өмнө/);
  });
});

describe("formFields", () => {
  it("keeps the first value of each string field", () => {
    const fd = new FormData();
    fd.append("title", "a");
    fd.append("title", "b");
    fd.append("weight", "5");
    expect(formFields(fd)).toEqual({ title: "a", weight: "5" });
  });
});
