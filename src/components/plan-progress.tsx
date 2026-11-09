import { unassignedWeight } from "@/lib/plan-stats";
import type { PlanSummary } from "@/lib/types";
import { AlertIcon } from "./icons";

/** Neutral bar: blue is reserved for priority. */
export function ProgressBar({ value, width = 120 }: { value: number; width?: number | string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <span
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Төлөвлөгөөний явц"
      className="inline-block h-1.5 overflow-hidden rounded-full bg-hairline align-middle"
      style={{ width }}
    >
      <span className="block h-full rounded-full bg-ink-2" style={{ width: `${pct}%` }} />
    </span>
  );
}

/** "Хуваарилагдаагүй: 20%" / "Хувь хэтэрсэн: 20%" when a plan's weights don't total 100%. */
export function WeightWarning({ plan }: { plan: Pick<PlanSummary, "weightTotal" | "activityCount"> }) {
  if (plan.activityCount === 0 || plan.weightTotal === 100) return null;
  const over = plan.weightTotal > 100;
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs text-ink-2">
      <AlertIcon size={12} className="text-warning" />
      {over ? `Хувь хэтэрсэн: ${plan.weightTotal - 100}%` : `Хуваарилагдаагүй: ${unassignedWeight(plan)}%`}
    </span>
  );
}
