import Link from "next/link";
import { durationDays, formatDate } from "@/lib/dates";
import { isOverdue } from "@/lib/plan-stats";
import type { Activity, ISODate, Plan } from "@/lib/types";
import { PriorityBadge } from "./priority-badge";
import { StatusSelect } from "./status-select";
import { OverdueMark } from "./status-badge";

const th = "whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-ink-2";
const td = "px-3 py-2 align-top";

/**
 * The to-do list, and the Gantt chart's table view: every value the chart
 * shows on hover is readable here without hovering.
 */
export function ActivityTable({
  activities,
  plans,
  today,
  showPlan = true,
  empty,
}: {
  activities: Activity[];
  plans: Pick<Plan, "id" | "title">[];
  today: ISODate;
  showPlan?: boolean;
  empty?: React.ReactNode;
}) {
  const planTitle = new Map(plans.map((p) => [p.id, p.title]));

  if (activities.length === 0) {
    return (
      <div className="rounded-[4px] border border-hairline bg-surface px-4 py-10 text-center text-ink-2">
        {empty ?? "Одоогоор ажил алга."}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-[4px] border border-hairline bg-surface">
      <table className="w-full min-w-[760px] border-collapse text-[13px]">
        <thead className="border-b border-hairline bg-surface-2">
          <tr>
            <th className={th}>Төлөв</th>
            <th className={`${th} w-full min-w-[220px]`}>Ажил</th>
            {showPlan ? <th className={th}>Төлөвлөгөө</th> : null}
            <th className={th}>Ач холбогдол</th>
            <th className={`${th} text-right`}>Хувь</th>
            <th className={th}>Эхлэх</th>
            <th className={th}>Дуусах</th>
            <th className={`${th} text-right`}>Хоног</th>
          </tr>
        </thead>
        <tbody>
          {activities.map((a) => {
            const done = a.status === "done";
            return (
              <tr key={a.id} className="border-b border-hairline last:border-b-0 hover:bg-surface-2">
                <td className={`${td} py-1`}>
                  <StatusSelect id={a.id} status={a.status} title={a.title} />
                </td>
                <td className={td}>
                  <div className="flex flex-wrap items-center gap-x-2">
                    <Link
                      href={`/activities/${a.id}/edit`}
                      className={`font-medium underline-offset-2 hover:underline ${done ? "text-ink-3 line-through" : "text-ink"}`}
                    >
                      {a.title}
                    </Link>
                    {isOverdue(a, today) ? <OverdueMark /> : null}
                  </div>
                  {a.description ? <p className="mt-0.5 line-clamp-1 text-xs text-ink-3">{a.description}</p> : null}
                </td>
                {showPlan ? (
                  <td className={`${td} whitespace-nowrap`}>
                    <Link href={`/plans/${a.planId}`} className="text-ink-2 underline-offset-2 hover:text-ink hover:underline">
                      {planTitle.get(a.planId) ?? "—"}
                    </Link>
                  </td>
                ) : null}
                <td className={td}>
                  <PriorityBadge priority={a.priority} />
                </td>
                <td className={`${td} text-right tabular-nums text-ink-2`}>{a.weight}%</td>
                <td className={`${td} whitespace-nowrap tabular-nums text-ink-2`}>{formatDate(a.startDate)}</td>
                <td className={`${td} whitespace-nowrap tabular-nums text-ink-2`}>{formatDate(a.endDate)}</td>
                <td className={`${td} text-right tabular-nums text-ink-2`}>{durationDays(a.startDate, a.endDate)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
