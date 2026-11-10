"use client";

import { openPreferences } from "./consent-store";

export function CookiePreferencesButton({ className }: { className?: string }) {
  return (
    <button type="button" onClick={openPreferences} className={className}>
      Cookie preferences
    </button>
  );
}
