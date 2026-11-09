"use client";

import { startTransition, useActionState, useEffect, useRef, type FormEvent } from "react";
import type { FormState } from "@/app/actions";

/**
 * useActionState for a form that keeps what the user typed when the server
 * sends back errors. A plain `action={…}` submit makes React reset the form
 * afterwards, which would wipe the entries the user is meant to fix. So with
 * JavaScript the form submits through onSubmit (after the browser's own
 * validation), and `action` stays as the no-JavaScript fallback.
 *
 * After errors arrive, focus moves to the first invalid field.
 */
export function useFormAction(action: (prev: FormState, data: FormData) => Promise<FormState>) {
  const [state, formAction, pending] = useActionState(action, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.errors) return;
    formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
  }, [state]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => formAction(data));
  }

  return { errors: state.errors ?? {}, pending, formProps: { ref: formRef, action: formAction, onSubmit } };
}

/** Props that tie an input to its FieldError. */
export function invalidProps(name: string, message: string | undefined, describedBy?: string) {
  const ids = [message ? `${name}-error` : null, describedBy].filter(Boolean).join(" ");
  return { "aria-invalid": message ? true : undefined, "aria-describedby": ids || undefined } as const;
}
