import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { deleteActivity } from "@/app/actions";
import { ActivityForm } from "@/components/activity-form";
import { ConfirmDelete } from "@/components/confirm-delete";
import { Container, Loading, PageHeader } from "@/components/ui";
import { getActivity, listPlans } from "@/lib/data";
import { parseId } from "@/lib/search-params";

export const metadata: Metadata = { title: "Ажил засах" };

export default function EditActivityPage({ params }: PageProps<"/activities/[id]/edit">) {
  return (
    <Container>
      <Suspense
        fallback={
          <>
            <PageHeader title="Ажил засах" />
            <Loading height={420} />
          </>
        }
      >
        <EditActivity params={params} />
      </Suspense>
    </Container>
  );
}

async function EditActivity({ params }: Pick<PageProps<"/activities/[id]/edit">, "params">) {
  const id = parseId((await params).id);
  const [activity, plans] = await Promise.all([id ? getActivity(id) : null, listPlans()]);
  if (!activity) notFound();
  const planHref = `/plans/${activity.planId}`;

  return (
    <>
      <PageHeader
        title="Ажил засах"
        actions={
          <ConfirmDelete action={deleteActivity} id={activity.id} returnTo={planHref} title="Ажлыг устгах уу?">
            <p>
              <strong className="font-medium text-ink">{activity.title}</strong> ажил устгагдана. Үүнийг буцаах
              боломжгүй.
            </p>
          </ConfirmDelete>
        }
      />
      <ActivityForm plans={plans} activity={activity} cancelHref={planHref} />
    </>
  );
}
