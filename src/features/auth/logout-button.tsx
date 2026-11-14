"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { postJson } from "./client";

export function LogoutButtons() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function signOut(path: string) {
    setPending(true);
    await postJson(path);
    router.replace("/login");
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="outline"
        size="lg"
        disabled={pending}
        onClick={() => signOut("/api/v1/auth/logout")}
      >
        Log out
      </Button>
      <Button
        variant="ghost"
        size="lg"
        disabled={pending}
        onClick={() => signOut("/api/v1/auth/logout-all")}
      >
        Log out everywhere
      </Button>
    </div>
  );
}
