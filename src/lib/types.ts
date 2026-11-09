/** A calendar date with no time part, e.g. "2026-11-09". */
export type ISODate = string;

export const PRIORITIES = ["low", "medium", "high"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const STATUSES = ["todo", "in_progress", "done"] as const;
export type Status = (typeof STATUSES)[number];

export const PRIORITY_LABEL: Record<Priority, string> = {
  low: "Бага",
  medium: "Дунд",
  high: "Өндөр",
};

export const STATUS_LABEL: Record<Status, string> = {
  todo: "Хийх",
  in_progress: "Хийгдэж буй",
  done: "Дууссан",
};

export interface Plan {
  id: number;
  title: string;
  description: string | null;
  createdAt: string;
}

export interface Activity {
  id: number;
  planId: number;
  title: string;
  description: string | null;
  priority: Priority;
  status: Status;
  /** Share of the plan this activity represents, an integer 1–100 (%). */
  weight: number;
  /** Inclusive range; endDate >= startDate, a single day is allowed. */
  startDate: ISODate;
  endDate: ISODate;
  createdAt: string;
  updatedAt: string;
}

/** A plan plus figures derived from its activities. Never stored. */
export interface PlanSummary extends Plan {
  activityCount: number;
  counts: Record<Status, number>;
  /** Sum of all activity weights (%). Should be 100. */
  weightTotal: number;
  /** Sum of the weights of done activities (%). */
  progress: number;
  /** Earliest activity start and latest activity end, null with no activities. */
  startDate: ISODate | null;
  endDate: ISODate | null;
}

export interface ActivityFilter {
  planId?: number;
  priority?: Priority;
  status?: Status;
}

export function isPriority(value: unknown): value is Priority {
  return typeof value === "string" && (PRIORITIES as readonly string[]).includes(value);
}

export function isStatus(value: unknown): value is Status {
  return typeof value === "string" && (STATUSES as readonly string[]).includes(value);
}

/** Text limits, shared by the forms (maxLength) and validation. */
export const TITLE_MAX = 200;
export const DESCRIPTION_MAX = 2000;
