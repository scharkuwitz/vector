"use client";

import { useSyncExternalStore } from "react";
import { THEME_KEY as KEY } from "@/lib/theme";
import { MonitorIcon, MoonIcon, SunIcon } from "./icons";

/**
 * Light / Dark / System. The choice is saved in localStorage and applied as
 * data-theme on <html>; THEME_SCRIPT (src/lib/theme.ts, run in <head>) applies it
 * again on every full page load, before first paint. "System" removes the
 * attribute, so the tokens follow prefers-color-scheme.
 */
type Theme = "light" | "dark" | "system";

const THEMES: { value: Theme; label: string; Icon: typeof SunIcon }[] = [
  { value: "light", label: "Цайвар", Icon: SunIcon },
  { value: "dark", label: "Бараан", Icon: MoonIcon },
  { value: "system", label: "Системийн", Icon: MonitorIcon },
];

function read(): Theme {
  try {
    const t = localStorage.getItem(KEY);
    return t === "light" || t === "dark" ? t : "system";
  } catch {
    return "system";
  }
}

const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // Another tab changed the theme: apply it here too.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    apply(read());
    onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function apply(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") delete root.dataset.theme;
  else root.dataset.theme = theme;
}

function choose(theme: Theme) {
  try {
    if (theme === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, theme);
  } catch {
    // Storage blocked: the theme still applies until the next reload.
  }
  apply(theme);
  listeners.forEach((l) => l());
}

export function ThemeSwitch() {
  // The server doesn't know the choice; it renders "system" and the client
  // corrects the pressed button right after hydration (the colors themselves
  // are already right, set by THEME_SCRIPT).
  const theme = useSyncExternalStore(subscribe, read, () => "system" as const);
  const current = THEMES.find((t) => t.value === theme)!;
  const next = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];

  return (
    <>
      {/* Phones: one button that cycles through the three. */}
      <button
        type="button"
        onClick={() => choose(next.value)}
        className="flex size-7 cursor-pointer items-center justify-center rounded-[4px] text-ink-2 hover:bg-surface-2 hover:text-ink sm:hidden"
        aria-label={`Өнгө: ${current.label}. Солих`}
        title={`Өнгө: ${current.label}`}
      >
        <current.Icon size={16} />
      </button>
      {/* Wider screens: all three side by side. */}
      <div role="group" aria-label="Өнгө" className="hidden rounded-[4px] border border-line p-0.5 sm:flex">
        {THEMES.map(({ value, label, Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => choose(value)}
            aria-pressed={theme === value}
            aria-label={label}
            title={label}
            className="flex size-6 cursor-pointer items-center justify-center rounded-[3px] text-ink-3 hover:text-ink aria-pressed:bg-surface-2 aria-pressed:text-ink"
          >
            <Icon size={14} />
          </button>
        ))}
      </div>
    </>
  );
}
