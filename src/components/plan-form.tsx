"use client";

import Link from "next/link";
import { savePlan } from "@/app/actions";
import { DESCRIPTION_MAX, TITLE_MAX, type Plan } from "@/lib/types";
import { FieldError, btnPrimary, btnSecondary, inputClass, labelClass } from "./ui";
import { invalidProps, useFormAction } from "./use-form-action";

/** Create / edit a plan. Its dates and progress come from its activities. */
export function PlanForm({ plan, cancelHref }: { plan?: Plan; cancelHref: string }) {
  const { errors, pending, formProps } = useFormAction(savePlan);

  return (
    <form {...formProps} className="flex max-w-2xl flex-col gap-5">
      {plan ? <input type="hidden" name="id" value={plan.id} /> : null}
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
          defaultValue={plan?.title}
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
          defaultValue={plan?.description ?? ""}
          className={`${inputClass} h-auto py-1.5`}
          {...invalidProps("description", errors.description)}
        />
        <FieldError id="description-error" message={errors.description} />
      </div>
      <p className="text-xs text-ink-3">Төлөвлөгөөний огноо болон явц нь түүний ажлуудаас тооцогдоно.</p>
      <div className="flex flex-wrap items-center gap-3 border-t border-hairline pt-4">
        <button type="submit" className={btnPrimary} disabled={pending}>
          {pending ? "Хадгалж байна…" : plan ? "Хадгалах" : "Төлөвлөгөө үүсгэх"}
        </button>
        <Link href={cancelHref} className={btnSecondary}>
          Болих
        </Link>
      </div>
    </form>
  );
}
