import type { Metadata } from "next";
import { PlanForm } from "@/components/plan-form";
import { Container, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Шинэ төлөвлөгөө" };

export default function NewPlanPage() {
  return (
    <Container>
      <PageHeader title="Шинэ төлөвлөгөө" />
      <PlanForm cancelHref="/plans" />
    </Container>
  );
}
