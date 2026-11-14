"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/notify";
import { postJson } from "./client";

export function LogoutButtons() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [navigating, startNavigation] = useTransition();
  const busy = pending || navigating;

  async function signOut(path: string, message: string) {
    setPending(true);
    const result = await postJson(path);
    setPending(false);
    if (!result.ok) {
      notify.error(result.message);
      return;
    }
    notify.success(message);
    startNavigation(() => router.replace("/login"));
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="outline"
        size="lg"
        disabled={busy}
        onClick={() => signOut("/api/v1/auth/logout", "Logged out.")}
      >
        Log out
      </Button>
      <Button
        variant="ghost"
        size="lg"
        disabled={busy}
        onClick={() =>
          signOut("/api/v1/auth/logout-all", "Logged out of all devices.")
        }
      >
        Log out everywhere
      </Button>
    </div>
  );
}
