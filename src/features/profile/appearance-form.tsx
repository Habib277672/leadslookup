"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { type ThemePref, useThemeSync } from "./use-theme-sync";

const options: { value: ThemePref; label: string; hint: string }[] = [
  { value: "system", label: "System", hint: "Follow this device's setting." },
  { value: "light", label: "Light", hint: "Always use the light theme." },
  { value: "dark", label: "Dark", hint: "Always use the dark theme." },
];

const noopSubscribe = () => () => {};

export function AppearanceForm({ initial }: { initial: ThemePref }) {
  const { theme } = useTheme();
  const { choose } = useThemeSync();
  // next-themes only knows the real value in the browser; avoid a hydration mismatch.
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const current = mounted ? (theme ?? "system") : initial;

  return (
    <fieldset className="max-w-md">
      <legend className="sr-only">Theme</legend>
      <div className="divide-y divide-border border-y border-border">
        {options.map((o) => (
          <label
            key={o.value}
            className="flex cursor-pointer items-start gap-3 py-3 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50"
          >
            <input
              type="radio"
              name="theme"
              value={o.value}
              checked={current === o.value}
              onChange={() => void choose(o.value)}
              className="mt-0.5 size-4 accent-primary"
            />
            <span>
              <span className="block text-sm font-medium">{o.label}</span>
              <span className="block text-sm text-muted-foreground">
                {o.hint}
              </span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
