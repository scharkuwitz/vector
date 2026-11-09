import { compareText } from "./collate";
import type { Activity, ISODate, Plan, PlanSummary, Status } from "./types";

/** Derive progress, weight total, counts and date range for one plan. */
export function summarizePlan(plan: Plan, activities: readonly Activity[]): PlanSummary {
  const own = activities.filter((a) => a.planId === plan.id);
  const counts: Record<Status, number> = { todo: 0, in_progress: 0, done: 0 };
  let weightTotal = 0;
  let progress = 0;
  let startDate: ISODate | null = null;
  let endDate: ISODate | null = null;

  for (const a of own) {
    counts[a.status] += 1;
    weightTotal += a.weight;
    if (a.status === "done") progress += a.weight;
    // ISO dates compare correctly as strings.
    if (startDate === null || a.startDate < startDate) startDate = a.startDate;
    if (endDate === null || a.endDate > endDate) endDate = a.endDate;
  }

  return { ...plan, activityCount: own.length, counts, weightTotal, progress, startDate, endDate };
}

/** Percentage of the plan not yet given to any activity (never negative). */
export function unassignedWeight(summary: Pick<PlanSummary, "weightTotal">): number {
  return Math.max(0, 100 - summary.weightTotal);
}

/** Ended before today and not done. */
export function isOverdue(activity: Pick<Activity, "endDate" | "status">, today: ISODate): boolean {
  return activity.status !== "done" && activity.endDate < today;
}

/** Plain ordering for ISO dates, which sort correctly as strings. */
const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/** Sort key used everywhere activities are listed: start, end, title, id. */
export function compareActivities(a: Activity, b: Activity): number {
  return (
    cmp(a.startDate, b.startDate) ||
    cmp(a.endDate, b.endDate) ||
    compareText(a.title, b.title) ||
    a.id - b.id
  );
}

/** Plans with dates first (earliest start), then empty plans; ties by title. */
export function comparePlans(a: PlanSummary, b: PlanSummary): number {
  if (a.startDate !== b.startDate) {
    if (a.startDate === null) return 1;
    if (b.startDate === null) return -1;
    return cmp(a.startDate, b.startDate);
  }
  return compareText(a.title, b.title) || a.id - b.id;
}
