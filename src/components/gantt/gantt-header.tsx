import type { Tick } from "@/lib/gantt";

export const LABEL_COL = "w-[170px] sm:w-[280px]";
export const ROW_H = 36;
const TICK_ROW_H = 22;
export const HEADER_H = TICK_ROW_H * 2;

/** Rough text width at 11–12px; a label that wouldn't fit is left out (the title keeps it). */
function fits(label: string, width: number) {
  return label.length * 7 + 10 <= width;
}

/** Sticky two-row time scale plus the sticky corner cell. */
export function GanttHeader({
  ticks,
  width,
  todayX,
  cornerLabel,
}: {
  ticks: { major: Tick[]; minor: Tick[] };
  width: number;
  todayX: number;
  cornerLabel: string;
}) {
  return (
    <div className="sticky top-0 z-[4] flex" style={{ height: HEADER_H }} role="row">
      <div
        data-corner
        role="columnheader"
        className={`${LABEL_COL} sticky left-0 z-[5] flex shrink-0 items-end border-b border-r border-line bg-surface-2 px-3 pb-1 text-xs font-medium text-ink-2`}
      >
        {cornerLabel}
      </div>
      <div role="columnheader" className="relative flex-1 border-b border-line bg-surface-2" style={{ minWidth: width }}>
        <div className="absolute inset-x-0 top-0" style={{ height: TICK_ROW_H }}>
          {ticks.major.map((t) => (
            <div
              key={t.key}
              title={t.title}
              className="absolute top-0 flex h-full items-center border-l border-line px-1.5 text-xs font-medium text-ink first:border-l-0"
              style={{ left: t.x, width: t.width }}
            >
              {fits(t.label, t.width) ? <span className="sticky left-[180px] whitespace-nowrap sm:left-[290px]">{t.label}</span> : null}
            </div>
          ))}
        </div>
        <div className="absolute inset-x-0 border-t border-hairline" style={{ top: TICK_ROW_H, height: TICK_ROW_H }}>
          {ticks.minor.map((t) => (
            <div
              key={t.key}
              title={t.title}
              className={`absolute top-0 flex h-full items-center border-l border-hairline text-[11px] tabular-nums text-ink-2 first:border-l-0 ${
                t.width < 40 ? "justify-center" : "px-1.5"
              } ${t.weekend ? "text-ink-3" : ""}`}
              style={{ left: t.x, width: t.width }}
            >
              {fits(t.label, t.width) ? t.label : null}
            </div>
          ))}
        </div>
        {/* Today marker at the foot of the scale; the line continues through the body. */}
        <div
          aria-hidden="true"
          className="absolute bottom-0 size-0 border-x-[5px] border-b-[6px] border-x-transparent border-b-ink-2"
          style={{ left: todayX - 5 }}
        />
      </div>
    </div>
  );
}
