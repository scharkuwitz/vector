"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Container, btnPrimary, linkClass } from "@/components/ui";

/** Unexpected failures (e.g. the database file can't be opened). */
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container>
      <div className="rounded-[4px] border border-hairline bg-surface px-6 py-12 text-center">
        <h1 className="text-lg font-semibold text-ink">Алдаа гарлаа</h1>
        <p className="mt-1 text-ink-2">Хуудсыг ачаалж чадсангүй. Дахин оролдоно уу.</p>
        <div className="mt-5 flex items-center justify-center gap-4">
          <button type="button" className={btnPrimary} onClick={() => retry()}>
            Дахин оролдох
          </button>
          <Link href="/" className={`${linkClass} text-[13px]`}>
            Ажлууд руу буцах
          </Link>
        </div>
      </div>
    </Container>
  );
}
