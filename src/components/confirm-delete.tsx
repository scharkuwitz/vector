"use client";

import { useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { btnPrimary, btnSecondary } from "./ui";

/**
 * A "Delete" button that asks first, in a native modal <dialog>. The dialog
 * holds its own small form that posts the id to a Server Action, which then
 * redirects away from the deleted item.
 */
export function ConfirmDelete({
  action,
  id,
  returnTo,
  title,
  children,
  confirmLabel = "Устгах",
}: {
  action: (formData: FormData) => Promise<void>;
  id: number;
  returnTo?: string;
  title: string;
  /** What will be deleted, in a sentence or two. */
  children: ReactNode;
  confirmLabel?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = `confirm-delete-${id}-title`;

  return (
    <>
      <button type="button" className={btnSecondary} onClick={() => ref.current?.showModal()}>
        Устгах
      </button>
      <dialog
        ref={ref}
        aria-labelledby={titleId}
        // Clicking the dimmed backdrop (the dialog element itself) cancels.
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
        className="m-auto w-[min(420px,calc(100vw-32px))] rounded-[4px] border border-line bg-surface p-0 text-ink backdrop:bg-scrim"
      >
        <form action={action} className="flex flex-col gap-4 p-5">
          <input type="hidden" name="id" value={id} />
          {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
          <h2 id={titleId} className="text-base font-semibold">
            {title}
          </h2>
          <div className="text-ink-2">{children}</div>
          <div className="flex justify-end gap-2">
            <button type="button" className={btnSecondary} onClick={() => ref.current?.close()} autoFocus>
              Болих
            </button>
            <SubmitButton label={confirmLabel} />
          </div>
        </form>
      </dialog>
    </>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={btnPrimary} disabled={pending}>
      {pending ? "Устгаж байна…" : label}
    </button>
  );
}
