"use client";

import { useOptimistic, useTransition } from "react";
import { setActivityStatus } from "@/app/actions";
import { STATUSES, STATUS_LABEL, isStatus, type Status } from "@/lib/types";
import { ChevronIcon, StatusIcon } from "./icons";

/**
 * Quick status change from the list: a native <select> styled like the status
 * badge. The new status shows at once and the page refreshes from the server.
 */
export function StatusSelect({ id, status, title }: { id: number; status: Status; title: string }) {
  const [shown, setShown] = useOptimistic(status);
  const [pending, startTransition] = useTransition();

  return (
    <span className={`relative inline-flex items-center ${pending ? "opacity-70" : ""}`}>
      <StatusIcon
        status={shown}
        className={`pointer-events-none absolute left-1.5 ${shown === "done" ? "text-ink-3" : "text-ink-2"}`}
      />
      <select
        value={shown}
        aria-label={`Төлөв: ${title}`}
        onChange={(e) => {
          const next = e.target.value;
          if (!isStatus(next)) return;
          startTransition(async () => {
            setShown(next);
            await setActivityStatus(id, next);
          });
        }}
        className="h-7 cursor-pointer appearance-none rounded-[4px] border border-transparent bg-transparent pl-6 pr-6 text-[13px] text-ink-2 hover:border-line hover:bg-surface focus-visible:border-line"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABEL[s]}
          </option>
        ))}
      </select>
      <ChevronIcon open size={11} className="pointer-events-none absolute right-1.5 text-ink-3" />
    </span>
  );
}
