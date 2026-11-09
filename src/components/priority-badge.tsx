import { PRIORITY_LABEL, type Priority } from "@/lib/types";

export const PRIORITY_FILL: Record<Priority, string> = {
  low: "bg-prio-low",
  medium: "bg-prio-medium",
  high: "bg-prio-high",
};

/** Colored swatch beside the word: identity never rests on color alone. */
export function PrioritySwatch({ priority, className = "" }: { priority: Priority; className?: string }) {
  return <span aria-hidden="true" className={`inline-block size-2.5 shrink-0 rounded-[2px] ${PRIORITY_FILL[priority]} ${className}`} />;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-ink-2">
      <PrioritySwatch priority={priority} />
      {PRIORITY_LABEL[priority]}
    </span>
  );
}
