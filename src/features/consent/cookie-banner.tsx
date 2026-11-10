"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  closePreferences,
  saveConsent,
  useConsent,
  usePreferencesOpen,
} from "./consent-store";

export function CookieBanner() {
  const consent = useConsent();
  const open = usePreferencesOpen();
  const [managing, setManaging] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (open) ref.current?.focus();
  }, [open]);

  if (consent === undefined) return null;
  if (consent !== null && !open) return null;

  const showPanel = managing || open;

  return (
    <section
      ref={ref}
      tabIndex={-1}
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 max-h-dvh overflow-y-auto border-t border-border bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))] outline-none"
    >
      <div className="mx-auto max-w-3xl space-y-4">
        {showPanel ? (
          <PreferencesPanel
            initial={consent?.analytics ?? false}
            onBack={() => {
              setManaging(false);
              closePreferences();
            }}
            onSave={(analytics) => {
              setManaging(false);
              saveConsent(analytics);
            }}
          />
        ) : (
          <>
            <p className="text-sm text-text-secondary">
              We use essential browser storage to make the site work. Optional
              analytics would load only if you accept. No analytics provider is
              active yet, but your choice is saved for when one is. See the{" "}
              <Link
                href="/cookies"
                className="font-medium text-text-primary underline underline-offset-4"
              >
                cookie policy
              </Link>
              .
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => saveConsent(true)}>
                Accept
              </Button>
              <Button variant="outline" onClick={() => saveConsent(false)}>
                Reject
              </Button>
              <Button variant="outline" onClick={() => setManaging(true)}>
                Manage
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function PreferencesPanel({
  initial,
  onBack,
  onSave,
}: {
  initial: boolean;
  onBack: () => void;
  onSave: (analytics: boolean) => void;
}) {
  const [analytics, setAnalytics] = useState(initial);
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-text-primary">
        Cookie preferences
      </legend>
      <p className="text-sm text-text-secondary">
        <span className="font-medium text-text-primary">Essential</span> (always
        on): theme choice, this consent choice and, later, sign-in and form
        protection.
      </p>
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={analytics}
          onChange={(e) => setAnalytics(e.target.checked)}
          className="mt-0.5 size-4 accent-foreground"
        />
        <span>
          <span className="font-medium text-text-primary">Analytics</span>
          <span className="block text-text-secondary">
            Helps us understand how the site is used. Off unless you turn it on.
          </span>
        </span>
      </label>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => onSave(analytics)}>
          Save choices
        </Button>
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
      </div>
    </fieldset>
  );
}
