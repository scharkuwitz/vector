import type { Ref } from "react";
import { durationDays, formatRange } from "@/lib/dates";
import { isOverdue, unassignedWeight } from "@/lib/plan-stats";
import { PRIORITY_LABEL, STATUS_LABEL, type Activity, type ISODate, type PlanSummary } from "@/lib/types";
import { AlertIcon } from "../icons";
import { PRIORITY_FILL } from "../priority-badge";

export type TipContent =
  | { kind: "activity"; activity: Activity; planTitle: string }
  | { kind: "plan"; plan: PlanSummary };

const dt = "text-ink-3";
const dd = "text-ink";

/**
 * Floating details for the hovered or focused bar. It is positioned by the
 * chart (style.transform) and never takes the pointer. All text goes through
 * React, so names are always rendered as text, never as markup.
 */
export function GanttTooltip({ id, tip, today, ref }: { id: string; tip: TipContent | null; today: ISODate; ref: Ref<HTMLDivElement> }) {
  return (
    <div
      ref={ref}
      id={id}
      role="tooltip"
      className="pointer-events-none fixed left-0 top-0 z-50 w-max max-w-[320px] rounded-[4px] border border-line bg-surface px-3 py-2.5 text-[13px] leading-[18px] text-ink"
      style={{ visibility: tip ? "visible" : "hidden" }}
    >
      {tip?.kind === "activity" ? <ActivityTip activity={tip.activity} planTitle={tip.planTitle} today={today} /> : null}
      {tip?.kind === "plan" ? <PlanTip plan={tip.plan} /> : null}
    </div>
  );
}

function ActivityTip({ activity: a, planTitle, today }: { activity: Activity; planTitle: string; today: ISODate }) {
  const days = durationDays(a.startDate, a.endDate);
  return (
    <>
      <p className="font-semibold">{a.title}</p>
      <p className="tabular-nums text-ink">
        {formatRange(a.startDate, a.endDate)}
        <span className="text-ink-3"> · {days} хоног</span>
      </p>
      {isOverdue(a, today) ? (
        <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-critical">
          <AlertIcon size={12} />
          Хугацаа хэтэрсэн
        </p>
      ) : null}
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 border-t border-hairline pt-2 text-xs">
        <dt className={dt}>Эзлэх хувь</dt>
        <dd className={`${dd} tabular-nums`}>
          <strong className="font-semibold">{a.weight}%</strong>
        </dd>
        <dt className={dt}>Ач холбогдол</dt>
        <dd className={`${dd} flex items-center gap-1.5`}>
          <span aria-hidden="true" className={`h-0.5 w-3 rounded-full ${PRIORITY_FILL[a.priority]}`} />
          {PRIORITY_LABEL[a.priority]}
        </dd>
        <dt className={dt}>Төлөв</dt>
        <dd className={dd}>{STATUS_LABEL[a.status]}</dd>
        <dt className={dt}>Төлөвлөгөө</dt>
        <dd className={dd}>{planTitle}</dd>
      </dl>
      {a.description ? <p className="mt-2 line-clamp-4 text-xs text-ink-2">{a.description}</p> : null}
    </>
  );
}

function PlanTip({ plan: p }: { plan: PlanSummary }) {
  const unassigned = unassignedWeight(p);
  return (
    <>
      <p className="font-semibold">{p.title}</p>
      {p.startDate && p.endDate ? (
        <p className="tabular-nums">
          {formatRange(p.startDate, p.endDate)}
          <span className="text-ink-3"> · {durationDays(p.startDate, p.endDate)} хоног</span>
        </p>
      ) : null}
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 border-t border-hairline pt-2 text-xs">
        <dt className={dt}>Явц</dt>
        <dd className={`${dd} tabular-nums`}>
          <strong className="font-semibold">{p.progress}%</strong> дууссан
        </dd>
        <dt className={dt}>Ажлууд</dt>
        <dd className={`${dd} tabular-nums`}>
          {STATUS_LABEL.done}: {p.counts.done} · {STATUS_LABEL.in_progress}: {p.counts.in_progress} · {STATUS_LABEL.todo}:{" "}
          {p.counts.todo}
        </dd>
        <dt className={dt}>Нийт хувь</dt>
        <dd className={`${dd} tabular-nums`}>{p.weightTotal}%</dd>
      </dl>
      {p.activityCount > 0 && p.weightTotal !== 100 ? (
        <p className="mt-2 flex items-center gap-1 text-xs text-ink-2">
          <AlertIcon size={12} className="text-warning" />
          {p.weightTotal > 100 ? `Хувь хэтэрсэн: ${p.weightTotal - 100}%` : `Хуваарилагдаагүй: ${unassigned}%`}
        </p>
      ) : null}
    </>
  );
}
