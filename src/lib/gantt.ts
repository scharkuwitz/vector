import {
  addMonths,
  dayParts,
  formatDate,
  formatDayShort,
  formatMonth,
  formatMonthYear,
  formatQuarter,
  formatRange,
  formatWeekday,
  fromDay,
  monthStart,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
  toDay,
} from "./dates";
import { compareActivities, comparePlans } from "./plan-stats";
import type { Activity, ISODate, PlanSummary } from "./types";

/*
 * Pure layout math for the Gantt chart: the visible date range, header ticks,
 * row order and bar geometry. Everything works on day numbers (see dates.ts).
 */

export const ZOOMS = ["day", "week", "month", "quarter"] as const;
export type Zoom = (typeof ZOOMS)[number];

export const ZOOM_LABEL: Record<Zoom, string> = {
  day: "Өдөр",
  week: "7 хоног",
  month: "Сар",
  quarter: "Улирал",
};

export const PX_PER_DAY: Record<Zoom, number> = {
  day: 28,
  week: 10,
  month: 3.5,
  quarter: 1.2,
};

export const DEFAULT_ZOOM: Zoom = "month";
export const MIN_BAR_WIDTH = 6;

export function isZoom(value: unknown): value is Zoom {
  return typeof value === "string" && (ZOOMS as readonly string[]).includes(value);
}

/** Half-open range of day numbers: [start, end). */
export interface DayRange {
  start: number;
  end: number;
}

type Unit = "day" | "week" | "month" | "quarter" | "year";

function unitStart(day: number, unit: Unit): number {
  switch (unit) {
    case "day":
      return day;
    case "week":
      return startOfWeek(day);
    case "month":
      return startOfMonth(day);
    case "quarter":
      return startOfQuarter(day);
    case "year":
      return monthStart(dayParts(day).year, 0);
  }
}

/** Start of the unit after the one beginning at `start` (which must be aligned). */
function unitAfter(start: number, unit: Unit, steps = 1): number {
  switch (unit) {
    case "day":
      return start + steps;
    case "week":
      return start + 7 * steps;
    case "month":
      return addMonths(start, steps);
    case "quarter":
      return addMonths(start, 3 * steps);
    case "year":
      return addMonths(start, 12 * steps);
  }
}

/** The unit the visible range snaps to, and is padded by, at each zoom. */
const SNAP_UNIT: Record<Zoom, Unit> = {
  day: "week",
  week: "week",
  month: "month",
  quarter: "quarter",
};

/**
 * Visible range: earliest start to latest end, always including today,
 * snapped to whole units and padded by one unit on each side.
 */
export function computeRange(
  items: ReadonlyArray<{ startDate: ISODate; endDate: ISODate }>,
  today: ISODate,
  zoom: Zoom,
): DayRange {
  let lo = toDay(today);
  let hi = lo;
  for (const item of items) {
    lo = Math.min(lo, toDay(item.startDate));
    hi = Math.max(hi, toDay(item.endDate));
  }
  const unit = SNAP_UNIT[zoom];
  const start = unitAfter(unitStart(lo, unit), unit, -1);
  const end = unitAfter(unitStart(hi, unit), unit, 2);
  return { start, end };
}

export function rangeWidth(range: DayRange, zoom: Zoom): number {
  return (range.end - range.start) * PX_PER_DAY[zoom];
}

export interface Tick {
  key: string;
  label: string;
  /** Full label for a tooltip/screen readers when `label` is abbreviated. */
  title: string;
  x: number;
  width: number;
  weekend?: boolean;
}

function spans(range: DayRange, unit: Unit): Array<{ unitStart: number; start: number; end: number }> {
  const out = [];
  for (let s = unitStart(range.start, unit); s < range.end; s = unitAfter(s, unit)) {
    const e = unitAfter(s, unit);
    out.push({ unitStart: s, start: Math.max(s, range.start), end: Math.min(e, range.end) });
  }
  return out;
}

