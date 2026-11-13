import { Suspense, type ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { Container, Loading } from "@/components/ui";
import { requireUser } from "@/lib/session";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<Container><Loading label="Ачаалж байна…" /></Container>}>
      <AuthenticatedApp>{children}</AuthenticatedApp>
    </Suspense>
  );
}

async function AuthenticatedApp({ children }: { children: ReactNode }) {
  const user = await requireUser();
  return (
    <>
      <SiteHeader email={user.email} />
      <main className="flex-1">{children}</main>
    </>
  );
}
