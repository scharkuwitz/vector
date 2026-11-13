import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { AuthHeader } from "@/components/auth-header";
import { Loading } from "@/components/ui";
import { getCurrentUser } from "@/lib/session";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthHeader />
      <main className="flex-1 px-4 py-10 sm:py-16">
        <Suspense fallback={<div className="mx-auto max-w-sm"><Loading /></div>}>
          <GuestOnly>{children}</GuestOnly>
        </Suspense>
      </main>
    </>
  );
}

async function GuestOnly({ children }: { children: ReactNode }) {
  if (await getCurrentUser()) redirect("/");
  return children;
}
