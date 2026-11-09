import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PlanForm } from "@/components/plan-form";
import { Container, Loading, PageHeader } from "@/components/ui";
import { getPlan } from "@/lib/data";
import { parseId } from "@/lib/search-params";

export const metadata: Metadata = { title: "Төлөвлөгөө засах" };

export default function EditPlanPage({ params }: PageProps<"/plans/[id]/edit">) {
  return (
    <Container>
      <PageHeader title="Төлөвлөгөө засах" />
      <Suspense fallback={<Loading height={260} />}>
        <EditPlan params={params} />
      </Suspense>
    </Container>
  );
}

async function EditPlan({ params }: Pick<PageProps<"/plans/[id]/edit">, "params">) {
  const id = parseId((await params).id);
  const plan = id ? await getPlan(id) : null;
  if (!plan) notFound();
  return <PlanForm plan={plan} cancelHref={`/plans/${plan.id}`} />;
}
