import Link from "next/link";
import { Suspense } from "react";
import { LogoMark, PlusIcon } from "./icons";
import { NavLinks, NavLinksStatic } from "./nav-link";
import { btnPrimary } from "./ui";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-surface">
      <div className="flex h-12 items-center gap-4 px-3 sm:gap-6 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-ink">
          <LogoMark />
          vector
        </Link>
        <nav aria-label="Үндсэн цэс" className="flex items-center gap-3.5 sm:gap-5">
          <Suspense fallback={<NavLinksStatic />}>
            <NavLinks />
          </Suspense>
        </nav>
        <div className="ml-auto">
          <Link href="/activities/new" className={`${btnPrimary} max-sm:px-2`} aria-label="Шинэ ажил">
            <PlusIcon size={13} />
            <span className="hidden sm:inline">Шинэ ажил</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
