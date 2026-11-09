import type { ISODate } from "./types";

/*
 * Dates are calendar days without a time or time zone. Internally they are
 * handled as whole "day numbers" (days since 1970-01-01, computed in UTC),
 * which makes differences and offsets plain integer math with no DST surprises.
 */

const MS_PER_DAY = 86_400_000;
const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isValidISODate(value: string): boolean {
  const m = ISO_RE.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

/** "2026-11-09" -> day number. Throws on malformed input. */
export function toDay(iso: ISODate): number {
  const m = ISO_RE.exec(iso);
  if (!m) throw new Error(`Invalid date: ${iso}`);
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / MS_PER_DAY;
}

/** Day number -> "2026-11-09". */
export function fromDay(day: number): ISODate {
  return new Date(day * MS_PER_DAY).toISOString().slice(0, 10);
}

export function addDays(iso: ISODate, days: number): ISODate {
  return fromDay(toDay(iso) + days);
}

/** Whole days from `a` to `b` (positive when b is later). */
export function diffDays(a: ISODate, b: ISODate): number {
  return toDay(b) - toDay(a);
}

/** Inclusive length of a date range: a single day counts as 1. */
export function durationDays(start: ISODate, end: ISODate): number {
  return diffDays(start, end) + 1;
}

export interface DayParts {
  year: number;
  /** 0–11 */
  month: number;
  /** 1–31 */
  date: number;
  /** 0 = Monday … 6 = Sunday */
  weekday: number;
}

export function dayParts(day: number): DayParts {
  const dt = new Date(day * MS_PER_DAY);
  return {
    year: dt.getUTCFullYear(),
    month: dt.getUTCMonth(),
    date: dt.getUTCDate(),
    weekday: (dt.getUTCDay() + 6) % 7,
  };
}

/** Day number of the first day of a month; month may overflow (13 = next January). */
export function monthStart(year: number, month: number): number {
  return Date.UTC(year, month, 1) / MS_PER_DAY;
}

/** Monday on or before the given day. */
export function startOfWeek(day: number): number {
  return day - dayParts(day).weekday;
}

export function startOfMonth(day: number): number {
  const { year, month } = dayParts(day);
  return monthStart(year, month);
}

export function startOfQuarter(day: number): number {
  const { year, month } = dayParts(day);
  return monthStart(year, month - (month % 3));
}

/** First day of the month `n` months after the month containing `day`. */
export function addMonths(day: number, n: number): number {
  const { year, month } = dayParts(day);
  return monthStart(year, month + n);
}

/** Today's date on this machine's clock, in its local time zone. */
export function todayISO(now: Date = new Date()): ISODate {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/*
 * Formatting, Mongolian style. Hand-written rather than Intl so server and
 * browser always print exactly the same text (browsers differ in which
 * locale data they ship) and so dates stay compact: Mongolian readers use
 * year.month.day numbers, e.g. "2026.11.09".
 */

const WEEKDAYS = ["Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба", "Ням"];
const pad = (n: number) => String(n).padStart(2, "0");

/** "long" -> "2026.11.09", "short" (year implied) -> "11.09". */
export function formatDate(iso: ISODate, style: "short" | "long" = "long"): string {
  const { year, month, date } = dayParts(toDay(iso));
  return style === "short" ? `${pad(month + 1)}.${pad(date)}` : `${year}.${pad(month + 1)}.${pad(date)}`;
}

/** "2026.11.09 – 2027.01.15", or a single date when both ends are the same day. */
export function formatRange(start: ISODate, end: ISODate): string {
  if (start === end) return formatDate(start, "long");
  return `${formatDate(start, "long")} – ${formatDate(end, "long")}`;
}

/** "11-р сар" for a day number. */
export function formatMonth(day: number): string {
  return `${dayParts(day).month + 1}-р сар`;
}

/** "2026 оны 11-р сар" for a day number. */
export function formatMonthYear(day: number): string {
  return `${dayParts(day).year} оны ${formatMonth(day)}`;
}

/** "11.09" for a day number. */
export function formatDayShort(day: number): string {
  return formatDate(fromDay(day), "short");
}

/** "Даваа" … "Ням" for a day number. */
export function formatWeekday(day: number): string {
  return WEEKDAYS[dayParts(day).weekday];
}

/** "2026 оны 1-р улирал" style quarter label parts: { short: "1-р улирал", long: "2026 оны 1-р улирал" }. */
export function formatQuarter(day: number): { short: string; long: string } {
  const { year, month } = dayParts(day);
  const short = `${Math.floor(month / 3) + 1}-р улирал`;
  return { short, long: `${year} оны ${short}` };
}
