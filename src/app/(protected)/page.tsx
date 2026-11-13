import Link from "next/link";
import { Suspense } from "react";
import { ActivityFilters } from "@/components/activity-filters";
import { ActivityTable } from "@/components/activity-table";
import { PlusIcon } from "@/components/icons";
import { Container, Loading, PageHeader, btnPrimary, linkClass } from "@/components/ui";
import { getToday, listActivities, listPlans } from "@/lib/data";
import { isOverdue } from "@/lib/plan-stats";
import { hasFilter, parseActivityFilter } from "@/lib/search-params";

export default function ActivitiesPage({ searchParams }: PageProps<"/">) {
  return (
    <Container>
      <PageHeader
        title="Ажлууд"
        subtitle="Бүх ажил, эхлэх огноогоор."
        actions={
          <Link href="/gantt" className={`${linkClass} text-[13px] text-ink-2`}>
            Gantt-аар харах
          </Link>
        }
      />
      <Suspense fallback={<Loading height={320} />}>
        <ActivityList searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function ActivityList({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const filter = parseActivityFilter(await searchParams);
  const [plans, activities, today] = await Promise.all([listPlans(), listActivities(filter), getToday()]);
  const filtered = hasFilter(filter);

  // First run: nothing exists yet, so point at the first step instead of an empty table.
  if (plans.length === 0) return <FirstRun />;

  const overdue = activities.filter((a) => isOverdue(a, today)).length;

  return (
    <>
      {activities.length > 0 || filtered ? <ActivityFilters plans={plans} value={filter} /> : null}
      <ActivityTable
        activities={activities}
        plans={plans}
        today={today}
        empty={
          filtered ? (
            <>
              Шүүлтүүрт тохирох ажил алга.{" "}
              <Link href="/" className={linkClass}>
                Шүүлтүүр арилгах
              </Link>
            </>
          ) : (
            <>
              Одоогоор ажил алга.{" "}
              <Link href="/activities/new" className={linkClass}>
                Эхний ажлаа нэмэх
              </Link>
            </>
          )
        }
      />
      {activities.length > 0 ? (
        <p className="mt-2 text-xs text-ink-3">
          {activities.length} ажил
          {overdue > 0 ? ` · хугацаа хэтэрсэн: ${overdue}` : ""}
        </p>
      ) : null}
    </>
  );
}

function FirstRun() {
  return (
    <div className="rounded-[4px] border border-hairline bg-surface px-6 py-12 text-center">
      <h2 className="text-base font-semibold text-ink">Эхлээд төлөвлөгөө үүсгэнэ үү</h2>
      <p className="mx-auto mt-1 max-w-md text-ink-2">
        Ажил бүр нэг төлөвлөгөөнд хамаарна. Урт хугацааны зорилгоо төлөвлөгөө болгон үүсгээд, дараа нь түүнд ажлуудаа
        нэмээрэй.
      </p>
      <Link href="/plans/new" className={`${btnPrimary} mt-5`}>
        <PlusIcon size={13} />
        Шинэ төлөвлөгөө
      </Link>
    </div>
  );
}
