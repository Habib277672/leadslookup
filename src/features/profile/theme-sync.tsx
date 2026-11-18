"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";
import { patchJson } from "@/features/auth/client";
import { isThemePref, PENDING_KEY, type ThemePref } from "./use-theme-sync";

/** Runs once per dashboard mount: retry an unsynced choice, else adopt the saved preference. */
export function ThemeSync({
  serverPreference,
}: {
  serverPreference: ThemePref;
}) {
  const { setTheme } = useTheme();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    let pending: string | null = null;
    try {
      pending = localStorage.getItem(PENDING_KEY);
    } catch {
      /* ignore */
    }

    if (isThemePref(pending)) {
      setTheme(pending); // the local choice wins until it has synced
      void patchJson("/api/v1/me", { themePreference: pending }).then((r) => {
        if (!r.ok) return;
        try {
          localStorage.removeItem(PENDING_KEY);
        } catch {
          /* ignore */
        }
      });
      return;
    }
    setTheme(serverPreference);
  }, [serverPreference, setTheme]);

  return null;
}
