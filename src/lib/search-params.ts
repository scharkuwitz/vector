import { DEFAULT_ZOOM, isZoom, type Zoom } from "./gantt";
import { isPriority, isStatus, type ActivityFilter } from "./types";

export type SearchParams = Record<string, string | string[] | undefined>;

export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Parse a positive integer id, or undefined. */
export function parseId(value: string | string[] | undefined): number | undefined {
  const raw = firstParam(value);
  if (!raw || !/^\d+$/.test(raw)) return undefined;
  const n = Number(raw);
  return Number.isSafeInteger(n) && n > 0 ? n : undefined;
}

/** ?plan=1&priority=high&status=todo -> filter; unknown values are ignored. */
export function parseActivityFilter(sp: SearchParams): ActivityFilter {
  const priority = firstParam(sp.priority);
  const status = firstParam(sp.status);
  return {
    planId: parseId(sp.plan),
    priority: isPriority(priority) ? priority : undefined,
    status: isStatus(status) ? status : undefined,
  };
}

export function hasFilter(f: ActivityFilter): boolean {
  return f.planId !== undefined || f.priority !== undefined || f.status !== undefined;
}

/** ?zoom=week&group=plan -> Gantt view state. */
export function parseGanttView(sp: SearchParams): { zoom: Zoom; grouped: boolean } {
  const zoom = firstParam(sp.zoom);
  return { zoom: isZoom(zoom) ? zoom : DEFAULT_ZOOM, grouped: firstParam(sp.group) === "plan" };
}