function toTicks(
  range: DayRange,
  unit: Unit,
  px: number,
  label: (unitStart: number) => { label: string; title: string; weekend?: boolean },
): Tick[] {
  return spans(range, unit).map((s) => ({
    key: `${unit}-${s.unitStart}`,
    x: (s.start - range.start) * px,
    width: (s.end - s.start) * px,
    ...label(s.unitStart),
  }));
}

const monthTick = (d: number) => ({ label: formatMonthYear(d), title: formatMonthYear(d) });
const yearTick = (d: number) => ({ label: String(dayParts(d).year), title: String(dayParts(d).year) });

/** Two header rows: `major` (top, coarse) and `minor` (bottom, one per grid column). */
export function buildTicks(range: DayRange, zoom: Zoom): { major: Tick[]; minor: Tick[] } {
  const px = PX_PER_DAY[zoom];
  switch (zoom) {
    case "day":
      return {
        major: toTicks(range, "month", px, monthTick),
        minor: toTicks(range, "day", px, (d) => {
          const p = dayParts(d);
          return { label: String(p.date), title: `${formatDate(fromDay(d))}, ${formatWeekday(d)}`, weekend: p.weekday >= 5 };
        }),
      };
    case "week":
      return {
        major: toTicks(range, "month", px, monthTick),
        minor: toTicks(range, "week", px, (d) => ({
          label: formatDayShort(d),
          title: formatRange(fromDay(d), fromDay(d + 6)),
        })),
      };
    case "month":
      return {
        major: toTicks(range, "year", px, yearTick),
        minor: toTicks(range, "month", px, (d) => ({ label: formatMonth(d), title: formatMonthYear(d) })),
      };
    case "quarter":
      return {
        major: toTicks(range, "year", px, yearTick),
        minor: toTicks(range, "quarter", px, (d) => {
          const q = formatQuarter(d);
          return { label: q.short, title: q.long };
        }),
      };
  }
}

/** Horizontal position of the start of a date's column. */
export function dateX(iso: ISODate, range: DayRange, zoom: Zoom): number {
  return (toDay(iso) - range.start) * PX_PER_DAY[zoom];
}

/** Bar position for an inclusive date range; never narrower than MIN_BAR_WIDTH. */
export function barGeometry(
  startDate: ISODate,
  endDate: ISODate,
  range: DayRange,
  zoom: Zoom,
): { left: number; width: number } {
  const px = PX_PER_DAY[zoom];
  const left = (toDay(startDate) - range.start) * px;
  const width = Math.max(MIN_BAR_WIDTH, (toDay(endDate) - toDay(startDate) + 1) * px);
  return { left, width };
}

export type GanttRow =
  | { kind: "plan"; key: string; plan: PlanSummary; collapsed: boolean }
  | { kind: "activity"; key: string; activity: Activity; planTitle: string; nested: boolean };

/**
 * Flat: every activity by start date. Grouped: one header row per plan
 * (earliest plan first), followed by its activities unless it is collapsed.
 */
export function buildRows(
  activities: readonly Activity[],
  plans: readonly PlanSummary[],
  opts: { grouped: boolean; collapsed?: ReadonlySet<number> },
): GanttRow[] {
  const titles = new Map(plans.map((p) => [p.id, p.title]));
  const activityRow = (a: Activity, nested: boolean): GanttRow => ({
    kind: "activity",
    key: `a${a.id}`,
    activity: a,
    planTitle: titles.get(a.planId) ?? "",
    nested,
  });
  const sorted = [...activities].sort(compareActivities);

  if (!opts.grouped) return sorted.map((a) => activityRow(a, false));

  const rows: GanttRow[] = [];
  for (const plan of [...plans].sort(comparePlans)) {
    const collapsed = opts.collapsed?.has(plan.id) ?? false;
    rows.push({ kind: "plan", key: `p${plan.id}`, plan, collapsed });
    if (!collapsed) {
      for (const a of sorted) if (a.planId === plan.id) rows.push(activityRow(a, true));
    }
  }
  // Never drop data: activities whose plan wasn't passed in go last, ungrouped.
  for (const a of sorted) if (!titles.has(a.planId)) rows.push(activityRow(a, false));
  return rows;
}
