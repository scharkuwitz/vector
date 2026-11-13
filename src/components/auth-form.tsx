"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { FieldError, btnPrimary, hintClass, inputClass, labelClass, linkClass } from "./ui";
import { invalidProps } from "./use-form-action";

const messages: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "И-мэйл эсвэл нууц үг буруу байна.",
  INVALID_EMAIL: "И-мэйл хаягаа зөв оруулна уу.",
  USER_ALREADY_EXISTS: "Энэ и-мэйл хаяг бүртгэлтэй байна. Нэвтэрнэ үү.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Энэ и-мэйл хаяг бүртгэлтэй байна. Нэвтэрнэ үү.",
  PASSWORD_TOO_SHORT: "Нууц үг хамгийн багадаа 8 тэмдэгттэй байх ёстой.",
  PASSWORD_TOO_LONG: "Нууц үг 128 тэмдэгтээс хэтрэхгүй байх ёстой.",
  INVALID_NAME: "Нэрээ зөв оруулна уу.",
};

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const signup = mode === "signup";
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const email = String(fields.get("email") ?? "").trim().toLowerCase();
    const password = String(fields.get("password") ?? "");
    const name = String(fields.get("name") ?? "").trim();
    setError(undefined);
    setPending(true);
    try {
      const result = signup
        ? await authClient.signUp.email({ name, email, password })
        : await authClient.signIn.email({ email, password, rememberMe: true });
      if (result.error) {
        setError(result.error.status === 429
          ? "Хэт олон оролдлого хийлээ. Нэг минутын дараа дахин оролдоно уу."
          : messages[result.error.code ?? ""] ?? "Алдаа гарлаа. Дахин оролдоно уу.");
        form.querySelector<HTMLInputElement>("#password")?.focus();
      } else {
        // A fresh document also discards any router cache from a previous account.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- Discard all account-specific router state.
        window.location.assign("/");
      }
    } catch {
      setError("Холболтын алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5" aria-busy={pending}>
      {signup ? (
        <div>
          <label htmlFor="name" className={labelClass}>Нэр</label>
          <input id="name" name="name" required maxLength={100} autoComplete="name" className={inputClass} />
        </div>
      ) : null}
      <div>
        <label htmlFor="email" className={labelClass}>И-мэйл</label>
        <input id="email" name="email" type="email" required maxLength={254} autoComplete="email" className={inputClass} />
      </div>
      <div>
        <label htmlFor="password" className={labelClass}>Нууц үг</label>
        <input
          id="password" name="password" type="password" required
          minLength={signup ? 8 : undefined} maxLength={128}
          autoComplete={signup ? "new-password" : "current-password"}
          className={inputClass} {...invalidProps("password", error, signup ? "password-hint" : undefined)}
        />
        {signup ? <p id="password-hint" className={hintClass}>8–128 тэмдэгт ашиглана уу.</p> : null}
        <div aria-live="polite"><FieldError id="password-error" message={error} /></div>
      </div>
      <button type="submit" disabled={pending} className={`${btnPrimary} justify-center`}>
        {pending ? "Түр хүлээнэ үү…" : signup ? "Бүртгүүлэх" : "Нэвтрэх"}
      </button>
      <p className="border-t border-hairline pt-4 text-[13px] text-ink-2">
        {signup ? "Бүртгэлтэй юу? " : "Бүртгэлгүй юу? "}
        <Link href={signup ? "/login" : "/signup"} className={linkClass}>
          {signup ? "Нэвтрэх" : "Бүртгүүлэх"}
        </Link>
      </p>
    </form>
  );
}
