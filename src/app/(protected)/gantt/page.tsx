import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Gantt } from "@/components/gantt/gantt";
import { Container, Loading, PageHeader, linkClass } from "@/components/ui";
import { getToday, listActivities, listPlans } from "@/lib/data";
import { parseGanttView } from "@/lib/search-params";

export const metadata: Metadata = { title: "Gantt" };

export default function GanttPage({ searchParams }: PageProps<"/gantt">) {
  return (
    <Container wide>
      <PageHeader
        title="Gantt"
        subtitle="Бүх ажил нэг хуваарь дээр. Өнгө нь ач холбогдлыг заана."
        actions={
          <Link href="/" className={`${linkClass} text-[13px] text-ink-2`}>
            Жагсаалтаар харах
          </Link>
        }
      />
      <Suspense fallback={<Loading height={480} label="Диаграм ачаалж байна…" />}>
        <GanttContent searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function GanttContent({ searchParams }: Pick<PageProps<"/gantt">, "searchParams">) {
  const view = parseGanttView(await searchParams);
  const [plans, activities, today] = await Promise.all([listPlans(), listActivities(), getToday()]);
  return (
    <Gantt
      // A client navigation to a different ?zoom/?group starts from that view.
      key={`${view.zoom}-${view.grouped}`}
      activities={activities}
      plans={plans}
      today={today}
      initialZoom={view.zoom}
      initialGrouped={view.grouped}
      syncUrl
    />
  );
}
