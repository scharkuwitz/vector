import { ZOOMS, ZOOM_LABEL, type Zoom } from "@/lib/gantt";
import { PRIORITIES, PRIORITY_LABEL, STATUS_LABEL } from "@/lib/types";
import { PRIORITY_FILL } from "../priority-badge";
import { btnSecondary } from "../ui";

const smallBtn = `${btnSecondary} h-7 px-2.5 text-[13px]`;

/** One row above the chart: zoom, grouping, jump to today, legend. */
export function GanttToolbar({
  zoom,
  onZoom,
  grouped,
  onGrouped,
  allowGrouping,
  onExpandAll,
  onCollapseAll,
  onToday,
}: {
  zoom: Zoom;
  onZoom: (z: Zoom) => void;
  grouped: boolean;
  onGrouped: (g: boolean) => void;
  allowGrouping: boolean;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onToday: () => void;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-3">
      <fieldset className="flex items-center">
        <legend className="sr-only">Масштаб</legend>
        <div className="flex overflow-hidden rounded-[4px] border border-line">
          {ZOOMS.map((z) => (
            <label
              key={z}
              className="cursor-pointer border-l border-line px-2.5 py-1 text-[13px] text-ink-2 first:border-l-0 hover:bg-surface-2 has-checked:bg-ink has-checked:text-page has-focus-visible:outline-2 has-focus-visible:-outline-offset-2 has-focus-visible:outline-ink"
            >
              <input
                type="radio"
                name="gantt-zoom"
                value={z}
                checked={zoom === z}
                onChange={() => onZoom(z)}
                className="sr-only"
              />
              {ZOOM_LABEL[z]}
            </label>
          ))}
        </div>
      </fieldset>

      {allowGrouping ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap text-[13px] text-ink">
            <input
              type="checkbox"
              checked={grouped}
              onChange={(e) => onGrouped(e.target.checked)}
              className="size-4 accent-ink"
            />
            Төлөвлөгөөгөөр бүлэглэх
          </label>
          {grouped ? (
            <span className="flex items-center gap-1.5">
              <button type="button" className={smallBtn} onClick={onExpandAll}>
                Бүгдийг дэлгэх
              </button>
              <button type="button" className={smallBtn} onClick={onCollapseAll}>
                Бүгдийг хураах
              </button>
            </span>
          ) : null}
        </div>
      ) : null}

      <button type="button" className={smallBtn} onClick={onToday}>
        Өнөөдөр
      </button>

      <ul className="ml-auto flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-ink-2" aria-label="Тайлбар">
        {PRIORITIES.map((p) => (
          <li key={p} className="flex items-center gap-1.5">
            <span aria-hidden="true" className={`h-2.5 w-4 rounded-[2px] ${PRIORITY_FILL[p]}`} />
            {PRIORITY_LABEL[p]}
          </li>
        ))}
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-2.5 w-4 rounded-[2px] bg-done" />
          {STATUS_LABEL.done}
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-3 w-px bg-ink-2" />
          Өнөөдөр
        </li>
      </ul>
    </div>
  );
}
