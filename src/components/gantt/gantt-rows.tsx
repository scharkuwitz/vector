import Link from "next/link";
import type { FocusEvent, PointerEvent } from "react";
import { formatRange } from "@/lib/dates";
import type { GanttRow } from "@/lib/gantt";
import { isOverdue } from "@/lib/plan-stats";
import { PRIORITY_LABEL, STATUS_LABEL, type ISODate } from "@/lib/types";
import { AlertIcon, ChevronIcon, StatusIcon } from "../icons";
import { PRIORITY_FILL } from "../priority-badge";
import { LABEL_COL, ROW_H } from "./gantt-header";
import type { TipContent } from "./gantt-tooltip";

export interface TipHandlers {
  onPointerEnter: (e: PointerEvent<HTMLElement>, tip: TipContent) => void;
  onPointerMove: (e: PointerEvent<HTMLElement>) => void;
  onPointerLeave: () => void;
  onFocus: (e: FocusEvent<HTMLElement>, tip: TipContent) => void;
  onBlur: () => void;
}

/** Extra hit area on each side of a bar, so thin bars are easy to hover. */
const HIT_PAD = 4;
const BAR_H = 16;
const SUMMARY_H = 6;

const labelCell = `${LABEL_COL} sticky left-0 z-[3] flex shrink-0 flex-col justify-center border-r border-line px-3`;

export function GanttRowView({
  row,
  bar,
  width,
  today,
  tooltipId,
  activeKey,
  tip,
  onToggle,
  subline,
}: {
  row: GanttRow;
  bar: { left: number; width: number } | null;
  width: number;
  today: ISODate;
  tooltipId: string;
  activeKey: string | null;
  tip: TipHandlers;
  onToggle: (planId: number) => void;
  /** Second line under an activity title: its plan's name, or its dates. */
  subline: "plan" | "dates";
}) {
  if (row.kind === "plan") {
    const p = row.plan;
    const content: TipContent = { kind: "plan", plan: p };
    return (
      <div role="row" className="group flex border-b border-hairline bg-surface-2" style={{ height: ROW_H }}>
        <div role="rowheader" className={`${labelCell} bg-surface-2`}>
          <div className="flex min-w-0 items-center gap-1">
            <button
              type="button"
              onClick={() => onToggle(p.id)}
              aria-expanded={!row.collapsed}
              aria-label={`${p.title}: ${row.collapsed ? "дэлгэх" : "хураах"}`}
              className="-ml-1 grid size-5 shrink-0 place-items-center rounded-[4px] text-ink-2 hover:bg-hairline hover:text-ink"
            >
              <ChevronIcon open={!row.collapsed} size={13} />
            </button>
            <Link href={`/plans/${p.id}`} className="truncate text-[13px] font-semibold text-ink underline-offset-2 hover:underline">
              {p.title}
            </Link>
            <span className="ml-auto pl-2 text-xs tabular-nums text-ink-2">{p.progress}%</span>
          </div>
          <p className="truncate pl-[18px] text-[11px] leading-[14px] text-ink-3">
            {p.activityCount} ажил
            {p.startDate && p.endDate ? ` · ${formatRange(p.startDate, p.endDate)}` : ""}
          </p>
        </div>
        <div role="gridcell" className="relative flex-1" style={{ minWidth: width }}>
          {bar ? (
            <Link
              href={`/plans/${p.id}`}
              aria-label={`${p.title}: ${p.progress}% дууссан`}
              aria-describedby={activeKey === row.key ? tooltipId : undefined}
              className="group/bar absolute top-0 z-[2] flex h-full items-center outline-none"
              style={{ left: bar.left - HIT_PAD, width: bar.width + HIT_PAD * 2, paddingInline: HIT_PAD }}
              onPointerEnter={(e) => tip.onPointerEnter(e, content)}
              onPointerMove={tip.onPointerMove}
              onPointerLeave={tip.onPointerLeave}
              onFocus={(e) => tip.onFocus(e, content)}
              onBlur={tip.onBlur}
            >
              <span
                className="relative block w-full overflow-hidden rounded-full bg-line group-hover/bar:brightness-95 group-focus-visible/bar:outline-2 group-focus-visible/bar:outline-offset-2 group-focus-visible/bar:outline-ink"
                style={{ height: SUMMARY_H }}
              >
                <span className="absolute inset-y-0 left-0 bg-ink-2" style={{ width: `${p.progress}%` }} />
              </span>
            </Link>
          ) : (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-ink-3">Ажил алга</span>
          )}
        </div>
      </div>
    );
  }

  const a = row.activity;
  const done = a.status === "done";
  const overdue = isOverdue(a, today);
  const content: TipContent = { kind: "activity", activity: a, planTitle: row.planTitle };
  const sub = subline === "plan" ? row.planTitle : formatRange(a.startDate, a.endDate);

  return (
    <div role="row" className="group flex border-b border-hairline" style={{ height: ROW_H }}>
      <div role="rowheader" className={`${labelCell} bg-surface group-hover:bg-surface-2 ${row.nested ? "pl-8" : ""}`}>
        <div className="flex min-w-0 items-center gap-1.5">
          <StatusIcon status={a.status} size={12} className={`shrink-0 ${done ? "text-ink-3" : "text-ink-2"}`} />
          <span className={`truncate text-[13px] ${done ? "text-ink-3 line-through" : "text-ink"}`}>{a.title}</span>
          {overdue ? (
            <span className="ml-auto flex shrink-0 items-center gap-1 pl-1 text-[11px] font-medium text-critical">
              <AlertIcon size={11} />
              <span className="hidden sm:inline">Хугацаа хэтэрсэн</span>
            </span>
          ) : null}
        </div>
        <p className="truncate pl-[18px] text-[11px] leading-[14px] text-ink-3">{sub}</p>
      </div>
      <div role="gridcell" className="relative flex-1" style={{ minWidth: width }}>
        {bar ? (
          <Link
            href={`/activities/${a.id}/edit`}
            aria-label={`${a.title}, ${formatRange(a.startDate, a.endDate)}, ач холбогдол: ${PRIORITY_LABEL[a.priority]}, ${STATUS_LABEL[a.status]}${overdue ? ", хугацаа хэтэрсэн" : ""}`}
            aria-describedby={activeKey === row.key ? tooltipId : undefined}
            className="group/bar absolute top-0 z-[2] flex h-full items-center outline-none"
            style={{ left: bar.left - HIT_PAD, width: bar.width + HIT_PAD * 2, paddingInline: HIT_PAD }}
            onPointerEnter={(e) => tip.onPointerEnter(e, content)}
            onPointerMove={tip.onPointerMove}
            onPointerLeave={tip.onPointerLeave}
            onFocus={(e) => tip.onFocus(e, content)}
            onBlur={tip.onBlur}
          >
            <span
              className={`block w-full rounded-[4px] ${done ? "bg-done" : PRIORITY_FILL[a.priority]} group-hover/bar:brightness-110 group-focus-visible/bar:outline-2 group-focus-visible/bar:outline-offset-2 group-focus-visible/bar:outline-ink ${
                activeKey === row.key ? "brightness-110" : ""
              }`}
              style={{ height: BAR_H }}
            />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
