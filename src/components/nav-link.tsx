"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const NAV_ITEMS = [
  { href: "/", label: "Ажлууд", match: ["/", "/activities"] },
  { href: "/plans", label: "Төлөвлөгөө", match: ["/plans"] },
  { href: "/gantt", label: "Gantt", match: ["/gantt"] },
] as const;

const base = "flex h-12 items-center border-b-2 px-1 text-sm";
const idle = `${base} border-transparent text-ink-2 hover:text-ink`;
const active = `${base} border-ink font-medium text-ink`;

function isActive(pathname: string, match: readonly string[]) {
  return match.some((m) => (m === "/" ? pathname === "/" : pathname === m || pathname.startsWith(`${m}/`)));
}

/** Nav links with the current section marked. Reads the URL, so render it inside <Suspense>. */
export function NavLinks() {
  const pathname = usePathname();
  return <NavLinksStatic pathname={pathname} />;
}

/** Same links without reading the URL; the Suspense fallback. */
export function NavLinksStatic({ pathname = "" }: { pathname?: string }) {
  return (
    <>
      {NAV_ITEMS.map((item) => {
        const on = isActive(pathname, item.match);
        return (
          <Link key={item.href} href={item.href} className={on ? active : idle} aria-current={on ? "page" : undefined}>
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
