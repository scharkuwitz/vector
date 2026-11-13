import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ActivityForm } from "@/components/activity-form";
import { PlusIcon } from "@/components/icons";
import { Container, Loading, PageHeader, btnPrimary } from "@/components/ui";
import { listPlans } from "@/lib/data";
import { parseId } from "@/lib/search-params";

export const metadata: Metadata = { title: "Шинэ ажил" };

export default function NewActivityPage({ searchParams }: PageProps<"/activities/new">) {
  return (
    <Container>
      <PageHeader title="Шинэ ажил" />
      <Suspense fallback={<Loading height={420} />}>
        <NewActivity searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function NewActivity({ searchParams }: Pick<PageProps<"/activities/new">, "searchParams">) {
  const planId = parseId((await searchParams).plan);
  const plans = await listPlans();

  if (plans.length === 0) {
    return (
      <div className="max-w-2xl rounded-[4px] border border-hairline bg-surface px-6 py-10 text-center">
        <p className="text-ink-2">Ажил нэг төлөвлөгөөнд хамаарах ёстой. Эхлээд төлөвлөгөө үүсгэнэ үү.</p>
        <Link href="/plans/new" className={`${btnPrimary} mt-4`}>
          <PlusIcon size={13} />
          Шинэ төлөвлөгөө
        </Link>
      </div>
    );
  }

  const preselected = plans.some((p) => p.id === planId) ? planId : plans.length === 1 ? plans[0].id : undefined;
  // Back to wherever "new" was opened from: the plan's page, or the list.
  const back = planId === preselected && preselected ? `/plans/${preselected}` : "/";
  return <ActivityForm plans={plans} defaultPlanId={preselected} cancelHref={back} returnTo={back} />;
}
