import Link from "next/link";
import { LogoMark } from "./icons";
import { ThemeSwitch } from "./theme-switch";

export function AuthHeader() {
  return (
    <header className="border-b border-hairline bg-surface">
      <div className="flex h-12 items-center justify-between px-4 sm:px-6">
        <Link href="/login" className="flex items-center gap-2.5 text-[16px] font-bold tracking-tight text-ink">
          <LogoMark />Вектор
        </Link>
        <ThemeSwitch />
      </div>
    </header>
  );
}
