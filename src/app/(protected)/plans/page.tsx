import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PlusIcon } from "@/components/icons";
import { ProgressBar, WeightWarning } from "@/components/plan-progress";
import { Container, Loading, PageHeader, btnSecondary, linkClass } from "@/components/ui";
import { listPlans } from "@/lib/data";
import { formatRange } from "@/lib/dates";

export const metadata: Metadata = { title: "Төлөвлөгөө" };

export default function PlansPage() {
  return (
    <Container>
      <PageHeader
        title="Төлөвлөгөө"
        subtitle="Урт хугацааны зорилгууд. Явц нь дууссан ажлуудын эзлэх хувь."
        actions={
          <Link href="/plans/new" className={btnSecondary}>
            <PlusIcon size={13} />
            Шинэ төлөвлөгөө
          </Link>
        }
      />
      <Suspense fallback={<Loading height={280} />}>
        <PlanList />
      </Suspense>
    </Container>
  );
}

async function PlanList() {
  const plans = await listPlans();

  if (plans.length === 0) {
    return (
      <div className="rounded-[4px] border border-hairline bg-surface px-4 py-10 text-center text-ink-2">
        Одоогоор төлөвлөгөө алга.{" "}
        <Link href="/plans/new" className={linkClass}>
          Эхний төлөвлөгөөгөө үүсгэх
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-hairline rounded-[4px] border border-hairline bg-surface">
      {plans.map((p) => (
        <li key={p.id} className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-6">
          <div className="min-w-0 flex-1">
            <Link href={`/plans/${p.id}`} className="text-[15px] font-medium text-ink underline-offset-2 hover:underline">
              {p.title}
            </Link>
            {p.description ? <p className="mt-0.5 line-clamp-1 text-[13px] text-ink-2">{p.description}</p> : null}
            <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-ink-3">
              <span className="tabular-nums">
                {p.startDate && p.endDate ? formatRange(p.startDate, p.endDate) : "Огноо алга"}
              </span>
              <span aria-hidden="true">·</span>
              <span>{p.activityCount} ажил</span>
              <WeightWarning plan={p} />
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3 sm:w-56 sm:justify-end">
            <ProgressBar value={p.progress} width={120} />
            <span className="w-24 text-[13px] tabular-nums text-ink-2">
              <span className="font-medium text-ink">{p.progress}%</span> дууссан
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
