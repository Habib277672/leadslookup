"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/notify";
import { postJson } from "./client";

export function LogoutButtons() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function signOut(path: string, message: string) {
    setPending(true);
    const result = await postJson(path);
    if (!result.ok) {
      notify.error(result.message);
      setPending(false);
      return;
    }
    notify.success(message);
    router.replace("/login");
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="outline"
        size="lg"
        disabled={pending}
        onClick={() => signOut("/api/v1/auth/logout", "Logged out.")}
      >
        Log out
      </Button>
      <Button
        variant="ghost"
        size="lg"
        disabled={pending}
        onClick={() =>
          signOut("/api/v1/auth/logout-all", "Logged out of all devices.")
        }
      >
        Log out everywhere
      </Button>
    </div>
  );
}
