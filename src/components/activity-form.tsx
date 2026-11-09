"use client";

import Link from "next/link";
import { useState } from "react";
import { saveActivity } from "@/app/actions";
import {
  DESCRIPTION_MAX,
  PRIORITIES,
  PRIORITY_LABEL,
  STATUSES,
  STATUS_LABEL,
  TITLE_MAX,
  type Activity,
  type PlanSummary,
} from "@/lib/types";
import { PrioritySwatch } from "./priority-badge";
import { FieldError, btnPrimary, btnSecondary, hintClass, inputClass, labelClass, selectClass } from "./ui";
import { invalidProps, useFormAction } from "./use-form-action";

type PlanOption = Pick<PlanSummary, "id" | "title" | "weightTotal">;

/** Create / edit an activity. Saved by the saveActivity Server Action. */
export function ActivityForm({
  plans,
  activity,
  defaultPlanId,
  cancelHref,
  returnTo,
}: {
  plans: PlanOption[];
  activity?: Activity;
  defaultPlanId?: number;
  cancelHref: string;
  /** Where to go after saving; defaults to the activity's plan. */
  returnTo?: string;
}) {
  const { errors, pending, formProps } = useFormAction(saveActivity);
  const [planId, setPlanId] = useState<string>(String(activity?.planId ?? defaultPlanId ?? ""));
  const [startDate, setStartDate] = useState(activity?.startDate ?? "");
  const [weight, setWeight] = useState(String(activity?.weight ?? ""));

  // Weight still free in the selected plan, not counting this activity's own share.
  const plan = plans.find((p) => String(p.id) === planId);
  const ownShare = activity && plan && activity.planId === plan.id ? activity.weight : 0;
  const available = plan ? Math.max(0, 100 - (plan.weightTotal - ownShare)) : null;
  const tooHeavy = available !== null && Number(weight) > available;
  const weightError = errors.weight ?? (tooHeavy ? overMessage(available) : undefined);

  return (
    <form {...formProps} className="flex max-w-2xl flex-col gap-5">
      {activity ? <input type="hidden" name="id" value={activity.id} /> : null}
      {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
      <FieldError id="form-error" message={errors.form} />

      <div>
        <label htmlFor="title" className={labelClass}>
          Нэр
        </label>
        <input
          id="title"
          name="title"
          required
          maxLength={TITLE_MAX}
          defaultValue={activity?.title}
          className={inputClass}
          autoComplete="off"
          {...invalidProps("title", errors.title)}
        />
        <FieldError id="title-error" message={errors.title} />
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          Тайлбар <span className="font-normal text-ink-3">(заавал биш)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          maxLength={DESCRIPTION_MAX}
          defaultValue={activity?.description ?? ""}
          className={`${inputClass} h-auto py-1.5`}
          {...invalidProps("description", errors.description)}
        />
        <FieldError id="description-error" message={errors.description} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="planId" className={labelClass}>
            Төлөвлөгөө
          </label>
          <select
            id="planId"
            name="planId"
            required
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
            className={selectClass}
            {...invalidProps("planId", errors.planId)}
          >
            <option value="" disabled>
              Төлөвлөгөө сонгох…
            </option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          <FieldError id="planId-error" message={errors.planId} />
        </div>
        <div>
          <label htmlFor="status" className={labelClass}>
            Төлөв
          </label>
          <select
            id="status"
            name="status"
            defaultValue={activity?.status ?? "todo"}
            className={selectClass}
            {...invalidProps("status", errors.status)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
          <FieldError id="status-error" message={errors.status} />
        </div>
      </div>

      <fieldset>
        <legend className={labelClass}>Ач холбогдол</legend>
        <div className="flex flex-wrap gap-2">
          {PRIORITIES.map((p) => (
            <label
              key={p}
              className="flex h-8 cursor-pointer items-center gap-2 rounded-[4px] border border-line bg-surface px-3 text-sm has-checked:border-ink has-checked:bg-surface-2"
            >
              <input
                type="radio"
                name="priority"
                value={p}
                defaultChecked={(activity?.priority ?? "medium") === p}
                className="accent-ink"
              />
              <PrioritySwatch priority={p} />
              {PRIORITY_LABEL[p]}
            </label>
          ))}
        </div>
        <FieldError id="priority-error" message={errors.priority} />
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="weight" className={labelClass}>
            Төлөвлөгөөнд эзлэх хувь
          </label>
          <div className="relative">
            <input
              id="weight"
              name="weight"
              type="number"
              inputMode="numeric"
              required
              min={1}
              max={100}
              step={1}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className={`${inputClass} pr-7 tabular-nums`}
              {...invalidProps("weight", weightError, weightError ? undefined : "weight-hint")}
            />
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-ink-3">%</span>
          </div>
          {weightError ? (
            <FieldError id="weight-error" message={weightError} />
          ) : (
            <p id="weight-hint" className={hintClass}>
              {available === null ? "1–100%." : `Дээд тал нь ${available}% байж болно.`}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="startDate" className={labelClass}>
            Эхлэх огноо
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={`${inputClass} tabular-nums`}
            {...invalidProps("startDate", errors.startDate)}
          />
          <FieldError id="startDate-error" message={errors.startDate} />
        </div>
        <div>
          <label htmlFor="endDate" className={labelClass}>
            Дуусах огноо
          </label>
          <input
            id="endDate"
            name="endDate"
            type="date"
            required
            min={startDate || undefined}
            defaultValue={activity?.endDate}
            className={`${inputClass} tabular-nums`}
            {...invalidProps("endDate", errors.endDate, errors.endDate ? undefined : "endDate-hint")}
          />
          {errors.endDate ? (
            <FieldError id="endDate-error" message={errors.endDate} />
          ) : (
            <p id="endDate-hint" className={hintClass}>
              Эхлэх өдөртэйгөө ижил байж болно.
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-hairline pt-4">
        <button type="submit" className={btnPrimary} disabled={pending}>
          {pending ? "Хадгалж байна…" : activity ? "Хадгалах" : "Ажил нэмэх"}
        </button>
        <Link href={cancelHref} className={btnSecondary}>
          Болих
        </Link>
      </div>
    </form>
  );
}

function overMessage(available: number | null): string {
  return available === 0
    ? "Энэ төлөвлөгөөний 100% аль хэдийн хуваарилагдсан байна."
    : `Энэ төлөвлөгөөнд ${available}% л үлдсэн байна.`;
}
