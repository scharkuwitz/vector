import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "Нэвтрэх" };

export default function Page() {
  return (
    <div className="mx-auto w-full max-w-sm rounded-[4px] border border-hairline bg-surface p-6">
      <h1 className="text-xl font-semibold tracking-tight text-ink">Нэвтрэх</h1>
      <p className="mb-6 mt-1 text-[13px] text-ink-2">Сайн уу? Та эхлээд нэвтрэнэ үү.</p>
      <AuthForm mode="login" />
    </div>
  );
}
