"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type PointerEvent,
} from "react";
import { toDay } from "@/lib/dates";
import {
  DEFAULT_ZOOM,
  PX_PER_DAY,
  barGeometry,
  buildRows,
  buildTicks,
  computeRange,
  rangeWidth,
  type Zoom,
} from "@/lib/gantt";
import type { Activity, ISODate, PlanSummary } from "@/lib/types";
import { linkClass } from "../ui";
import { GanttHeader, LABEL_COL, ROW_H } from "./gantt-header";
import { GanttRowView, type TipHandlers } from "./gantt-rows";
import { GanttToolbar } from "./gantt-toolbar";
import { GanttTooltip, type TipContent } from "./gantt-tooltip";

export interface GanttProps {
  activities: Activity[];
  plans: PlanSummary[];
  today: ISODate;
  initialZoom?: Zoom;
  initialGrouped?: boolean;
  /** Offer the "Group by plan" toggle (off on a single plan's page). */
  allowGrouping?: boolean;
  /** Mirror zoom and grouping into the URL (?zoom=week&group=plan). */
  syncUrl?: boolean;
  /** CSS max-height of the scrolling chart area. */
  maxHeight?: string;
}

const TIP_OFFSET = 14;
const EDGE = 8;

export function Gantt({
  activities,
  plans,
  today,
  initialZoom = DEFAULT_ZOOM,
  initialGrouped = false,
  allowGrouping = true,
  syncUrl = false,
  maxHeight = "calc(100dvh - 220px)",
}: GanttProps) {
  const [zoom, setZoom] = useState<Zoom>(initialZoom);
  const [grouped, setGrouped] = useState(allowGrouping && initialGrouped);
  const [collapsed, setCollapsed] = useState<ReadonlySet<number>>(() => new Set());
  const [tip, setTip] = useState<{ key: string; content: TipContent } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const anchor = useRef({ x: 0, y: 0 });
  const tooltipId = useId();

  const range = useMemo(() => computeRange(activities, today, zoom), [activities, today, zoom]);
  const ticks = useMemo(() => buildTicks(range, zoom), [range, zoom]);
  const rows = useMemo(
    () => buildRows(activities, plans, { grouped, collapsed }),
    [activities, plans, grouped, collapsed],
  );
  const width = rangeWidth(range, zoom);
  const px = PX_PER_DAY[zoom];
  const todayX = (toDay(today) - range.start + 0.5) * px;

  // ---- view state <-> URL -------------------------------------------------

  function writeUrl(next: { zoom: Zoom; grouped: boolean }) {
    if (!syncUrl) return;
    const params = new URLSearchParams(window.location.search);
    if (next.zoom === DEFAULT_ZOOM) params.delete("zoom");
    else params.set("zoom", next.zoom);
    if (next.grouped) params.set("group", "plan");
    else params.delete("group");
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }

  function changeZoom(z: Zoom) {
    setZoom(z);
    writeUrl({ zoom: z, grouped });
  }

  function changeGrouped(g: boolean) {
    setGrouped(g);
    writeUrl({ zoom, grouped: g });
  }

  function togglePlan(id: number) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // ---- scrolling ------------------------------------------------------------

  const scrollToToday = useCallback(
    (behavior: ScrollBehavior = "auto") => {
      const el = scrollRef.current;
      if (!el) return;
      const labelWidth = el.querySelector<HTMLElement>("[data-corner]")?.offsetWidth ?? 0;
      const visible = el.clientWidth - labelWidth;
      el.scrollTo({ left: Math.max(0, todayX - visible / 2), behavior });
    },
    [todayX],
  );

  // Keep today in view on first render and whenever the scale changes.
  useEffect(() => {
    scrollToToday();
  }, [scrollToToday]);

  // ---- tooltip --------------------------------------------------------------

  /** Place the tooltip next to the anchor point, flipping at the viewport edges. */
  const placeTip = useCallback(() => {
    const el = tipRef.current;
    if (!el) return;
    const { width: w, height: h } = el.getBoundingClientRect();
    let { x, y } = anchor.current;
    x = x + TIP_OFFSET + w + EDGE > window.innerWidth ? x - TIP_OFFSET - w : x + TIP_OFFSET;
    y = y + TIP_OFFSET + h + EDGE > window.innerHeight ? y - TIP_OFFSET - h : y + TIP_OFFSET;
    el.style.transform = `translate(${Math.max(EDGE, x)}px, ${Math.max(EDGE, y)}px)`;
  }, []);

  // New content changes the tooltip's size, so measure and place it after render.
  useLayoutEffect(() => {
    if (tip) placeTip();
  }, [tip, placeTip]);

  // Escape dismisses the tooltip without moving the pointer or focus.
  useEffect(() => {
    if (!tip) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTip(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tip]);

  const tipHandlers: TipHandlers = {
    onPointerEnter(e: PointerEvent<HTMLElement>, content: TipContent) {
      anchor.current = { x: e.clientX, y: e.clientY };
      setTip({ key: tipKey(content), content });
    },
    onPointerMove(e: PointerEvent<HTMLElement>) {
      anchor.current = { x: e.clientX, y: e.clientY };
      placeTip();
    },
    onPointerLeave() {
      setTip(null);
    },
    onFocus(e: FocusEvent<HTMLElement>, content: TipContent) {
      // Keyboard focus: anchor under the visible start of the bar.
      const r = e.currentTarget.getBoundingClientRect();
      const box = scrollRef.current?.getBoundingClientRect();
      const x = box ? Math.min(Math.max(r.left, box.left), box.right) : r.left;
      anchor.current = { x: x + 8, y: r.top + r.height / 2 };
      setTip({ key: tipKey(content), content });
    },
    onBlur() {
      setTip(null);
    },
  };

  if (activities.length === 0 && plans.every((p) => p.activityCount === 0)) {
    return (
      <div className="rounded-[4px] border border-hairline bg-surface px-4 py-10 text-center text-ink-2">
        Одоогоор харуулах ажил алга. Ажил нэмэхэд энд гарч ирнэ.
      </div>
    );
  }

  const planCount = rows.filter((r) => r.kind === "plan").length;
  const activityCount = activities.length;

  return (
    <div>
      <GanttToolbar
        zoom={zoom}
        onZoom={changeZoom}
        grouped={grouped}
        onGrouped={changeGrouped}
        allowGrouping={allowGrouping}
        onExpandAll={() => setCollapsed(new Set())}
        onCollapseAll={() => setCollapsed(new Set(plans.map((p) => p.id)))}
        onToday={() => scrollToToday("smooth")}
      />

      <div
        ref={scrollRef}
        className="relative overflow-auto overscroll-x-contain rounded-[4px] border border-line bg-surface"
        style={{ maxHeight, scrollbarColor: "var(--line) var(--surface)" }}
        onScroll={() => {
          if (tip) setTip(null);
        }}
      >
        <div
          role="grid"
          aria-label={`Gantt диаграм, ${activityCount} ажил${grouped ? `, ${planCount} төлөвлөгөө` : ""}`}
          aria-rowcount={rows.length + 1}
          className="relative w-max min-w-full"
        >
          <GanttHeader
            ticks={ticks}
            width={width}
            todayX={todayX}
            cornerLabel={grouped ? "Төлөвлөгөө / ажил" : "Ажил"}
          />

          <div className="relative">
            {/* Grid, weekend shading and today line: above row backgrounds, under the bars. */}
            <GridOverlay ticks={ticks.minor} majors={ticks.major} width={width} todayX={todayX} height={rows.length * ROW_H} />

            {rows.map((row) => (
              <GanttRowView
                key={row.key}
                row={row}
                width={width}
                today={today}
                tooltipId={tooltipId}
                activeKey={tip?.key ?? null}
                tip={tipHandlers}
                onToggle={togglePlan}
                subline={allowGrouping && !grouped ? "plan" : "dates"}
                bar={
                  row.kind === "activity"
                    ? barGeometry(row.activity.startDate, row.activity.endDate, range, zoom)
                    : row.plan.startDate && row.plan.endDate
                      ? barGeometry(row.plan.startDate, row.plan.endDate, range, zoom)
                      : null
                }
              />
            ))}
          </div>
        </div>
      </div>

      <p className="mt-2 flex flex-wrap items-center gap-x-2 text-xs text-ink-3">
        <span className="hidden sm:inline">Дэлгэрэнгүйг харах бол зурвас дээр хулганаа аваачна уу. Дарж нээнэ.</span>
        <span aria-hidden="true" className="hidden sm:inline">
          ·
        </span>
        <Link href="/" className={`${linkClass} text-ink-2`}>
          Жагсаалтаар харах
        </Link>
      </p>

      <GanttTooltip id={tooltipId} ref={tipRef} tip={tip?.content ?? null} today={today} />
    </div>
  );
}

function tipKey(content: TipContent): string {
  return content.kind === "plan" ? `p${content.plan.id}` : `a${content.activity.id}`;
}

/** Vertical grid lines, weekend columns and the today line, under the rows. */
function GridOverlay({
  ticks,
  majors,
  width,
  todayX,
  height,
}: {
  ticks: { key: string; x: number; width: number; weekend?: boolean }[];
  majors: { key: string; x: number }[];
  width: number;
  todayX: number;
  height: number;
}) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute top-0 z-[1] flex" style={{ height }}>
      <div className={`${LABEL_COL} shrink-0`} />
      <div className="relative shrink-0" style={{ width, height }}>
        {ticks.map((t) =>
          t.weekend ? (
            <div key={`w${t.key}`} className="absolute inset-y-0 bg-surface-2" style={{ left: t.x, width: t.width }} />
          ) : null,
        )}
        {ticks.map((t) =>
          t.x > 0 ? <div key={t.key} className="absolute inset-y-0 w-px bg-hairline" style={{ left: t.x }} /> : null,
        )}
        {majors.map((t) =>
          t.x > 0 ? <div key={t.key} className="absolute inset-y-0 w-px bg-line" style={{ left: t.x }} /> : null,
        )}
        <div className="absolute inset-y-0 w-px bg-ink-2" style={{ left: todayX }} />
      </div>
    </div>
  );
}
