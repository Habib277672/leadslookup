import { getConsent } from "./consent-store";

type EventProps = Record<string, string | number | boolean>;

export type AnalyticsProvider = {
  track(event: string, props?: EventProps): void;
};

let provider: AnalyticsProvider | null = null;

/** Called by whichever provider we choose later, and only after consent. */
export function registerAnalyticsProvider(p: AnalyticsProvider | null) {
  provider = p;
}

/**
 * Client-only. Never pass emails, tokens, notes or message text as props.
 * Does nothing unless the visitor accepted analytics and a provider exists.
 */
export function track(event: string, props?: EventProps) {
  if (!provider) return;
  if (getConsent()?.analytics !== true) return;
  provider.track(event, props);
}
