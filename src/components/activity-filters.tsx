import Form from "next/form";
import Link from "next/link";
import { hasFilter } from "@/lib/search-params";
import { PRIORITIES, PRIORITY_LABEL, STATUSES, STATUS_LABEL, type ActivityFilter, type Plan } from "@/lib/types";
import { btnSecondary, selectClass } from "./ui";

const field = "flex flex-col gap-1 text-xs font-medium text-ink-2";

/** One row of filters above the list. A plain GET form: works without JavaScript. */
export function ActivityFilters({ plans, value }: { plans: Pick<Plan, "id" | "title">[]; value: ActivityFilter }) {
  return (
    <Form
      // Remount when the URL changes so "Clear filters" also resets the selects.
      key={`${value.planId ?? ""}-${value.priority ?? ""}-${value.status ?? ""}`}
      action="/"
      className="mb-3 flex flex-wrap items-end gap-3"
      aria-label="Ажил шүүх"
    >
      <label className={field}>
        Төлөвлөгөө
        <select name="plan" defaultValue={value.planId ?? ""} className={`${selectClass} w-56`}>
          <option value="">Бүх төлөвлөгөө</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
      </label>
      <label className={field}>
        Ач холбогдол
        <select name="priority" defaultValue={value.priority ?? ""} className={`${selectClass} w-36`}>
          <option value="">Бүгд</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABEL[p]}
            </option>
          ))}
        </select>
      </label>
      <label className={field}>
        Төлөв
        <select name="status" defaultValue={value.status ?? ""} className={`${selectClass} w-36`}>
          <option value="">Бүгд</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className={btnSecondary}>
        Шүүх
      </button>
      {hasFilter(value) ? (
        <Link href="/" className="h-8 content-center text-[13px] text-ink-2 underline-offset-2 hover:text-ink hover:underline">
          Шүүлтүүр арилгах
        </Link>
      ) : null}
    </Form>
  );
}
