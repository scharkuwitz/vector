"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { LogoutIcon } from "./icons";
import { btnSecondary } from "./ui";

export function LogoutButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  async function logout() {
    setPending(true);
    setError(false);
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error("Sign out failed");
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- Discard all account-specific router state.
      window.location.assign("/login");
    } catch {
      setError(true);
      setPending(false);
    }
  }
  return (
    <div className="relative shrink-0">
      <button type="button" onClick={logout} disabled={pending} className={`${btnSecondary} max-sm:px-2`} aria-label={pending ? "Гарч байна…" : "Гарах"}>
        <LogoutIcon size={13} className="sm:hidden" />
        <span className="max-sm:sr-only">{pending ? "Гарч байна…" : "Гарах"}</span>
      </button>
      {error ? <p role="alert" className="absolute right-0 top-full mt-2 w-52 rounded-[4px] border border-line bg-surface p-2 text-xs text-critical">Гарах үед алдаа гарлаа. Дахин оролдоно уу.</p> : null}
    </div>
  );
}
