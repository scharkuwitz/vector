import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { deletePlan } from "@/app/actions";
import { ActivityTable } from "@/components/activity-table";
import { ConfirmDelete } from "@/components/confirm-delete";
import { Gantt } from "@/components/gantt/gantt";
import { ArrowLeftIcon, PlusIcon } from "@/components/icons";
import { ProgressBar, WeightWarning } from "@/components/plan-progress";
import { Container, Loading, PageHeader, SectionTitle, btnSecondary, linkClass } from "@/components/ui";
import { getPlan, getToday, listActivities } from "@/lib/data";
import { formatRange } from "@/lib/dates";
import { parseId } from "@/lib/search-params";
import { STATUS_LABEL } from "@/lib/types";

export async function generateMetadata({ params }: PageProps<"/plans/[id]">): Promise<Metadata> {
  const id = parseId((await params).id);
  const plan = id ? await getPlan(id) : null;
  return { title: plan?.title ?? "Төлөвлөгөө олдсонгүй" };
}

export default function PlanPage({ params }: PageProps<"/plans/[id]">) {
  return (
    <Container>
      <Suspense fallback={<Loading height={420} />}>
        <PlanDetail params={params} />
      </Suspense>
    </Container>
  );
}

async function PlanDetail({ params }: Pick<PageProps<"/plans/[id]">, "params">) {
  const id = parseId((await params).id);
  const plan = id ? await getPlan(id) : null;
  if (!plan) notFound();
  const [activities, today] = await Promise.all([listActivities({ planId: plan.id }), getToday()]);
  const { counts } = plan;

  return (
    <>
      <PageHeader
        back={
          <Link href="/plans" className={`${linkClass} inline-flex items-center gap-1 text-ink-2`}>
            <ArrowLeftIcon size={13} />
            Бүх төлөвлөгөө
          </Link>
        }
        title={plan.title}
        subtitle={plan.description}
        actions={
          <>
            <Link href={`/plans/${plan.id}/edit`} className={btnSecondary}>
              Засах
            </Link>
            <ConfirmDelete action={deletePlan} id={plan.id} title="Төлөвлөгөөг устгах уу?">
              <p>
                <strong className="font-medium text-ink">{plan.title}</strong>
                {plan.activityCount > 0
                  ? ` төлөвлөгөө болон түүний ${plan.activityCount} ажил бүгд устгагдана.`
                  : " төлөвлөгөө устгагдана."}
              </p>
              <p className="mt-2">Үүнийг буцаах боломжгүй.</p>
            </ConfirmDelete>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-[4px] border border-hairline bg-surface px-4 py-3 text-[13px] text-ink-2">
        <span className="flex items-center gap-3">
          <ProgressBar value={plan.progress} width={180} />
          <span>
            <span className="font-medium text-ink tabular-nums">{plan.progress}%</span> дууссан
          </span>
        </span>
        <span className="tabular-nums">
          {STATUS_LABEL.done}: {counts.done} · {STATUS_LABEL.in_progress}: {counts.in_progress} · {STATUS_LABEL.todo}:{" "}
          {counts.todo}
        </span>
        <span className="tabular-nums">
          {plan.startDate && plan.endDate ? formatRange(plan.startDate, plan.endDate) : "Огноо алга"}
        </span>
        <span className="tabular-nums">Нийт хувь: {plan.weightTotal}%</span>
        <WeightWarning plan={plan} />
      </div>

      {activities.length > 0 ? (
        <>
          <SectionTitle>Хуваарь</SectionTitle>
          <Gantt activities={activities} plans={[plan]} today={today} allowGrouping={false} maxHeight="480px" />
        </>
      ) : null}

      <SectionTitle
        actions={
          <Link href={`/activities/new?plan=${plan.id}`} className={btnSecondary}>
            <PlusIcon size={13} />
            Ажил нэмэх
          </Link>
        }
      >
        Ажлууд
      </SectionTitle>
      <ActivityTable
        activities={activities}
        plans={[plan]}
        today={today}
        showPlan={false}
        empty="Энэ төлөвлөгөөнд одоогоор ажил алга."
      />
    </>
  );
}
