"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/** Server renders UTC; the browser swaps in the visitor's own time zone. */
export function LocalTime({ iso }: { iso: string }) {
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const text = mounted
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(iso))
    : `${iso.slice(0, 16).replace("T", " ")} UTC`;
  return <time dateTime={iso}>{text}</time>;
}
