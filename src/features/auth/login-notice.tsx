"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { notify } from "@/lib/notify";
import { FormAlert } from "./ui";

// Only known codes are shown. Anything else in the URL is ignored, never echoed.
const MESSAGES: Record<string, string> = {
  google_denied: "Google sign-in was cancelled.",
  google_failed: "We couldn't sign you in with Google. Please try again.",
  google_unavailable: "Google sign-in isn't available right now.",
  google_email_in_use:
    "An account with this email already exists. Log in with your email and password instead.",
  account_suspended: "This account is unavailable. Please contact support.",
  rate_limited: "Too many attempts. Try again in a few minutes.",
};

export function LoginNotice() {
  const params = useSearchParams();
  const pathname = usePathname();
  const [message] = useState<string | undefined>(() => {
    const code = params.get("error");
    return code ? MESSAGES[code] : undefined;
  });

  useEffect(() => {
    if (!message) return;
    notify.error(message);
    window.history.replaceState(null, "", pathname); // a reload must not show it again
  }, [message, pathname]);

  return <FormAlert message={message} />;
}
