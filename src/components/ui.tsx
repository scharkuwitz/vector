import type { ReactNode } from "react";
import { AlertIcon } from "./icons";

/* Shared class strings and layout pieces. Plain strings keep markup readable. */

const btn =
  "inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-[4px] border px-3 text-sm font-medium " +
  "disabled:cursor-not-allowed disabled:opacity-50";
export const btnPrimary = `${btn} border-ink bg-ink text-page hover:border-ink-2 hover:bg-ink-2`;
export const btnSecondary = `${btn} border-line bg-surface text-ink hover:bg-surface-2`;

export const inputClass =
  "h-8 w-full rounded-[4px] border border-line bg-surface px-2 text-sm text-ink " +
  "placeholder:text-ink-3 aria-[invalid=true]:border-critical";
export const selectClass = `${inputClass} pr-7`;
export const labelClass = "mb-1 block text-[13px] font-medium text-ink";
export const hintClass = "mt-1 text-xs text-ink-3";

export const linkClass = "text-ink underline-offset-2 hover:underline";

/** Width-limited column used by every page except the full-width Gantt. */
export function Container({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return <div className={`mx-auto w-full px-4 py-6 sm:px-6 ${wide ? "" : "max-w-[1100px]"}`}>{children}</div>;
}

export function PageHeader({
  title,
  subtitle,
  actions,
  back,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  back?: ReactNode;
}) {
  return (
    <div className="mb-5">
      {back ? <div className="mb-2 text-[13px] text-ink-2">{back}</div> : null}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-ink">{title}</h1>
          {subtitle ? <div className="mt-1 text-ink-2">{subtitle}</div> : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}

export function SectionTitle({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-2 mt-8 flex items-center justify-between gap-3">
      <h2 className="text-base font-semibold text-ink">{children}</h2>
      {actions}
    </div>
  );
}

/** Quiet placeholder shown while a Suspense boundary waits for data. */
export function Loading({ label = "Ачаалж байна…", height = 160 }: { label?: string; height?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-[4px] border border-hairline bg-surface text-[13px] text-ink-3"
      style={{ height }}
      role="status"
    >
      {label}
    </div>
  );
}

/** A field's validation message, tied to the input by `id` (use it in aria-describedby). */
export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 flex items-start gap-1 text-xs text-critical">
      <AlertIcon size={12} className="mt-[3px] shrink-0" />
      {message}
    </p>
  );
}
