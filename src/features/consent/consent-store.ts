"use client";

import { useSyncExternalStore } from "react";

export const CONSENT_VERSION = 1;
const KEY = "ll-consent";

export type Consent = {
  version: number;
  analytics: boolean;
  decidedAt: string;
};

const listeners = new Set<() => void>();
let preferencesOpen = false;
let memory: Consent | null = null; // fallback when storage is blocked
let cache: { raw: string | null; value: Consent | null } = {
  raw: null,
  value: null,
};

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

export function getConsent(): Consent | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === cache.raw) return cache.value ?? memory;
    let value: Consent | null = null;
    if (raw) {
      const p = JSON.parse(raw) as Partial<Consent>;
      if (
        p.version === CONSENT_VERSION &&
        typeof p.analytics === "boolean" &&
        typeof p.decidedAt === "string"
      ) {
        value = p as Consent;
      }
    }
    cache = { raw, value };
    return value ?? memory;
  } catch {
    return memory;
  }
}

export function saveConsent(analytics: boolean) {
  const value: Consent = {
    version: CONSENT_VERSION,
    analytics,
    decidedAt: new Date().toISOString(),
  };
  memory = value;
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // Storage blocked: the choice lasts for this page session only.
  }
  preferencesOpen = false;
  emit();
}

export function openPreferences() {
  preferencesOpen = true;
  emit();
}

export function closePreferences() {
  preferencesOpen = false;
  emit();
}

/** undefined = not known yet (server render / hydration). */
export function useConsent(): Consent | null | undefined {
  return useSyncExternalStore(subscribe, getConsent, () => undefined);
}

export function usePreferencesOpen(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => preferencesOpen,
    () => false,
  );
}
