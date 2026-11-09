import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  dayParts,
  diffDays,
  durationDays,
  formatDate,
  formatMonth,
  formatMonthYear,
  formatQuarter,
  formatRange,
  formatWeekday,
  fromDay,
  isValidISODate,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
  toDay,
  todayISO,
} from "./dates";

describe("day numbers", () => {
  it("round-trips and starts at the epoch", () => {
    expect(toDay("1970-01-01")).toBe(0);
    expect(fromDay(toDay("2026-11-09"))).toBe("2026-11-09");
  });

  it("adds days across month, year and leap-day boundaries", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2027-02-28", 1)).toBe("2027-03-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("counts inclusive durations", () => {
    expect(durationDays("2026-09-12", "2026-09-12")).toBe(1);
    expect(durationDays("2026-11-02", "2027-01-31")).toBe(91);
    expect(diffDays("2026-11-09", "2026-11-02")).toBe(-7);
  });

  it("rejects malformed and impossible dates", () => {
    expect(isValidISODate("2026-02-30")).toBe(false);
    expect(isValidISODate("2026-2-3")).toBe(false);
    expect(isValidISODate("2028-02-29")).toBe(true);
    expect(() => toDay("nope")).toThrow();
  });
});

describe("unit boundaries", () => {
  const nov9 = toDay("2026-11-09"); // a Monday

  it("weeks start on Monday", () => {
    expect(dayParts(nov9).weekday).toBe(0);
    expect(startOfWeek(nov9)).toBe(nov9);
    expect(fromDay(startOfWeek(toDay("2026-11-15")))).toBe("2026-11-09"); // Sunday
    expect(fromDay(startOfWeek(toDay("2027-01-01")))).toBe("2026-12-28");
  });

  it("finds month and quarter starts", () => {
    expect(fromDay(startOfMonth(nov9))).toBe("2026-11-01");
    expect(fromDay(startOfQuarter(nov9))).toBe("2026-10-01");
    expect(fromDay(startOfQuarter(toDay("2027-03-31")))).toBe("2027-01-01");
  });

  it("adds months across years in both directions", () => {
    expect(fromDay(addMonths(nov9, 2))).toBe("2027-01-01");
    expect(fromDay(addMonths(nov9, -11))).toBe("2025-12-01");
  });
});

describe("formatting", () => {
  it("prints short and long dates", () => {
    expect(formatDate("2026-11-09", "short")).toBe("11.09");
    expect(formatDate("2026-11-09")).toBe("2026.11.09");
  });

  it("prints ranges with full dates on both ends", () => {
    expect(formatRange("2026-10-05", "2026-10-09")).toBe("2026.10.05 – 2026.10.09");
    expect(formatRange("2026-11-02", "2027-01-31")).toBe("2026.11.02 – 2027.01.31");
    expect(formatRange("2026-09-12", "2026-09-12")).toBe("2026.09.12");
  });

  it("uses the local calendar date for today", () => {
    expect(todayISO(new Date(2026, 10, 9, 23, 59))).toBe("2026-11-09");
    expect(todayISO(new Date(2027, 0, 1, 0, 0))).toBe("2027-01-01");
  });
});

describe("Mongolian labels", () => {
  it("names months, weekdays and quarters", () => {
    const d = toDay("2026-11-09");
    expect(formatMonth(d)).toBe("11-р сар");
    expect(formatMonthYear(d)).toBe("2026 оны 11-р сар");
    expect(formatWeekday(d)).toBe("Даваа");
    expect(formatWeekday(toDay("2026-11-15"))).toBe("Ням");
    expect(formatQuarter(toDay("2027-02-01"))).toEqual({ short: "1-р улирал", long: "2027 оны 1-р улирал" });
  });
});
