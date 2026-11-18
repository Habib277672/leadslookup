"use client";

import { useTheme } from "next-themes";
import { useCallback } from "react";
import { patchJson } from "@/features/auth/client";

export type ThemePref = "system" | "light" | "dark";
export const PENDING_KEY = "ll-theme-pending";

export function isThemePref(value: unknown): value is ThemePref {
  return value === "system" || value === "light" || value === "dark";
}

function store(action: () => void) {
  try {
    action();
  } catch {
    /* storage unavailable: the local choice still applies for this session */
  }
}

/** Applies the theme locally first, then syncs it to the profile in the background. */
export function useThemeSync() {
  const { setTheme } = useTheme();

  const choose = useCallback(
    async (value: string) => {
      if (!isThemePref(value)) return;
      setTheme(value);
      store(() => localStorage.setItem(PENDING_KEY, value));
      const result = await patchJson("/api/v1/me", { themePreference: value });
      // On failure the pending marker stays; ThemeSync retries on the next load.
      if (result.ok) store(() => localStorage.removeItem(PENDING_KEY));
    },
    [setTheme],
  );

  return { choose };
}
